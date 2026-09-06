import{I as e,P as t,it as n,nt as r,yt as i}from"../chunks/BDLcFjNi.js";import"../chunks/xihTtKlq.js";import"../chunks/C3kXMaAy.js";import{t as a}from"../chunks/BnicrACe.js";import{t as o}from"../chunks/CKGhWLYV.js";import{t as s}from"../chunks/CKC416Ky.js";var c=e(`<!> <!> <p>The prebuilt PocketBase v0.17+ executable comes with embedded ES5 JavaScript engine (<a href="https://github.com/dop251/goja" target="_blank" rel="nopppener noreferrer">goja</a>) which enables you to write custom server-side code using plain JavaScript.</p> <p>You can start by creating <code>*.pb.js</code> file(s) inside a <code>pb_hooks</code> directory next to your executable.</p> <!> <p><em>For convenience, when making changes to the files inside <code>pb_hooks</code>, the process will
        automatically restart/reload itself (currently supported only on UNIX based platforms). The <code>*.pb.js</code> files are loaded per their filename sort order.</em></p> <p>For most parts, the JavaScript APIs are derived from <a href="/docs/go-overview">Go</a> with 2 main differences:</p> <ul><li>Go exported method and field names are converted to camelCase, for example: <br/> <code>app.FindRecordById("example", "RECORD_ID")</code> becomes <code>$app.findRecordById("example", "RECORD_ID")</code>.</li> <li>Errors are thrown as regular JavaScript exceptions and not returned as Go values.</li></ul> <!> <p>Below is a list with some of the commonly used global objects that are accessible from everywhere:</p> <ul><li><a href="/jsvm/variables/__hooks.html" target="_blank"><code>__hooks</code></a> - The absolute path to the app <code>pb_hooks</code> directory.</li> <li><a href="/jsvm/modules/_app.html" target="_blank"><code>$app</code></a> - The current running PocketBase application instance.</li> <li><a href="/jsvm/modules/_apis.html" target="_blank"><code>$apis.*</code></a> - API routing helpers and middlewares.</li> <li><a href="/jsvm/modules/_os.html" target="_blank"><code>$os.*</code></a> - OS level primitives (deleting directories, executing shell commands, etc.).</li> <li><a href="/jsvm/modules/_security.html" target="_blank"><code>$security.*</code></a> - Low level helpers for creating and parsing JWTs, random string generation, AES encryption, etc.</li> <li class="txt-bold">And many more - for all exposed APIs, please refer to the <a href="/jsvm/index.html" target="_blank">JSVM reference docs</a>.</li></ul> <!> <p>While you can't use directly TypeScript (<em>without transpiling it to JS on your own</em>), PocketBase
    comes with builtin <strong>ambient TypeScript declarations</strong> that can help providing information
    and documentation about the available global variables, methods and arguments, code completion, etc. as
    long as your editor has TypeScript LSP support <em>(most editors either have it builtin or available as plugin)</em>.</p> <p>The types declarations are stored in <code>pb_data/types.d.ts</code> file. You can point to those declarations using the <a href="https://www.typescriptlang.org/docs/handbook/triple-slash-directives.html#-reference-path-" target="_blank" rel="noopener">reference triple-slash directive</a> at the top of your JS file:</p> <!> <p>If after referencing the types your editor still doesn't perform linting, then you can try to rename your
    file to have <code>.pb.ts</code> extension.</p> <!> <!> <p>Each handler function (hook, route, middleware, etc.) is <strong>serialized and executed in its own isolated context as a separate "program"</strong>. This means
    that you don't have access to custom variables and functions declared outside of the handler scope. For
    example, the below code will fail:</p> <!> <p class="txt-hint txt-italic">The above serialization and isolation context is also the reason why error stack trace line numbers may
    not be accurate.</p> <p>One possible workaround for sharing/reusing code across different handlers could be to move and export the
    reusable code portion as local module and load it with <code>require()</code> inside the handler but keep in
    mind that the loaded modules use a shared registry and mutations should be avoided when possible to prevent
    concurrency issues:</p> <!> <!> <p>Relative file paths are relative to the current working directory (CWD) and not to the <code>pb_hooks</code>. <br/> To get an absolute path to the <code>pb_hooks</code> directory you can use the global <code class="txt-bold">__hooks</code> variable.</p> <!> <div class="alert alert-danger m-b-sm"><div class="icon"><i class="ri-alert-line"></i></div> <div class="content"><p>Please note that the embedded JavaScript engine is not a Node.js or browser environment, meaning
            that modules that rely on APIs like <em>window</em>, <em>fs</em>, <em>fetch</em>, <em>buffer</em> or any other runtime specific API not part of the ES5 spec may not
            work!</p></div></div> <p>You can load modules either by specifying their local filesystem path or by using their name, which will
    automatically search in:</p> <ul><li>the current working directory (<em>affects also relative paths</em>)</li> <li>any <code>node_modules</code> directory</li> <li>any parent <code>node_modules</code> directory</li></ul> <p>Currently only CommonJS (CJS) modules are supported and can be loaded with <code>const x = require(...)</code>. <br/> ECMAScript modules (ESM) can be loaded by first precompiling and transforming your dependencies with a bundler
    like <a href="https://rollupjs.org/" target="_blank" rel="noopener noreferrer">rollup</a>, <a href="https://webpack.js.org/" target="_blank" rel="noopener noreferrer">webpack</a>, <a href="https://browserify.org/" target="_blank" rel="noopener noreferrer">browserify</a>, etc.</p> <p>A common usage of local modules is for loading shared helpers or configuration parameters, for example:</p> <!> <div class="clearfix m-b-10"></div> <!> <div class="alert alert-info m-t-10 m-b-sm"><div class="icon"><i class="ri-information-line"></i></div> <div class="content"><p>Loaded modules use a shared registry and mutations should be avoided when possible to prevent
            concurrency issues.</p></div></div> <!> <p>The prebuilt executable comes with a <strong>prewarmed pool of 15 JS runtimes</strong>, which helps
    maintaining the handlers execution times on par with the Go equivalent code (see <a href="https://github.com/pocketbase/benchmarks/blob/master/results/hetzner_cax11.md#go-vs-js-route-execution" target="blank" rel="noopener noreferrer">benchmarks</a>). You can adjust the pool size manually with the <code>--hooksPool=50</code> flag (<em>increasing the pool size may improve the performance in high concurrent scenarios but also will
        increase the memory usage</em>).</p> <p>Note that the handlers performance may degrade if you have heavy computational tasks in pure JavaScript
    (encryption, random generators, etc.). For such cases prefer using the exposed <a href="/jsvm/index.html" target="_blank">Go bindings</a> (e.g. <code>$security.randomString(10)</code>).</p> <!> <p>We inherit some of the limitations and caveats of the embedded JavaScript engine (<a href="https://github.com/dop251/goja" target="_blank" rel="nopppener noreferrer">goja</a>):</p> <ul><li>Has most of ES6 functionality already implemented but it is not fully spec compliant yet.</li> <li>No concurrent execution inside a single handler (aka. no <code>setTimeout</code>/<code>setInterval</code>).</li> <li>Wrapped Go structural types (such as maps, slices) comes with some peculiarities and do not behave the
        exact same way as native ECMAScript values (for more details see <a href="https://pkg.go.dev/github.com/dop251/goja#Runtime.ToValue" target="blank" rel="noreferrer noopener">goja ToValue</a>).</li> <li>In relation to the above, DB <code>json</code> field values require the use of <code>get()</code> and <code>set()</code> helpers (<em>this may change in the future</em>).</li></ul>`,1);function l(e){var l=c(),u=r(l);s(u,{});var d=n(u,2);a(d,{title:`JavaScript engine`});var f=n(d,6);o(f,{content:`
        // pb_hooks/main.pb.js

        routerAdd("GET", "/hello/{name}", (e) => {
            let name = e.request.pathValue("name")

            return e.json(200, { "message": "Hello " + name })
        })

        onRecordAfterUpdateSuccess((e) => {
            console.log("user updated...", e.record.get("email"))

            e.next()
        }, "users")
    `});var p=n(f,8);a(p,{title:`Global objects`,tag:`h5`});var m=n(p,6);a(m,{title:`TypeScript declarations and code completion`});var h=n(m,6);o(h,{content:`
        /// <reference path="../pb_data/types.d.ts" />

        onBootstrap((e) => {
            e.next()

            console.log("App initialized!")
        })
    `});var g=n(h,4);a(g,{title:`Caveats and limitations`});var _=n(g,2);a(_,{title:`Handlers scope`,tag:`h5`});var v=n(_,4);o(v,{content:`
        const name = "test"

        onBootstrap((e) => {
            e.next()

            console.log(name) // <-- name will be undefined inside the handler
        })
    `});var y=n(v,6);o(y,{content:`
        onBootstrap((e) => {
            e.next()

            const config = require(\`\${__hooks}/config.js\`)
            console.log(config.name)
        })
    `});var b=n(y,2);a(b,{title:`Relative paths`,tag:`h5`});var x=n(b,4);a(x,{title:`Loading modules`,tag:`h5`});var S=n(x,12);o(S,{content:`
        // pb_hooks/utils.js
        module.exports = {
            hello: (name) => {
                console.log("Hello " + name)
            }
        }
    `});var C=n(S,4);o(C,{content:`
        // pb_hooks/main.pb.js
        onBootstrap((e) => {
            e.next()

            const utils = require(\`\${__hooks}/utils.js\`)
            utils.hello("world")
        })
    `});var w=n(C,4);a(w,{title:`Performance`,tag:`h5`});var T=n(w,6);a(T,{title:`Engine limitations`,tag:`h5`}),i(4),t(e,l)}export{l as component};