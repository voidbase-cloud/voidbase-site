import{I as e,P as t,bt as n,it as r,nt as i,tt as a,yt as o}from"../chunks/BDLcFjNi.js";import"../chunks/xihTtKlq.js";import"../chunks/C3kXMaAy.js";import{t as s}from"../chunks/BnicrACe.js";import{t as c}from"../chunks/CKGhWLYV.js";import{t as l}from"../chunks/CKC416Ky.js";var u=e(`<!> <!> <p>A common task when creating custom routes or emails is the need of generating HTML output. To assist with
    this, PocketBase provides the global <code>$template</code> helper for parsing and rendering HTML templates.</p> <!> <p>The general flow when working with composed and nested templates is that you create "base" template(s)
    that defines various placeholders using the <code></code> or <code></code> actions.</p> <p>Then in the partials, you define the content for those placeholders using the <code></code> action.</p> <p>The dot object (<code class="txt-bold">.</code>) in the above represents the data passed to the templates
    via the <code>render(data)</code> method.</p> <p>By default the templates apply contextual (HTML, JS, CSS, URI) auto escaping so the generated template
    content should be injection-safe. To render raw/verbatim trusted content in the templates you can use the
    builtin <code>raw</code> function (e.g. <code></code>).</p> <div class="alert alert-info m-t-10 m-b-sm"><div class="icon"><i class="ri-information-line"></i></div> <div class="content"><p>For more information about the template syntax please refer to the <a href="https://pkg.go.dev/html/template#hdr-A_fuller_picture" target="_blank" rel="noopener noreferrer"><em>html/template</em></a> and <a href="https://pkg.go.dev/text/template" target="_blank" rel="noopener noreferrer"><em>text/template</em></a> package godocs. <strong>Another great resource is also the Hashicorp's <a href="https://developer.hashicorp.com/nomad/tutorials/templates/go-template-syntax" target="_blank" rel="noopener noreferrer">Learn Go Template Syntax</a> tutorial.</strong></p></div></div> <!> <p>Consider the following app directory structure:</p> <!> <p>We define the content for <code>layout.html</code> as:</p> <!> <p>We define the content for <code>hello.html</code> as:</p> <!> <p>Then to output the final page, we'll register a custom <code>/hello/:name</code> route:</p> <!>`,1);function d(e){var d=u(),f=i(d);l(f,{});var p=r(f,2);s(p,{title:`Overview`});var m=r(p,4);c(m,{language:`javascript`,content:"\n        const html = $template.loadFiles(\n            `${__hooks}/views/base.html`,\n            `${__hooks}/views/partial1.html`,\n            `${__hooks}/views/partial2.html`,\n        ).render(data)\n    "});var h=r(m,2),g=r(a(h));g.textContent=`{{template "placeholderName" .}}`;var _=r(g,2);_.textContent=`{{block "placeholderName" .}}default...{{end}}`,o(),n(h);var v=r(h,2),y=r(a(v));y.textContent=`{{define "placeholderName"}}custom...{{end}}`,o(),n(v);var b=r(v,4),x=r(a(b),3);x.textContent=`{{.content|raw}}`,o(),n(b);var S=r(b,4);s(S,{title:`Example HTML page with layout`});var C=r(S,4);c(C,{language:`html`,content:`
        myapp/
            pb_hooks/
                views/
                    layout.html
                    hello.html
                main.pb.js
            pocketbase
    `});var w=r(C,4);c(w,{language:`html`,content:`
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
    `});var T=r(w,4);c(T,{language:`html`,content:`
        {{define "title"}}
            Page 1
        {{end}}

        {{define "body"}}
            <p>Hello from {{.name}}</p>
        {{end}}
    `});var E=r(T,4);c(E,{language:`javascript`,content:`
        routerAdd("get", "/hello/{name}", (e) => {
            const name = e.request.pathValue("name")

            const html = $template.loadFiles(
                \`\${__hooks}/views/layout.html\`,
                \`\${__hooks}/views/hello.html\`,
            ).render({
                "name": name,
            })

            return e.html(200, html)
        })
    `}),t(e,d)}export{d as component};