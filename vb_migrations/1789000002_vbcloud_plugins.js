/// <reference path="../.voidbase/pb_data/types.d.ts" />
// An instance's plugins, for the cloud shape: the set it should run (recorded when the owner installs or removes
// one), and the state of the build that makes them real, because a cloud instance's plugins are fixed when its
// Worker is built and the control plane cannot build one itself.
migrate((app) => {
  const instances = app.findCollectionByNameOrId("vb_instances");
  const text = (name) => ({ type: "text", name, required: false, hidden: false, presentable: false, system: false, primaryKey: false, autogeneratePattern: "", pattern: "", min: 0, max: 0 });
  instances.fields.add({ type: "json", name: "plugins", required: false, hidden: false, presentable: false, system: false, maxSize: 0 });
  instances.fields.add(text("build"));
  instances.fields.add(text("build_error"));
  app.save(instances);
}, (app) => {
  const instances = app.findCollectionByNameOrId("vb_instances");
  for (const name of ["plugins", "build", "build_error"]) instances.fields.removeByName(name);
  app.save(instances);
});
