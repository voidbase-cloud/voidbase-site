/// <reference path="../.voidbase/pb_data/types.d.ts" />
// A project instance (one with a repository linked) gets its plugins by a commit to that repository, not by a build
// here: build_commit is the URL of the last commit the control plane made for it.
migrate((app) => {
  const c = app.findCollectionByNameOrId("vb_instances");
  if (!c.fields.getByName("build_commit")) c.fields.add({ type: "text", name: "build_commit", required: false, hidden: false, presentable: false, system: false, primaryKey: false, autogeneratePattern: "", pattern: "", min: 0, max: 0 });
  app.save(c);
  return null;
}, (app) => {
  const c = app.findCollectionByNameOrId("vb_instances");
  const f = c.fields.getByName("build_commit"); if (f) c.fields.removeById(f.id);
  app.save(c);
  return null;
});
