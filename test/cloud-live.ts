// The cloud control plane, for real, on the demo: demo.voidbase.cloud is a system project of voidbase.cloud (its
// repository is linked to its instance), so a plugin change made here is one commit to voidbase-cloud/voidbase-demo
// and the demo's own Cloudflare build deploys it. This runs the lifecycle an owner would: uninstall echo, install an
// older echo, update it; each step is a commit, each commit's build is watched, and the demo is asked to answer.
//   bun test/cloud-live.ts [--cloud https://voidbase.cloud]      (bun run live)
// Nothing here is a mock; nothing is created or deleted on Cloudflare; the demo ends where it started (echo 0.2.0),
// three commits later. Credentials come from this checkout (.voidbase/pb_data/.superuser-credentials, which a deploy
// from here writes, and vb_secrets/secrets.json: VB_BUILDS_TOKEN watches the builds, VB_ADMIN_EMAILS must list the
// admin this run acts as, live@voidbase.cloud by default) or from the environment (VB_LIVE_SUPERUSER_EMAIL,
// VB_LIVE_SUPERUSER_PASSWORD, VB_LIVE_ADMIN_EMAIL).
export {};
const args = process.argv.slice(2);
const flag = (n: string) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined; };
const CP = (flag("cloud") ?? "https://voidbase.cloud").replace(/\/+$/, "");
const MARKET = "https://raw.githubusercontent.com/voidbase-cloud/voidbase-throwaway-marketplace/master";
const DEMO_WORKER = "voidbase-demo", DEMO_REPO = "voidbase-cloud/voidbase-demo";
const ua = { "user-agent": "voidbase-cloud-live/3" };
const readJson = async (path: string) => ((await Bun.file(path).exists()) ? (JSON.parse(await Bun.file(path).text()) as Record<string, string>) : {});
const secretsFile = await readJson("vb_secrets/secrets.json");
const suFile = await readJson(".voidbase/pb_data/.superuser-credentials");
const su = { email: process.env.VB_LIVE_SUPERUSER_EMAIL || suFile.email || "", password: process.env.VB_LIVE_SUPERUSER_PASSWORD || suFile.password || "" };
const buildsToken = process.env.VB_BUILDS_TOKEN || secretsFile.VB_BUILDS_TOKEN || "";
// the admin this run acts as: an address only the superuser can mint a session for (nobody signs in with it), which
// VB_ADMIN_EMAILS must list; the user row is made here the way the sign-in would have made it
const admins = (process.env.VB_ADMIN_EMAILS || secretsFile.VB_ADMIN_EMAILS || "").toLowerCase().split(/[\s,]+/).filter(Boolean);
const adminEmail = process.env.VB_LIVE_ADMIN_EMAIL || "live@voidbase.cloud";
if (!admins.includes(adminEmail)) { console.error(`${adminEmail} is not in VB_ADMIN_EMAILS (${admins.join(", ")}): add it there (the trigger's variables and vb_secrets/secrets.json) or set VB_LIVE_ADMIN_EMAIL`); process.exit(2); }
for (const [k, v] of Object.entries({ superuser: su.email && su.password, VB_BUILDS_TOKEN: buildsToken, VB_ADMIN_EMAILS: adminEmail })) if (!v) { console.error(`${k}: not in this checkout's files nor in the environment`); process.exit(2); }
let pass = 0, fail = 0; const t0 = Date.now();
const since = () => `${Math.round((Date.now() - t0) / 1000)}s`;
const check = (label: string, ok: boolean, detail = "") => { ok ? pass++ : fail++; console.log(`${ok ? "PASS" : "FAIL"}  [${since()}] ${label}${ok ? "" : "  " + detail}`); };
const api = async (method: string, path: string, body?: unknown, token?: string) => { const r = await fetch(CP + path, { method, headers: { "content-type": "application/json", ...ua, ...(token ? { authorization: token } : {}) }, body: body !== undefined ? JSON.stringify(body) : undefined }); let json: any = {}; try { json = await r.json(); } catch { /* no body */ } return { status: r.status, json }; }; // eslint-disable-line @typescript-eslint/no-explicit-any

