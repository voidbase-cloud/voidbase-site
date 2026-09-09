/// <reference path="../.voidbase/pb_data/types.d.ts" />
// The durable run behind an instance's build (workflows/instance-build.ts): its id, so the routes the builder
// calls can tell the run what happened.
migrate((app) => {
  const instances = app.findCollectionByNameOrId("vb_instances");
  instances.fields.add({ type: "text", name: "build_run", required: false, hidden: false, presentable: false, system: false, primaryKey: false, autogeneratePattern: "", pattern: "", min: 0, max: 0 });
  app.save(instances);
}, (app) => {
  const instances = app.findCollectionByNameOrId("vb_instances");
  instances.fields.removeByName("build_run");
  app.save(instances);
});
