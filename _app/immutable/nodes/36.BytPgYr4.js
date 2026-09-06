import{I as e,P as ee,V as te,X as ne,_ as t,bt as n,gt as re,ht as ie,it as r,lt as ae,nt as oe,o as se,tt as i,yt as a}from"../chunks/BDLcFjNi.js";import"../chunks/xihTtKlq.js";import"../chunks/C3kXMaAy.js";import{t as o}from"../chunks/BnicrACe.js";import{t as s}from"../chunks/CKGhWLYV.js";import{t as ce}from"../chunks/CfPCrhHi.js";import{t as le}from"../chunks/CKC416Ky.js";var ue=e(`<p>PocketBase routing is built on top of the standard Go <a href="https://pkg.go.dev/net/http#ServeMux" target="_blank" rel="noopener noreferrer"><code>net/http.ServeMux</code></a>.
    The router can be accessed via the <code>app.OnServe()</code> hook allowing you to register custom endpoints
    and middlewares.</p> <!> <!> <!> <p>Every route has a path, handler function and eventually middlewares attached to it. For example:</p> <!> <p>There are several routes registration methods available, but the most common ones are:</p> <!> <p>The router also supports creating groups for routes that share the same base path and middlewares. For
    example:</p> <div class="grid"><div class="col-6"><!></div> <div class="col-6"><p>The example registers the following endpoints <br/> (all require authenticated user access):</p> <ul><li>GET /api/myapp -> action1</li> <li></li> <li></li> <li>GET /api/myapp/example/sub/sub1 -> action4</li></ul></div></div> <p>Each router group and route could define <a href="#middlewares">middlewares</a> in a similar manner to the
    regular app hooks via the <code>Bind/BindFunc</code> methods, allowing you to perform various BEFORE or AFTER
    action operations (e.g. inspecting request headers, custom access checks, etc.).</p> <!> <p>Because PocketBase routing is based on top of the Go standard router mux, we follow the same pattern
    matching rules. Below you could find a short overview but for more details please refer to <a href="https://pkg.go.dev/net/http#ServeMux" target="_blank" rel="noopener noreferrer"><code>net/http.ServeMux</code></a>.</p> <p>In general, a route pattern looks like <code>[METHOD ][HOST]/[PATH]</code> (<em>the METHOD prefix is added automatically when using the designated <code>GET()</code>, <code>POST()</code>, etc. methods)</em>).</p> <p>Route paths can include parameters in the format <code></code>. <br/> You can also use <code></code> format to specify a parameter that targets more than one path
    segment.</p> <p class="txt-bold">A pattern ending with a trailing slash <code>/</code> acts as anonymous wildcard and matches any requests
    that begins with the defined route. If you want to have a trailing slash but to indicate the end of the
    URL then you need to end the path with the special <code></code> parameter.</p> <div class="alert alert-info m-t-sm m-b-sm"><div class="icon"><i class="ri-information-line"></i></div> <div class="content"><p>If your route path starts with <code>/api/</code> consider combining it with your unique app name like <code>/api/myapp/...</code> to avoid collisions
            with system routes.</p></div></div> <p>Here are some examples:</p> <!> <hr/> <center class="txt-hint"><p>In the following examples <code>e</code> is usually <a target="_blank" rel="noopener noreferrer"><code>*core.RequestEvent</code></a> value.</p></center> <hr/> <!> <!> <!> <p>The request auth state can be accessed (or set) via the <code>RequestEvent.Auth</code> field.</p> <!> <p>Alternatively you could also access the request data from the summarized request info instance <em>(usually used in hooks like the <code>OnRecordEnrich</code> where there is no direct access to the request)</em>.</p> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <p>Body parameters can be read either via <a target="_blank" rel="noopener noreferrer"><code>e.BindBody</code></a> OR through the parsed request info (<em>requires manual type assertions</em>).</p> <p>The <code>e.BindBody</code> argument must be a pointer to a struct or <code>map[string]any</code>. <br/> The following struct tags are supported <em>(the specific binding rules and which one will be used depend on the request Content-Type)</em>:</p> <ul><li><code>json</code> (json body)- uses the builtin Go JSON package for unmarshaling.</li> <li><code>xml</code> (xml body) - uses the builtin Go XML package for unmarshaling.</li> <li><code>form</code> (form data) - utilizes the custom <a target="_blank" rel="noopener noreferrer"><code>router.UnmarshalRequestData</code></a> method.</li></ul> <p class="txt-bold">NB! When binding structs make sure that they don't have public fields that shouldn't be bindable and it is
    advisable such fields to be unexported or define a separate struct with just the safe bindable fields.</p> <!> <!> <p><em>For all supported methods, you can refer to <a target="_blank" rel="noopener noreferrer"><code>router.Event</code></a> .</em></p> <!> <!> <!> <!> <p>The <code>core.RequestEvent</code> comes with a local store that you can use to share custom data between <a href="#middlewares">middlewares</a> and the route action.</p> <!> <!> <!> <p>Middlewares allow inspecting, intercepting and filtering route requests.</p> <p>All middleware functions share the same signature with the route actions (aka. <code></code>) but expect the user to call <code>e.Next()</code> if they
    want to proceed with the execution chain.</p> <p>Middlewares can be registered <em>globally</em>, on <em>group</em> and on <em>route</em> level using the <code>Bind</code> and <code>BindFunc</code> methods.</p> <p>Here is a minimal example of what a global middleware looks like:</p> <!> <p><a target="_blank" rel="noopener noreferrer"><code>RouterGroup.Bind(middlewares...)</code></a> / <a target="_blank" rel="noopener noreferrer"><code>Route.Bind(middlewares...)</code></a> registers one or more middleware handlers. <br/> Similar to the other app hooks, a middleware handler has 3 fields:</p> <ul><li><code>Id</code> <em>(optional)</em> - the name of the middleware (could be used as argument for <code>Unbind</code>)</li> <li><code>Priority</code> <em>(optional)</em> - the execution order of the middleware (if empty fallbacks to
        the order of registration in the code)</li> <li><code>Func</code> <em>(required)</em> - the middleware handler function</li></ul> <p>Often you don't need to specify the <code>Id</code> or <code>Priority</code> of the middleware and for
    convenience you can instead use directly <a target="_blank" rel="noopener noreferrer"><code>RouterGroup.BindFunc(funcs...)</code></a> / <a target="_blank" rel="noopener noreferrer"><code>Route.BindFunc(funcs...)</code></a> .</p> <p>Below is a slightly more advanced example showing all options and the execution sequence (<em>2,0,1,3,4</em>):</p> <!> <!> <p>To remove a registered middleware from the execution chain for a specific group or route you can make use
    of the <code>Unbind(id)</code> method.</p> <p>Note that only middlewares that have a non-empty <code>Id</code> can be removed.</p> <!> <!> <p>The <a target="_blank" rel="noopener noreferrer"><code>apis</code></a> package exposes several middlewares that you can use as part of your application.</p> <!> <!> <small class="txt-hint">The below list is mostly useful for users that may want to plug their own custom middlewares before/after
    the priority of the default global ones, for example: registering a custom auth loader before the rate
    limiter with <code>apis.DefaultRateLimitMiddlewarePriority - 1</code> so that the rate limit can be applied
    properly based on the loaded auth state.</small> <p>All PocketBase applications have the below internal middlewares registered out of the box (<em>sorted by their priority</em>): <br/></p> <ul><li><strong>WWW redirect</strong> <small class="txt-hint"><a target="_blank" rel="noopener noreferrer"><code>apis.DefaultWWWRedirectMiddlewareId</code></a> <a target="_blank" rel="noopener noreferrer"><code>apis.DefaultWWWRedirectMiddlewarePriority</code></a></small> <br/> <em>Performs www -> non-www redirect(s) if the request host matches with one of the values in
            certificate host policy.</em></li> <li><strong>CORS</strong> <small class="txt-hint"><a target="_blank" rel="noopener noreferrer"><code>apis.DefaultCorsMiddlewareId</code></a> <a target="_blank" rel="noopener noreferrer"><code>apis.DefaultCorsMiddlewarePriority</code></a></small> <br/> <em>By default all origins are allowed (PocketBase is stateless and doesn't rely on cookies) and can
            be configured with the <code>--origins</code> flag but for more advanced customization it can be also replaced entirely by binding with <code>apis.CORS(config)</code> middleware or registering your own custom one in its place.</em></li> <li><strong>Activity logger</strong> <small class="txt-hint"><a target="_blank" rel="noopener noreferrer"><code>apis.DefaultActivityLoggerMiddlewareId</code></a> <a target="_blank" rel="noopener noreferrer"><code>apis.DefaultActivityLoggerMiddlewarePriority</code></a></small> <br/> <em>Saves request information into the logs auxiliary database.</em></li> <li><strong>Auto panic recover</strong> <small class="txt-hint"><a target="_blank" rel="noopener noreferrer"><code>apis.DefaultPanicRecoverMiddlewareId</code></a> <a target="_blank" rel="noopener noreferrer"><code>apis.DefaultPanicRecoverMiddlewarePriority</code></a></small> <br/> <em>Default panic-recover handler.</em></li> <li><strong>Auth token loader</strong> <small class="txt-hint"><a target="_blank" rel="noopener noreferrer"><code>apis.DefaultLoadAuthTokenMiddlewareId</code></a> <a target="_blank" rel="noopener noreferrer"><code>apis.DefaultLoadAuthTokenMiddlewarePriority</code></a></small> <br/> <em>Loads the auth token from the <code>Authorization</code> header and populates the related auth
            record into the request event (aka. <code>e.Auth</code>).</em></li> <li><strong>Superuser IPs whitelist check</strong> <small class="txt-hint"><a target="_blank" rel="noopener noreferrer"><code>apis.DefaultSuperuserIPsWhitelistMiddlewareId</code></a> <a target="_blank" rel="noopener noreferrer"><code>apis.DefaultSuperuserIPsWhitelistMiddlewarePriority</code></a></small> <br/> <em>Ensures that the current authenticated superuser IP exists in a predifined IPs/subnets list. <br/> This middleware does nothing if no whitelisted IPs/subnets are configured in the application settings.</em></li> <li><strong>Security response headers</strong> <small class="txt-hint"><a target="_blank" rel="noopener noreferrer"><code>apis.DefaultSecurityHeadersMiddlewareId</code></a> <a target="_blank" rel="noopener noreferrer"><code>apis.DefaultSecurityHeadersMiddlewarePriority</code></a></small> <br/> <em>Adds default common security headers (<code>X-XSS-Protection</code>, <code>X-Content-Type-Options</code>, <code>X-Frame-Options</code>) to the response (can be overwritten by other middlewares or from
            inside the route action).</em></li> <li><strong>Rate limit</strong> <small class="txt-hint"><a target="_blank" rel="noopener noreferrer"><code>apis.DefaultRateLimitMiddlewareId</code></a> <a target="_blank" rel="noopener noreferrer"><code>apis.DefaultRateLimitMiddlewarePriority</code></a></small> <br/> <em>Rate limits client requests based on the configured app settings (it does nothing if the rate
            limit option is not enabled).</em></li> <li><strong>Body limit</strong> <small class="txt-hint"><a target="_blank" rel="noopener noreferrer"><code>apis.DefaultBodyLimitMiddlewareId</code></a> <a target="_blank" rel="noopener noreferrer"><code>apis.DefaultBodyLimitMiddlewarePriority</code></a></small> <br/> <em>Applies a default max ~32MB request body limit for all custom routes ( system record routes have
            dynamic body size limit based on their collection field types). Can be overwritten on group/route
            level by simply rebinding the <code>apis.BodyLimit(limitBytes)</code> middleware.</em></li></ul> <!> <p>PocketBase has a global error handler and every returned error from a route or middleware will be safely
    converted by default to a generic <code>ApiError</code> to avoid accidentally leaking sensitive
    information (the original raw error message will be visible only in the <em>Dashboard > Logs</em> or when
    in <code>--dev</code> mode).</p> <p>To make it easier returning formatted JSON error responses, the request event provides several <code>ApiError</code> methods. <br/> Note that <code>ApiError.RawData()</code> will be returned in the response only if it is a map of <code>router.SafeErrorItem</code>/<code>validation.Error</code> items.</p> <!> <p>This is not very common but if you want to return <code>ApiError</code> outside of request related
    handlers, you can use the below <code>apis.*</code> factories:</p> <!> <!> <!> <p><a target="_blank" rel="noopener noreferrer"><code>apis.Static()</code></a> serves static directory content from <code>fs.FS</code> instance.</p> <p>Expects the route to have a <code></code> wildcard parameter.</p> <!> <!> <p><a target="_blank" rel="noopener noreferrer"><code>apis.RecordAuthResponse()</code></a> writes standardized JSON record auth response (aka. token + record data) into the specified request body.
    Could be used as a return result from a custom auth route.</p> <!> <!> <p><a target="_blank" rel="noopener noreferrer"><code>apis.EnrichRecord()</code></a> and <a target="_blank" rel="noopener noreferrer"><code>apis.EnrichRecords()</code></a> helpers parses the request context and enrich the provided record(s) by:</p> <ul><li>expands relations (if <code>defaultExpands</code> and/or <code>?expand</code> query parameter is set)</li> <li>ensures that the emails of the auth record and its expanded auth relations are visible only for the
        current logged superuser, record owner or record with manage access</li></ul> <!> <!> <p>If you want to register standard Go <code>http.Handler</code> function and middlewares, you can use <a target="_blank" rel="noopener noreferrer"><code>apis.WrapStdHandler(handler)</code></a> and <a target="_blank" rel="noopener noreferrer"><code>apis.WrapStdMiddleware(func)</code></a> functions.</p> <!> <p>The official PocketBase SDKs expose the internal <code>send()</code> method that could be used to send requests
    to your custom route(s).</p> <!>`,1);function de(e,de){re(de,!1),se();var fe=ue(),pe=r(oe(fe),2);le(pe,{});var me=r(pe,2);o(me,{title:`Routes`});var he=r(me,2);o(he,{title:`Registering new routes`,tag:`h5`});var ge=r(he,4);s(ge,{language:`go`,content:`
        app.OnServe().BindFunc(func(se *core.ServeEvent) error {
            // register "GET /hello/{name}" route (allowed for everyone)
            se.Router.GET("/hello/{name}", func(e *core.RequestEvent) error {
                name := e.Request.PathValue("name")

                return e.String(http.StatusOK, "Hello " + name)
            })

            // register "POST /api/myapp/settings" route (allowed only for authenticated users)
            se.Router.POST("/api/myapp/settings", func(e *core.RequestEvent) error {
                // do something ...
                return e.JSON(http.StatusOK, map[string]bool{"success": true})
            }).Bind(apis.RequireAuth())

            return se.Next()
        })
    `});var _e=r(ge,4);s(_e,{language:`go`,content:`
        se.Router.GET(path, action)
        se.Router.POST(path, action)
        se.Router.PUT(path, action)
        se.Router.PATCH(path, action)
        se.Router.DELETE(path, action)

        // If you want to handle any HTTP method define only a path (e.g. "/example")
        // OR if you want to specify a custom one add it as prefix to the path (e.g. "TRACE /example")
        se.Router.Any(pattern, action)
    `});var c=r(_e,4),l=i(c),ve=i(l);s(ve,{language:`go`,content:`
                g := se.Router.Group("/api/myapp")

                // group middleware
                g.Bind(apis.RequireAuth())

                // group routes
                g.GET("", action1)
                g.GET("/example/{id}", action2)
                g.PATCH("/example/{id}", action3).BindFunc(
                    /* custom route specific middleware func */
                )

                // nested group
                sub := g.Group("/sub")
                sub.GET("/sub1", action4)
            `}),n(l);var ye=r(l,2),be=r(i(ye),2),xe=r(i(be),2);xe.textContent=`GET /api/myapp/example/{id} -> action2`;var Se=r(xe,2);Se.textContent=`PATCH /api/myapp/example/{id} -> action3`,a(2),n(be),n(ye),n(c);var Ce=r(c,4);o(Ce,{title:`Path parameters and matching rules`,tag:`h5`});var u=r(Ce,6),we=r(i(u));we.textContent=`{paramName}`;var Te=r(we,4);Te.textContent=`{paramName...}`,a(),n(u);var d=r(u,2),Ee=r(i(d),3);Ee.textContent=`{$}`,a(),n(d);var f=r(d,6);s(f,{language:`go`,content:`
        // match "GET example.com/index.html"
        se.Router.GET("example.com/index.html")

        // match "GET /index.html" (for any host)
        se.Router.GET("/index.html")

        // match "GET /static/", "GET /static/a/b/c", etc.
        se.Router.GET("/static/")

        // match "GET /static/", "GET /static/a/b/c", etc.
        // (similar to the above but with a named wildcard parameter)
        se.Router.GET("/static/{path...}")

        // match only "GET /static/" (if no "/static" is registered, it is 301 redirected)
        se.Router.GET("/static/{$}")

        // match "GET /customers/john", "GET /customers/jane", etc.
        se.Router.GET("/customers/{name}")
    `});var p=r(f,4),m=i(p),De=r(i(m),3);a(),n(m),n(p);var h=r(p,4);o(h,{title:`Reading path parameters`,tag:`h5`});var g=r(h,2);s(g,{language:`go`,content:`id := e.Request.PathValue("id")`});var _=r(g,2);o(_,{title:`Retrieving the current auth state`,tag:`h5`});var v=r(_,4);s(v,{language:`go`,content:`
        authRecord := e.Auth

        isGuest := e.Auth == nil

        // the same as "e.Auth != nil && e.Auth.IsSuperuser()"
        isSuperuser := e.HasSuperuserAuth()
    `});var y=r(v,4);s(y,{language:`go`,content:`
        info, err := e.RequestInfo()

        authRecord := info.Auth

        isGuest := info.Auth == nil

        // the same as "info.Auth != nil && info.Auth.IsSuperuser()"
        isSuperuser := info.HasSuperuserAuth()
    `});var b=r(y,2);o(b,{title:`Reading query parameters`,tag:`h5`});var x=r(b,2);s(x,{language:`go`,content:`
        // retrieve the first value of the "search" query param
        search := e.Request.URL.Query().Get("search")

        // or via the parsed request info
        info, err := e.RequestInfo()
        search := info.Query["search"]

        // in case of array query params (e.g. search=123&search=456)
        arr := e.Request.URL.Query()["search"] // []string{"123", "456"}
    `});var S=r(x,2);o(S,{title:`Reading request headers`,tag:`h5`});var C=r(S,2);s(C,{language:`go`,content:`
        token := e.Request.Header.Get("Some-Header")

        // or via the parsed request info
        // (the header value is always normalized per the @request.headers.* API rules format)
        info, err := e.RequestInfo()
        token := info.Headers["some_header"]
    `});var w=r(C,2);o(w,{title:`Writing response headers`,tag:`h5`});var T=r(w,2);s(T,{language:`go`,content:`e.Response.Header().Set("Some-Header", "123")`});var E=r(T,2);o(E,{title:`Retrieving uploaded files`,tag:`h5`});var D=r(E,2);s(D,{language:`go`,content:`
        // retrieve the uploaded files and parse the found multipart data into a ready-to-use []*filesystem.File
        files, err := e.FindUploadedFiles("document")

        // or retrieve the raw single multipart/form-data file and header
        mf, mh, err := e.Request.FormFile("document")
    `});var O=r(D,2);o(O,{title:`Reading request body`,tag:`h5`});var k=r(O,2),Oe=r(i(k));a(3),n(k);var A=r(k,4),j=r(i(A),4),ke=r(i(j),2);a(),n(j),n(A);var M=r(A,4);s(M,{language:`go`,content:`
        // read/scan the request body fields into a typed struct
        data := struct {
            // unexported to prevent binding
            somethingPrivate string

            Title       string \`json:"title" form:"title"\`
            Description string \`json:"description" form:"description"\`
            Active      bool   \`json:"active" form:"active"\`
        }{}
        if err := e.BindBody(&data); err != nil {
            return e.BadRequestError("Failed to read request data", err)
        }

        // alternatively, read the body via the parsed request info
        info, err := e.RequestInfo()
        title, ok := info.Body["title"].(string)
    `});var Ae=r(M,2);o(Ae,{title:`Writing response body`,tag:`h5`});var N=r(Ae,2),je=i(N),Me=r(i(je));a(),n(je),n(N);var Ne=r(N,2);s(Ne,{language:`go`,content:`
        // send response with JSON body
        // (it also provides a generic response fields picker/filter if the "fields" query parameter is set)
        e.JSON(http.StatusOK, map[string]any{"name": "John"})

        // send response with string body
        e.String(http.StatusOK, "Lorem ipsum...")

        // send response with HTML body
        // (check also the "Rendering templates" section)
        e.HTML(http.StatusOK, "<h1>Hello!</h1>")

        // redirect
        e.Redirect(http.StatusTemporaryRedirect, "https://example.com")

        // send response with no body
        e.NoContent(http.StatusNoContent)

        // serve a single file
        e.FileFS(os.DirFS("..."), "example.txt")

        // stream the specified reader
        e.Stream(http.StatusOK, "application/octet-stream", reader)

        // send response with blob (bytes slice) body
        e.Blob(http.StatusOK, "application/octet-stream", []byte{ ... })
    `});var Pe=r(Ne,2);o(Pe,{title:`Reading the client IP`,tag:`h5`});var Fe=r(Pe,2);{let e=ae(()=>`
        // The IP of the last client connecting to your server.
        // The returned IP is safe and can be always trusted.
        // When behind a reverse proxy (e.g. nginx) this method returns the IP of the proxy.
        // https://pkg.go.dev/github.com/pocketbase/pocketbase/tools/router#Event.RemoteIP
        ip := e.RemoteIP()

        // The "real" IP of the client based on the configured Settings.TrustedProxy header(s).
        // If such headers are not set, it fallbacks to e.RemoteIP().
        // https://pkg.go.dev/github.com/pocketbase/pocketbase/core#RequestEvent.RealIP
        ip := e.RealIP()
    `);s(Fe,{language:`go`,get content(){return te(e)}})}var Ie=r(Fe,2);o(Ie,{title:`Request store`,tag:`h5`});var Le=r(Ie,4);s(Le,{language:`go`,content:`
        // store for the duration of the request
        e.Set("someKey", 123)

        // retrieve later
        val := e.Get("someKey").(int) // 123
    `});var Re=r(Le,2);o(Re,{title:`Middlewares`});var ze=r(Re,2);o(ze,{title:`Registering middlewares`,tag:`h5`});var P=r(ze,4),Be=r(i(P));Be.textContent=`func(e *core.RequestEvent) error`,a(3),n(P);var Ve=r(P,6);s(Ve,{language:`go`,content:`
        app.OnServe().BindFunc(func(se *core.ServeEvent) error {
            // register a global middleware
            se.Router.BindFunc(func(e *core.RequestEvent) error {
                if e.Request.Header.Get("Something") == "" {
                    return e.BadRequestError("Something header value is missing!", nil)
                }
                return e.Next()
            })

            return se.Next()
        })
    `});var F=r(Ve,2),He=i(F),Ue=r(He,2);a(3),n(F);var I=r(F,4),We=r(i(I),5),Ge=r(We,2);a(),n(I);var Ke=r(I,4);s(Ke,{language:`go`,content:`
        app.OnServe().BindFunc(func(se *core.ServeEvent) error {
            // attach global middleware
            se.Router.BindFunc(func(e *core.RequestEvent) error {
                println(0)
                return e.Next()
            })

            g := se.Router.Group("/sub")

            // attach group middleware
            g.BindFunc(func(e *core.RequestEvent) error {
                println(1)
                return e.Next()
            })

            // attach group middleware with an id and custom priority
            g.Bind(&hook.Handler[*core.RequestEvent]{
                Id: "something",
                Func: func(e *core.RequestEvent) error {
                    println(2)
                    return e.Next()
                },
                Priority: -1,
            })

            // attach middleware to a single route
            //
            // "GET /sub/hello" should print the sequence: 2,0,1,3,4
            g.GET("/hello", func(e *core.RequestEvent) error {
                println(4)
                return e.String(200, "Hello!")
            }).BindFunc(func(e *core.RequestEvent) error {
                println(3)
                return e.Next()
            })

            return se.Next()
        })
    `});var qe=r(Ke,2);o(qe,{title:`Removing middlewares`,tag:`h5`});var Je=r(qe,6);s(Je,{language:`go`,content:`
        app.OnServe().BindFunc(func(se *core.ServeEvent) error {
            // global middleware
            se.Router.Bind(&hook.Handler[*core.RequestEvent]{
                Id: "test",
                Func: func(e *core.RequestEvent) error {
                    // ...
                    return e.Next()
                },
            )

            // "GET /A" invokes the "test" middleware
            se.Router.GET("/A", func(e *core.RequestEvent) error {
                return e.String(200, "A")
            })

            // "GET /B" doesn't invoke the "test" middleware
            se.Router.GET("/B", func(e *core.RequestEvent) error {
                return e.String(200, "B")
            }).Unbind("test")

            return se.Next()
        })
    `});var Ye=r(Je,2);o(Ye,{title:`Builtin middlewares`,tag:`h5`});var L=r(Ye,2),Xe=r(i(L));a(),n(L);var Ze=r(L,2);s(Ze,{language:`go`,content:`
        // Require the request client to be unauthenticated (aka. guest).
        // Example: Route.Bind(apis.RequireGuestOnly())
        apis.RequireGuestOnly()

        // Require the request client to be authenticated
        // (optionally specify a list of allowed auth collection names, default to any).
        // Example: Route.Bind(apis.RequireAuth())
        apis.RequireAuth(optCollectionNames...)

        // Require the request client to be authenticated as superuser
        // (this is an alias for apis.RequireAuth(core.CollectionNameSuperusers)).
        // Example: Route.Bind(apis.RequireSuperuserAuth())
        apis.RequireSuperuserAuth()

        // Require the request client to be authenticated as superuser OR
        // regular auth record with id matching the specified route parameter (default to "id").
        // Example: Route.Bind(apis.RequireSuperuserOrOwnerAuth(""))
        apis.RequireSuperuserOrOwnerAuth(ownerIdParam)

        // Changes the global 32MB default request body size limit (set it to 0 for no limit).
        // Note that system record routes have dynamic body size limit based on their collection field types.
        // Example: Route.Bind(apis.BodyLimit(10 << 20))
        apis.BodyLimit(limitBytes)

        // Compresses the HTTP response using Gzip compression scheme.
        // Example: Route.Bind(apis.Gzip())
        apis.Gzip()

        // Instructs the activity logger to log only requests that have failed/returned an error.
        // Example: Route.Bind(apis.SkipSuccessActivityLog())
        apis.SkipSuccessActivityLog()
    `});var Qe=r(Ze,2);o(Qe,{title:`Default globally registered middlewares`,tag:`h5`});var R=r(Qe,6),z=i(R),$e=r(i(z),2),et=i($e),tt=r(et,2);n($e),a(4),n(z);var B=r(z,2),nt=r(i(B),2),rt=i(nt),it=r(rt,2);n(nt),a(4),n(B);var V=r(B,2),at=r(i(V),2),ot=i(at),st=r(ot,2);n(at),a(4),n(V);var H=r(V,2),ct=r(i(H),2),lt=i(ct),ut=r(lt,2);n(ct),a(4),n(H);var U=r(H,2),dt=r(i(U),2),ft=i(dt),pt=r(ft,2);n(dt),a(4),n(U);var W=r(U,2),mt=r(i(W),2),ht=i(mt),gt=r(ht,2);n(mt),a(4),n(W);var G=r(W,2),_t=r(i(G),2),vt=i(_t),yt=r(vt,2);n(_t),a(4),n(G);var K=r(G,2),bt=r(i(K),2),xt=i(bt),St=r(xt,2);n(bt),a(4),n(K);var Ct=r(K,2),wt=r(i(Ct),2),Tt=i(wt),Et=r(Tt,2);n(wt),a(4),n(Ct),n(R);var Dt=r(R,2);o(Dt,{title:`Error response`});var Ot=r(Dt,6);s(Ot,{language:`go`,content:`
        import validation "github.com/go-ozzo/ozzo-validation/v4"

        se.Router.GET("/example", func(e *core.RequestEvent) error {
            ...

            // construct ApiError with custom status code and validation data error
            return e.Error(500, "something went wrong", map[string]validation.Error{
                "title": validation.NewError("invalid_title", "Invalid or missing title"),
            })

            // if message is empty string, a default one will be set
            return e.BadRequestError(optMessage, optData)      // 400 ApiError
            return e.UnauthorizedError(optMessage, optData)    // 401 ApiError
            return e.ForbiddenError(optMessage, optData)       // 403 ApiError
            return e.NotFoundError(optMessage, optData)        // 404 ApiError
            return e.TooManyRequestsError(optMessage, optData) // 429 ApiError
            return e.InternalServerError(optMessage, optData)  // 500 ApiError
        })
    `});var kt=r(Ot,4);s(kt,{language:`go`,content:`
        import (
            validation "github.com/go-ozzo/ozzo-validation/v4"
            "github.com/pocketbase/pocketbase/apis"
        )


        app.OnRecordCreate().BindFunc(func(e *core.RecordEvent) error {
            ...

            // construct ApiError with custom status code and validation data error
            return apis.NewApiError(500, "something went wrong", map[string]validation.Error{
                "title": validation.NewError("invalid_title", "Invalid or missing title"),
            })

            // if message is empty string, a default one will be set
            return apis.NewBadRequestError(optMessage, optData)      // 400 ApiError
            return apis.NewUnauthorizedError(optMessage, optData)    // 401 ApiError
            return apis.NewForbiddenError(optMessage, optData)       // 403 ApiError
            return apis.NewNotFoundError(optMessage, optData)        // 404 ApiError
            return apis.NewTooManyRequestsError(optMessage, optData) // 429 ApiError
            return apis.NewInternalServerError(optMessage, optData)  // 500 ApiError
        })
    `});var At=r(kt,2);o(At,{title:`Helpers`});var jt=r(At,2);o(jt,{title:`Serving static directory`,tag:`h5`});var q=r(jt,2),Mt=i(q);a(3),n(q);var J=r(q,2),Nt=r(i(J));Nt.textContent=`{path...}`,a(),n(J);var Pt=r(J,2);s(Pt,{language:`go`,content:`
        app.OnServe().BindFunc(func(se *core.ServeEvent) error {
            // serves static files from the provided dir (if exists)
            se.Router.GET("/{path...}", apis.Static(os.DirFS("/path/to/public"), false))

            return se.Next()
        })
    `});var Ft=r(Pt,2);o(Ft,{title:`Auth response`,tag:`h5`});var Y=r(Ft,2),It=i(Y);a(),n(Y);var Lt=r(Y,2);s(Lt,{language:`go`,content:`
        app.OnServe().BindFunc(func(se *core.ServeEvent) error {
            se.Router.POST("/phone-login", func(e *core.RequestEvent) error {
                data := struct {
                    Phone    string \`json:"phone" form:"phone"\`
                    Password string \`json:"password" form:"password"\`
                }{}
                if err := e.BindBody(&data); err != nil {
                    return e.BadRequestError("Failed to read request data", err)
                }

                record, err := e.App.FindFirstRecordByData("users", "phone", data.Phone)
                if err != nil || !record.ValidatePassword(data.Password) {
                    // return generic 400 error as a basic enumeration protection
                    return e.BadRequestError("Invalid credentials", err)
                }

                return apis.RecordAuthResponse(e, record, "phone", nil)
            })

            return se.Next()
        })
    `});var Rt=r(Lt,2);o(Rt,{title:`Enrich record(s)`,tag:`h5`});var X=r(Rt,2),zt=i(X),Bt=r(zt,2);a(),n(X);var Vt=r(X,4);s(Vt,{language:`go`,content:`
        app.OnServe().BindFunc(func(se *core.ServeEvent) error {
            se.Router.GET("/custom-article", func(e *core.RequestEvent) error {
                records, err := e.App.FindRecordsByFilter("article", "status = 'active'", "-created", 40, 0)
                if err != nil {
                    return e.NotFoundError("No active articles", err)
                }

                // enrich the records with the "categories" relation as default expand
                err = apis.EnrichRecords(e, records, "categories")
                if err != nil {
                    return err
                }

                return e.JSON(http.StatusOK, records)
            })

            return se.Next()
        })
    `});var Z=r(Vt,2);o(Z,{title:`Go http.Handler wrappers`,tag:`h5`});var Q=r(Z,2),Ht=r(i(Q),3),Ut=r(Ht,2);a(),n(Q);var $=r(Q,2);o($,{title:`Sending request to custom routes using the SDKs`});var Wt=r($,4);ce(Wt,{js:`
        import PocketBase from 'pocketbase';

        const pb = new PocketBase('http://127.0.0.1:8090');

        await pb.send("/hello", {
            // for other options check
            // https://developer.mozilla.org/en-US/docs/Web/API/fetch#options
            query: { "abc": 123 },
        });
    `,dart:`
        import 'package:pocketbase/pocketbase.dart';

        final pb = PocketBase('http://127.0.0.1:8090');

        await pb.send("/hello", query: { "abc": 123 })
    `}),ne(()=>{t(De,`href`,`https://pkg.go.dev/github.com/pocketbase/pocketbase/core#RequestEvent`),t(Oe,`href`,`https://pkg.go.dev/github.com/pocketbase/pocketbase/tools/router#Event.BindBody`),t(ke,`href`,`https://pkg.go.dev/github.com/pocketbase/pocketbase/tools/router#UnmarshalRequestData`),t(Me,`href`,`https://pkg.go.dev/github.com/pocketbase/pocketbase/tools/router#Event`),t(He,`href`,`https://pkg.go.dev/github.com/pocketbase/pocketbase/tools/router#RouterGroup.Bind`),t(Ue,`href`,`https://pkg.go.dev/github.com/pocketbase/pocketbase/tools/router#Route.Bind`),t(We,`href`,`https://pkg.go.dev/github.com/pocketbase/pocketbase/tools/router#RouterGroup.BindFunc`),t(Ge,`href`,`https://pkg.go.dev/github.com/pocketbase/pocketbase/tools/router#Route.BindFunc`),t(Xe,`href`,`https://pkg.go.dev/github.com/pocketbase/pocketbase/apis`),t(et,`href`,`https://pkg.go.dev/github.com/pocketbase/pocketbase/apis#pkg-constants`),t(tt,`href`,`https://pkg.go.dev/github.com/pocketbase/pocketbase/apis#pkg-constants`),t(rt,`href`,`https://pkg.go.dev/github.com/pocketbase/pocketbase/apis#pkg-constants`),t(it,`href`,`https://pkg.go.dev/github.com/pocketbase/pocketbase/apis#pkg-constants`),t(ot,`href`,`https://pkg.go.dev/github.com/pocketbase/pocketbase/apis#pkg-constants`),t(st,`href`,`https://pkg.go.dev/github.com/pocketbase/pocketbase/apis#pkg-constants`),t(lt,`href`,`https://pkg.go.dev/github.com/pocketbase/pocketbase/apis#pkg-constants`),t(ut,`href`,`https://pkg.go.dev/github.com/pocketbase/pocketbase/apis#pkg-constants`),t(ft,`href`,`https://pkg.go.dev/github.com/pocketbase/pocketbase/apis#pkg-constants`),t(pt,`href`,`https://pkg.go.dev/github.com/pocketbase/pocketbase/apis#pkg-constants`),t(ht,`href`,`https://pkg.go.dev/github.com/pocketbase/pocketbase/apis#pkg-constants`),t(gt,`href`,`https://pkg.go.dev/github.com/pocketbase/pocketbase/apis#pkg-constants`),t(vt,`href`,`https://pkg.go.dev/github.com/pocketbase/pocketbase/apis#pkg-constants`),t(yt,`href`,`https://pkg.go.dev/github.com/pocketbase/pocketbase/apis#pkg-constants`),t(xt,`href`,`https://pkg.go.dev/github.com/pocketbase/pocketbase/apis#pkg-constants`),t(St,`href`,`https://pkg.go.dev/github.com/pocketbase/pocketbase/apis#pkg-constants`),t(Tt,`href`,`https://pkg.go.dev/github.com/pocketbase/pocketbase/apis#pkg-constants`),t(Et,`href`,`https://pkg.go.dev/github.com/pocketbase/pocketbase/apis#pkg-constants`),t(Mt,`href`,`https://pkg.go.dev/github.com/pocketbase/pocketbase/apis#Static`),t(It,`href`,`https://pkg.go.dev/github.com/pocketbase/pocketbase/apis#RecordAuthResponse`),t(zt,`href`,`https://pkg.go.dev/github.com/pocketbase/pocketbase/apis#EnrichRecord`),t(Bt,`href`,`https://pkg.go.dev/github.com/pocketbase/pocketbase/apis#EnrichRecords`),t(Ht,`href`,`https://pkg.go.dev/github.com/pocketbase/pocketbase/apis#WrapStdHandler`),t(Ut,`href`,`https://pkg.go.dev/github.com/pocketbase/pocketbase/apis#WrapStdMiddleware`)}),ee(e,fe),ie()}export{de as component};