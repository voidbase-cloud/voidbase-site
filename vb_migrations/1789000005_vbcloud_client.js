/// <reference path="../.voidbase/pb_data/types.d.ts" />
// voidbase.cloud does its work in the browser: the rows it keeps about a user's instances and repositories are the
// user's to write, through the collections' rules, as long as they are the user's own and not system rows.
migrate((app) => {
  const inst = app.findCollectionByNameOrId("vb_instances");
  const status = inst.fields.getByName("status"); if (status && !status.values.includes("upgrading")) status.values = [...status.values, "upgrading"];
  inst.listRule = "@request.auth.id != '' && owner = @request.auth.id";
  inst.viewRule = "@request.auth.id != '' && owner = @request.auth.id";
  inst.createRule = "@request.auth.id != '' && @request.body.owner = @request.auth.id && @request.body.system != true";
  inst.updateRule = "@request.auth.id != '' && owner = @request.auth.id && system != true && @request.body.owner:isset = false && @request.body.system:isset = false";
  inst.deleteRule = "@request.auth.id != '' && owner = @request.auth.id && system != true";
  app.save(inst);
  const repos = app.findCollectionByNameOrId("vb_repos");
  repos.createRule = "@request.auth.id != '' && @request.body.user = @request.auth.id && @request.body.system != true";
  repos.updateRule = "@request.auth.id != '' && user = @request.auth.id && system != true && @request.body.user:isset = false && @request.body.system:isset = false";
  repos.deleteRule = "@request.auth.id != '' && user = @request.auth.id && system != true";
  app.save(repos);
  return null;
}, (app) => {
  for (const name of ["vb_instances", "vb_repos"]) { const c = app.findCollectionByNameOrId(name); c.createRule = null; c.updateRule = null; c.deleteRule = null; app.save(c); }
  return null;
});
