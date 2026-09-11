/// <reference path="../.voidbase/pb_data/types.d.ts" />
// An upgrade is reversible for a while: previous_release is the release the instance was on before the last one,
// and upgraded_at is when it moved. The browser writes both when it upgrades (the owner already updates their own
// rows, see 1789000005_vbcloud_client.js) and clears both on a rollback, so a rollback is not itself rollable.
migrate((app) => {
  const c = app.findCollectionByNameOrId("vb_instances");
  if (!c.fields.getByName("previous_release")) c.fields.add({ type: "text", name: "previous_release", required: false, hidden: false, presentable: false, system: false, primaryKey: false, autogeneratePattern: "", pattern: "", min: 0, max: 0 });
  if (!c.fields.getByName("upgraded_at")) c.fields.add({ type: "date", name: "upgraded_at", required: false, hidden: false, presentable: false, system: false, min: "", max: "" });
  app.save(c);
  return null;
}, (app) => {
  const c = app.findCollectionByNameOrId("vb_instances");
  for (const name of ["previous_release", "upgraded_at"]) { const f = c.fields.getByName(name); if (f) c.fields.removeById(f.id); }
  app.save(c);
  return null;
});
