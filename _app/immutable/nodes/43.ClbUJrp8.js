import{I as ee,P as te,bt as e,it as t,nt as ne,tt as n,yt as r}from"../chunks/BDLcFjNi.js";import"../chunks/xihTtKlq.js";import"../chunks/C3kXMaAy.js";import{t as i}from"../chunks/BnicrACe.js";import{t as a}from"../chunks/CKGhWLYV.js";import{t as re}from"../chunks/CKC416Ky.js";import{t as ie}from"../chunks/DfiSPTV4.js";var ae=ee(`<p><a href="/jsvm/modules/_app.html" target="_blank"><code>$app</code></a> is the main interface to interact with your database.</p> <p><code>$app.db()</code> returns a <code>dbx.Builder</code> that can run all kinds of SQL statements, including raw queries.</p> <div class="alert alert-info"><div class="icon"><i class="ri-information-line"></i></div> <div class="content"><p>For more details and examples how to interact with Record and Collection models programmatically
            you could also check <a href="/docs/js-collections">Collection operations</a> and <a href="/docs/js-records">Record operations</a> sections.</p></div></div> <!> <!> <p>To execute DB queries you can start with the <code>newQuery("...")</code> statement and then call one of:</p> <ul><li><p><!> - for any query statement that is not meant to retrieve data:</p> <!></li> <li><p><!> - to populate a single row into <a href="/jsvm/classes/DynamicModel.html" target="_blank"><code>DynamicModel</code></a> object:</p> <!></li> <li><p><!> - to populate multiple rows into an array of objects (note that the array must be created with <code>arrayOf</code>):</p> <!></li></ul> <!> <p>To prevent SQL injection attacks, you should use named parameters for any expression value that comes from
    user input. This could be done using the named <code></code> placeholders in your SQL statement and then define the parameter values for the query with <code>bind(params)</code>. For example:</p> <!> <!> <p>Instead of writing plain SQLs, you can also compose SQL statements programmatically using the db query
    builder. <br/> Every SQL keyword has a corresponding query building method. For example, <code>SELECT</code> corresponds
    to <code>select()</code>, <code>FROM</code> corresponds to <code>from()</code>, <code>WHERE</code> corresponds to <code>where()</code>, and so on.</p> <!> <!> <p>The <code>select(...cols)</code> method initializes a <code>SELECT</code> query builder. It accepts a list
    of the column names to be selected. <br/> To add additional columns to an existing select query, you can call <code>andSelect()</code>. <br/> To select distinct rows, you can call <code>distinct(true)</code>.</p> <!> <!> <p>The <code>from(...tables)</code> method specifies which tables to select from (plain table names are automatically
    quoted).</p> <!> <!> <p>The <code>join(type, table, on)</code> method specifies a <code>JOIN</code> clause. It takes 3 parameters:</p> <ul><li><code>type</code> - join type string like <code>INNER JOIN</code>, <code>LEFT JOIN</code>, etc.</li> <li><code>table</code> - the name of the table to be joined</li> <li><code>on</code> - optional <code>dbx.Expression</code> as an <code>ON</code> clause</li></ul> <p>For convenience, you can also use the shortcuts <code>innerJoin(table, on)</code>, <code>leftJoin(table, on)</code>, <code>rightJoin(table, on)</code> to specify <code>INNER JOIN</code>, <code>LEFT JOIN</code> and <code>RIGHT JOIN</code>, respectively.</p> <!> <!> <p>The <code>where(exp)</code> method specifies the <code>WHERE</code> condition of the query. <br/> You can also use <code>andWhere(exp)</code> or <code>orWhere(exp)</code> to append additional one or more
    conditions to an existing <code>WHERE</code> clause. <br/> Each where condition accepts a single <code>dbx.Expression</code> (see below for full list).</p> <!> <p>The following <code>dbx.Expression</code> methods are available:</p> <ul><li class="m-b-xs"><!> <br/> Generates an expression with the specified raw query fragment. Use the <code>optParams</code> to bind
        parameters to the expression. <!></li> <li class="m-b-xs"><!> <br/> Generates a hash expression from a map whose keys are DB column names which need to be filtered according
        to the corresponding values. <!></li> <li class="m-b-xs"><!> <br/> Negates a single expression by wrapping it with <code>NOT()</code>. <!></li> <li class="m-b-xs"><!> <br/> Creates a new expression by concatenating the specified ones with <code>AND</code>. <!></li> <li class="m-b-xs"><!> <br/> Creates a new expression by concatenating the specified ones with <code>OR</code>. <!></li> <li class="m-b-xs"><!> <br/> Generates an <code>IN</code> expression for the specified column and the list of allowed values. <!></li> <li class="m-b-xs"><!> <br/> Generates an <code>NOT IN</code> expression for the specified column and the list of allowed values. <!></li> <li class="m-b-xs"><!> <br/> Generates a <code>LIKE</code> expression for the specified column and the possible strings that the
        column should be like. If multiple values are present, the column should be like <strong>all</strong> of them. <br/> By default, each value will be surrounded by <em>"%"</em> to enable partial matching. Special
        characters like <em>"%"</em>, <em>"\\"</em>, <em>"_"</em> will also be properly escaped. You may call <code>escape(...pairs)</code> and/or <code>match(left, right)</code> to change the default behavior. <!></li> <li class="m-b-xs"><!> <br/> Generates a <code>NOT LIKE</code> expression in similar manner as <code>like()</code>. <!></li> <li class="m-b-xs"><!> <br/> This is similar to <code>like()</code> except that the column must be one of the provided values, aka.
        multiple values are concatenated with <code>OR</code> instead of <code>AND</code>. <!></li> <li class="m-b-xs"><!> <br/> This is similar to <code>notLike()</code> except that the column must not be one of the provided
        values, aka. multiple values are concatenated with <code>OR</code> instead of <code>AND</code>. <!></li> <li class="m-b-xs"><!> <br/> Prefix with <code>EXISTS</code> the specified expression (usually a subquery). <!></li> <li class="m-b-xs"><!> <br/> Prefix with <code>NOT EXISTS</code> the specified expression (usually a subquery). <!></li> <li class="m-b-xs"><!> <br/> Generates a <code>BETWEEN</code> expression with the specified range. <!></li> <li class="m-b-xs"><!> <br/> Generates a <code>NOT BETWEEN</code> expression with the specified range. <!></li></ul> <!> <p>The <code>orderBy(...cols)</code> specifies the <code>ORDER BY</code> clause of the query. <br/> A column name can contain <em>"ASC"</em> or <em>"DESC"</em> to indicate its ordering direction. <br/> You can also use <code>andOrderBy(...cols)</code> to append additional columns to an existing <code>ORDER BY</code> clause.</p> <!> <!> <p>The <code>groupBy(...cols)</code> specifies the <code>GROUP BY</code> clause of the query. <br/> You can also use <code>andGroupBy(...cols)</code> to append additional columns to an existing <code>GROUP BY</code> clause.</p> <!> <!> <p>The <code>having(exp)</code> specifies the <code>HAVING</code> clause of the query. <br/> Similarly to <code>where(exp)</code>, it accept a single <code>dbx.Expression</code> (see all available expressions
    listed above). <br/> You can also use <code>andHaving(exp)</code> or <code>orHaving(exp)</code> to append additional one or
    more conditions to an existing <code>HAVING</code> clause.</p> <!> <!> <p>The <code>limit(number)</code> method specifies the <code>LIMIT</code> clause of the query.</p> <!> <!> <p>The <code>offset(number)</code> method specifies the <code>OFFSET</code> clause of the query. Usually used
    together with <code>limit(number)</code>.</p> <!> <!> <!> <!>`,1);function o(ee){var o=ae(),s=t(ne(o),6);re(s,{});var c=t(s,2);i(c,{title:`Executing queries`});var l=t(c,4),u=n(l),d=n(u),oe=n(d);i(oe,{title:`execute()`,tag:`code`}),r(),e(d);var se=t(d,2);a(se,{language:`javascript`,content:`
                $app.db()
                    .newQuery("DELETE FROM articles WHERE status = 'archived'")
                    .execute() // throw an error on db failure
            `}),e(u);var f=t(u,2),p=n(f),ce=n(p);i(ce,{id:`execute-one`,title:`one()`,tag:`code`}),r(3),e(p);var le=t(p,2);a(le,{language:`javascript`,content:`
                const result = new DynamicModel({
                    // describe the shape of the data (used also as initial values)
                    // the keys cannot start with underscore and must be a valid Go struct field name
                    "id":         ""     // or nullString() if nullable
                    "status":     false, // or nullBool() if nullable
                    "age":        0,     // or nullInt() if nullable
                    "totalSpent": -0,    // or nullFloat() if nullable
                    "roles":      [],    // or nullArray() if nullable;
                    "meta":       {},    // or nullObject() if nullable
                })

                $app.db()
                    .newQuery("SELECT id, status, age, totalSpent, roles, meta FROM users WHERE id=1")
                    .one(result) // throw an error on db failure or missing row

                console.log(result.id)
            `}),e(f);var m=t(f,2),h=n(m),ue=n(h);i(ue,{id:`execute-all`,title:`all()`,tag:`code`}),r(3),e(h);var de=t(h,2);a(de,{language:`javascript`,content:`
                const result = arrayOf(new DynamicModel({
                    // describe the shape of the data (used also as initial values)
                    // the keys cannot start with underscore and must be a valid Go struct field name
                    "id":         ""     // or nullString() if nullable
                    "status":     false, // or nullBool() if nullable
                    "age":        0,     // or nullInt() if nullable
                    "totalSpent": -0,    // or nullFloat() if nullable
                    "roles":      [],    // or nullArray() if nullable
                    "meta":       {},    // or nullObject() if nullable
                }))

                $app.db()
                    .newQuery("SELECT id, status, age, totalSpent, Roles, meta FROM users LIMIT 100")
                    .all(result) // throw an error on db failure

                if (result.length > 0) {
                    console.log(result[0].id)
                }
            `}),e(m),e(l);var fe=t(l,2);i(fe,{title:`Binding parameters`});var g=t(fe,2),pe=t(n(g));pe.textContent=`{:paramName}`,r(3),e(g);var _=t(g,2);a(_,{language:`javascript`,content:`
        const result = arrayOf(new DynamicModel({
            "name":    "",
            "created": "",
        }))

        $app.db()
            .newQuery("SELECT name, created FROM posts WHERE created >= {:from} and created <= {:to}")
            .bind({
                "from": "2023-06-25 00:00:00.000Z",
                "to":   "2023-06-28 23:59:59.999Z",
            })
            .all(result)

        console.log(result.length)
    `});var v=t(_,2);i(v,{title:`Query builder`});var y=t(v,4);a(y,{language:`javascript`,content:`
        const result = arrayOf(new DynamicModel({
            "id":    "",
            "email": "",
        }))

        $app.db()
            .select("id", "email")
            .from("users")
            .andWhere($dbx.like("email", "example.com"))
            .limit(100)
            .orderBy("created ASC")
            .all(result)
    `});var me=t(y,2);i(me,{title:`select(), andSelect(), distinct()`,tag:`h5`});var b=t(me,4);a(b,{language:`javascript`,content:`
        $app.db()
            .select("id", "avatar as image")
            .andSelect("(firstName || ' ' || lastName) as fullName")
            .distinct(true)
            ...
    `});var x=t(b,2);i(x,{title:`from()`,tag:`h5`});var S=t(x,4);a(S,{language:`javascript`,content:`
        $app.db()
            .select("table1.id", "table2.name")
            .from("table1", "table2")
            ...
    `});var C=t(S,2);i(C,{title:`join()`,tag:`h5`});var w=t(C,8);a(w,{language:`javascript`,content:`
        $app.db()
            .select("users.*")
            .from("users")
            .innerJoin("profiles", $dbx.exp("profiles.user_id = users.id"))
            .join("FULL OUTER JOIN", "department", $dbx.exp("department.id = {:id}", {id: "someId"}))
            ...
    `});var T=t(w,2);i(T,{title:`where(), andWhere(), orWhere()`,tag:`h5`});var E=t(T,4);a(E,{language:`javascript`,content:`
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
        $app.db()
            .select("users.*")
            .from("users")
            .where($dbx.exp("id = {:id}", { id: "someId" }))
            .andWhere($dbx.hashExp({ status: "public" }))
            .andWhere($dbx.like("name", "john"))
            .orWhere($dbx.and(
                $dbx.hashExp({
                    role:     "manager",
                    fullTime: true,
                }),
                $dbx.exp("experience > {:exp}", { exp: 10 })
            ))
            ...
    `});var D=t(E,4),O=n(D),k=n(O);i(k,{title:`$dbx.exp(raw, optParams)`,tag:`code`});var he=t(k,6);a(he,{language:`javascript`,content:`
                $dbx.exp("status = 'public'")
                $dbx.exp("total > {:min} AND total < {:max}", { min: 10, max: 30 })
            `}),e(O);var A=t(O,2),j=n(A);i(j,{title:`$dbx.hashExp(pairs)`,tag:`code`});var ge=t(j,4);a(ge,{language:`javascript`,content:`
                // slug = "example" AND active IS TRUE AND tags in ("tag1", "tag2", "tag3") AND parent IS NULL
                $dbx.hashExp({
                    slug:   "example",
                    active: true,
                    tags:   ["tag1", "tag2", "tag3"],
                    parent: null,
                })
            `}),e(A);var M=t(A,2),N=n(M);i(N,{title:`$dbx.not(exp)`,tag:`code`});var _e=t(N,6);a(_e,{language:`javascript`,content:`
                // NOT(status = 1)
                $dbx.not($dbx.exp("status = 1"))
            `}),e(M);var P=t(M,2),F=n(P);i(F,{title:`$dbx.and(...exps)`,tag:`code`});var ve=t(F,6);a(ve,{language:`javascript`,content:`
                // (status = 1 AND username like "%john%")
                $dbx.and($dbx.exp("status = 1"), $dbx.like("username", "john"))
            `}),e(P);var I=t(P,2),L=n(I);i(L,{title:`$dbx.or(...exps)`,tag:`code`});var ye=t(L,6);a(ye,{language:`javascript`,content:`
                // (status = 1 OR username like "%john%")
                $dbx.or($dbx.exp("status = 1"), $dbx.like("username", "john"))
            `}),e(I);var R=t(I,2),z=n(R);i(z,{title:`$dbx.in(col, ...values)`,tag:`code`});var be=t(z,6);a(be,{language:`javascript`,content:`
                // status IN ("public", "reviewed")
                $dbx.in("status", "public", "reviewed")
            `}),e(R);var B=t(R,2),V=n(B);i(V,{title:`$dbx.notIn(col, ...values)`,tag:`code`});var xe=t(V,6);a(xe,{language:`javascript`,content:`
                // status NOT IN ("public", "reviewed")
                $dbx.notIn("status", "public", "reviewed")
            `}),e(B);var H=t(B,2),U=n(H);i(U,{title:`$dbx.like(col, ...values)`,tag:`code`});var Se=t(U,22);a(Se,{language:`javascript`,content:`
                // name LIKE "%test1%" AND name LIKE "%test2%"
                $dbx.like("name", "test1", "test2")

                // name LIKE "test1%"
                $dbx.like("name", "test1").match(false, true)
            `}),e(H);var W=t(H,2),G=n(W);i(G,{title:`$dbx.notLike(col, ...values)`,tag:`code`});var Ce=t(G,8);a(Ce,{language:`javascript`,content:`
                // name NOT LIKE "%test1%" AND name NOT LIKE "%test2%"
                $dbx.notLike("name", "test1", "test2")

                // name NOT LIKE "test1%"
                $dbx.notLike("name", "test1").match(false, true)
            `}),e(W);var K=t(W,2),q=n(K);i(q,{title:`$dbx.orLike(col, ...values)`,tag:`code`});var we=t(q,10);a(we,{language:`javascript`,content:`
                // name LIKE "%test1%" OR name LIKE "%test2%"
                $dbx.orLike("name", "test1", "test2")

                // name LIKE "test1%" OR name LIKE "test2%"
                $dbx.orLike("name", "test1", "test2").match(false, true)
            `}),e(K);var J=t(K,2),Y=n(J);i(Y,{title:`$dbx.orNotLike(col, ...values)`,tag:`code`});var Te=t(Y,10);a(Te,{language:`javascript`,content:`
                // name NOT LIKE "%test1%" OR name NOT LIKE "%test2%"
                $dbx.orNotLike("name", "test1", "test2")

                // name NOT LIKE "test1%" OR name NOT LIKE "test2%"
                $dbx.orNotLike("name", "test1", "test2").match(false, true)
            `}),e(J);var X=t(J,2),Ee=n(X);i(Ee,{title:`$dbx.exists(exp)`,tag:`code`});var De=t(Ee,6);a(De,{language:`javascript`,content:`
                // EXISTS (SELECT 1 FROM users WHERE status = 'active')
                $dbx.exists(dbx.exp("SELECT 1 FROM users WHERE status = 'active'"))
            `}),e(X);var Z=t(X,2),Oe=n(Z);i(Oe,{title:`$dbx.notExists(exp)`,tag:`code`});var ke=t(Oe,6);a(ke,{language:`javascript`,content:`
                // NOT EXISTS (SELECT 1 FROM users WHERE status = 'active')
                $dbx.notExists(dbx.exp("SELECT 1 FROM users WHERE status = 'active'"))
            `}),e(Z);var Q=t(Z,2),Ae=n(Q);i(Ae,{title:`$dbx.between(col, from, to)`,tag:`code`});var je=t(Ae,6);a(je,{language:`javascript`,content:`
                // age BETWEEN 3 and 99
                $dbx.between("age", 3, 99)
            `}),e(Q);var Me=t(Q,2),Ne=n(Me);i(Ne,{title:`$dbx.notBetween(col, from, to)`,tag:`code`});var Pe=t(Ne,6);a(Pe,{language:`javascript`,content:`
                // age NOT BETWEEN 3 and 99
                $dbx.notBetween("age", 3, 99)
            `}),e(Me),e(D);var $=t(D,2);i($,{title:`orderBy(), andOrderBy()`,tag:`h5`});var Fe=t($,4);a(Fe,{language:`javascript`,content:`
        $app.db()
            .select("users.*")
            .from("users")
            .orderBy("created ASC", "updated DESC")
            .andOrderBy("title ASC")
            ...
    `});var Ie=t(Fe,2);i(Ie,{title:`groupBy(), andGroupBy()`,tag:`h5`});var Le=t(Ie,4);a(Le,{language:`javascript`,content:`
        $app.db()
            .select("users.*")
            .from("users")
            .groupBy("department", "level")
            ...
    `});var Re=t(Le,2);i(Re,{title:`having(), andHaving(), orHaving()`,tag:`h5`});var ze=t(Re,4);a(ze,{language:`javascript`,content:`
        $app.db()
            .select("users.*")
            .from("users")
            .groupBy("department", "level")
            .having($dbx.exp("sum(level) > {:sum}", { sum: 10 }))
            ...
    `});var Be=t(ze,2);i(Be,{title:`limit()`,tag:`h5`});var Ve=t(Be,4);a(Ve,{language:`javascript`,content:`
        $app.db()
            .select("users.*")
            .from("users")
            .limit(30)
            ...
    `});var He=t(Ve,2);i(He,{title:`offset()`,tag:`h5`});var Ue=t(He,4);a(Ue,{language:`javascript`,content:`
        $app.db()
            .select("users.*")
            .from("users")
            .offset(5)
            .limit(30)
            ...
    `});var We=t(Ue,2);i(We,{title:`Transaction`});var Ge=t(We,2);ie(Ge,{});var Ke=t(Ge,2);a(Ke,{language:`javascript`,content:`
        $app.runInTransaction((txApp) => {
            // update a record
            const record = txApp.findRecordById("articles", "RECORD_ID")
            record.set("status", "active")
            txApp.save(record)

            // run a custom raw query (doesn't fire event hooks)
            txApp.db().newQuery("DELETE FROM articles WHERE status = 'pending'").execute()
        })
    `}),te(ee,o)}export{o as component};