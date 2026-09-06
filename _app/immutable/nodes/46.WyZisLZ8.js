import{I as e,P as t,S as n,bt as r,it as i,nt as a,tt as o,yt as s}from"../chunks/BDLcFjNi.js";import"../chunks/xihTtKlq.js";import"../chunks/C3kXMaAy.js";import{t as c}from"../chunks/JhE-H64I.js";import{t as l}from"../chunks/CKGhWLYV.js";var u=e(`<p>If you have tasks that need to be performed periodically, you could set up crontab-like jobs with <code>cronAdd(id, expr, handler)</code>.</p> <p>Each scheduled job runs in its own goroutine as part of the <code>serve</code> command process and must have:</p> <ul><li class="m-0"><strong>id</strong> - identifier for the scheduled job; could be used to replace or remove an existing
        job</li> <li class="m-0"><strong>cron expression</strong> - e.g. <code>0 0 * * *</code> ( <em>supports numeric list, steps, ranges or <span class="link-hint">macros</span></em>)</li> <li class="m-0"><strong>handler</strong> - the function that will be executed every time when the job runs</li></ul> <p>Here is an example:</p> <!> <p>To remove a single registered cron job you can call <code>cronRemove(id)</code>.</p> <p>All registered app level cron jobs can be also previewed and triggered from the <em></em> section.</p>`,1);function d(e){var d=u(),f=i(a(d),4),p=i(o(f),2),m=i(o(p),4),h=i(o(m));n(h,(e,t)=>c?.(e,t),()=>`@yearly
@annually
@monthly
@weekly
@daily
@midnight
@hourly`),r(m),s(),r(p),s(2),r(f);var g=i(f,4);l(g,{language:`javascript`,content:`
        // prints "Hello!" every 2 minutes
        cronAdd("hello", "*/2 * * * *", () => {
            console.log("Hello!")
        })
    `});var _=i(g,4),v=i(o(_));v.textContent=`Dashboard > Settings > Crons`,s(),r(_),t(e,d)}export{d as component};