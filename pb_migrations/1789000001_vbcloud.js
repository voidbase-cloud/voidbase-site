/// <reference path="../pb_data/types.d.ts" />
// voidbase cloud control plane (see ../cloud/index.ts):
//   cf_connections  one row per user who signed in with Cloudflare: their OAuth tokens and the accounts they granted
//                   (no API rules: only the control plane routes and superusers read it)
//                   (tokens sealed with VOIDBASE_ENCRYPTION_KEY, see ../cloud/index.ts)
//   vb_instances    the voidbase instances created from the site, one row each, listed to their owner; the site's own
//                   backend appears as the `system` row that admins can delete (dogfooding)
migrate((app) => {
  const text = (name, extra = {}) => ({ type: "text", name, required: false, hidden: false, presentable: false, system: false, primaryKey: false, autogeneratePattern: "", min: 0, max: 0, pattern: "", ...extra });
  const autodates = [
    { type: "autodate", name: "created", onCreate: true, onUpdate: false, hidden: false, presentable: false, system: false },
    { type: "autodate", name: "updated", onCreate: true, onUpdate: true, hidden: false, presentable: false, system: false },
  ];
  const id = { type: "text", name: "id", required: true, primaryKey: true, system: true, hidden: false, presentable: false, autogeneratePattern: "[a-z0-9]{15}", min: 15, max: 15, pattern: "^[a-z0-9]+$" };
  const user = (name, required) => ({ type: "relation", name, collectionId: "_pb_users_auth_", cascadeDelete: true, maxSelect: 1, minSelect: 0, required, hidden: false, presentable: false, system: false });
  return app.importCollections([
    {
      name: "cf_connections", type: "base", system: false,
      listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null,
      indexes: ["CREATE UNIQUE INDEX `idx_cf_connections_user` ON `cf_connections` (`user`)"],
      fields: [
        id, user("user", true),
        text("cf_user_id"), { type: "email", name: "email", required: false, hidden: false, presentable: true, system: false, exceptDomains: [], onlyDomains: [] }, text("name"),
        text("access_token", { hidden: true }), text("refresh_token", { hidden: true }), { type: "date", name: "expiry", required: false, hidden: false, presentable: false, system: false, min: "", max: "" },
        text("scopes"), { type: "json", name: "accounts", required: false, hidden: false, presentable: false, system: false, maxSize: 0 },
        ...autodates,
      ],
    },
    {
      name: "vb_instances", type: "base", system: false,
      listRule: "@request.auth.id != '' && owner = @request.auth.id", viewRule: "@request.auth.id != '' && owner = @request.auth.id",
      createRule: null, updateRule: null, deleteRule: null,
      indexes: ["CREATE UNIQUE INDEX `idx_vb_instances_name` ON `vb_instances` (`name`)"],
      fields: [
        id, user("owner", false),
        text("name", { required: true, presentable: true, pattern: "^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$" }), text("account_id", { required: true }), text("account_name"),
        { type: "url", name: "url", required: false, hidden: false, presentable: false, system: false, exceptDomains: [], onlyDomains: [] },
        { type: "select", name: "status", required: true, hidden: false, presentable: false, system: false, maxSelect: 1, values: ["creating", "live", "error", "deleting", "deleted"] },
        text("error"), text("release"), text("d1_id"), text("queue_id"),
        text("superuser_email"), // the generated password is shown once at creation and never stored
        { type: "bool", name: "system", required: false, hidden: false, presentable: false, system: false },
        ...autodates,
      ],
    },
  ], false);
}, (app) => {
  for (const name of ["vb_instances", "cf_connections"]) { try { app.delete(app.findCollectionByNameOrId(name)); } catch (_) { /* already gone */ } }
  return null;
});
