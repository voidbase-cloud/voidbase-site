import{A as e,I as t,N as n,P as r,V as i,X as a,at as o,b as s,bt as c,it as l,nt as u,rt as d,st as f,tt as p,yt as m,z as h}from"../chunks/BDLcFjNi.js";import"../chunks/xihTtKlq.js";import"../chunks/C3kXMaAy.js";import{t as g}from"../chunks/B6gCHVlt.js";import{t as _}from"../chunks/CKGhWLYV.js";import{t as v}from"../chunks/CfPCrhHi.js";import{t as y}from"../chunks/DK-N8Yuz.js";import{t as b}from"../chunks/zqPRTk6w.js";var x=t(`<button> </button>`),S=t(`<div><!></div>`),C=t(`<div class="content m-b-sm"><p>Returns a paginated logs list.</p> <p>Only superusers can perform this action.</p></div> <!> <h6 class="m-b-xs">API details</h6> <div class="api-route alert alert-info"><strong class="label label-primary">GET</strong> <div class="content">/api/logs</div> <small class="txt-hint auth-header">Requires <code>Authorization:TOKEN</code></small></div> <div class="section-title">Query parameters</div> <table class="table-compact table-border m-b-base"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><tr><td id="query-page">page</td><td><span class="label">Number</span></td><td>The page (aka. offset) of the paginated list (<em>default to 1</em>).</td></tr><tr><td id="query-perPage">perPage</td><td><span class="label">Number</span></td><td>The max returned logs per page (<em>default to 30</em>).</td></tr><tr><td id="query-sort">sort</td><td><span class="label">String</span></td><td><div class="content"><p>Specify the <em>ORDER BY</em> fields.</p> <p>Add <code>-</code> / <code>+</code> (default) in front of the attribute for DESC /
                            ASC order, e.g.:</p> <!> <p><strong>Supported log sort fields:</strong> <br/> <code>@random</code>, <code>rowid</code>, <code>id</code>, <code>created</code>, <code>updated</code>, <code>level</code>, <code>message</code> and any <code>data.*</code> attribute.</p></div></td></tr><tr><td id="query-filter">filter</td><td><span class="label">String</span></td><td><div class="content"><p>Filter expression to filter/search the returned logs list, e.g.:</p> <!> <p><strong>Supported log filter fields:</strong> <br/> <code>id</code>, <code>created</code>, <code>updated</code>, <code>level</code>, <code>message</code> and any <code>data.*</code> attribute.</p> <!></div></td></tr><!></tbody></table> <div class="section-title">Responses</div> <div class="tabs"><div class="tabs-header compact combined left"></div> <div class="tabs-content"></div></div>`,1);function w(t){let w=[{code:200,body:`
                {
                  "page": 1,
                  "perPage": 20,
                  "totalItems": 2,
                  "items": [
                    {
                      "id": "ai5z3aoed6809au",
                      "created": "2024-10-27 09:28:19.524Z",
                      "data": {
                        "auth": "_superusers",
                        "execTime": 2.392327,
                        "method": "GET",
                        "referer": "http://localhost:8090/_/",
                        "remoteIP": "127.0.0.1",
                        "status": 200,
                        "type": "request",
                        "url": "/api/collections/_pbc_2287844090/records?page=1&perPage=1&filter=&fields=id",
                        "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
                        "userIP": "127.0.0.1"
                      },
                      "message": "GET /api/collections/_pbc_2287844090/records?page=1&perPage=1&filter=&fields=id",
                      "level": 0
                    },
                    {
                      "id": "26apis4s3sm9yqm",
                      "created": "2024-10-27 09:28:19.524Z",
                      "data": {
                        "auth": "_superusers",
                        "execTime": 2.392327,
                        "method": "GET",
                        "referer": "http://localhost:8090/_/",
                        "remoteIP": "127.0.0.1",
                        "status": 200,
                        "type": "request",
                        "url": "/api/collections/_pbc_2287844090/records?page=1&perPage=1&filter=&fields=id",
                        "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
                        "userIP": "127.0.0.1"
                      },
                      "message": "GET /api/collections/_pbc_2287844090/records?page=1&perPage=1&filter=&fields=id",
                      "level": 0
                    }
                  ]
                }
            `},{code:400,body:`
                {
                  "status": 400,
                  "message": "Something went wrong while processing your request. Invalid filter.",
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
            `}],T=o(w[0].code);g(t,{single:!0,title:`List logs`,children:(t,o)=>{var g=C(),E=l(u(g),2);v(E,{js:`
            import PocketBase from 'pocketbase';

            const pb = new PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection("_superusers").authWithPassword('test@example.com', '1234567890');

            const pageResult = await pb.logs.getList(1, 20, {
                filter: 'data.status >= 400'
            });
        `,dart:`
            import 'package:pocketbase/pocketbase.dart';

            final pb = PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection("_superusers").authWithPassword('test@example.com', '1234567890');

            final pageResult = await pb.logs.getList(
                page: 1,
                perPage: 20,
                filter: 'data.status >= 400',
            );
        `});var D=l(E,8),O=l(p(D)),k=l(p(O),2),A=l(p(k),2),j=p(A),M=l(p(j),4);_(M,{content:`
                                // DESC by the insertion rowid and ASC by level
                                ?sort=-rowid,level
                            `}),m(2),c(j),c(A),c(k);var N=l(k),P=l(p(N),2),F=p(P),I=l(p(F),2);_(I,{content:`
                                ?filter=(data.url~'test.com' && level>0)
                            `});var L=l(I,4);b(L,{}),c(F),c(P),c(N);var R=l(N);y(R,{}),c(O),c(D);var z=l(D,4),B=p(z);e(B,5,()=>w,e=>e.code,(e,t)=>{var o=x();let c;var l=d(o,!0);a(()=>{c=s(o,1,`tab-item`,null,c,{active:i(T)===i(t).code}),n(l,i(t).code)}),h(`click`,o,()=>f(T,i(t).code)),r(e,o)}),c(B);var V=l(B,2);e(V,5,()=>w,e=>e.code,(e,t)=>{var n=S();let o;var l=p(n);_(l,{get content(){return i(t).body}}),c(n),a(()=>o=s(n,1,`tab-item`,null,o,{active:i(T)===i(t).code})),r(e,n)}),c(V),c(z),r(t,g)},$$slots:{default:!0}})}var T=t(`<button> </button>`),E=t(`<div><!></div>`),D=t(`<div class="content m-b-sm"><p>Returns a single log by its ID.</p> <p>Only superusers can perform this action.</p></div> <!> <h6 class="m-b-xs">API details</h6> <div class="api-route alert alert-info"><strong class="label label-primary">GET</strong> <div class="content">/api/logs/<code>id</code></div> <small class="txt-hint auth-header">Requires <code>Authorization:TOKEN</code></small></div> <div class="section-title">Path parameters</div> <table class="table-compact table-border m-b-base"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><tr><td>id</td><td><span class="label">String</span></td><td>ID of the log to view.</td></tr></tbody></table> <div class="section-title">Query parameters</div> <table class="table-compact table-border m-b-base"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><!></tbody></table> <div class="section-title">Responses</div> <div class="tabs"><div class="tabs-header compact combined left"></div> <div class="tabs-content"></div></div>`,1);function O(t){let m=[{code:200,body:`
                {
                  "id": "ai5z3aoed6809au",
                  "created": "2024-10-27 09:28:19.524Z",
                  "data": {
                    "auth": "_superusers",
                    "execTime": 2.392327,
                    "method": "GET",
                    "referer": "http://localhost:8090/_/",
                    "remoteIP": "127.0.0.1",
                    "status": 200,
                    "type": "request",
                    "url": "/api/collections/_pbc_2287844090/records?page=1&perPage=1&filter=&fields=id",
                    "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
                    "userIP": "127.0.0.1"
                  },
                  "message": "GET /api/collections/_pbc_2287844090/records?page=1&perPage=1&filter=&fields=id",
                  "level": 0
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
            `},{code:404,body:`
                {
                  "status": 404,
                  "message": "The requested resource wasn't found.",
                  "data": {}
                }
            `}],b=o(m[0].code);g(t,{single:!0,title:`View log`,children:(t,o)=>{var g=D(),x=l(u(g),2);v(x,{js:`
            import PocketBase from 'pocketbase';

            const pb = new PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection("_superusers").authWithEmail('test@example.com', '123456');

            const log = await pb.logs.getOne('LOG_ID');
        `,dart:`
            import 'package:pocketbase/pocketbase.dart';

            final pb = PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection("_superusers").authWithEmail('test@example.com', '123456');

            final log = await pb.logs.getOne('LOG_ID');
        `});var S=l(x,12),C=l(p(S)),w=p(C);y(w,{}),c(C),c(S);var O=l(S,4),k=p(O);e(k,5,()=>m,e=>e.code,(e,t)=>{var o=T();let c;var l=d(o,!0);a(()=>{c=s(o,1,`tab-item`,null,c,{active:i(b)===i(t).code}),n(l,i(t).code)}),h(`click`,o,()=>f(b,i(t).code)),r(e,o)}),c(k);var A=l(k,2);e(A,5,()=>m,e=>e.code,(e,t)=>{var n=E();let o;var l=p(n);_(l,{get content(){return i(t).body}}),c(n),a(()=>o=s(n,1,`tab-item`,null,o,{active:i(b)===i(t).code})),r(e,n)}),c(A),c(O),r(t,g)},$$slots:{default:!0}})}var k=t(`<button> </button>`),A=t(`<div><!></div>`),j=t(`<div class="content m-b-sm"><p>Returns hourly aggregated logs statistics.</p> <p>Only superusers can perform this action.</p></div> <!> <h6 class="m-b-xs">API details</h6> <div class="api-route alert alert-info"><strong class="label label-primary">GET</strong> <div class="content">/api/logs/stats</div> <small class="txt-hint auth-header">Requires <code>Authorization:TOKEN</code></small></div> <div class="section-title">Query parameters</div> <table class="table-compact table-border m-b-base"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><tr><td id="query-filter">filter</td><td><span class="label">String</span></td><td><div class="content"><p>Filter expression to filter/search the logs, e.g.:</p> <!> <p><strong>Supported log filter fields:</strong> <br/> <code>rowid</code>, <code>id</code>, <code>created</code>, <code>updated</code>, <code>level</code>, <code>message</code> and any <code>data.*</code> attribute.</p> <!></div></td></tr><!></tbody></table> <div class="section-title">Responses</div> <div class="tabs"><div class="tabs-header compact combined left"></div> <div class="tabs-content"></div></div>`,1);function M(t){let m=[{code:200,body:`
                [
                  {
                    "total": 4,
                    "date": "2022-06-01 19:00:00.000"
                  },
                  {
                    "total": 1,
                    "date": "2022-06-02 12:00:00.000"
                  },
                  {
                    "total": 8,
                    "date": "2022-06-02 13:00:00.000"
                  }
                ]
            `},{code:400,body:`
                {
                  "status": 400,
                  "message": "Something went wrong while processing your request. Invalid filter.",
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
            `}],x=o(m[0].code);g(t,{single:!0,title:`Logs statistics`,children:(t,o)=>{var g=j(),S=l(u(g),2);v(S,{js:`
            import PocketBase from 'pocketbase';

            const pb = new PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection("_superusers").authWithPassword('test@example.com', '123456');

            const stats = await pb.logs.getStats({
                filter: 'data.status >= 400'
            });
        `,dart:`
            import 'package:pocketbase/pocketbase.dart';

            final pb = PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection("_superusers").authWithPassword('test@example.com', '123456');

            final stats = await pb.logs.getStats(
                filter: 'data.status >= 400'
            );
        `});var C=l(S,8),w=l(p(C)),T=p(w),E=l(p(T),2),D=p(E),O=l(p(D),2);_(O,{content:`
                                ?filter=(data.url~'test.com' && level>0)
                            `});var M=l(O,4);b(M,{}),c(D),c(E),c(T);var N=l(T);y(N,{}),c(w),c(C);var P=l(C,4),F=p(P);e(F,5,()=>m,e=>e.code,(e,t)=>{var o=k();let c;var l=d(o,!0);a(()=>{c=s(o,1,`tab-item`,null,c,{active:i(x)===i(t).code}),n(l,i(t).code)}),h(`click`,o,()=>f(x,i(t).code)),r(e,o)}),c(F);var I=l(F,2);e(I,5,()=>m,e=>e.code,(e,t)=>{var n=A();let o;var l=p(n);_(l,{get content(){return i(t).body}}),c(n),a(()=>o=s(n,1,`tab-item`,null,o,{active:i(x)===i(t).code})),r(e,n)}),c(I),c(P),r(t,g)},$$slots:{default:!0}})}var N=t(`<button> </button>`),P=t(`<div><!></div>`),F=t(`<div class="content m-b-sm"><p>Deletes all logs from the database.</p> <p>Only superusers can perform this action.</p></div> <!> <h6 class="m-b-xs">API details</h6> <div class="api-route alert alert-danger"><strong class="label label-primary">DELETE</strong> <div class="content">/api/logs</div> <small class="txt-hint auth-header">Requires <code>Authorization:TOKEN</code></small></div> <div class="section-title">Responses</div> <div class="tabs"><div class="tabs-header compact combined left"></div> <div class="tabs-content"></div></div>`,1);function I(t){let m=[{code:204,body:`null`},{code:400,body:`
                {
                  "status": 400,
                  "message": "Failed to truncate all logs.",
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
            `}],y=o(m[0].code);g(t,{single:!0,title:`Truncate logs`,children:(t,o)=>{var g=F(),b=l(u(g),2);v(b,{js:`
            import PocketBase from 'pocketbase';

            const pb = new PocketBase('http://127.0.0.1:8090');

            ...

            await pb.logs.truncate()
        `,dart:`
            import 'package:pocketbase/pocketbase.dart';

            final pb = PocketBase('http://127.0.0.1:8090');

            ...

            await pb.logs.truncate()
        `});var x=l(b,8),S=p(x);e(S,5,()=>m,e=>e.code,(e,t)=>{var o=N();let c;var l=d(o,!0);a(()=>{c=s(o,1,`tab-item`,null,c,{active:i(y)===i(t).code}),n(l,i(t).code)}),h(`click`,o,()=>f(y,i(t).code)),r(e,o)}),c(S);var C=l(S,2);e(C,5,()=>m,e=>e.code,(e,t)=>{var n=P();let o;var l=p(n);_(l,{get content(){return i(t).body}}),c(n),a(()=>o=s(n,1,`tab-item`,null,o,{active:i(y)===i(t).code})),r(e,n)}),c(C),c(x),r(t,g)},$$slots:{default:!0}})}var L=t(`<div class="accordions"><!> <!> <!> <!></div>`);function R(e){var t=L(),n=p(t);w(n,{});var i=l(n,2);O(i,{});var a=l(i,2);M(a,{}),I(l(a,2),{}),c(t),r(e,t)}export{R as component};