import{I as e,P as t,it as n,nt as r}from"../chunks/BDLcFjNi.js";import"../chunks/xihTtKlq.js";import"../chunks/C3kXMaAy.js";import{t as i}from"../chunks/BnicrACe.js";import{t as a}from"../chunks/CKGhWLYV.js";import{t as o}from"../chunks/CKC416Ky.js";import{n as s,t as c}from"../chunks/CWVs4Kmh.js";var l=e(`<p><code>$app.logger()</code> could be used to write any logs into the database so that they can be later
    explored from the PocketBase <em>Dashboard > Logs</em> section.</p> <!> <!> <!> <p>All standard <a href="/jsvm/interfaces/slog.Logger.html" target="_blank" rel="noopener noreferrer"><code>slog.Logger</code></a> methods are available but below is a list with some of the most notable ones. Note that attributes are represented
    as key-value pair arguments.</p> <!> <!> <!> <!> <!> <!> <!> <!> <!> <p><code>with(attrs...)</code> creates a new local logger that will "inject" the specified attributes with each
    following log.</p> <!> <!> <p><code>withGroup(name)</code> creates a new local logger that wraps all logs attributes under the specified
    group name.</p> <!> <!> <!> <p>The logs are usually meant to be filtered from the UI but if you want to programmatically retrieve and
    filter the stored logs you can make use of the <a href="/jsvm/functions/_app.logQuery.html" target="_blank" rel="noopener noreferrer"><code>$app.logQuery()</code></a> query builder method. For example:</p> <!> <!> <p>If you want to modify the log data before persisting in the database or to forward it to an external
    system, then you can listen for changes of the <code>_logs</code> table by attaching to the <a href="/docs/js-event-hooks/#base-model-hooks">base model hooks</a>. For example:</p> <!>`,1);function u(e){var u=l(),d=n(r(u),2);s(d,{});var f=n(d,2);o(f,{});var p=n(f,2);i(p,{title:`Logger methods`});var m=n(p,4);i(m,{title:`debug(message, attrs...)`,tag:`h5`});var h=n(m,2);a(h,{language:`javascript`,content:`
        $app.logger().debug("Debug message!")

        $app.logger().debug(
            "Debug message with attributes!",
            "name", "John Doe",
            "id", 123,
        )
    `});var g=n(h,2);i(g,{title:`info(message, attrs...)`,tag:`h5`});var _=n(g,2);a(_,{language:`javascript`,content:`
        $app.logger().info("Info message!")

        $app.logger().info(
            "Info message with attributes!",
            "name", "John Doe",
            "id", 123,
        )
    `});var v=n(_,2);i(v,{title:`warn(message, attrs...)`,tag:`h5`});var y=n(v,2);a(y,{language:`javascript`,content:`
        $app.logger().warn("Warning message!")

        $app.logger().warn(
            "Warning message with attributes!",
            "name", "John Doe",
            "id", 123,
        )
    `});var b=n(y,2);i(b,{title:`error(message, attrs...)`,tag:`h5`});var x=n(b,2);a(x,{language:`javascript`,content:`
        $app.logger().error("Error message!")

        $app.logger().error(
            "Error message with attributes!",
            "id", 123,
            "error", err,
        )
    `});var S=n(x,2);i(S,{title:`with(attrs...)`,tag:`h5`});var C=n(S,4);a(C,{language:`javascript`,content:`
        const l = $app.logger().with("total", 123)

        // results in log with data {"total": 123}
        l.info("message A")

        // results in log with data {"total": 123, "name": "john"}
        l.info("message B", "name", "john")
    `});var w=n(C,2);i(w,{title:`withGroup(name)`,tag:`h5`});var T=n(w,4);a(T,{language:`javascript`,content:`
        const l = $app.logger().withGroup("sub")

        // results in log with data {"sub": { "total": 123 }}
        l.info("message A", "total", 123)
    `});var E=n(T,2);c(E,{});var D=n(E,2);i(D,{title:`Custom log queries`});var O=n(D,4);a(O,{language:`javascript`,content:`
        let logs = arrayOf(new DynamicModel({
            id:      "",
            created: "",
            message: "",
            level:   0,
            data:    {},
        }))

        // see https://pocketbase.io/docs/js-database/#query-builder
        $app.logQuery().
            // target only debug and info logs
            andWhere($dbx.in("level", -4, 0)).
            // the data column is serialized json object and could be anything
            andWhere($dbx.exp("json_extract(data, '$.type') = 'request'")).
            orderBy("created DESC").
            limit(100).
            all(logs)
    `});var k=n(O,2);i(k,{title:`Intercepting logs write`});var A=n(k,4);a(A,{language:`javascript`,content:`
        onModelCreate((e) => {
            // print log model fields
            console.log(e.model.id)
            console.log(e.model.created)
            console.log(e.model.level)
            console.log(e.model.message)
            console.log(e.model.data)

            e.next()
        }, "_logs")
    `}),t(e,u)}export{u as component};