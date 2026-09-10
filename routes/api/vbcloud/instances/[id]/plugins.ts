// GET / POST /api/vbcloud/instances/:id/plugins — the plugins a cloud instance should run.
//
// Two kinds of instance. A project instance has a repository linked to it and deploys from there: a change here is
// one commit to that repository (pb_plugins/ and voidbase.lock, exactly as `voidbase plugins add` writes them) and
// the repository's own pipeline deploys it (src/shared/project.ts). A vanilla instance has no repository, and the
// plugins of a Worker are fixed when it is built, so an install records the set and queues a build;
// scripts/instance-build.ts in voidbase makes the release and the control plane re-provisions the instance from it
// (builds/next, builds/:id/done). In both, what is recorded is what voidbase.lock records: the marketplace, the
// version, the integrity, the source.
import { defineHandler } from "void";
import { authOf, pb } from "@voidbase-cloud/voidbase/adapter";
import { download, fetchIndex, pick, type PluginVersion } from "@voidbase-cloud/voidbase/registry";
import { commitPlugins, instanceJSON, isAdmin, lockOf, lockPlugins, pluginsMessage, pluginsOf, readBody, repoJSON, repoOf, repoToken, requireAuth, startBuildRun, userId, type InstancePlugin, type PluginChange } from "@/shared";

const OFFICIAL = "https://marketplace.voidbase.cloud";
const NAME = /^[a-z][a-z0-9-]*$/;
const MARKETPLACE = /^https?:\/\/[^\s/]+(\/[^\s]*)?$/;

async function owned(c: Parameters<Parameters<typeof defineHandler>[1]>[0]) {
  const auth = authOf(c); const uid = userId(c);
  const row = await pb.$app.findRecordById("vb_instances", c.req.param("id") ?? "");
  if (!row) throw new pb.NotFoundError();
  if (!(row.getString("owner") === uid || (row.getBool("system") && isAdmin(auth)))) throw new pb.ForbiddenError();
  return { auth, row };
}

/** the releases a marketplace serves, for the dashboard to offer; an unreachable marketplace is a reason, not a crash */
async function available(marketplace: string): Promise<{ marketplace: string; plugins: { name: string; title: string; summary: string; latest: string; repository: string }[]; error?: string }> {
  try {
    const { index } = await fetchIndex(marketplace);
    return { marketplace, plugins: index.plugins.map((p) => ({ name: p.name, title: p.title, summary: p.summary, latest: p.latest, repository: p.repository })) };
  } catch (err) { return { marketplace, plugins: [], error: err instanceof Error ? err.message : String(err) }; }
}

export const GET = defineHandler(requireAuth("users"), async (c) => {
  const { auth, row } = await owned(c);
  const extra = (c.req.query("marketplace") ?? "").trim().replace(/\/+$/, "");
  const marketplaces = [OFFICIAL, ...(extra && extra !== OFFICIAL && MARKETPLACE.test(extra) ? [extra] : [])];
  const linked = await repoOf(row);
  // a project instance's set is its repository's lockfile; the row is a record of the last change made from here
  let plugins = pluginsOf(row);
  if (linked) { try { plugins = lockPlugins(await lockOf(await repoToken(linked), linked)); } catch (err) { console.warn("vbcloud: lockfile of", linked.getString("full_name"), err instanceof Error ? err.message : err); } }
  return { instance: instanceJSON(row, auth), plugins, build: row.getString("build"), buildError: row.getString("build_error"), commit: row.getString("build_commit"), repo: linked ? repoJSON(linked) : null, available: await Promise.all(marketplaces.map(available)) };
});

export const POST = defineHandler(requireAuth("users"), async (c) => {
  const { auth, row } = await owned(c);
  const linked = await repoOf(row);
  if (row.getBool("system") && !linked) throw new pb.BadRequestError("This is the site's own backend, built from its repository: install plugins there (voidbase plugins add) and deploy it.");
  const token = linked ? await repoToken(linked) : "";  // a system repository without VB_GH_TOKEN is refused before anything is read
  if (row.getString("status") !== "live") throw new pb.BadRequestError(`This instance is ${row.getString("status")}; plugins change when it is live.`);
  if (row.getString("build") === "building") throw new pb.BadRequestError("A build for this instance is running; wait for it to finish.");
  const body = await readBody(c);
  const add = Array.isArray(body.add) ? (body.add as { name?: unknown; version?: unknown; marketplace?: unknown }[]) : [];
  const remove = Array.isArray(body.remove) ? (body.remove as unknown[]).map(String) : [];
  if (!add.length && !remove.length) throw new pb.BadRequestError("Say what to add or remove.");
  const current: InstancePlugin[] = linked ? lockPlugins(await lockOf(token, linked)) : pluginsOf(row);
  const set = new Map(current.map((p) => [p.name, p]));
  const change: PluginChange = { add: [], remove: [] };
  for (const name of remove) { if (!set.has(name)) throw new pb.BadRequestError(`${name} is not installed on this instance.`); set.delete(name); }
  for (const a of add) {
    const name = String(a.name ?? "").trim(); const version = a.version ? String(a.version) : undefined;
    const marketplace = String(a.marketplace ?? OFFICIAL).trim().replace(/\/+$/, "");
    if (!NAME.test(name)) throw new pb.BadRequestError(`${JSON.stringify(name)} is not a plugin name.`);
    if (!MARKETPLACE.test(marketplace)) throw new pb.BadRequestError(`${JSON.stringify(marketplace)} is not a marketplace URL.`);
    let v: PluginVersion | null; let indexUrl: string;
    try { const got = await fetchIndex(marketplace); indexUrl = got.url; v = pick(got.index, name, version); } catch (err) { throw new pb.BadRequestError(`${marketplace} could not be read: ${err instanceof Error ? err.message : String(err)}`); }
    if (!v) throw new pb.BadRequestError(`${name}${version ? `@${version}` : ""} is not served by ${marketplace}.`);
    const entry: InstancePlugin = { name, version: v.version, marketplace, integrity: v.integrity, source: v.source };
    set.set(name, entry);
    if (linked) {
      // the bytes go into the repository, so they are fetched and verified here, as `voidbase plugins add` does
      const got = await download(indexUrl, v);
      if (!got.verified) throw new pb.BadRequestError(`${got.url} is not the bytes ${marketplace} promised (${v.integrity}); nothing was changed.`);
      change.add.push({ name, version: v, marketplace, bytes: got.bytes });
    }
  }
  if (linked) {
    change.remove = remove;
    const committed = await commitPlugins(token, linked, change, pluginsMessage(change));
    row.set("plugins", JSON.stringify([...set.values()]));
    row.set("build", ""); row.set("build_error", ""); row.set("build_commit", committed.url);
    await pb.$app.save(row);
    return { instance: instanceJSON(row, auth), plugins: [...set.values()], build: "", commit: committed.url, repo: repoJSON(linked), message: `Committed to ${linked.getString("full_name")} (${committed.sha.slice(0, 7)}); its build deploys it in about a minute.` };
  }
  row.set("plugins", JSON.stringify([...set.values()]));
  row.set("build", "queued"); row.set("build_error", "");
  await pb.$app.save(row);
  const run = await startBuildRun(c, row, `plugins of ${row.getString("name")}`); const started = run === "workflow" || run === "started";
  return { instance: instanceJSON(row, auth), plugins: [...set.values()], build: "queued", builderStarted: started, message: `Queued a build with these plugins${started ? " and started the builder" : ""}; it takes minutes, and the instance keeps running the version it has until the new one is deployed.` };
});
