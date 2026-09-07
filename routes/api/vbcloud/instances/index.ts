import { defineHandler } from "void";
import { authOf, pb } from "@voidbase-cloud/voidbase/adapter";
import { provisionInstance, workerExists } from "@voidbase-cloud/voidbase/cloud";
import { cfg, connectionFor, ensureSelf, instanceJSON, isAdmin, randomPassword, readBody, releaseSource, requireAuth, userId, type HookRecord } from "@/shared";

export const GET = defineHandler(requireAuth(), async (c) => {
  const auth = authOf(c)!; const origin = new URL(c.req.raw.url).origin;
  try { await ensureSelf(origin); } catch (err) { console.warn("vbcloud: self registration", err); }
  const own = (auth.isSuperuser() ? [] : await pb.$app.findRecordsByFilter("vb_instances", "owner = {:u} && status != 'deleted'", "-created", 100, 0, { u: auth.id })) as HookRecord[];
  const system = (isAdmin(auth) ? await pb.$app.findRecordsByFilter("vb_instances", "system = true && status != 'deleted'", "-created", 20, 0) : []) as HookRecord[];
  const seen = new Set<string>(); const rows = [...system, ...own].filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)));
  return { instances: rows.map((r) => instanceJSON(r, auth)) };
});

export const POST = defineHandler(requireAuth("users"), async (c) => {
  const uid = userId(c); const body = await readBody(c); const conf = cfg();
  const { cf, accounts } = await connectionFor(uid);
  const wanted = String(body.name ?? "").trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
  if (!wanted) throw new pb.BadRequestError("Give the instance a name (letters, digits, dashes).");
  const name = wanted.startsWith(conf.prefix) ? wanted : `${conf.prefix}${wanted}`;
  if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(name)) throw new pb.BadRequestError(`"${name}" is not a valid worker name (lowercase letters, digits and dashes, 63 chars max).`);
  const accountId = String(body.account ?? accounts[0]?.id ?? "");
  if (!accountId) throw new pb.BadRequestError("Pick the Cloudflare account to create the instance in.");
  const account = accounts.find((a) => a.id === accountId) ?? (accounts.length ? null : { id: accountId, name: "" });
  if (!account) throw new pb.BadRequestError("That Cloudflare account was not granted to this site: sign in with Cloudflare again and select it.");
  const mine = (await pb.$app.findRecordsByFilter("vb_instances", "owner = {:u} && status != 'deleted'", "", 200, 0, { u: uid })) as HookRecord[];
  if (mine.length >= conf.maxPerUser) throw new pb.BadRequestError(`You already have ${mine.length} instances (limit ${conf.maxPerUser}). Delete one first.`);
  if (mine.some((r) => r.getString("name") === name)) throw new pb.BadRequestError(`You already have an instance named ${name}.`);
  if (await pb.$app.findRecordsByFilter("vb_instances", "name = {:n} && status != 'deleted'", "", 1, 0, { n: name }).then((r: HookRecord[]) => r.length)) throw new pb.BadRequestError(`The name ${name} is taken.`);
  if (await workerExists(cf, account.id, name)) throw new pb.BadRequestError(`A Worker named ${name} already exists on that account.`);
  const release = await releaseSource(c);
  const auth = authOf(c)!;
  const email = String(body.superuserEmail ?? auth.email?.() ?? auth.getString("email") ?? "admin@example.com");
  const password = randomPassword();
  const row = new pb.Record(pb.$app.findCollectionByNameOrId("vb_instances"));
  row.set("owner", uid); row.set("name", name); row.set("account_id", account.id); row.set("account_name", account.name); row.set("status", "creating"); row.set("release", release.manifest.version); row.set("superuser_email", email); row.set("system", false);
  await pb.$app.save(row);
  const lines: string[] = [];
  try {
    const r = await provisionInstance(cf, { account: account.id, name, release, superuser: { email, password }, applyDoMigrations: true, tags: [`vbcloud-owner:${uid}`], log: (l) => lines.push(l) });
    row.set("status", "live"); row.set("url", r.url ?? ""); row.set("d1_id", r.d1.uuid); row.set("queue_id", r.queue?.id ?? ""); row.set("error", "");
    await pb.$app.save(row);
    // the superuser password travels to the new Worker as a secret and to the owner once, here; it is not kept
    return { instance: instanceJSON(row, auth), credentials: { url: r.url ?? "", superuserEmail: email, superuserPassword: password, panel: r.url ? `${r.url}/_/` : "" }, log: lines };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    row.set("status", "error"); row.set("error", message.slice(0, 1000)); await pb.$app.save(row);
    console.error("vbcloud: provisioning", name, err);
    throw new pb.BadRequestError(`Creating ${name} failed: ${message}`, { log: lines });
  }
});
