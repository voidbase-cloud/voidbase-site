// POST /api/vbcloud/builds/:id/done — a release built for this instance was pushed; deploy the instance from it.
//
// The same upload an upgrade does, from the named release instead of the base: the instance keeps its database,
// files, domains and superuser (secrets inherited, Durable Object migrations not resent), and only the code changes.
import { defineHandler } from "void";
import { pb } from "@voidbase-cloud/voidbase/adapter";
import { provisionInstance } from "@voidbase-cloud/voidbase/cloud";
import { connectionFor, instanceJSON, readBody, releaseSource, reportBuild, requireSuperuser, safe } from "@/shared";

const INHERITED = ["VOIDBASE_SUPERUSER_EMAIL", "VOIDBASE_SUPERUSER_PASSWORD"];

export const POST = defineHandler(requireSuperuser(), async (c) => {
  const row = await pb.$app.findRecordById("vb_instances", c.req.param("id") ?? "");
  if (!row) throw new pb.NotFoundError();
  const version = String((await readBody(c)).version ?? "");
  if (!safe(version)) throw new pb.BadRequestError("a release version is required");
  const release = await releaseSource(c, version);
  const { cf } = await connectionFor(row.getString("owner"));
  const lines: string[] = [];
  try {
    await provisionInstance(cf, { account: row.getString("account_id"), name: row.getString("name"), release, inheritSecrets: INHERITED, applyDoMigrations: false, tags: [`vbcloud-owner:${row.getString("owner")}`], log: (l) => lines.push(l) });
    row.set("release", version); row.set("build", ""); row.set("build_error", ""); row.set("status", "live"); row.set("error", "");
    await pb.$app.save(row);
    await reportBuild(c, row, { version });
    return { instance: instanceJSON(row, null), log: lines };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // the previous code is still deployed and still serving: a failed upload replaces nothing
    row.set("build", "failed"); row.set("build_error", `deploying ${version}: ${message}`.slice(0, 1000));
    await pb.$app.save(row);
    await reportBuild(c, row, { error: `deploying ${version}: ${message}`.slice(0, 1000) });
    throw new pb.ApiError(502, `Deploying ${version} to ${row.getString("name")} failed; it still runs ${row.getString("release") || "what it had"}: ${message}`, { log: lines });
  }
});
