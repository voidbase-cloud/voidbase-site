// GET / POST /api/vbcloud/instances/:id/plugins — the plugins a cloud instance should run.
//
// The owner does not hold the instance's filesystem, and the plugins of a Worker are fixed when it is built, so an
// install here records the set and queues a build; scripts/instance-build.ts in voidbase makes the release and the
// control plane re-provisions the instance from it (builds/next, builds/:id/done). What is recorded is exactly what
// `voidbase plugins add` would record in voidbase.lock: the marketplace, the version, the integrity, the source.
import { defineHandler } from "void";
import { authOf, pb } from "@voidbase-cloud/voidbase/adapter";
import { fetchIndex, pick, type PluginVersion } from "@voidbase-cloud/voidbase/registry";
import { instanceJSON, isAdmin, pluginsOf, readBody, requireAuth, userId, type InstancePlugin } from "@/shared";

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
  return { instance: instanceJSON(row, auth), plugins: pluginsOf(row), build: row.getString("build"), buildError: row.getString("build_error"), available: await Promise.all(marketplaces.map(available)) };
});

export const POST = defineHandler(requireAuth("users"), async (c) => {
  const { auth, row } = await owned(c);
  if (row.getString("status") !== "live") throw new pb.BadRequestError(`This instance is ${row.getString("status")}; plugins change when it is live.`);
  if (row.getString("build") === "building") throw new pb.BadRequestError("A build for this instance is running; wait for it to finish.");
  const body = await readBody(c);
  const add = Array.isArray(body.add) ? (body.add as { name?: unknown; version?: unknown; marketplace?: unknown }[]) : [];
  const remove = Array.isArray(body.remove) ? (body.remove as unknown[]).map(String) : [];
  if (!add.length && !remove.length) throw new pb.BadRequestError("Say what to add or remove.");
  const set = new Map(pluginsOf(row).map((p) => [p.name, p]));
  for (const name of remove) { if (!set.has(name)) throw new pb.BadRequestError(`${name} is not installed on this instance.`); set.delete(name); }
  for (const a of add) {
    const name = String(a.name ?? "").trim(); const version = a.version ? String(a.version) : undefined;
    const marketplace = String(a.marketplace ?? OFFICIAL).trim().replace(/\/+$/, "");
    if (!NAME.test(name)) throw new pb.BadRequestError(`${JSON.stringify(name)} is not a plugin name.`);
    if (!MARKETPLACE.test(marketplace)) throw new pb.BadRequestError(`${JSON.stringify(marketplace)} is not a marketplace URL.`);
    let v: PluginVersion | null;
    try { v = pick((await fetchIndex(marketplace)).index, name, version); } catch (err) { throw new pb.BadRequestError(`${marketplace} could not be read: ${err instanceof Error ? err.message : String(err)}`); }
    if (!v) throw new pb.BadRequestError(`${name}${version ? `@${version}` : ""} is not served by ${marketplace}.`);
    const entry: InstancePlugin = { name, version: v.version, marketplace, integrity: v.integrity, source: v.source };
    set.set(name, entry);
  }
  row.set("plugins", JSON.stringify([...set.values()]));
  row.set("build", "queued"); row.set("build_error", "");
  await pb.$app.save(row);
  return { instance: instanceJSON(row, auth), plugins: [...set.values()], build: "queued", message: "Queued a build with these plugins; it takes minutes, and the instance keeps running the version it has until the new one is deployed." };
});
