// Project instances: an instance with a repository linked to it (vb_repos.instance) is deployed by that repository's
// own build, so its plugins live there, in pb_plugins/ and voidbase.lock, exactly as `voidbase plugins add` writes
// them. A plugin change through the control plane is therefore one commit to the repository, and the repository's
// pipeline (a push = build + deploy) makes it live. No builder, no release: the control plane's part ends at the
// commit. The site's own repository and the system projects (VB_SYSTEM_PROJECTS, the demo) are committed to with
// VB_GH_TOKEN; a visitor's repository with their GitHub connection. Everything is the Git Data API, one commit.
import type { PluginVersion } from "@voidbase-cloud/voidbase/registry";
import { pb, type HookRecord } from "./pb";
import { ghCfg } from "./config";
import { gh, ghConnectionFor } from "./github";

export const PLUGINS_DIR = "pb_plugins";
export const LOCKFILE = "voidbase.lock";
const DEFAULT_MARKETPLACES = ["https://marketplace.voidbase.cloud"];

/** voidbase.lock as src/node/installed.ts writes it (the shape is the contract; the writer there sorts the same way) */
export interface LockEntry { version: string; integrity: string; marketplace: string; source: { repository: string; commit: string }; installedOn: string }
export interface Lock { lockfileVersion: 1; marketplaces: string[]; plugins: Record<string, LockEntry>; disabled: string[] }
export const emptyLock = (): Lock => ({ lockfileVersion: 1, marketplaces: [...DEFAULT_MARKETPLACES], plugins: {}, disabled: [] });
export const parseLock = (text: string): Lock => {
  const raw = JSON.parse(text) as Partial<Lock>;
  if (raw.lockfileVersion !== 1) throw new Error(`${LOCKFILE}: lockfileVersion ${JSON.stringify(raw.lockfileVersion)} is not one this voidbase reads`);
  return { lockfileVersion: 1, marketplaces: raw.marketplaces ?? [...DEFAULT_MARKETPLACES], plugins: raw.plugins ?? {}, disabled: raw.disabled ?? [] };
};
export const lockText = (lock: Lock): string => `${JSON.stringify({ ...lock, plugins: Object.fromEntries(Object.entries(lock.plugins).sort(([a], [b]) => a.localeCompare(b))), disabled: [...new Set(lock.disabled)].sort() }, null, 2)}\n`;

/** the repository linked to an instance, if any: that makes it a project instance */
export async function repoOf(inst: HookRecord): Promise<HookRecord | null> {
  try { return (await pb.$app.findFirstRecordByFilter("vb_repos", "instance = {:i}", { i: inst.id })) as HookRecord; } catch { return null; }
}

/** the token that may commit to a linked repository: the site's for system rows, the owner's connection otherwise */
export async function repoToken(repo: HookRecord): Promise<string> {
  if (repo.getBool("system")) {
    const t = ghCfg().token;
    if (!t) throw new pb.BadRequestError(`${repo.getString("full_name")} is a system repository and this site has no VB_GH_TOKEN to commit with.`);
    return t;
  }
  const uid = repo.getString("user"); if (!uid) throw new pb.BadRequestError("This repository is linked to nobody who could commit to it.");
  return (await ghConnectionFor(uid)).token;
}

const b64 = (bytes: Uint8Array): string => { let s = ""; for (const b of bytes) s += String.fromCharCode(b); return btoa(s); };
const fromB64 = (s: string): string => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\s/g, "")), (ch) => ch.charCodeAt(0)));

/** the repository's lockfile at the head of its default branch: what a project instance really runs */
export async function lockOf(token: string, repo: HookRecord): Promise<Lock> {
  const full = repo.getString("full_name"); const branch = repo.getString("default_branch") || "master";
  const f = await gh<{ content?: string }>(token, "GET", `/repos/${full}/contents/${LOCKFILE}?ref=${encodeURIComponent(branch)}`, undefined, [404]);
  return f.status === 404 ? emptyLock() : parseLock(fromB64(String(f.data.content ?? "")));
}
/** the lockfile's plugins in the shape the instance row records */
export const lockPlugins = (lock: Lock) => Object.entries(lock.plugins).map(([name, e]) => ({ name, version: e.version, marketplace: e.marketplace, integrity: e.integrity, source: e.source }));

