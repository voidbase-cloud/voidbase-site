import{I as e,P as t,it as n,nt as r}from"../chunks/BDLcFjNi.js";import"../chunks/xihTtKlq.js";import"../chunks/C3kXMaAy.js";import{t as i}from"../chunks/BnicrACe.js";import{t as a}from"../chunks/CKGhWLYV.js";import{t as o}from"../chunks/CKC416Ky.js";var s=e(`<p>PocketBase comes with a builtin DB and data migration utility, allowing you to version your DB structure,
    create collections programmatically, initialize default settings and/or run anything that needs to be
    executed only once.</p> <p>The user defined migrations are located in <code>pb_migrations</code> directory (it can be changed using
    the <code>--migrationsDir</code> flag) and each unapplied migration inside it will be executed automatically
    in a transaction on <code>serve</code> (or on <code>migrate up</code>).</p> <p>The generated migrations are safe to be committed to version control and can be shared with your other
    team members.</p> <!> <!> <p>The prebuilt executable has the <code>--automigrate</code> flag enabled by default, meaning that every collection
    configuration change from the Dashboard (or Web API) will generate the related migration file automatically
    for you.</p> <!> <p>To create a new blank migration you can run <code>migrate create</code>.</p> <!> <div class="clearfix m-t-xs"></div> <!> <p class="txt-bold">New migrations are applied automatically on <code>serve</code>.</p> <p>Optionally, you could apply new migrations manually by running <code>migrate up</code>. <br/> To revert the last applied migration(s), you could run <code>migrate down [number]</code>. <br/> <small class="txt-hint">When manually applying or reverting migrations, the <code>serve</code> process needs to be restarted so
        that it can refresh its cached collections state.</small></p> <!> <p>Each migration file should have a single <code>migrate(upFunc, downFunc)</code> call.</p> <p>In the migration file, you are expected to write your "upgrade" code in the <code>upFunc</code> callback. <br/> The <code>downFunc</code> is optional and it should contain the "downgrade" operations to revert the
    changes made by the <code>upFunc</code>.</p> <p>Both callbacks accept a transactional <code>app</code> instance.</p> <!> <p>The <code>migrate collections</code> command generates a full snapshot of your current collections
    configuration without having to type it manually. Similar to the <code>migrate create</code> command, this
    will generate a new migration file in the <code>pb_migrations</code> directory.</p> <!> <p>By default the collections snapshot is imported in <em>extend</em> mode, meaning that collections and
    fields that don't exist in the snapshot are preserved. If you want the snapshot to <em>delete</em> missing collections and fields, you can edit the generated file and change the last argument of <code>importCollections</code> to <code>true</code>.</p> <!> <p>All applied migration filenames are stored in the internal <code>_migrations</code> table. <br/> During local development often you might end up making various collection changes to test different approaches. <br/> When <code>--automigrate</code> is enabled (<em>which is the default</em>) this could lead in a migration
    history with unnecessary intermediate steps that may not be wanted in the final migration history.</p> <p class="txt-bold">To avoid the clutter and to prevent applying the intermediate steps in production, you can remove (or
    squash) the unnecessary migration files manually and then update the local migrations history by running:</p> <!> <p>The above command will remove any entry from the <code>_migrations</code> table that doesn't have a related
    migration file associated with it.</p> <!> <!> <!> <!> <!> <!> <p><em>For all supported record methods, you can refer to <a href="/docs/js-records">Record operations</a></em> .</p> <!> <!> <p><em>For all supported collection methods, you can refer to <a href="/docs/js-collections">Collection operations</a></em> .</p> <!>`,1);function c(e){var c=s(),l=n(r(c),6);o(l,{});var u=n(l,2);i(u,{title:`Automigrate`});var d=n(u,4);i(d,{title:`Creating migrations`});var f=n(d,4);a(f,{content:`
        [root@dev app]$ ./pocketbase migrate create "your_new_migration"
    `});var p=n(f,4);a(p,{language:`javascript`,content:`
        // pb_migrations/1687801097_your_new_migration.js
        migrate((app) => {
            // add up queries...
        }, (app) => {
            // add down queries...
        })
    `});var m=n(p,6);i(m,{title:`Migration file`,tag:`h5`});var h=n(m,8);i(h,{title:`Collections snapshot`});var g=n(h,4);a(g,{content:`[root@dev app]$ ./pocketbase migrate collections`});var _=n(g,4);i(_,{title:`Migrations history`});var v=n(_,6);a(v,{content:`[root@dev app]$ ./pocketbase migrate history-sync`});var y=n(v,4);i(y,{title:`Examples`});var b=n(y,2);i(b,{title:`Executing raw SQL statements`,tag:`h5`});var x=n(b,2);a(x,{language:`javascript`,content:`
        // pb_migrations/1687801090_set_pending_status.js

        migrate((app) => {
            app.db().newQuery("UPDATE articles SET status = 'pending' WHERE status = ''").execute()
        })
    `});var S=n(x,2);i(S,{title:`Initialize default application settings`,tag:`h5`});var C=n(S,2);a(C,{language:`javascript`,content:`
        // pb_migrations/1687801090_initial_settings.js

        migrate((app) => {
            let settings = app.settings()

            // for all available settings fields you could check
            // /jsvm/interfaces/core.Settings.html
            settings.meta.appName = "test"
            settings.meta.appURL = "https://example.com"
            settings.logs.maxDays = 2
            settings.logs.logAuthId = true
            settings.logs.logIP = false

            app.save(settings)
        })
    `});var w=n(C,2);i(w,{title:`Creating initial superuser`,tag:`h5`});var T=n(w,4);a(T,{language:`javascript`,content:`
        // pb_migrations/1687801090_initial_superuser.js

        migrate((app) => {
            let superusers = app.findCollectionByNameOrId("_superusers")

            let record = new Record(superusers)

            // note: the values can be eventually loaded via $os.getenv(key)
            // or from a special local config file
            record.set("email", "test@example.com")
            record.set("password", "1234567890")

            app.save(record)
        }, (app) => { // optional revert operation
            try {
                let record = app.findAuthRecordByEmail("_superusers", "test@example.com")
                app.delete(record)
            } catch {
                // silent errors (probably already deleted)
            }
        })
    `});var E=n(T,2);i(E,{title:`Creating collection programmatically`,tag:`h5`});var D=n(E,4);a(D,{language:`javascript`,content:`
        // migrations/1687801090_create_clients_collection.js

        migrate((app) => {
            // missing default options, system fields like id, email, etc. are initialized automatically
            // and will be merged with the provided configuration
            let collection = new Collection({
                type:     "auth",
                name:     "clients",
                listRule: "id = @request.auth.id",
                viewRule: "id = @request.auth.id",
                fields: [
                    {
                        type:     "text",
                        name:     "company",
                        required: true,
                        max:      100,
                    },
                    {
                        name:        "url",
                        type:        "url",
                        presentable: true,
                    },
                ],
                passwordAuth: {
                    enabled: false,
                },
                otp: {
                    enabled: true,
                },
                indexes: [
                    "CREATE INDEX idx_clients_company ON clients (company)"
                ],
            })

            app.save(collection)
        }, (app) => {
            let collection = app.findCollectionByNameOrId("clients")
            app.delete(collection)
        })
    `}),t(e,c)}export{c as component};