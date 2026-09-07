import { defineHandler } from "void";
import { authOf, pb } from "@voidbase-cloud/voidbase/adapter";
import { destroyInstance } from "@voidbase-cloud/voidbase/cloud";
import { cfg, connectionFor, isAdmin, requireAuth, userId } from "@/shared";

export const DELETE = defineHandler(requireAuth("users"), async (c) => {
  const uid = userId(c); const row = await pb.$app.findRecordById("vb_instances", c.req.param("id") ?? ""); if (!row) throw new pb.NotFoundError();
  const system = row.getBool("system");
  if (!(row.getString("owner") === uid || (system && isAdmin(authOf(c))))) throw new pb.ForbiddenError("Only the owner can delete this instance.");
  if (row.getString("status") === "deleting") throw new pb.BadRequestError("This instance is already being deleted.");
  if (system && !cfg().allowSelfDelete) throw new pb.ForbiddenError("Deleting the site's own backend is disabled (VB_ALLOW_SELF_DELETE=1 enables it).");
  const { cf, accounts } = await connectionFor(uid);
  const accountId = row.getString("account_id");
  if (accounts.length && !accounts.some((a) => a.id === accountId)) throw new pb.BadRequestError(`Your Cloudflare connection does not reach account ${accountId}: sign in with Cloudflare again and grant it.`);
  row.set("status", "deleting"); await pb.$app.save(row);
  const name = row.getString("name"); const self = !!cfg().worker && name === cfg().worker;
  const lines: string[] = [];
  // for the site's own backend the script goes first (that is this Worker), the data after; the response still
  // leaves this isolate, later requests hit a deleted Worker. Anything else: same order, nothing special.
  const report = await destroyInstance(cf, { account: accountId, name, log: (l) => lines.push(l) });
  if (self) return { deleted: report.deleted, skipped: report.skipped, errors: report.errors, self: true, log: lines };
  if (report.errors.length) { row.set("status", "error"); row.set("error", report.errors.join("; ").slice(0, 1000)); await pb.$app.save(row); throw new pb.BadRequestError(`Deleting ${name} left errors: ${report.errors.join("; ")}`, { report }); }
  await pb.$app.delete(row);
  return { deleted: report.deleted, skipped: report.skipped, errors: report.errors, self: false, log: lines };
});
