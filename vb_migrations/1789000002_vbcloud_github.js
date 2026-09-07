/// <reference path="../.voidbase/pb_data/types.d.ts" />
// The template marketplace (see ../cloud/github.ts):
//   gh_connections  one row per user who connected GitHub: sealed OAuth token, login, avatar (no API rules)
//   vb_templates    GitHub template repositories offered on the /cloud page (public read; superusers add more from the
//                   panel). `variables` lists the repository Actions variables to write when a repository is created:
//                   [{ name, source }] with source instance_url | instance_panel | instance_name | input:<field> | literal
//   vb_repos        repositories created from a template in a user's GitHub account, wired to one of their instances
migrate((app) => {
  const text = (name, extra = {}) => ({ type: "text", name, required: false, hidden: false, presentable: false, system: false, primaryKey: false, autogeneratePattern: "", min: 0, max: 0, pattern: "", ...extra });
  const url = (name) => ({ type: "url", name, required: false, hidden: false, presentable: false, system: false, exceptDomains: [], onlyDomains: [] });
  const autodates = [
    { type: "autodate", name: "created", onCreate: true, onUpdate: false, hidden: false, presentable: false, system: false },
    { type: "autodate", name: "updated", onCreate: true, onUpdate: true, hidden: false, presentable: false, system: false },
  ];
  const id = { type: "text", name: "id", required: true, primaryKey: true, system: true, hidden: false, presentable: false, autogeneratePattern: "[a-z0-9]{15}", min: 15, max: 15, pattern: "^[a-z0-9]+$" };
  const rel = (name, collectionId, required, cascadeDelete) => ({ type: "relation", name, collectionId, cascadeDelete, maxSelect: 1, minSelect: 0, required, hidden: false, presentable: false, system: false });
  app.importCollections([
    {
      name: "gh_connections", type: "base", system: false,
      listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null,
      indexes: ["CREATE UNIQUE INDEX `idx_gh_connections_user` ON `gh_connections` (`user`)"],
      fields: [id, rel("user", "_pb_users_auth_", true, true), text("gh_user_id"), text("login", { presentable: true }), text("name"), url("avatar_url"), text("access_token", { hidden: true }), text("scopes"), ...autodates],
    },
    {
      name: "vb_templates", type: "base", system: false,
      listRule: "", viewRule: "", createRule: null, updateRule: null, deleteRule: null,
      indexes: ["CREATE UNIQUE INDEX `idx_vb_templates_name` ON `vb_templates` (`name`)"],
      fields: [
        id, text("name", { required: true, presentable: true, pattern: "^[a-z0-9-]+$" }), text("repo", { required: true }), text("title", { required: true }), text("description"), url("url"),
        { type: "select", name: "kind", required: true, hidden: false, presentable: false, system: false, maxSelect: 1, values: ["site", "app", "backend"] },
        { type: "json", name: "variables", required: false, hidden: false, presentable: false, system: false, maxSize: 0 },
        ...autodates,
      ],
    },
    {
      name: "vb_repos", type: "base", system: false,
      listRule: "@request.auth.id != '' && user = @request.auth.id", viewRule: "@request.auth.id != '' && user = @request.auth.id",
      createRule: null, updateRule: null, deleteRule: null,
      indexes: ["CREATE UNIQUE INDEX `idx_vb_repos_full_name` ON `vb_repos` (`full_name`)"],
      fields: [
        id, rel("user", "_pb_users_auth_", true, true),
        text("instance"), text("template"), // ids kept as text: an instance or template may be deleted while the repository lives on
        text("full_name", { required: true, presentable: true }), url("html_url"), text("default_branch"),
        { type: "bool", name: "private", required: false, hidden: false, presentable: false, system: false },
        { type: "select", name: "status", required: true, hidden: false, presentable: false, system: false, maxSelect: 1, values: ["creating", "ready", "error"] },
        text("error"), ...autodates,
      ],
    },
  ], false);
  // the first template (this site) is seeded by cloud/github.ts at bootstrap
  return null;
}, (app) => {
  for (const name of ["vb_repos", "vb_templates", "gh_connections"]) { try { app.delete(app.findCollectionByNameOrId(name)); } catch (_) { /* already gone */ } }
  return null;
});
