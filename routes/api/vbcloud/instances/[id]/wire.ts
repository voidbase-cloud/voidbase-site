// POST / DELETE /api/vbcloud/instances/:id/wire — the one thing the browser cannot do itself: put the user's GitHub
// token on their instance's Worker, so the instance's installer commits to the repository the instance deploys
// from. The token is the user's own OAuth token, kept sealed here; it goes to their Worker as a secret through their
// Cloudflare connection, with the repository's name and branch beside it. DELETE takes the three keys away.
import { defineHandler } from "void";
import { authOf, pb } from "@voidbase-cloud/voidbase/adapter";
import { connectionFor, ghConnectionFor, isAdmin, readBody, requireAuth, userId } from "@/shared";

const KEYS = ["VOIDBASE_PROJECT_REPO", "VOIDBASE_PROJECT_BRANCH", "VOIDBASE_GH_TOKEN"] as const;
async function owned(c: Parameters<Parameters<typeof defineHandler>[1]>[0]) {
  const uid = userId(c); const row = await pb.$app.findRecordById("vb_instances", c.req.param("id") ?? ""); if (!row) throw new pb.NotFoundError();
  if (!(row.getString("owner") === uid || (row.getBool("system") && isAdmin(authOf(c))))) throw new pb.ForbiddenError();
  if (row.getBool("system")) throw new pb.BadRequestError("A system instance is wired by the operator (VOIDBASE_PROJECT_REPO and VOIDBASE_GH_TOKEN in its secrets).");
  return { uid, row };
}

export const POST = defineHandler(requireAuth("users"), async (c) => {
  const { uid, row } = await owned(c); const body = await readBody(c);
  const fullName = String(body.repository ?? "").trim().toLowerCase(); const branch = String(body.branch ?? "").trim() || "master";
  if (!/^[a-z0-9-]+\/[a-z0-9._-]+$/.test(fullName)) throw new pb.BadRequestError("Say which repository, as owner/name.");
  const { cf } = await connectionFor(uid); const { token } = await ghConnectionFor(uid);
  const account = row.getString("account_id"); const name = row.getString("name");
  const values: Record<string, string> = { VOIDBASE_PROJECT_REPO: fullName, VOIDBASE_PROJECT_BRANCH: branch, VOIDBASE_GH_TOKEN: token };
  for (const [k, text] of Object.entries(values)) await cf.json("PUT", `/accounts/${account}/workers/scripts/${name}/secrets`, { name: k, text, type: "secret_text" });
  return { wired: Object.keys(values), repository: fullName, branch };
});

export const DELETE = defineHandler(requireAuth("users"), async (c) => {
  const { uid, row } = await owned(c);
  const { cf } = await connectionFor(uid); const account = row.getString("account_id"); const name = row.getString("name");
  for (const k of KEYS) await cf.json("DELETE", `/accounts/${account}/workers/scripts/${name}/secrets/${k}`, undefined, [404, 10007]).catch(() => null);
  return { unwired: [...KEYS] };
});