const SU = (await api("POST", "/api/collections/_superusers/auth-with-password", { identity: su.email, password: su.password })).json.token as string | undefined;
if (!SU) { console.error(`cannot sign in to ${CP} as ${su.email}`); process.exit(2); }
let admin = (await api("GET", `/api/collections/users/records?filter=${encodeURIComponent(`email='${adminEmail}'`)}&fields=id,email`, undefined, SU)).json.items?.[0];
if (!admin) { const password = crypto.randomUUID() + crypto.randomUUID(); admin = (await api("POST", "/api/collections/users/records", { email: adminEmail, password, passwordConfirm: password, name: "live", verified: true }, SU)).json; }
if (!admin?.id) { console.error(`no user for ${adminEmail} on ${CP}: ${JSON.stringify(admin).slice(0, 200)}`); process.exit(2); }
const A = (await api("POST", `/api/collections/users/impersonate/${admin.id}`, { duration: 3600 }, SU)).json.token as string;
check("the admin's session is minted", !!A, adminEmail);

// ---- the demo as the control plane sees it: a system instance with its repository linked
const instances = ((await api("GET", "/api/vbcloud/instances", undefined, A)).json.instances ?? []) as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
const demo = instances.find((i) => i.name === DEMO_WORKER);
const repos = ((await api("GET", "/api/vbcloud/repos", undefined, A)).json.repos ?? []) as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
const demoRepo = repos.find((r) => r.fullName === DEMO_REPO);
check("the demo is a system instance of this control plane, with its repository linked", !!demo && demo.system === true && !!demoRepo && demoRepo.system === true && demoRepo.instanceName === DEMO_WORKER, JSON.stringify({ demo, demoRepo }).slice(0, 300));
if (!demo || !demoRepo) process.exit(1);
const DEMO = String(demo.url).replace(/\/+$/, "");

// ---- the demo's Cloudflare builds, to know when a commit is live
async function cf<T>(path: string): Promise<T> { const r = await fetch(`https://api.cloudflare.com/client/v4${path}`, { headers: { authorization: `Bearer ${buildsToken}` } }); const j = (await r.json()) as { result: T; success: boolean; errors: { message: string }[] }; if (!j.success) throw new Error(`${path}: ${j.errors.map((e) => e.message).join("; ")}`); return j.result; }
const accountId = (await cf<{ id: string }[]>("/accounts"))[0]?.id ?? ""; // the builds token reaches one account
const tag = (await cf<{ id: string; tag?: string }[]>(`/accounts/${accountId}/workers/scripts`)).find((s) => s.id === DEMO_WORKER)?.tag ?? "";
check("the demo's Worker and its builds are reachable", !!accountId && !!tag, `${accountId} ${tag}`);
type Build = { build_uuid: string; status: string; build_outcome?: string; build_trigger_metadata?: { commit_hash?: string } };
/** the build Cloudflare runs for a commit, followed to its end (a push starts it within seconds) */
async function buildOf(sha: string): Promise<string> {
  const FINAL = new Set(["success", "failure", "failed", "canceled", "cancelled", "timed_out", "error"]);
  for (let i = 0; i < 90; i++) {
    const builds = await cf<Build[]>(`/accounts/${accountId}/builds/workers/${tag}/builds`);
    const b = builds.find((x) => (x.build_trigger_metadata?.commit_hash ?? "").startsWith(sha));
    if (b) { const st = b.status === "stopped" ? (b.build_outcome === "success" ? "success" : b.build_outcome ?? "stopped") : b.status; if (FINAL.has(st)) return st; }
    await Bun.sleep(4000);
  }
  return "not seen within six minutes";
}
const get = async (path: string, token?: string) => { const r = await fetch(DEMO + path, { headers: { ...ua, ...(token ? { authorization: token } : {}) } }); const text = await r.text(); let json: any = null; try { json = JSON.parse(text); } catch { /* text */ } return { status: r.status, text, json }; }; // eslint-disable-line @typescript-eslint/no-explicit-any
const demoSu = async () => { const r = await fetch(`${DEMO}/api/collections/_superusers/auth-with-password`, { method: "POST", headers: { "content-type": "application/json", ...ua }, body: JSON.stringify({ identity: "test@example.com", password: "demo123456" }) }); return ((await r.json()) as { token?: string }).token ?? ""; };
const origins = async () => ((await get("/api/plugins", await demoSu())).json?.origins ?? {}) as Record<string, string>;
/** after a build: the new upload answers within seconds; a state is polled for a minute before it is called wrong */
const until = async (what: () => Promise<boolean>) => { for (let i = 0; i < 20; i++) { if (await what()) return true; await Bun.sleep(3000); } return what(); };
const shaOf = (commitUrl: string) => (commitUrl.match(/\/commit\/([0-9a-f]{7,40})/)?.[1] ?? "").slice(0, 12);

