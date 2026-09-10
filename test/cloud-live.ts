// The plugin lifecycle on the demo, through the demo's own installer: demo.voidbase.cloud is a project (deployed
// from voidbase-cloud/voidbase-demo, with VOIDBASE_PROJECT_REPO and VOIDBASE_GH_TOKEN on its Worker), so a change
// asked of the instance is a commit to that repository and the demo's own Cloudflare build deploys it. This is what
// the /cloud page does when its owner signs in to an instance there; nothing goes through the site.
//   bun test/cloud-live.ts [--demo https://demo.voidbase.cloud]      (bun run live)
// Three commits per run (remove echo, add echo 0.1.0, update to 0.2.0), each build watched with VB_BUILDS_TOKEN from
// vb_secrets/secrets.json (or the environment); the demo ends as it started.
import { CloudClient } from "../src/lib/cloud";

const args = process.argv.slice(2);
const flag = (n: string) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined; };
const DEMO = (flag("demo") ?? "https://demo.voidbase.cloud").replace(/\/+$/, "");
const MARKET = "https://raw.githubusercontent.com/voidbase-cloud/voidbase-throwaway-marketplace/master";
const DEMO_WORKER = "voidbase-demo", DEMO_REPO = "voidbase-cloud/voidbase-demo";
const ua = { "user-agent": "voidbase-cloud-live/4" };
const readJson = async (path: string) => ((await Bun.file(path).exists()) ? (JSON.parse(await Bun.file(path).text()) as Record<string, string>) : {});
const secretsFile = await readJson("vb_secrets/secrets.json");
const buildsToken = process.env.VB_BUILDS_TOKEN || process.env.CLOUDFLARE_BUILDS_TOKEN || secretsFile.VB_BUILDS_TOKEN || "";
if (!buildsToken) { console.error("VB_BUILDS_TOKEN (or CLOUDFLARE_BUILDS_TOKEN): not set; the builds cannot be watched"); process.exit(2); }
let pass = 0, fail = 0; const t0 = Date.now();
const since = () => `${Math.round((Date.now() - t0) / 1000)}s`;
const check = (label: string, ok: boolean, detail = "") => { ok ? pass++ : fail++; console.log(`${ok ? "PASS" : "FAIL"}  [${since()}] ${label}${ok ? "" : "  " + detail}`); };

const client = new CloudClient("", () => "");  // the site is not involved: the client talks to the instance itself
const demo = { id: "demo", name: DEMO_WORKER, url: DEMO, status: "live", account: { id: "" } };
const session = await client.instanceSession(demo, "test@example.com", "demo123456");
check("the demo's public superuser signs in from the client", !!session);
const plugins = client.plugins(demo, session);
const start = await plugins.running();
check("the demo is a project: its installer commits to its repository", start.installer?.mode === "repository" && start.installer.repository === DEMO_REPO, JSON.stringify(start.installer));
check("the demo starts with echo from the throwaway marketplace", String(start.origins.echo ?? "").startsWith(MARKET), JSON.stringify(start.origins));

async function cf<T>(path: string): Promise<T> { const r = await fetch(`https://api.cloudflare.com/client/v4${path}`, { headers: { authorization: `Bearer ${buildsToken}` } }); const j = (await r.json()) as { result: T; success: boolean; errors: { message: string }[] }; if (!j.success) throw new Error(`${path}: ${j.errors.map((e) => e.message).join("; ")}`); return j.result; }
const accountId = (await cf<{ id: string }[]>("/accounts"))[0]?.id ?? "";
const tag = (await cf<{ id: string; tag?: string }[]>(`/accounts/${accountId}/workers/scripts`)).find((s) => s.id === DEMO_WORKER)?.tag ?? "";
check("the demo's builds are reachable", !!accountId && !!tag);
type Build = { status: string; build_outcome?: string; build_trigger_metadata?: { commit_hash?: string } };
async function buildOf(sha: string): Promise<string> {
  const FINAL = new Set(["success", "failure", "failed", "canceled", "cancelled", "timed_out", "error"]);
  for (let i = 0; i < 90; i++) { const b = (await cf<Build[]>(`/accounts/${accountId}/builds/workers/${tag}/builds`)).find((x) => (x.build_trigger_metadata?.commit_hash ?? "").startsWith(sha)); if (b) { const st = b.status === "stopped" ? (b.build_outcome === "success" ? "success" : b.build_outcome ?? "stopped") : b.status; if (FINAL.has(st)) return st; } await Bun.sleep(4000); }
  return "not seen within six minutes";
}
const get = async (path: string) => fetch(DEMO + path, { headers: { ...ua, authorization: session } });
const until = async (what: () => Promise<boolean>) => { for (let i = 0; i < 20; i++) { if (await what()) return true; await Bun.sleep(3000); } return what(); };
async function change(label: string, fn: () => Promise<Record<string, unknown>>, live: () => Promise<boolean>) {
  console.log(`\n${label}`);
  const r = await fn(); const c = r.committed as { sha?: string; url?: string } | undefined;
  check(`the instance commits it to ${DEMO_REPO} (${c?.sha?.slice(0, 12) ?? "?"})`, r.applied === "repository" && !!c?.sha, JSON.stringify(r).slice(0, 300));
  if (!c?.sha) return;
  const t = Date.now(); const outcome = await buildOf(c.sha);
  check(`the demo's own build deploys that commit (${Math.round((Date.now() - t) / 1000)}s)`, outcome === "success", outcome);
  check("the demo answers as the change says", await until(live));
}
try {
  await change("uninstall", () => plugins.remove("echo"), async () => (await get("/api/echo")).status === 404 && !(await plugins.running()).origins.echo);
  check("the collection echo owned stays with its data", (await get("/api/collections/echoes")).status === 200);
  await change("install an older version", () => plugins.install("echo", { version: "0.1.0", marketplace: MARKET }), async () => (await get("/api/echo")).status === 200 && String((await plugins.running()).origins.echo ?? "").includes("0.1.0"));
  await change("update", () => plugins.update("echo"), async () => String((await plugins.running()).origins.echo ?? "").includes("0.2.0"));
  const log = (await (await fetch(`https://api.github.com/repos/${DEMO_REPO}/commits?per_page=3`, { headers: { accept: "application/vnd.github+json", ...ua } })).json()) as { commit: { message: string } }[];
  check("the repository's last three commits are the three changes, made by the instance", Array.isArray(log) && log.map((c) => c.commit.message.split("\n")[0]).join(" | ") === "plugins: add echo 0.2.0 | plugins: add echo 0.1.0 | plugins: remove echo", JSON.stringify(log.map?.((c) => c.commit?.message)));
} finally {
  const now = await plugins.running().catch(() => null);
  if (now && !String(now.origins.echo ?? "").includes("0.2.0")) { console.log("\nputting the demo back"); await change("restore echo 0.2.0", () => plugins.install("echo", { marketplace: MARKET }), async () => String((await plugins.running()).origins.echo ?? "").includes("0.2.0")); }
  console.log(`\n${pass} passed, ${fail} failed (${since()})`);
  process.exit(fail ? 1 : 0);
}
