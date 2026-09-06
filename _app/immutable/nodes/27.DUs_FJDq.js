import{I as e,P as t,S as n,X as r,_ as i,bt as a,gt as o,ht as s,it as c,nt as l,o as u,tt as d,yt as f}from"../chunks/BDLcFjNi.js";import"../chunks/xihTtKlq.js";import"../chunks/C3kXMaAy.js";import{t as p}from"../chunks/JhE-H64I.js";import{t as m}from"../chunks/CKGhWLYV.js";var h=e(`<p>If you have tasks that need to be performed periodically, you could set up crontab-like jobs with the
    builtin <code>app.Cron()</code> <em>(it returns an app scoped <a target="_blank" rel="noopener noreferrer"><code>cron.Cron</code></a> value)</em> .</p> <p>The jobs scheduler is started automatically on app <code>serve</code>, so all you have to do is register a
    handler with <a target="_blank" rel="noopener noreferrer"><code>app.Cron().Add(id, cronExpr, handler)</code></a> or <a target="_blank" rel="noopener noreferrer"><code>app.Cron().MustAdd(id, cronExpr, handler)</code></a> (<em>the latter panic if the cron expression is not valid</em>).</p> <p>Each scheduled job runs in its own goroutine and must have:</p> <ul><li class="m-0"><strong>id</strong> - identifier for the scheduled job; could be used to replace or remove an existing
        job</li> <li class="m-0"><strong>cron expression</strong> - e.g. <code>0 0 * * *</code> ( <em>supports numeric list, steps, ranges or <span class="link-hint">macros</span></em>)</li> <li class="m-0"><strong>handler</strong> - the function that will be executed every time when the job runs</li></ul> <p>Here is one minimal example:</p> <!> <p>To remove already registered cron job you can call <a target="_blank" rel="noopener noreferrer"><code>app.Cron().Remove(id)</code></a></p> <p>All registered app level cron jobs can be also previewed and triggered from the <em></em> section.</p> <div class="alert alert-warning"><div class="icon"><i class="ri-error-warning-line"></i></div> <div class="content"><p>Keep in mind that the <code>app.Cron()</code> is also used for running the system scheduled jobs
            like the logs cleanup or auto backups (the jobs id is in the format <code>__pb*__</code>) and
            replacing these system jobs or calling <code>RemoveAll()</code>/<code>Stop()</code> could have unintended
            side-effects.</p> <p>If you want more advanced control you can initialize your own cron instance independent from the
            application via <code>cron.New()</code>.</p></div></div>`,1);function g(e,g){o(g,!1),u();var _=h(),v=l(_),y=c(d(v),3),b=c(d(y));f(),a(y),f(),a(v);var x=c(v,2),S=c(d(x),3),C=c(S,2);f(3),a(x);var w=c(x,4),T=c(d(w),2),E=c(d(T),4),D=c(d(E));n(D,(e,t)=>p?.(e,t),()=>({text:`@yearly
@annually
@monthly
@weekly
@daily
@midnight
@hourly`,delay:0})),a(E),f(),a(T),f(2),a(w);var O=c(w,4);m(O,{language:`go`,content:`
        // main.go
        package main

        import (
            "log"

            "github.com/pocketbase/pocketbase"
        )

        func main() {
            app := pocketbase.New()

            // prints "Hello!" every 2 minutes
            app.Cron().MustAdd("hello", "*/2 * * * *", func() {
                log.Println("Hello!")
            })

            if err := app.Start(); err != nil {
                log.Fatal(err)
            }
        }
    `});var k=c(O,2),A=c(d(k));a(k);var j=c(k,2),M=c(d(j));M.textContent=`Dashboard > Settings > Crons`,f(),a(j),f(2),r(()=>{i(b,`href`,`https://pkg.go.dev/github.com/pocketbase/pocketbase/tools/cron#Cron`),i(S,`href`,`https://pkg.go.dev/github.com/pocketbase/pocketbase/tools/cron#Cron.Add`),i(C,`href`,`https://pkg.go.dev/github.com/pocketbase/pocketbase/tools/cron#Cron.MustAdd`),i(A,`href`,`https://pkg.go.dev/github.com/pocketbase/pocketbase/tools/cron#Cron.Remove`)}),t(e,_),s()}export{g as component};