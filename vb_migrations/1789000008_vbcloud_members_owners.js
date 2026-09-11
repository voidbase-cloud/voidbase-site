/// <reference path="../.voidbase/pb_data/types.d.ts" />
// Every instance that already exists gets its `owner` member, so nothing anyone has today stops working: the rules
// 1789000007 wrote read the team, and without this a row created before the team existed would have none. A
// separate file because a migration cannot see the collection it just created; this one runs after that reload.
// The site's own backend and the system projects are owned by nobody and are left alone, as they are everywhere
// else: an admin reaches them through VB_ADMIN_EMAILS, not through a membership.
migrate(async (app) => {
  const members = app.findCollectionByNameOrId("vb_members");
  const now = new Date().toISOString().replace("T", " ");
  const instances = await app.findRecordsByFilter("vb_instances", "owner != ''", "created", 1000, 0);
  let made = 0;
  for (const inst of instances) {
    const owner = inst.getString("owner");
    if (!owner) continue;
    if ((await app.findRecordsByFilter("vb_members", "instance = {:i} && user = {:u}", "", 1, 0, { i: inst.id, u: owner })).length) continue;
    let email = "";
    try { email = String((await app.findRecordById("users", owner))?.getString("email") ?? "").toLowerCase(); } catch (_) { email = ""; }
    if (!email) { console.warn(`vbcloud: ${inst.getString("name")} has an owner with no email address, so it gets no owner member`); continue; }
    const row = new Record(members);
    row.set("instance", inst.id); row.set("user", owner); row.set("email", email); row.set("role", "owner"); row.set("accepted_at", now);
    await app.save(row);
    made++;
  }
  if (made) console.log(`vbcloud: ${made} instance(s) given their owner member`);
  return null;
}, () => {
  // the rows go with the collection when 1789000007 is rolled back; there is nothing of its own to undo here
  return null;
});
