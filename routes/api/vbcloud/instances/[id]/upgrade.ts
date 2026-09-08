// POST /api/vbcloud/instances/:id/upgrade — move a running instance onto the active release, in place.
//
// The instance keeps everything that makes it itself: the same D1, the same bucket, the same queue and hub, the same
// custom domains, and the same superuser. Only the code changes, and the migrations the new release brings run on
// the next boot the way they do on any deploy.
//
// The superuser is the reason this needs care. Its password is shown once at creation and kept nowhere, so an
// upgrade cannot resupply it; the secrets are declared as inherited instead, which tells Cloudflare to carry the
// deployed values across the upload rather than replacing them.
import { defineHandler } from "void";
import { authOf, pb } from "@voidbase-cloud/voidbase/adapter";
import { provisionInstance, workerExists } from "@voidbase-cloud/voidbase/cloud";
import { connectionFor, instanceJSON, isAdmin, releaseSource, requireAuth, userId } from "@/shared";

/** carried over rather than resupplied: everything the instance was given when it was created */
const INHERITED = ["VOIDBASE_SUPERUSER_EMAIL", "VOIDBASE_SUPERUSER_PASSWORD"];

export const POST = defineHandler(requireAuth("users"), async (c) => {
  const auth = authOf(c);
  const uid = userId(c);
  const row = await pb.$app.findRecordById("vb_instances", c.req.param("id") ?? "");
  if (!row) throw new pb.NotFoundError();
  if (!(row.getString("owner") === uid || (row.getBool("system") && isAdmin(auth)))) throw new pb.ForbiddenError();
  if (row.getString("status") === "creating") throw new pb.BadRequestError("This instance is still being created.");

  const name = row.getString("name");
  const release = await releaseSource(c);
  const from = row.getString("release");
  const to = release.manifest.version;
  if (from === to) return { instance: instanceJSON(row, auth), upgraded: false, from, to, message: `Already on ${to}.` };

  const { cf } = await connectionFor(uid);
  const account = row.getString("account_id");
  if (!(await workerExists(cf, account, name))) throw new pb.BadRequestError("The Worker for this instance is not on the account any more.");

  const was = row.getString("status");
  row.set("status", "upgrading");
  await pb.$app.save(row);
  const lines: string[] = [];
  try {
    // no superuser: its secrets are inherited. The Durable Object migration is not resent, because the deployed
    // script already carries the tag and sending it again is an error rather than a no-op.
    await provisionInstance(cf, {
      account,
      name,
      release,
      inheritSecrets: INHERITED,
      applyDoMigrations: false,
      tags: [`vbcloud-owner:${row.getString("owner")}`],
      log: (l) => lines.push(l),
    });
    row.set("release", to);
    row.set("status", "live");
    row.set("error", "");
    await pb.$app.save(row);
    return { instance: instanceJSON(row, auth), upgraded: true, from, to, log: lines };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // the old code is still deployed and still serving: a failed upload replaces nothing
    row.set("status", was || "live");
    row.set("error", message.slice(0, 1000));
    await pb.$app.save(row);
    throw new pb.ApiError(502, `Upgrading ${name} from ${from || "unknown"} to ${to} failed. It is still running the version it was on: ${message}`);
  }
});