export interface PluginChange { add: { name: string; version: PluginVersion; marketplace: string; bytes: Uint8Array }[]; remove: string[] }
export interface Committed { sha: string; url: string; branch: string; lock: Lock }

/**
 * One commit on the repository's default branch: pb_plugins/<name>/{bundle.js,release.json} written or deleted,
 * voidbase.lock updated the way `voidbase plugins add|remove` would. Returns the commit and the lock it wrote.
 */
export async function commitPlugins(token: string, repo: HookRecord, change: PluginChange, message: string): Promise<Committed> {
  const full = repo.getString("full_name"); const branch = repo.getString("default_branch") || "master";
  const head = await gh<{ object: { sha: string } }>(token, "GET", `/repos/${full}/git/ref/heads/${branch}`);
  const headSha = head.data.object.sha;
  const commit = await gh<{ tree: { sha: string } }>(token, "GET", `/repos/${full}/git/commits/${headSha}`);
  const lockFile = await gh<{ content?: string; encoding?: string }>(token, "GET", `/repos/${full}/contents/${LOCKFILE}?ref=${headSha}`, undefined, [404]);
  const lock = lockFile.status === 404 ? emptyLock() : parseLock(fromB64(String(lockFile.data.content ?? "")));
  const tree: { path: string; mode: "100644"; type: "blob"; sha: string | null }[] = [];
  const blob = async (content: string, encoding: "utf-8" | "base64") => (await gh<{ sha: string }>(token, "POST", `/repos/${full}/git/blobs`, { content, encoding })).data.sha;
  for (const name of change.remove) {
    const dir = await gh<{ path: string; type: string }[]>(token, "GET", `/repos/${full}/contents/${PLUGINS_DIR}/${name}?ref=${headSha}`, undefined, [404]);
    if (dir.status !== 404 && Array.isArray(dir.data)) for (const f of dir.data) if (f.type === "file") tree.push({ path: f.path, mode: "100644", type: "blob", sha: null });
    delete lock.plugins[name];
  }
  for (const a of change.add) {
    tree.push({ path: `${PLUGINS_DIR}/${a.name}/bundle.js`, mode: "100644", type: "blob", sha: await blob(b64(a.bytes), "base64") });
    tree.push({ path: `${PLUGINS_DIR}/${a.name}/release.json`, mode: "100644", type: "blob", sha: await blob(`${JSON.stringify(a.version, null, 2)}\n`, "utf-8") });
    lock.plugins[a.name] = { version: a.version.version, integrity: a.version.integrity, marketplace: a.marketplace, source: a.version.source, installedOn: new Date().toISOString().slice(0, 10) };
    lock.disabled = lock.disabled.filter((d) => d !== a.name);
  }
  tree.push({ path: LOCKFILE, mode: "100644", type: "blob", sha: await blob(lockText(lock), "utf-8") });
  const newTree = await gh<{ sha: string }>(token, "POST", `/repos/${full}/git/trees`, { base_tree: commit.data.tree.sha, tree });
  const newCommit = await gh<{ sha: string; html_url?: string }>(token, "POST", `/repos/${full}/git/commits`, { message, tree: newTree.data.sha, parents: [headSha] });
  await gh(token, "PATCH", `/repos/${full}/git/refs/heads/${branch}`, { sha: newCommit.data.sha, force: false });
  const url = newCommit.data.html_url ?? `${repo.getString("html_url") || `https://github.com/${full}`}/commit/${newCommit.data.sha}`;
  return { sha: newCommit.data.sha, url, branch, lock };
}

/** the commit message `voidbase plugins` would leave, had it committed */
export const pluginsMessage = (change: PluginChange): string => {
  const parts = [...change.add.map((a) => `add ${a.name} ${a.version.version}`), ...change.remove.map((n) => `remove ${n}`)];
  return `plugins: ${parts.join(", ")}`;
};
