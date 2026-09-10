import { defineHandler } from "void";
import { authOf, pb } from "@voidbase-cloud/voidbase/adapter";
import { alreadyLinked, ensureSiteRepo, ensureSystemProjects, gh, ghConnectionFor, isAdmin, linkableInstance, readBody, repoJSON, requireAuth, setVariable, templateJSON, userId, varValue, type HookRecord } from "@/shared";

export const GET = defineHandler(requireAuth("users"), async (c) => {
  const uid = userId(c);
  const own = (await pb.$app.findRecordsByFilter("vb_repos", "user = {:u}", "-created", 100, 0, { u: uid })) as HookRecord[];
  let system: HookRecord[] = [];
  if (isAdmin(authOf(c))) { try { await ensureSiteRepo(); await ensureSystemProjects(); } catch (err) { console.warn("vbcloud: site repository", err); } system = (await pb.$app.findRecordsByFilter("vb_repos", "system = true", "-created", 20, 0)) as HookRecord[]; }
  const rows = [...own, ...system.filter((r) => !own.some((o) => o.id === r.id))];
  let token = ""; try { token = (await ghConnectionFor(uid)).token; } catch { token = ""; }
  const out = [];
  for (const r of rows) {
    let inst: HookRecord | null = null; try { inst = r.getString("instance") ? await pb.$app.findRecordById("vb_instances", r.getString("instance")) : null; } catch { inst = null; }
    let tpl: HookRecord | null = null; try { tpl = r.getString("template") ? await pb.$app.findRecordById("vb_templates", r.getString("template")) : null; } catch { tpl = null; }
    // live check: the repository still exists and its PB_VB_URL variable points at the instance
    let live: Record<string, unknown> = { checked: false };
    if (token) {
      try {
        const repo = await gh<{ html_url: string; default_branch: string; private: boolean }>(token, "GET", `/repos/${r.getString("full_name")}`, undefined, [404]);
        if (repo.status === 404) live = { checked: true, exists: false, connected: false };
        else {
          const v = await gh<{ value?: string }>(token, "GET", `/repos/${r.getString("full_name")}/actions/variables/PB_VB_URL`, undefined, [404]);
          const value = v.status === 404 ? "" : String(v.data?.value ?? "");
          live = { checked: true, exists: true, connected: !!inst && !!value && value === inst.getString("url"), backendUrl: value, htmlUrl: repo.data.html_url, defaultBranch: repo.data.default_branch, private: repo.data.private };
        }
      } catch (err) { live = { checked: false, error: err instanceof Error ? err.message : String(err) }; }
    }
    out.push(repoJSON(r, { instanceName: inst?.getString("name") ?? "", instanceUrl: inst?.getString("url") ?? "", templateName: tpl?.getString("name") ?? "", templateTitle: tpl?.getString("title") ?? "", live }));
  }
  return { repos: out, githubConnected: !!token };
});

export const POST = defineHandler(requireAuth("users"), async (c) => {
  const uid = userId(c); const body = await readBody(c);
  const { conn, token } = await ghConnectionFor(uid);
  const tplKey = String(body.template ?? "").trim(); if (!tplKey) throw new pb.BadRequestError("Pick a template.");
  let tpl: HookRecord; try { tpl = await pb.$app.findFirstRecordByFilter("vb_templates", "name = {:n} || id = {:n}", { n: tplKey }); } catch { throw new pb.BadRequestError(`Unknown template "${tplKey}".`); }
  const inst = await linkableInstance(c, uid, String(body.instance ?? "").trim());
  // GitHub treats repository names case-insensitively: keep them lowercase so the "already linked" check is exact
  const name = String(body.name ?? "").trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^[-.]+|[-.]+$/g, "");
  if (!name || name.length > 100) throw new pb.BadRequestError("Give the repository a name (letters, digits, dashes, dots, underscores).");
  const owner = String(body.owner ?? conn.getString("login")); const fullName = `${owner}/${name}`;
  if (await alreadyLinked(fullName)) throw new pb.BadRequestError(`${fullName} is already linked here.`);
  const row = new pb.Record(pb.$app.findCollectionByNameOrId("vb_repos"));
  row.set("user", uid); row.set("instance", inst.id); row.set("template", tpl.id); row.set("full_name", fullName); row.set("private", !!body.private); row.set("status", "creating");
  await pb.$app.save(row);
  const t = templateJSON(tpl);
  try {
    const made = await gh<{ full_name: string; html_url: string; default_branch: string; private: boolean }>(token, "POST", `/repos/${t.repo}/generate`, { owner, name, private: !!body.private, description: String(body.description ?? `${t.title} on voidbase (${inst.getString("name")})`), include_all_branches: false });
    row.set("full_name", made.data.full_name); row.set("html_url", made.data.html_url); row.set("default_branch", made.data.default_branch ?? "main"); row.set("private", !!made.data.private);
    // the template's variables: the instance URL is what connects the repository to the instance
    const set: Record<string, string> = {};
    for (const v of t.variables) { const value = varValue(v.source, inst, body, v.value); if (!value) continue; await setVariable(token, made.data.full_name, v.name, value); set[v.name] = value; }
    row.set("status", "ready"); row.set("error", ""); await pb.$app.save(row);
    return { repo: repoJSON(row, { variables: set, instanceName: inst.getString("name"), instanceUrl: inst.getString("url"), templateName: t.name, templateTitle: t.title }) };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    row.set("status", "error"); row.set("error", message.slice(0, 1000)); await pb.$app.save(row);
    throw new pb.BadRequestError(`Creating ${fullName} failed: ${message}`);
  }
});
