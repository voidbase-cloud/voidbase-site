import{A as e,I as t,N as n,P as r,V as i,X as a,at as o,b as s,bt as c,it as l,nt as u,rt as d,st as f,tt as p,z as m}from"../chunks/BDLcFjNi.js";import"../chunks/xihTtKlq.js";import"../chunks/C3kXMaAy.js";import{t as h}from"../chunks/B6gCHVlt.js";import{t as g}from"../chunks/CKGhWLYV.js";import{t as _}from"../chunks/CfPCrhHi.js";import{t as v}from"../chunks/DK-N8Yuz.js";var y=t(`<button> </button>`),b=t(`<div><!></div>`),x=t(`<div class="content m-b-sm"><p>Returns list with all registered app level cron jobs.</p> <p>Only superusers can perform this action.</p></div> <!> <h6 class="m-b-xs">API details</h6> <div class="api-route alert alert-info"><strong class="label label-primary">GET</strong> <div class="content">/api/crons</div></div> <div class="section-title">Query parameters</div> <table class="table-compact table-border m-b-base"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><!></tbody></table> <div class="section-title">Responses</div> <div class="tabs"><div class="tabs-header compact combined left"></div> <div class="tabs-content"></div></div>`,1);function S(t){let S=[{code:200,body:`
              [
                {
                  "id": "__pbDBOptimize__",
                  "expression": "0 0 * * *"
                },
                {
                  "id": "__pbMFACleanup__",
                  "expression": "0 * * * *"
                },
                {
                  "id": "__pbOTPCleanup__",
                  "expression": "0 * * * *"
                },
                {
                  "id": "__pbLogsCleanup__",
                  "expression": "0 */6 * * *"
                }
              ]
            `},{code:400,body:`
                {
                  "status": 400,
                  "message": "Failed to load backups filesystem.",
                  "data": {}
                }
            `},{code:401,body:`
                {
                  "status": 401,
                  "message": "The request requires valid record authorization token.",
                  "data": {}
                }
            `},{code:403,body:`
                {
                  "status": 403,
                  "message": "Only superusers can perform this action.",
                  "data": {}
                }
            `}],C=o(S[0].code);h(t,{single:!0,title:`List cron jobs`,children:(t,o)=>{var h=x(),w=l(u(h),2);_(w,{js:`
            import PocketBase from 'pocketbase';

            const pb = new PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection("_superusers").authWithPassword('test@example.com', '1234567890');

            const jobs = await pb.crons.getFullList();
        `,dart:`
            import 'package:pocketbase/pocketbase.dart';

            final pb = PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection("_superusers").authWithPassword('test@example.com', '1234567890');

            final jobs = await pb.crons.getFullList();
        `});var T=l(w,8),E=l(p(T)),D=p(E);v(D,{}),c(E),c(T);var O=l(T,4),k=p(O);e(k,5,()=>S,e=>e.code,(e,t)=>{var o=y();let c;var l=d(o,!0);a(()=>{c=s(o,1,`tab-item`,null,c,{active:i(C)===i(t).code}),n(l,i(t).code)}),m(`click`,o,()=>f(C,i(t).code)),r(e,o)}),c(k);var A=l(k,2);e(A,5,()=>S,e=>e.code,(e,t)=>{var n=b();let o;var l=p(n);g(l,{get content(){return i(t).body}}),c(n),a(()=>o=s(n,1,`tab-item`,null,o,{active:i(C)===i(t).code})),r(e,n)}),c(A),c(O),r(t,h)},$$slots:{default:!0}})}var C=t(`<button> </button>`),w=t(`<div><!></div>`),T=t(`<div class="content m-b-sm"><p>Triggers a single cron job by its id.</p> <p>Only superusers can perform this action.</p></div> <!> <h6 class="m-b-xs">API details</h6> <div class="api-route alert alert-success"><strong class="label label-primary">POST</strong> <div class="content">/api/crons/<code>jobId</code></div> <small class="txt-hint auth-header">Requires <code>Authorization:TOKEN</code></small></div> <div class="section-title">Path parameters</div> <table class="table-compact table-border m-b-base"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><tr><td>jobId</td><td><span class="label">String</span></td><td>The identifier of the cron job to run.</td></tr></tbody></table> <div class="section-title">Responses</div> <div class="tabs"><div class="tabs-header compact combined left"></div> <div class="tabs-content"></div></div>`,1);function E(t){let v=[{code:204,body:`null`},{code:401,body:`
                {
                  "status": 401,
                  "message": "The request requires valid record authorization token.",
                  "data": {}
                }
            `},{code:403,body:`
                {
                  "status": 403,
                  "message": "The authorized record is not allowed to perform this action.",
                  "data": {}
                }
            `},{code:404,body:`
                {
                  "status": 404,
                  "message": "Missing or invalid cron job.",
                  "data": {}
                }
            `}],y=o(v[0].code);h(t,{single:!0,title:`Run cron job`,children:(t,o)=>{var h=T(),b=l(u(h),2);_(b,{js:`
            import PocketBase from 'pocketbase';

            const pb = new PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection('_superusers').authWithPassword('test@example.com', '1234567890');

            await pb.crons.run('__pbLogsCleanup__');
        `,dart:`
            import 'package:pocketbase/pocketbase.dart';

            final pb = PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection('_superusers').authWithPassword('test@example.com', '1234567890');

            await pb.crons.run('__pbLogsCleanup__');
        `});var x=l(b,12),S=p(x);e(S,5,()=>v,e=>e.code,(e,t)=>{var o=C();let c;var l=d(o,!0);a(()=>{c=s(o,1,`tab-item`,null,c,{active:i(y)===i(t).code}),n(l,i(t).code)}),m(`click`,o,()=>f(y,i(t).code)),r(e,o)}),c(S);var E=l(S,2);e(E,5,()=>v,e=>e.code,(e,t)=>{var n=w();let o;var l=p(n);g(l,{get content(){return i(t).body}}),c(n),a(()=>o=s(n,1,`tab-item`,null,o,{active:i(y)===i(t).code})),r(e,n)}),c(E),c(x),r(t,h)},$$slots:{default:!0}})}var D=t(`<div class="accordions"><!> <!></div>`);function O(e){var t=D(),n=p(t);S(n,{}),E(l(n,2),{}),c(t),r(e,t)}export{O as component};