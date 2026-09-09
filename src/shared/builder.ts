// The builder behind cloud instance plugins runs in GitHub Actions (voidbase's instance-build workflow) on a
// schedule. GitHub's schedules are best effort and can lag by a long time, so when a token is configured the
// control plane starts the workflow itself the moment a build is queued; without one, the schedule is the fallback
// and the dashboard says "within minutes". Never a failure of the request that queued the build.
import { env } from "./pb";
import { ghCfg } from "./config";

export async function dispatchBuilder(reason: string): Promise<"started" | "no-token" | "failed"> {
  const token = env("VB_GITHUB_TOKEN"); if (!token) return "no-token";
  const repo = env("VB_BUILDER_REPO", "voidbase-cloud/voidbase"); const workflow = env("VB_BUILDER_WORKFLOW", "instance-build.yml");
  try {
    const r = await fetch(`${ghCfg().api}/repos/${repo}/actions/workflows/${workflow}/dispatches`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, accept: "application/vnd.github+json", "content-type": "application/json", "user-agent": "voidbase-cloud" },
      body: JSON.stringify({ ref: "master" }),
    });
    if (r.status !== 204) { console.warn("vbcloud: builder dispatch", reason, r.status, (await r.text()).slice(0, 200)); return "failed"; }
    return "started";
  } catch (err) { console.warn("vbcloud: builder dispatch", reason, err); return "failed"; }
}
