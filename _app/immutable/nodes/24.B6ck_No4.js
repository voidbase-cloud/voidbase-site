import{I as ee,P as te,X as ne,_ as re,bt as e,gt as ie,ht as ae,it as t,nt as oe,o as se,tt as n,yt as r}from"../chunks/BDLcFjNi.js";import"../chunks/xihTtKlq.js";import"../chunks/C3kXMaAy.js";import{t as i}from"../chunks/BnicrACe.js";import{t as a}from"../chunks/CKGhWLYV.js";import{t as ce}from"../chunks/CKC416Ky.js";import{t as le}from"../chunks/UBISIenZ.js";var ue=ee(`<p><a target="_blank" rel="noopener noreferrer"><code>core.App</code></a> is the main interface to interact with the database.</p> <p><code>App.DB()</code> returns a <code>dbx.Builder</code> that can run all kinds of SQL statements, including
    raw queries.</p> <p>Most of the common DB operations are listed below, but you can find further information in the <a href="https://pkg.go.dev/github.com/pocketbase/dbx" target="_blank" rel="noopener noreferrer">dbx package godoc</a>.</p> <div class="alert alert-info"><div class="icon"><i class="ri-information-line"></i></div> <div class="content"><p>For more details and examples how to interact with Record and Collection models programmatically
            you could also check <a href="/docs/go-collections">Collection operations</a> and <a href="/docs/go-records">Record operations</a> sections.</p></div></div> <!> <!> <p>To execute DB queries you can start with the <code>NewQuery("...")</code> statement and then call one of:</p> <ul><li><p><!> - for any query statement that is not meant to retrieve data:</p> <!></li> <li><p><!> - to populate a single row into a struct:</p> <!></li> <li><p><!> - to populate multiple rows into a slice of structs:</p> <!></li></ul> <!> <p>To prevent SQL injection attacks, you should use named parameters for any expression value that comes from
    user input. This could be done using the named <code></code> placeholders in your SQL statement and then define the parameter values for the query with <code>Bind(params)</code>. For example:</p> <!> <!> <p>Instead of writing plain SQLs, you can also compose SQL statements programmatically using the db query
    builder. <br/> Every SQL keyword has a corresponding query building method. For example, <code>SELECT</code> corresponds
    to <code>Select()</code>, <code>FROM</code> corresponds to <code>From()</code>, <code>WHERE</code> corresponds to <code>Where()</code>, and so on.</p> <!> <!> <p>The <code>Select(...cols)</code> method initializes a <code>SELECT</code> query builder. It accepts a list
    of the column names to be selected. <br/> To add additional columns to an existing select query, you can call <code>AndSelect()</code>. <br/> To select distinct rows, you can call <code>Distinct(true)</code>.</p> <!> <!> <p>The <code>From(...tables)</code> method specifies which tables to select from (plain table names are automatically
    quoted).</p> <!> <!> <p>The <code>Join(type, table, on)</code> method specifies a <code>JOIN</code> clause. It takes 3 parameters:</p> <ul><li><code>type</code> - join type string like <code>INNER JOIN</code>, <code>LEFT JOIN</code>, etc.</li> <li><code>table</code> - the name of the table to be joined</li> <li><code>on</code> - optional <code>dbx.Expression</code> as an <code>ON</code> clause</li></ul> <p>For convenience, you can also use the shortcuts <code>InnerJoin(table, on)</code>, <code>LeftJoin(table, on)</code>, <code>RightJoin(table, on)</code> to specify <code>INNER JOIN</code>, <code>LEFT JOIN</code> and <code>RIGHT JOIN</code>, respectively.</p> <!> <!> <p>The <code>Where(exp)</code> method specifies the <code>WHERE</code> condition of the query. <br/> You can also use <code>AndWhere(exp)</code> or <code>OrWhere(exp)</code> to append additional one or more
    conditions to an existing <code>WHERE</code> clause. <br/> Each where condition accepts a single <code>dbx.Expression</code> (see below for full list).</p> <!> <p>The following <code>dbx.Expression</code> methods are available:</p> <ul><li><!> <br/> Generates an expression with the specified raw query fragment. Use the <code>optParams</code> to bind <code>dbx.Params</code> to the expression. <!></li> <li><!> <br/> Generates a hash expression from a map whose keys are DB column names which need to be filtered according
        to the corresponding values. <!></li> <li><!> <br/> Negates a single expression by wrapping it with <code>NOT()</code>. <!></li> <li><!> <br/> Creates a new expression by concatenating the specified ones with <code>AND</code>. <!></li> <li><!> <br/> Creates a new expression by concatenating the specified ones with <code>OR</code>. <!></li> <li><!> <br/> Generates an <code>IN</code> expression for the specified column and the list of allowed values. <!></li> <li><!> <br/> Generates an <code>NOT IN</code> expression for the specified column and the list of allowed values. <!></li> <li><!> <br/> Generates a <code>LIKE</code> expression for the specified column and the possible strings that the
        column should be like. If multiple values are present, the column should be like <strong>all</strong> of them. <br/> By default, each value will be surrounded by <em>"%"</em> to enable partial matching. Special
        characters like <em>"%"</em>, <em>"\\"</em>, <em>"_"</em> will also be properly escaped. You may call <code>Escape(...pairs)</code> and/or <code>Match(left, right)</code> to change the default behavior. <!></li> <li><!> <br/> Generates a <code>NOT LIKE</code> expression in similar manner as <code>Like()</code>. <!></li> <li><!> <br/> This is similar to <code>Like()</code> except that the column must be one of the provided values, aka.
        multiple values are concatenated with <code>OR</code> instead of <code>AND</code>. <!></li> <li><!> <br/> This is similar to <code>NotLike()</code> except that the column must not be one of the provided
        values, aka. multiple values are concatenated with <code>OR</code> instead of <code>AND</code>. <!></li> <li><!> <br/> Prefix with <code>EXISTS</code> the specified expression (usually a subquery). <!></li> <li><!> <br/> Prefix with <code>NOT EXISTS</code> the specified expression (usually a subquery). <!></li> <li><!> <br/> Generates a <code>BETWEEN</code> expression with the specified range. <!></li> <li><!> <br/> Generates a <code>NOT BETWEEN</code> expression with the specified range. <!></li></ul> <!> <p>The <code>OrderBy(...cols)</code> specifies the <code>ORDER BY</code> clause of the query. <br/> A column name can contain <em>"ASC"</em> or <em>"DESC"</em> to indicate its ordering direction. <br/> You can also use <code>AndOrderBy(...cols)</code> to append additional columns to an existing <code>ORDER BY</code> clause.</p> <!> <!> <p>The <code>GroupBy(...cols)</code> specifies the <code>GROUP BY</code> clause of the query. <br/> You can also use <code>AndGroupBy(...cols)</code> to append additional columns to an existing <code>GROUP BY</code> clause.</p> <!> <!> <p>The <code>Having(exp)</code> specifies the <code>HAVING</code> clause of the query. <br/> Similarly to <code>Where(exp)</code>, it accept a single <code>dbx.Expression</code> (see all available expressions
    listed above). <br/> You can also use <code>AndHaving(exp)</code> or <code>OrHaving(exp)</code> to append additional one or
    more conditions to an existing <code>HAVING</code> clause.</p> <!> <!> <p>The <code>Limit(number)</code> method specifies the <code>LIMIT</code> clause of the query.</p> <!> <!> <p>The <code>Offset(number)</code> method specifies the <code>OFFSET</code> clause of the query. Usually used
    together with <code>Limit(number)</code>.</p> <!> <!> <!> <!>`,1);function o(ee,o){ie(o,!1),se();var s=ue(),c=oe(s),de=n(c);r(),e(c);var l=t(c,8);ce(l,{});var u=t(l,2);i(u,{title:`Executing queries`});var d=t(u,4),f=n(d),p=n(f),fe=n(p);i(fe,{title:`Execute()`,tag:`code`}),r(),e(p);var pe=t(p,2);a(pe,{language:`go`,content:`
                res, err := app.DB().
                    NewQuery("DELETE FROM articles WHERE status = 'archived'").
                    Execute()
            `}),e(f);var m=t(f,2),h=n(m),me=n(h);i(me,{id:`execute-one`,title:`One()`,tag:`code`}),r(),e(h);var he=t(h,2);a(he,{language:`go`,content:`
                type User struct {
                    Id     string                  \`db:"id" json:"id"\`
                    Status bool                    \`db:"status" json:"status"\`
                    Age    int                     \`db:"age" json:"age"\`
                    Roles  types.JSONArray[string] \`db:"roles" json:"roles"\`
                }

                user := User{}

                err := app.DB().
                    NewQuery("SELECT id, status, age, roles FROM users WHERE id=1").
                    One(&user)
            `}),e(m);var g=t(m,2),_=n(g),ge=n(_);i(ge,{id:`execute-all`,title:`All()`,tag:`code`}),r(),e(_);var _e=t(_,2);a(_e,{language:`go`,content:`
                type User struct {
                    Id     string                  \`db:"id" json:"id"\`
                    Status bool                    \`db:"status" json:"status"\`
                    Age    int                     \`db:"age" json:"age"\`
                    Roles  types.JSONArray[string] \`db:"roles" json:"roles"\`
                }

                users := []User{}

                err := app.DB().
                    NewQuery("SELECT id, status, age, roles FROM users LIMIT 100").
                    All(&users)
            `}),e(g),e(d);var v=t(d,2);i(v,{title:`Binding parameters`});var y=t(v,2),ve=t(n(y));ve.textContent=`{:paramName}`,r(3),e(y);var b=t(y,2);a(b,{language:`go`,content:`
        type Post struct {
            Name     string         \`db:"name" json:"name"\`
            Created  types.DateTime \`db:"created" json:"created"\`
        }

        posts := []Post{}

        err := app.DB().
            NewQuery("SELECT name, created FROM posts WHERE created >= {:from} and created <= {:to}").
            Bind(dbx.Params{
                "from": "2023-06-25 00:00:00.000Z",
                "to":   "2023-06-28 23:59:59.999Z",
            }).
            All(&posts)
    `});var x=t(b,2);i(x,{title:`Query builder`});var S=t(x,4);a(S,{language:`go`,content:`
        users := []struct {
            Id    string \`db:"id" json:"id"\`
            Email string \`db:"email" json:"email"\`
        }{}

        app.DB().
            Select("id", "email").
            From("users").
            AndWhere(dbx.Like("email", "example.com")).
            Limit(100).
            OrderBy("created ASC").
            All(&users)
    `});var C=t(S,2);i(C,{title:`Select(), AndSelect(), Distinct()`,tag:`h5`});var w=t(C,4);a(w,{language:`go`,content:`
        app.DB().
            Select("id", "avatar as image").
            AndSelect("(firstName || ' ' || lastName) as fullName").
            Distinct(true)
            ...
    `});var T=t(w,2);i(T,{title:`From()`,tag:`h5`});var E=t(T,4);a(E,{language:`go`,content:`
        app.DB().
            Select("table1.id", "table2.name").
            From("table1", "table2")
            ...
    `});var D=t(E,2);i(D,{title:`Join()`,tag:`h5`});var O=t(D,8);a(O,{language:`go`,content:`
        app.DB().
            Select("users.*").
            From("users").
            InnerJoin("profiles", dbx.NewExp("profiles.user_id = users.id")).
            Join("FULL OUTER JOIN", "department", dbx.NewExp("department.id = {:id}", dbx.Params{ "id": "someId" }))
            ...
    `});var k=t(O,2);i(k,{title:`Where(), AndWhere(), OrWhere()`,tag:`h5`});var A=t(k,4);a(A,{language:`go`,content:`
        /*
        SELECT users.*
        FROM users
        WHERE id = "someId" AND
            status = "public" AND
            name like "%john%" OR
            (
                role = "manager" AND
                fullTime IS TRUE AND
                experience > 10
            )
        */
        app.DB().
            Select("users.*").
            From("users").
            Where(dbx.NewExp("id = {:id}", dbx.Params{ "id": "someId" })).
            AndWhere(dbx.HashExp{"status": "public"}).
            AndWhere(dbx.Like("name", "john")).
            OrWhere(dbx.And(
                dbx.HashExp{
                    "role":     "manager",
                    "fullTime": true,
                },
                dbx.NewExp("experience > {:exp}", dbx.Params{ "exp": 10 })
            ))
            ...
    `});var j=t(A,4),M=n(j),N=n(M);i(N,{title:`dbx.NewExp(raw, optParams)`,tag:`code`});var ye=t(N,8);a(ye,{language:`go`,content:`
                dbx.NewExp("status = 'public'")
                dbx.NewExp("total > {:min} AND total < {:max}", dbx.Params{ "min": 10, "max": 30 })
            `}),e(M);var P=t(M,2),F=n(P);i(F,{title:`dbx.HashExp{k:v}`,tag:`code`});var be=t(F,4);a(be,{language:`go`,content:`
                // slug = "example" AND active IS TRUE AND tags in ("tag1", "tag2", "tag3") AND parent IS NULL
                dbx.HashExp{
                    "slug":   "example",
                    "active": true,
                    "tags":   []any{"tag1", "tag2", "tag3"},
                    "parent": nil,
                }
            `}),e(P);var I=t(P,2),L=n(I);i(L,{title:`dbx.Not(exp)`,tag:`code`});var xe=t(L,6);a(xe,{language:`go`,content:`
                // NOT(status = 1)
                dbx.Not(dbx.NewExp("status = 1"))
            `}),e(I);var R=t(I,2),z=n(R);i(z,{title:`dbx.And(...exps)`,tag:`code`});var Se=t(z,6);a(Se,{language:`go`,content:`
                // (status = 1 AND username like "%john%")
                dbx.And(
                    dbx.NewExp("status = 1"),
                    dbx.Like("username", "john"),
                )
            `}),e(R);var B=t(R,2),V=n(B);i(V,{title:`dbx.Or(...exps)`,tag:`code`});var Ce=t(V,6);a(Ce,{language:`go`,content:`
                // (status = 1 OR username like "%john%")
                dbx.Or(
                    dbx.NewExp("status = 1"),
                    dbx.Like("username", "john")
                )
            `}),e(B);var H=t(B,2),U=n(H);i(U,{title:`dbx.In(col, ...values)`,tag:`code`});var we=t(U,6);a(we,{language:`go`,content:`
                // status IN ("public", "reviewed")
                dbx.In("status", "public", "reviewed")
            `}),e(H);var W=t(H,2),Te=n(W);i(Te,{title:`dbx.NotIn(col, ...values)`,tag:`code`});var Ee=t(Te,6);a(Ee,{language:`go`,content:`
                // status NOT IN ("public", "reviewed")
                dbx.NotIn("status", "public", "reviewed")
            `}),e(W);var G=t(W,2),De=n(G);i(De,{title:`dbx.Like(col, ...values)`,tag:`code`});var Oe=t(De,22);a(Oe,{language:`go`,content:`
                // name LIKE "%test1%" AND name LIKE "%test2%"
                dbx.Like("name", "test1", "test2")

                // name LIKE "test1%"
                dbx.Like("name", "test1").Match(false, true)
            `}),e(G);var K=t(G,2),ke=n(K);i(ke,{title:`dbx.NotLike(col, ...values)`,tag:`code`});var Ae=t(ke,8);a(Ae,{language:`go`,content:`
                // name NOT LIKE "%test1%" AND name NOT LIKE "%test2%"
                dbx.NotLike("name", "test1", "test2")

                // name NOT LIKE "test1%"
                dbx.NotLike("name", "test1").Match(false, true)
            `}),e(K);var q=t(K,2),je=n(q);i(je,{title:`dbx.OrLike(col, ...values)`,tag:`code`});var Me=t(je,10);a(Me,{language:`go`,content:`
                // name LIKE "%test1%" OR name LIKE "%test2%"
                dbx.OrLike("name", "test1", "test2")

                // name LIKE "test1%" OR name LIKE "test2%"
                dbx.OrLike("name", "test1", "test2").Match(false, true)
            `}),e(q);var J=t(q,2),Ne=n(J);i(Ne,{title:`dbx.OrNotLike(col, ...values)`,tag:`code`});var Pe=t(Ne,10);a(Pe,{language:`go`,content:`
                // name NOT LIKE "%test1%" OR name NOT LIKE "%test2%"
                dbx.OrNotLike("name", "test1", "test2")

                // name NOT LIKE "test1%" OR name NOT LIKE "test2%"
                dbx.OrNotLike("name", "test1", "test2").Match(false, true)
            `}),e(J);var Y=t(J,2),Fe=n(Y);i(Fe,{title:`dbx.Exists(exp)`,tag:`code`});var Ie=t(Fe,6);a(Ie,{language:`go`,content:`
                // EXISTS (SELECT 1 FROM users WHERE status = 'active')
                dbx.Exists(dbx.NewExp("SELECT 1 FROM users WHERE status = 'active'"))
            `}),e(Y);var X=t(Y,2),Le=n(X);i(Le,{title:`dbx.NotExists(exp)`,tag:`code`});var Re=t(Le,6);a(Re,{language:`go`,content:`
                // NOT EXISTS (SELECT 1 FROM users WHERE status = 'active')
                dbx.NotExists(dbx.NewExp("SELECT 1 FROM users WHERE status = 'active'"))
            `}),e(X);var Z=t(X,2),Q=n(Z);i(Q,{title:`dbx.Between(col, from, to)`,tag:`code`});var ze=t(Q,6);a(ze,{language:`go`,content:`
                // age BETWEEN 3 and 99
                dbx.Between("age", 3, 99)
            `}),e(Z);var Be=t(Z,2),Ve=n(Be);i(Ve,{title:`dbx.NotBetween(col, from, to)`,tag:`code`});var He=t(Ve,6);a(He,{language:`go`,content:`
                // age NOT BETWEEN 3 and 99
                dbx.NotBetween("age", 3, 99)
            `}),e(Be),e(j);var Ue=t(j,2);i(Ue,{title:`OrderBy(), AndOrderBy()`,tag:`h5`});var We=t(Ue,4);a(We,{language:`go`,content:`
        app.DB().
            Select("users.*").
            From("users").
            OrderBy("created ASC", "updated DESC").
            AndOrderBy("title ASC")
            ...
    `});var Ge=t(We,2);i(Ge,{title:`GroupBy(), AndGroupBy()`,tag:`h5`});var Ke=t(Ge,4);a(Ke,{language:`go`,content:`
        app.DB().
            Select("users.*").
            From("users").
            GroupBy("department", "level")
            ...
    `});var qe=t(Ke,2);i(qe,{title:`Having(), AndHaving(), OrHaving()`,tag:`h5`});var Je=t(qe,4);a(Je,{language:`go`,content:`
        app.DB().
            Select("users.*").
            From("users").
            GroupBy("department", "level").
            Having(dbx.NewExp("sum(level) > {:sum}", dbx.Params{ sum: 10 }))
            ...
    `});var Ye=t(Je,2);i(Ye,{title:`Limit()`,tag:`h5`});var Xe=t(Ye,4);a(Xe,{language:`go`,content:`
        app.DB().
            Select("users.*").
            From("users").
            Limit(30)
            ...
    `});var Ze=t(Xe,2);i(Ze,{title:`Offset()`,tag:`h5`});var Qe=t(Ze,4);a(Qe,{language:`go`,content:`
        app.DB().
            Select("users.*").
            From("users").
            Offset(5).
            Limit(30)
            ...
    `});var $e=t(Qe,2);i($e,{title:`Transaction`});var $=t($e,2);le($,{});var et=t($,2);a(et,{language:`go`,content:`
        err := app.RunInTransaction(func(txApp core.App) error {
            // update a record
            record, err := txApp.FindRecordById("articles", "RECORD_ID")
            if err != nil {
                return err
            }
            record.Set("status", "active")
            if err := txApp.Save(record); err != nil {
                return err
            }

            // run a custom raw query (doesn't fire event hooks)
            rawQuery := "DELETE FROM articles WHERE status = 'pending'"
            if _, err := txApp.DB().NewQuery(rawQuery).Execute(); err != nil {
                return err
            }

            return nil
        })
    `}),ne(()=>re(de,`href`,`https://pkg.go.dev/github.com/pocketbase/pocketbase/core#App`)),te(ee,s),ae()}export{o as component};