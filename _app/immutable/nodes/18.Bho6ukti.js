import{A as e,I as t,N as n,P as r,V as i,X as a,at as o,b as s,bt as c,it as l,nt as u,rt as d,st as f,tt as p,z as m}from"../chunks/BDLcFjNi.js";import"../chunks/xihTtKlq.js";import"../chunks/C3kXMaAy.js";import{t as h}from"../chunks/B6gCHVlt.js";import{t as g}from"../chunks/CKGhWLYV.js";import{t as _}from"../chunks/CfPCrhHi.js";var v=t(`<button> </button>`),y=t(`<div><!></div>`),b=t(`<div class="content m-b-sm"><p>Executes a raw SQL query string <em>(used primarily for the "SQL Console" UI in PocketBase v0.39+)</em>.</p> <p>Only superusers can perform this action.</p></div> <div class="alert alert-warning"><div class="icon"><i class="ri-error-warning-line"></i></div> <div class="content"><p><strong>Be very careful when using this API!</strong></p> <p>It is intended for one-off analytic queries, the occasional
                VACUUM/PRAGMA optimize or debug purposes and NOT as the primary interface
                for interacting with your PocketBase data because, depending on the query,
                the execution could break your application and may not be reversible!</p></div></div> <!> <h6 class="m-b-xs">API details</h6> <div class="api-route alert alert-success"><strong class="label label-primary">POST</strong> <div class="content">/api/sql</div> <small class="txt-hint auth-header">Requires <code>Authorization:TOKEN</code></small></div> <div class="section-title">Body Parameters</div> <table class="table-compact table-border m-b-base"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><tr><td><div class="inline-flex"><span class="label label-success">Required</span> <span>query</span></div></td><td><span class="label">String</span></td><td>The SQL query to execute. Multiple inline SQL queries are supported but only the result of the last one is returned.</td></tr></tbody></table> <div class="section-title">Responses</div> <div class="tabs"><div class="tabs-header compact combined left"></div> <div class="tabs-content"></div></div>`,1);function x(t){let x=[{code:200,body:`
                {
                    "execTime": 0,
                    "affectedRows": 0,
                    "columns": [
                        {
                            "name": "count(*)",
                            "type": "",
                            "nullable": true
                        }
                    ],
                    "rows": [
                        ["1"]
                    ]
                }
            `},{code:400,body:`
                {
                  "status": 400,
                  "message": "Failed to execute query. Raw error: ...",
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
                  "message": "The authorized record is not allowed to perform this action.",
                  "data": {}
                }
            `}],S=o(x[0].code);h(t,{single:!0,title:`Run raw SQL query`,children:(t,o)=>{var h=b(),C=l(u(h),4);_(C,{js:`
            import PocketBase from 'pocketbase';

            const pb = new PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection('_superusers').authWithPassword('test@example.com', '1234567890');

            await pb.sql.run('SELECT count(*) FROM users');
        `,dart:`
            import 'package:pocketbase/pocketbase.dart';

            final pb = PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection('_superusers').authWithPassword('test@example.com', '1234567890');

            await pb.sql.run('SELECT count(*) FROM users');
        `});var w=l(C,12),T=p(w);e(T,5,()=>x,e=>e.code,(e,t)=>{var o=v();let c;var l=d(o,!0);a(()=>{c=s(o,1,`tab-item`,null,c,{active:i(S)===i(t).code}),n(l,i(t).code)}),m(`click`,o,()=>f(S,i(t).code)),r(e,o)}),c(T);var E=l(T,2);e(E,5,()=>x,e=>e.code,(e,t)=>{var n=y();let o;var l=p(n);g(l,{get content(){return i(t).body}}),c(n),a(()=>o=s(n,1,`tab-item`,null,o,{active:i(S)===i(t).code})),r(e,n)}),c(E),c(w),r(t,h)},$$slots:{default:!0}})}var S=t(`<div class="accordions"><!></div>`);function C(e){var t=S();x(p(t),{}),c(t),r(e,t)}export{C as component};