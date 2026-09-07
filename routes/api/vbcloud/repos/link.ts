import { defineHandler } from "void";
import { pb } from "@voidbase-cloud/voidbase/adapter";
import { alreadyLinked, gh, ghConnectionFor, linkableInstance, readBody, repoJSON, requireAuth, setVariable, templateJSON, userId, varValue, type HookRecord } from "@/shared";

// link a repository that already exists (a fork of this site, a hand-made app): the instance URL is written as its
// PB_VB_URL variable, plus the instance-derived variables of the template it came from when one is named
export const POST = defineHandler(requireAuth("users"), async (c) => {
  const uid = userId(c); const body = await readBody(c);
  const { token } = await ghConnectionFor(uid);
  const fullName = String(body.fullName ?? body.full_name ?? "").trim().toLowerCase().replace(/^https?:\/\/github\.com\//, "").replace(/\.git$/, "").replace(/\/+$/, "");
  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\/[a-z0-9._-]+$/.test(fullName)) throw new pb.BadRequestError("Give the repository as owner/name (or its GitHub URL).");
  const inst = await linkableInstance(c, uid, String(body.instance ?? "").trim());
  if (await alreadyLinked(fullName)) throw new pb.BadRequestError(`${fullName} is already linked here.`);
  let tpl: HookRecord | null = null; const tplKey = String(body.template ?? "").trim();
  if (tplKey) { try { tpl = await pb.$app.findFirstRecordByFilter("vb_templates", "name = {:n} || id = {:n}", { n: tplKey }); } catch { throw new pb.BadRequestError(`Unknown template "${tplKey}".`); } }
  const repo = await gh<{ full_name: string; html_url: string; default_branch: string; private: boolean; permissions?: { push?: boolean } }>(token, "GET", `/repos/${fullName}`, undefined, [404]);
  if (repo.status === 404) throw new pb.BadRequestError(`${fullName} was not found on GitHub with your connection (does the account have access to it?).`);
  if (repo.data.permissions && repo.data.permissions.push === false) throw new pb.BadRequestError(`You cannot write to ${fullName}, so its variables cannot be set.`);
  const set: Record<string, string> = {};
  const vars = tpl ? templateJSON(tpl).variables : [];
  if (!vars.some((v) => v.name === "PB_VB_URL")) vars.unshift({ name: "PB_VB_URL", source: "instance_url" });
  for (const v of vars) { if (!v.source.startsWith("instance_") && !(v.source.startsWith("input:") && body[v.source.slice(6)])) continue; const value = varValue(v.source, inst, body, v.value); if (!value) continue; await setVariable(token, repo.data.full_name, v.name, value); set[v.name] = value; }
  const row = new pb.Record(pb.$app.findCollectionByNameOrId("vb_repos"));
  row.set("user", uid); row.set("instance", inst.id); row.set("template", tpl?.id ?? ""); row.set("full_name", repo.data.full_name.toLowerCase()); row.set("html_url", repo.data.html_url); row.set("default_branch", repo.data.default_branch ?? ""); row.set("private", !!repo.data.private); row.set("status", "ready");
  await pb.$app.save(row);
  return { repo: repoJSON(row, { variables: set, instanceName: inst.getString("name"), instanceUrl: inst.getString("url"), templateName: tpl?.getString("name") ?? "", templateTitle: tpl?.getString("title") ?? "" }) };
});
