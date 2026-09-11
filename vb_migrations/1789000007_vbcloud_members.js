/// <reference path="../.voidbase/pb_data/types.d.ts" />
// An instance belongs to a team, not to whoever clicked first:
//   vb_members  one row per person on an instance. `email` is who was invited, lowercase and unique per instance;
//               `user` is filled in when they accept, so a row with none is a pending invitation. `token` is the
//               invitation's secret, hidden at rest and cleared on acceptance; `role` is what they may do:
//                 owner   everything, including deleting the instance and changing who is on it
//                 admin   everything to the instance (upgrade, roll back, domains, secrets, plugins, backups),
//                         but not deleting it and not membership
//                 viewer  reads what the instance reports and changes nothing
//
// Rules: a member of an instance lists and views its members (through the instance, so a pending row is visible to
// the team it belongs to), an owner changes a role, and creating and removing are the routes' alone
// (routes/api/vbcloud/instances/[id]/members/, .../invitations/[token]/accept) because an invitation carries a
// token and a token is not a thing the record API hands out. vb_hooks/05.last-owner.ts is what keeps an instance
// from losing its last owner through the role rule.
//
// vb_instances moves with it: the rows a member may see, change and delete are now said in terms of the member
// rows rather than the `owner` field, which stays as the creator's mark and as the fallback for a row written
// before this migration (see 1789000008_vbcloud_members_owners.js).
migrate((app) => {
  const instances = app.findCollectionByNameOrId("vb_instances");
  const text = (name, extra = {}) => ({ type: "text", name, required: false, hidden: false, presentable: false, system: false, primaryKey: false, autogeneratePattern: "", min: 0, max: 0, pattern: "", ...extra });
  const autodates = [
    { type: "autodate", name: "created", onCreate: true, onUpdate: false, hidden: false, presentable: false, system: false },
    { type: "autodate", name: "updated", onCreate: true, onUpdate: true, hidden: false, presentable: false, system: false },
  ];
  const id = { type: "text", name: "id", required: true, primaryKey: true, system: true, hidden: false, presentable: false, autogeneratePattern: "[a-z0-9]{15}", min: 15, max: 15, pattern: "^[a-z0-9]+$" };
  const rel = (name, collectionId, required, cascadeDelete) => ({ type: "relation", name, collectionId, cascadeDelete, maxSelect: 1, minSelect: 0, required, hidden: false, presentable: false, system: false });
  // a member of the instance this row belongs to, whichever row of it names them
  const onTheTeam = "instance.owner = @request.auth.id || instance.vb_members_via_instance.user ?= @request.auth.id";
  const anOwner = "instance.owner = @request.auth.id || (instance.vb_members_via_instance.user ?= @request.auth.id && instance.vb_members_via_instance.role ?= 'owner')";
  app.importCollections([
    {
      name: "vb_members", type: "base", system: false,
      listRule: `@request.auth.id != '' && (${onTheTeam})`,
      viewRule: `@request.auth.id != '' && (${onTheTeam})`,
      // the routes write these rows: an invitation carries a token, and accepting one binds a user to it
      createRule: null,
      // an owner changes a role, and nothing else: the email, the user, the token and the acceptance are the routes'
      updateRule: `@request.auth.id != '' && (${anOwner}) && @request.body.instance:isset = false && @request.body.user:isset = false && @request.body.email:isset = false && @request.body.token:isset = false && @request.body.invited_by:isset = false && @request.body.accepted_at:isset = false`,
      deleteRule: null,
      indexes: [
        "CREATE UNIQUE INDEX `idx_vb_members_instance_email` ON `vb_members` (`instance`, `email`)",
        "CREATE INDEX `idx_vb_members_user` ON `vb_members` (`user`)",
      ],
      fields: [
        id,
        rel("instance", instances.id, true, true),
        rel("user", "_pb_users_auth_", false, true), // empty until the invitation is accepted
        text("email", { required: true, presentable: true, pattern: "^[^A-Z@\\s]+@[^A-Z@\\s]+$" }), // lowercase, so one address is one row
        { type: "select", name: "role", required: true, hidden: false, presentable: false, system: false, maxSelect: 1, values: ["owner", "admin", "viewer"] },
        rel("invited_by", "_pb_users_auth_", false, false),
        text("token", { hidden: true }), // the invitation's secret, cleared on acceptance
        { type: "date", name: "accepted_at", required: false, hidden: false, presentable: false, system: false, min: "", max: "" },
        ...autodates,
      ],
    },
  ], false);
  // the instance itself, in terms of the team: a member sees it, an owner or an admin changes it, an owner deletes it
  const member = "owner = @request.auth.id || vb_members_via_instance.user ?= @request.auth.id";
  const changer = "owner = @request.auth.id || (vb_members_via_instance.user ?= @request.auth.id && (vb_members_via_instance.role ?= 'owner' || vb_members_via_instance.role ?= 'admin'))";
  const remover = "owner = @request.auth.id || (vb_members_via_instance.user ?= @request.auth.id && vb_members_via_instance.role ?= 'owner')";
  instances.listRule = `@request.auth.id != '' && (${member})`;
  instances.viewRule = `@request.auth.id != '' && (${member})`;
  instances.updateRule = `@request.auth.id != '' && (${changer}) && system != true && @request.body.owner:isset = false && @request.body.system:isset = false`;
  instances.deleteRule = `@request.auth.id != '' && (${remover}) && system != true`;
  app.save(instances);
  return null;
}, (app) => {
  try { app.delete(app.findCollectionByNameOrId("vb_members")); } catch (_) { /* already gone */ }
  const instances = app.findCollectionByNameOrId("vb_instances");
  instances.listRule = "@request.auth.id != '' && owner = @request.auth.id";
  instances.viewRule = "@request.auth.id != '' && owner = @request.auth.id";
  instances.updateRule = "@request.auth.id != '' && owner = @request.auth.id && system != true && @request.body.owner:isset = false && @request.body.system:isset = false";
  instances.deleteRule = "@request.auth.id != '' && owner = @request.auth.id && system != true";
  app.save(instances);
  return null;
});
