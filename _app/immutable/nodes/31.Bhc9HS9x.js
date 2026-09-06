import{I as e,P as t,X as n,_ as r,bt as i,gt as a,ht as o,it as s,nt as c,o as l,tt as u,yt as d}from"../chunks/BDLcFjNi.js";import"../chunks/xihTtKlq.js";import"../chunks/C3kXMaAy.js";import{t as f}from"../chunks/BnicrACe.js";import{t as p}from"../chunks/B6gCHVlt.js";import{t as m}from"../chunks/CKGhWLYV.js";import{t as h}from"../chunks/CKC416Ky.js";var g=e(`<p>This is a CGO driver and requires to build your application with <code>CGO_ENABLED=1</code>.</p> <p><em>For all available options please refer to the <a href="https://github.com/mattn/go-sqlite3" target="_blank" rel="noopener noreferrer"><code>github.com/mattn/go-sqlite3</code></a> README.</em></p> <!>`,1),_=e(`<p><em>For all available options please refer to the <a href="https://github.com/ncruces/go-sqlite3" target="_blank" rel="noopener noreferrer"><code>github.com/ncruces/go-sqlite3</code></a> README.</em></p> <!>`,1),v=e(`<!> <!> <p>PocketBase can be used as regular Go package that exposes various helpers and hooks to help you implement
    your own custom portable application.</p> <p>A new PocketBase instance is created via <a target="_blank" rel="noopener noreferrer"><code>pocketbase.New()</code></a> or <a target="_blank" rel="noopener noreferrer"><code>pocketbase.NewWithConfig(config)</code></a> .</p> <p>Once created you can register your custom business logic via the available <a href="/docs/go-event-hooks/">event hooks</a> and call <a target="_blank" rel="noopener noreferrer"><code>app.Start()</code></a> to start the application.</p> <p>Below is a minimal example:</p> <ol start="0"><li><a href="https://go.dev/doc/install" target="_blank" rel="noreferrer noopener">Install Go 1.23+</a></li> <li><p>Create a new project directory with <code>main.go</code> file inside it. <br/> <small class="txt-hint txt-sm">As a reference, you can also explore the prebuilt executable <a target="_blank" rel="noopener noreferrer"><code class="txt-sm">example/base/main.go</code></a> file.</small></p> <!></li> <li>To init the dependencies, run <code>go mod init myapp && go mod tidy</code>.</li> <li>To start the application, run <code>go run . serve</code>.</li> <li>To build a statically linked executable, run <code>go build</code> and then you can start the created executable with <code>./myapp serve</code>.</li></ol> <!> <div class="alert alert-info" id="cgo_note"><div class="icon"><i class="ri-information-line"></i></div> <div class="content"><p><strong>The general recommendation is to use the builtin SQLite setup</strong> but if you need more
            advanced configuration or extensions like ICU, FTS5, etc. you'll have to specify a custom driver/build.</p> <p>Note that PocketBase by default doesn't require CGO because it uses the pure Go SQLite port <a href="https://pkg.go.dev/modernc.org/sqlite" target="_blank" rel="noreferrer noopener">modernc.org/sqlite</a>, but this may not be the case when using a custom SQLite driver!</p></div></div> <p>PocketBase v0.23+ added support for defining a <code>DBConnect</code> function as app configuration to
    load custom SQLite builds and drivers compatible with the standard Go <code>database/sql</code>.</p> <p><strong>The <code>DBConnect</code> function is called twice</strong> - once for <code>pb_data/data.db</code> (the main database file) and second time for <code>pb_data/auxiliary.db</code> (used for logs and other ephemeral
    system meta information).</p> <p>If you want to load your custom driver conditionally and fallback to the default handler, then you can
    call <a target="_blank" rel="noreferrer noopener"><code>core.DefaultDBConnect</code></a> . <br/> <em class="txt-sm txt-hint">As a side-note, if you are not planning to use <code class="txt-sm">core.DefaultDBConnect</code> fallback as part of your custom driver registration you can exclude the default pure Go driver with <code class="txt-sm">go build -tags no_default_driver</code> to reduce the binary size a little (~4MB).</em></p> <p>Below are some minimal examples with commonly used external SQLite drivers:</p> <div class="accordions m-t-sm"><!> <!></div>`,1);function y(e,y){a(y,!1),l();var b=v(),x=c(b);h(x,{});var S=s(x,2);f(S,{title:`Getting started`});var C=s(S,4),w=s(u(C)),T=s(w,2);d(),i(C);var E=s(C,2),D=s(u(E),3);d(),i(E);var O=s(E,4),k=s(u(O),2),A=u(k),j=s(u(A),5),M=s(u(j));d(),i(j),i(A);var N=s(A,2);m(N,{language:`go`,content:`
                package main

                import (
                    "log"
                    "os"

                    "github.com/pocketbase/pocketbase"
                    "github.com/pocketbase/pocketbase/apis"
                    "github.com/pocketbase/pocketbase/core"
                )

                func main() {
                    app := pocketbase.New()

                    app.OnServe().BindFunc(func(se *core.ServeEvent) error {
                        // serves static files from the provided public dir (if exists)
                        se.Router.GET("/{path...}", apis.Static(os.DirFS("./pb_public"), false))

                        return se.Next()
                    })

                    if err := app.Start(); err != nil {
                        log.Fatal(err)
                    }
                }
            `}),i(k),d(6),i(O);var P=s(O,2);f(P,{title:`Custom SQLite driver`});var F=s(P,8),I=s(u(F));d(4),i(F);var L=s(F,4),R=u(L);p(R,{single:!0,title:`github.com/mattn/go-sqlite3`,children:(e,n)=>{var r=g(),i=s(c(r),4);m(i,{language:`go`,content:`
                package main

                import (
                    "database/sql"
                    "log"

                    "github.com/mattn/go-sqlite3"
                    "github.com/pocketbase/dbx"
                    "github.com/pocketbase/pocketbase"
                )

                // register a new driver with default PRAGMAs and the same query
                // builder implementation as the already existing sqlite3 builder
                func init() {
                    // initialize default PRAGMAs for each new connection
                    sql.Register("pb_sqlite3",
                        &sqlite3.SQLiteDriver{
                            ConnectHook: func(conn *sqlite3.SQLiteConn) error {
                                _, err := conn.Exec(\`
                                    PRAGMA busy_timeout       = 10000;
                                    PRAGMA journal_mode       = WAL;
                                    PRAGMA journal_size_limit = 200000000;
                                    PRAGMA synchronous        = NORMAL;
                                    PRAGMA foreign_keys       = ON;
                                    PRAGMA temp_store         = MEMORY;
                                    PRAGMA cache_size         = -32000;
                                \`, nil)

                                return err
                            },
                        },
                    )

                    dbx.BuilderFuncMap["pb_sqlite3"] = dbx.BuilderFuncMap["sqlite3"]
                }

                func main() {
                    app := pocketbase.NewWithConfig(pocketbase.Config{
                        DBConnect: func(dbPath string) (*dbx.DB, error) {
                            return dbx.Open("pb_sqlite3", dbPath)
                        },
                    })

                    // any custom hooks or plugins...

                    if err := app.Start(); err != nil {
                        log.Fatal(err)
                    }
                }
            `}),t(e,r)},$$slots:{default:!0}});var z=s(R,2);p(z,{single:!0,title:`github.com/ncruces/go-sqlite3`,children:(e,n)=>{var r=_(),i=s(c(r),2);m(i,{language:`go`,content:`
                package main

                import (
                    "log"

                    "github.com/pocketbase/dbx"
                    "github.com/pocketbase/pocketbase"

                    _ "github.com/ncruces/go-sqlite3/driver"
                )

                func main() {
                    app := pocketbase.NewWithConfig(pocketbase.Config{
                        DBConnect: func(dbPath string) (*dbx.DB, error) {
                            const pragmas = "?_pragma=busy_timeout(10000)&_pragma=journal_mode(WAL)&_pragma=journal_size_limit(200000000)&_pragma=synchronous(NORMAL)&_pragma=foreign_keys(ON)&_pragma=temp_store(MEMORY)&_pragma=cache_size(-32000)"

                            return dbx.Open("sqlite3", "file:"+dbPath+pragmas)
                        },
                    })

                    // custom hooks and plugins...

                    if err := app.Start(); err != nil {
                        log.Fatal(err)
                    }
                }
            `}),t(e,r)},$$slots:{default:!0}}),i(L),n(()=>{r(w,`href`,`https://pkg.go.dev/github.com/pocketbase/pocketbase#New`),r(T,`href`,`https://pkg.go.dev/github.com/pocketbase/pocketbase#NewWithConfig`),r(D,`href`,`https://pkg.go.dev/github.com/pocketbase/pocketbase#PocketBase.Start`),r(M,`href`,`https://github.com/voidbase-cloud/voidbase/blob/master/examples/base/main.go`),r(I,`href`,`https://pkg.go.dev/github.com/pocketbase/pocketbase/core#DefaultDBConnect`)}),t(e,b),o()}export{y as component};