/// <reference path="../.voidbase/pb_data/types.d.ts" />
// Dogfooding: the site's own repository (VB_SITE_REPO, voidbase-cloud/voidbase-site) is listed as a `system` row of
// vb_repos, linked to the site's own backend instance and owned by nobody, so `user` is optional now. Existing repositories
// can be linked without being created from a template (see ../cloud/github.ts). Import matches the collection by name and
// keeps every existing field.
migrate((app) => {
  const c = app.findCollectionByNameOrId("vb_repos");
  const user = c.fields.getByName("user"); if (user) user.required = false;
  if (!c.fields.getByName("system")) c.fields.add({ type: "bool", name: "system", required: false, hidden: false, presentable: false, system: false });
  app.save(c);
  return null;
}, (app) => {
  const c = app.findCollectionByNameOrId("vb_repos");
  const f = c.fields.getByName("system"); if (f) c.fields.removeById(f.id);
  app.save(c);
  return null;
});