/** one plugin change through the control plane, its commit, its build, and what the demo says afterwards */
async function change(label: string, body: Record<string, unknown>, live: () => Promise<boolean>): Promise<void> {
  console.log(`\n${label}`);
  const r = await api("POST", `/api/vbcloud/instances/${demo.id}/plugins`, body, A);
  const sha = shaOf(String(r.json.commit ?? ""));
  check(`the change is one commit to ${DEMO_REPO} (${sha || "?"})`, r.status === 200 && r.json.build === "" && !!sha && r.json.repo?.fullName === DEMO_REPO, JSON.stringify(r.json).slice(0, 300));
  if (!sha) return;
  const t = Date.now(); const outcome = await buildOf(sha);
  check(`the demo's own build deploys that commit (${Math.round((Date.now() - t) / 1000)}s)`, outcome === "success", outcome);
  check("the demo answers as the change says", await until(live));
}

const start = await get("/api/echo");
check("the demo starts with echo answering (0.2.0 from the throwaway marketplace)", start.status === 200 && String((await origins()).echo).startsWith(MARKET), `${start.status}`);
try {
  await change("uninstall", { remove: ["echo"] }, async () => (await get("/api/echo")).status === 404 && !(await origins()).echo);
  const kept = await get("/api/collections/echoes", await demoSu());
  check("the collection echo owned stays with its data: uninstalling drops no table", kept.status === 200 && kept.json?.name === "echoes", String(kept.status));
  await change("install an older version", { add: [{ name: "echo", version: "0.1.0", marketplace: MARKET }] }, async () => (await get("/api/echo")).status === 200 && String((await origins()).echo).startsWith(MARKET));
  await change("update", { add: [{ name: "echo", marketplace: MARKET }] }, async () => (await get("/api/echo")).status === 200);
  const final = await api("GET", `/api/vbcloud/instances/${demo.id}/plugins`, undefined, A);
  const echoRow = (final.json.plugins ?? []).find((p: { name: string }) => p.name === "echo");
  check("the control plane lists the repository's set (echo 0.2.0 from the throwaway marketplace among them), and the last commit", echoRow?.version === "0.2.0" && echoRow.marketplace === MARKET && !!final.json.commit, JSON.stringify(final.json).slice(0, 300));
  const log = (await (await fetch(`https://api.github.com/repos/${DEMO_REPO}/commits?per_page=3`, { headers: { accept: "application/vnd.github+json", ...ua } })).json()) as { commit: { message: string } }[];
  check("the repository's last three commits are the three changes, as `voidbase plugins` would have named them", Array.isArray(log) && log.map((c) => c.commit.message.split("\n")[0]).join(" | ") === "plugins: add echo 0.2.0 | plugins: add echo 0.1.0 | plugins: remove echo", JSON.stringify(log.map?.((c) => c.commit?.message)));
} finally {
  const now = await api("GET", `/api/vbcloud/instances/${demo.id}/plugins`, undefined, A);
  if ((now.json.plugins ?? []).find((p: { name: string }) => p.name === "echo")?.version !== "0.2.0") { console.log("\nputting the demo back"); await change("restore echo 0.2.0", { add: [{ name: "echo", marketplace: MARKET }] }, async () => (await get("/api/echo")).status === 200); }
  console.log(`\n${pass} passed, ${fail} failed (${since()})`);
  process.exit(fail ? 1 : 0);
}
