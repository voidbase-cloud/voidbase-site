import{I as e,P as t,X as n,_ as r,bt as i,gt as a,ht as o,it as s,nt as c,o as l,tt as u,yt as d}from"../chunks/BDLcFjNi.js";import"../chunks/xihTtKlq.js";import"../chunks/C3kXMaAy.js";import{t as f}from"../chunks/CKGhWLYV.js";var p=e(`<p>The available <a href="/docs/go-records"><code>core.Record</code> and its helpers</a> are usually the recommended way to interact with your data, but in case you want a typed access to your record
    fields you can create a helper struct that embeds <a target="_blank" rel="noopener noreferrer"><code>core.BaseRecordProxy</code></a> <em>(which implements the <code>core.RecordProxy</code> interface)</em> and define your collection fields as
    getters and setters.</p> <p>By implementing the <code>core.RecordProxy</code> interface you can use your custom struct as part of a <code>RecordQuery</code> result like a regular record model. In addition, every DB change through the proxy
    struct will trigger the corresponding record validations and hooks. This ensures that other parts of your app,
    including 3rd party plugins, that don't know or use your custom struct will still work as expected.</p> <p>Below is a sample <code>Article</code> record proxy implementation:</p> <!> <p>Accessing and modifying the proxy records is the same as for the regular records. Continuing with the
    above <code>Article</code> example:</p> <!> <p>If you have an existing <code>*core.Record</code> value you can also load it into your proxy using the <code>SetProxyRecord</code> method:</p> <!>`,1);function m(e,m){a(m,!1),l();var h=p(),g=c(h),_=s(u(g),3);d(3),i(g);var v=s(g,6);f(v,{language:`go`,content:`
        // article.go
        package main

        import (
            "github.com/pocketbase/pocketbase/core"
            "github.com/pocketbase/pocketbase/tools/types"
        )

        // ensures that the Article struct satisfy the core.RecordProxy interface
        var _ core.RecordProxy = (*Article)(nil)

        type Article struct {
            core.BaseRecordProxy
        }

        func (a *Article) Title() string {
            return a.GetString("title")
        }

        func (a *Article) SetTitle(title string) {
            a.Set("title", title)
        }

        func (a *Article) Slug() string {
            return a.GetString("slug")
        }

        func (a *Article) SetSlug(slug string) {
            a.Set("slug", slug)
        }

        func (a *Article) Created() types.DateTime {
            return a.GetDateTime("created")
        }

        func (a *Article) Updated() types.DateTime {
            return a.GetDateTime("updated")
        }
    `});var y=s(v,4);f(y,{language:`go`,content:`
        func FindArticleBySlug(app core.App, slug string) (*Article, error) {
            article := &Article{}

            err := app.RecordQuery("articles").
                AndWhere(dbx.NewExp("LOWER(slug)={:slug}", dbx.Params{
                    "slug": strings.ToLower(slug), // case insensitive match
                })).
                Limit(1).
                One(article)

            if err != nil {
                return nil, err
            }

            return article, nil
        }

        ...

        article, err := FindArticleBySlug(app, "example")
        if err != nil {
            return err
        }

        // change the title
        article.SetTitle("Lorem ipsum...")

        // persist the change while also triggering the original record validations and hooks
        err = app.Save(article)
        if err != nil {
            return err
        }
    `});var b=s(y,4);f(b,{language:`go`,content:`
        // fetch regular record
        record, err := app.FindRecordById("articles", "RECORD_ID")
        if err != nil {
            return err
        }

        // load into proxy
        article := &Article{}
        article.SetProxyRecord(record)
    `}),n(()=>r(_,`href`,`https://pkg.go.dev/github.com/pocketbase/pocketbase/core#BaseRecordProxy`)),t(e,h),o()}export{m as component};