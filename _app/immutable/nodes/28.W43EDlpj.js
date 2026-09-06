import{I as e,P as t,X as n,_ as r,bt as i,gt as a,ht as o,it as s,nt as c,o as l,tt as u,yt as d}from"../chunks/BDLcFjNi.js";import"../chunks/xihTtKlq.js";import"../chunks/C3kXMaAy.js";import{t as f}from"../chunks/BnicrACe.js";import{t as p}from"../chunks/CKGhWLYV.js";import{t as m}from"../chunks/CKC416Ky.js";import{n as h,t as g}from"../chunks/CWVs4Kmh.js";var _=e(`<p><code>app.Logger()</code> provides access to a standard <code>slog.Logger</code> implementation that
    writes any logs into the database so that they can be later explored from the PocketBase <em>Dashboard > Logs</em> section.</p> <!> <!> <!> <p>All standard <a href="https://pkg.go.dev/log/slog" target="_blank" rel="noopener noreferrer"><code>slog.Logger</code></a> methods are available but below is a list with some of the most notable ones.</p> <!> <!> <!> <!> <!> <!> <!> <!> <!> <p><code>With(atrs...)</code> creates a new local logger that will "inject" the specified attributes with each
    following log.</p> <!> <!> <p><code>WithGroup(name)</code> creates a new local logger that wraps all logs attributes under the specified
    group name.</p> <!> <!> <!> <p>The logs are usually meant to be filtered from the UI but if you want to programmatically retrieve and
    filter the stored logs you can make use of the <a target="_blank" rel="noopener noreferrer"><code>app.LogQuery()</code></a> query builder method. For example:</p> <!> <!> <p>If you want to modify the log data before persisting in the database or to forward it to an external
    system, then you can listen for changes of the <code>_logs</code> table by attaching to the <a href="/docs/go-event-hooks/#base-model-hooks">base model hooks</a>. For example:</p> <!>`,1);function v(e,v){a(v,!1),l();var y=_(),b=s(c(y),2);h(b,{});var x=s(b,2);m(x,{});var S=s(x,2);f(S,{title:`Log methods`});var C=s(S,4);f(C,{title:`Debug(message, attrs...)`,tag:`h5`});var w=s(C,2);p(w,{language:`go`,content:`
        app.Logger().Debug("Debug message!")

        app.Logger().Debug(
            "Debug message with attributes!",
            "name", "John Doe",
            "id", 123,
        )
    `});var T=s(w,2);f(T,{title:`Info(message, attrs...)`,tag:`h5`});var E=s(T,2);p(E,{language:`go`,content:`
        app.Logger().Info("Info message!")

        app.Logger().Info(
            "Info message with attributes!",
            "name", "John Doe",
            "id", 123,
        )
    `});var D=s(E,2);f(D,{title:`Warn(message, attrs...)`,tag:`h5`});var O=s(D,2);p(O,{language:`go`,content:`
        app.Logger().Warn("Warning message!")

        app.Logger().Warn(
            "Warning message with attributes!",
            "name", "John Doe",
            "id", 123,
        )
    `});var k=s(O,2);f(k,{title:`Error(message, attrs...)`,tag:`h5`});var A=s(k,2);p(A,{language:`go`,content:`
        app.Logger().Error("Error message!")

        app.Logger().Error(
            "Error message with attributes!",
            "id", 123,
            "error", err,
        )
    `});var j=s(A,2);f(j,{title:`With(attrs...)`,tag:`h5`});var M=s(j,4);p(M,{language:`go`,content:`
        l := app.Logger().With("total", 123)

        // results in log with data {"total": 123}
        l.Info("message A")

        // results in log with data {"total": 123, "name": "john"}
        l.Info("message B", "name", "john")
    `});var N=s(M,2);f(N,{title:`WithGroup(name)`,tag:`h5`});var P=s(N,4);p(P,{language:`go`,content:`
        l := app.Logger().WithGroup("sub")

        // results in log with data {"sub": { "total": 123 }}
        l.Info("message A", "total", 123)
    `});var F=s(P,2);g(F,{});var I=s(F,2);f(I,{title:`Custom log queries`});var L=s(I,2),R=s(u(L));d(),i(L);var z=s(L,2);p(z,{language:`go`,content:`
        logs := []*core.Log{}

        // see https://pocketbase.io/docs/go-database/#query-builder
        err := app.LogQuery().
            // target only debug and info logs
            AndWhere(dbx.In("level", -4, 0).
            // the data column is serialized json object and could be anything
            AndWhere(dbx.NewExp("json_extract(data, '$.type') = 'request'")).
            OrderBy("created DESC").
            Limit(100).
            All(&logs)
    `});var B=s(z,2);f(B,{title:`Intercepting logs write`});var V=s(B,4);p(V,{language:`go`,content:`
        app.OnModelCreate(core.LogsTableName).BindFunc(func(e *core.ModelEvent) error {
            l := e.Model.(*core.Log)

            fmt.Println(l.Id)
            fmt.Println(l.Created)
            fmt.Println(l.Level)
            fmt.Println(l.Message)
            fmt.Println(l.Data)

            return e.Next()
        })
    `}),n(()=>r(R,`href`,`https://pkg.go.dev/github.com/pocketbase/pocketbase/core#BaseApp.LogsQuery`)),t(e,y),o()}export{v as component};