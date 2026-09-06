import{I as e,P as t,X as n,_ as r,bt as i,gt as a,ht as o,it as s,nt as c,o as l,tt as u,yt as d}from"../chunks/BDLcFjNi.js";import"../chunks/xihTtKlq.js";import"../chunks/C3kXMaAy.js";import{t as f}from"../chunks/BnicrACe.js";import{t as p}from"../chunks/CKGhWLYV.js";import{t as m}from"../chunks/CKC416Ky.js";var h=e(`<!> <!> <p>A common task when creating custom routes or emails is the need of generating HTML output.</p> <p>There are plenty of Go template-engines available that you can use for this, but often for simple cases
    the Go standard library <code>html/template</code> package should work just fine.</p> <p>To make it slightly easier to load template files concurrently and on the fly, PocketBase also provides a
    thin wrapper around the standard library in the <a target="_blank" rel="noopener noreferrer"><code>github.com/pocketbase/pocketbase/tools/template</code></a> utility package.</p> <!> <p>The general flow when working with composed and nested templates is that you create "base" template(s)
    that defines various placeholders using the <code></code> or <code></code> actions.</p> <p>Then in the partials, you define the content for those placeholders using the <code></code> action.</p> <p>The dot object (<code class="txt-bold">.</code>) in the above represents the data passed to the templates
    via the <code>Render(data)</code> method.</p> <p>By default the templates apply contextual (HTML, JS, CSS, URI) auto escaping so the generated template
    content should be injection-safe. To render raw/verbatim trusted content in the templates you can use the
    builtin <code>raw</code> function (e.g. <code></code>).</p> <div class="alert alert-info m-t-10 m-b-sm"><div class="icon"><i class="ri-information-line"></i></div> <div class="content"><p>For more information about the template syntax please refer to the <a href="https://pkg.go.dev/html/template#hdr-A_fuller_picture" target="_blank" rel="noopener noreferrer"><em>html/template</em></a> and <a href="https://pkg.go.dev/text/template" target="_blank" rel="noopener noreferrer"><em>text/template</em></a> package godocs. <strong>Another great resource is also the Hashicorp's <a href="https://developer.hashicorp.com/nomad/tutorials/templates/go-template-syntax" target="_blank" rel="noopener noreferrer">Learn Go Template Syntax</a> tutorial.</strong></p></div></div> <!> <p>Consider the following app directory structure:</p> <!> <p>We define the content for <code>layout.html</code> as:</p> <!> <p>We define the content for <code>hello.html</code> as:</p> <!> <p>Then to output the final page, we'll register a custom <code>/hello/:name</code> route:</p> <!>`,1);function g(e,g){a(g,!1),l();var _=h(),v=c(_);m(v,{});var y=s(v,2);f(y,{title:`Overview`});var b=s(y,6),x=s(u(b));d(),i(b);var S=s(b,2);p(S,{language:`go`,content:`
        import "github.com/pocketbase/pocketbase/tools/template"

        data := map[string]any{"name": "John"}

        html, err := template.NewRegistry().LoadFiles(
            "views/base.html",
            "views/partial1.html",
            "views/partial2.html",
        ).Render(data)
    `});var C=s(S,2),w=s(u(C));w.textContent=`{{template "placeholderName" .}}`;var T=s(w,2);T.textContent=`{{block "placeholderName" .}}default...{{end}}`,d(),i(C);var E=s(C,2),D=s(u(E));D.textContent=`{{define "placeholderName"}}custom...{{end}}`,d(),i(E);var O=s(E,4),k=s(u(O),3);k.textContent=`{{.content|raw}}`,d(),i(O);var A=s(O,4);f(A,{title:`Example HTML page with layout`});var j=s(A,4);p(j,{language:`html`,content:`
        myapp/
            views/
                layout.html
                hello.html
            main.go
    `});var M=s(j,4);p(M,{language:`html`,content:`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <title>{{block "title" .}}Default app title{{end}}</title>
        </head>
        <body>
            Header...

            {{block "body" .}}
                Default app body...
            {{end}}

            Footer...
        </body>
        </html>
    `});var N=s(M,4);p(N,{language:`html`,content:`
        {{define "title"}}
            Page 1
        {{end}}

        {{define "body"}}
            <p>Hello from {{.name}}</p>
        {{end}}
    `});var P=s(N,4);p(P,{language:`go`,content:`
        // main.go
        package main

        import (
            "log"
            "net/http"

            "github.com/pocketbase/pocketbase"
            "github.com/pocketbase/pocketbase/core"
            "github.com/pocketbase/pocketbase/tools/template"
        )

        func main() {
            app := pocketbase.New()

            app.OnServe().BindFunc(func(se *core.ServeEvent) error {
                // this is safe to be used by multiple goroutines
                // (it acts as store for the parsed templates)
                registry := template.NewRegistry()

                se.Router.GET("/hello/{name}", func(e *core.RequestEvent) error {
                    name := e.Request.PathValue("name")

                    html, err := registry.LoadFiles(
                        "views/layout.html",
                        "views/hello.html",
                    ).Render(map[string]any{
                        "name": name,
                    })

                    if err != nil {
                        // or redirect to a dedicated 404 HTML page
                        return e.NotFoundError("", err)
                    }

                    return e.HTML(http.StatusOK, html)
                })

                return se.Next()
            })

            if err := app.Start(); err != nil {
                log.Fatal(err)
            }
        }
    `}),n(()=>r(x,`href`,`https://pkg.go.dev/github.com/pocketbase/pocketbase/tools/template`)),t(e,_),o()}export{g as component};