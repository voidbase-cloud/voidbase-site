import{A as e,E as t,I as n,J as r,N as i,P as a,V as o,W as s,X as c,Y as l,at as u,b as d,bt as f,gt as p,ht as m,it as h,j as g,nt as _,o as v,rt as y,st as b,tt as x,yt as S,z as C}from"../chunks/BDLcFjNi.js";import"../chunks/xihTtKlq.js";import"../chunks/C3kXMaAy.js";import{t as w}from"../chunks/DxB8CMVb.js";import{t as T}from"../chunks/BnicrACe.js";import{t as E}from"../chunks/B6gCHVlt.js";import{t as D}from"../chunks/CKGhWLYV.js";import{t as O}from"../chunks/CfPCrhHi.js";import{t as k}from"../chunks/DK-N8Yuz.js";import{t as A}from"../chunks/zqPRTk6w.js";import{t as j}from"../chunks/BMrla5zq.js";var M=n(`<tr><td>expand</td><td><span class="label">String</span></td><td>Auto expand record relations. Ex.: <!> Supports up to 6-levels depth nested relations expansion. <br/> The expanded relations will be appended to the record under the <code>expand</code> property (e.g. <code></code>). <br/> Only the relations to which the request user has permissions to <strong>view</strong> will be expanded.</td></tr>`);function N(e){var t=M(),n=h(x(t),2),r=h(x(n));D(r,{content:`?expand=relField1,relField2.subRelField`});var i=h(r,6);i.textContent=`"expand": {"relField1": {...}, ...}`,S(5),f(n),f(t),a(e,t)}var P=n(`<button> </button>`),F=n(`<div><!></div>`),I=n(`<div class="content m-b-sm"><p>Returns a paginated records list, supporting sorting and filtering.</p> <p>Depending on the collection's <code>listRule</code> value, the access to this action may or may not
            have been restricted.</p> <p class="txt-hint"><em>You could find individual generated records API documentation in the "Dashboard > Collections
                > API Preview".</em></p></div> <!> <h6 class="m-b-xs">API details</h6> <div class="api-route alert alert-info"><strong class="label label-primary">GET</strong> <div class="content">/api/collections/<code>collectionIdOrName</code>/records</div></div> <div class="section-title">Path parameters</div> <table class="table-compact table-border m-b-base"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><tr><td>collectionIdOrName</td><td><span class="label">String</span></td><td>ID or name of the records' collection.</td></tr></tbody></table> <div class="section-title">Query parameters</div> <table class="table-compact table-border m-b-base"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><tr><td id="query-page">page</td><td><span class="label">Number</span></td><td>The page (aka. offset) of the paginated list (<em>default to 1</em>).</td></tr><tr><td id="query-perPage">perPage</td><td><span class="label">Number</span></td><td>The max returned records per page (<em>default to 30</em>).</td></tr><tr><td valign="top" id="query-sort">sort</td><td valign="top"><span class="label">String</span></td><td valign="top"><div class="content"><p>Specify the <em>ORDER BY</em> fields.</p> <p>Add <code>-</code> / <code>+</code> (default) in front of the attribute for DESC /
                            ASC order, eg.:</p> <!> <p><strong>Supported record sort fields:</strong> <br/> <code>@random</code>, <code>@rowid</code>, <code>id</code>, <strong>and any other collection field</strong>.</p></div></td></tr><tr><td valign="top" id="query-filter">filter</td><td valign="top"><span class="label">String</span></td><td valign="top"><div class="content"><p>Filter expression to filter/search the returned records list (in addition to the
                            collection's <code>listRule</code>), e.g.:</p> <!> <p><strong>Supported record filter fields:</strong> <br/> <code>id</code>, <strong>+ any field from the collection schema</strong>.</p> <!></div></td></tr><!><!><!></tbody></table> <div class="section-title">Responses</div> <div class="tabs"><div class="tabs-header compact combined left"></div> <div class="tabs-content"></div></div>`,1);function L(t){let n=[{code:200,body:`
                {
                  "page": 1,
                  "perPage": 100,
                  "totalItems": 2,
                  "totalPages": 1,
                  "items": [
                    {
                      "id": "ae40239d2bc4477",
                      "collectionId": "a98f514eb05f454",
                      "collectionName": "posts",
                      "updated": "2022-06-25 11:03:50.052",
                      "created": "2022-06-25 11:03:35.163",
                      "title": "test1"
                    },
                    {
                      "id": "d08dfc4f4d84419",
                      "collectionId": "a98f514eb05f454",
                      "collectionName": "posts",
                      "updated": "2022-06-25 11:03:45.876",
                      "created": "2022-06-25 11:03:45.876",
                      "title": "test2"
                    }
                  ]
                }
            `},{code:400,body:`
                {
                  "status": 400,
                  "message": "Something went wrong while processing your request. Invalid filter.",
                  "data": {}
                }
            `},{code:403,body:`
                {
                  "status": 403,
                  "message": "Only superusers can filter by '@collection.*'",
                  "data": {}
                }
            `}],r=u(n[0].code);E(t,{single:!0,title:`List/Search records`,children:(t,s)=>{var l=I(),u=h(_(l),2);O(u,{js:`
            import PocketBase from 'pocketbase';

            const pb = new PocketBase('http://127.0.0.1:8090');

            ...

            // fetch a paginated records list
            const resultList = await pb.collection('posts').getList(1, 50, {
                filter: 'created >= "2022-01-01 00:00:00" && someField1 != someField2',
            });

            // you can also fetch all records at once via getFullList
            const records = await pb.collection('posts').getFullList({
                sort: '-created',
            });

            // or fetch only the first record that matches the specified filter
            const record = await pb.collection('posts').getFirstListItem('someField="test"', {
                expand: 'relField1,relField2.subRelField',
            });
        `,dart:`
            import 'package:pocketbase/pocketbase.dart';

            final pb = PocketBase('http://127.0.0.1:8090');

            ...

            // fetch a paginated records list
            final resultList = await pb.collection('posts').getList(
              page: 1,
              perPage: 50,
              filter: 'created >= "2022-01-01 00:00:00" && someField1 != someField2',
            );

            // you can also fetch all records at once via getFullList
            final records = await pb.collection('posts').getFullList(sort: '-created');

            // or fetch only the first record that matches the specified filter
            final record = await pb.collection('posts').getFirstListItem(
              'someField="test"',
              expand: 'relField1,relField2.subRelField',
            );
        `});var p=h(u,12),m=h(x(p)),g=h(x(m),2),v=h(x(g),2),w=x(v),T=h(x(w),4);D(T,{content:`
                                // DESC by created and ASC by id
                                ?sort=-created,id
                            `}),S(2),f(w),f(v),f(g);var E=h(g),M=h(x(E),2),L=x(M),R=h(x(L),2);D(R,{content:`
                                ?filter=(title~'abc' && created>'2022-01-01')
                            `});var z=h(R,4);A(z,{}),f(L),f(M),f(E);var B=h(E);N(B,{});var V=h(B);k(V,{});var H=h(V);j(H,{}),f(m),f(p);var U=h(p,4),W=x(U);e(W,5,()=>n,e=>e.code,(e,t)=>{var n=P();let s;var l=y(n,!0);c(()=>{s=d(n,1,`tab-item`,null,s,{active:o(r)===o(t).code}),i(l,o(t).code)}),C(`click`,n,()=>b(r,o(t).code)),a(e,n)}),f(W);var G=h(W,2);e(G,5,()=>n,e=>e.code,(e,t)=>{var n=F();let i;var s=x(n);D(s,{get content(){return o(t).body}}),f(n),c(()=>i=d(n,1,`tab-item`,null,i,{active:o(r)===o(t).code})),a(e,n)}),f(G),f(U),a(t,l)},$$slots:{default:!0}})}var R=n(`<button> </button>`),z=n(`<div><!></div>`),B=n(`<div class="content m-b-sm"><p>Returns a single collection record by its ID.</p> <p>Depending on the collection's <code>viewRule</code> value, the access to this action may or may not
            have been restricted.</p> <p class="txt-hint"><em>You could find individual generated records API documentation in the "Dashboard > Collections
                > API Preview".</em></p></div> <!> <h6 class="m-b-xs">API details</h6> <div class="api-route alert alert-info"><strong class="label label-primary">GET</strong> <div class="content">/api/collections/<code>collectionIdOrName</code>/records/<code>recordId</code></div></div> <div class="section-title">Path parameters</div> <table class="table-compact table-border m-b-base"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><tr><td>collectionIdOrName</td><td><span class="label">String</span></td><td>ID or name of the record's collection.</td></tr><tr><td>recordId</td><td><span class="label">String</span></td><td>ID of the record to view.</td></tr></tbody></table> <div class="section-title">Query parameters</div> <table class="table-compact table-border m-b-base"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><!><!></tbody></table> <div class="section-title">Responses</div> <div class="tabs"><div class="tabs-header compact combined left"></div> <div class="tabs-content"></div></div>`,1);function V(t){let n=[{code:200,body:`
                {
                  "id": "ae40239d2bc4477",
                  "collectionId": "a98f514eb05f454",
                  "collectionName": "posts",
                  "updated": "2022-06-25 11:03:50.052",
                  "created": "2022-06-25 11:03:35.163",
                  "title": "test1"
                }
            `},{code:403,body:`
                {
                  "status": 403,
                  "message": "Only superusers can perform this action.",
                  "data": {}
                }
            `},{code:404,body:`
                {
                  "status": 404,
                  "message": "The requested resource wasn't found.",
                  "data": {}
                }
            `}],r=u(n[0].code);E(t,{single:!0,title:`View record`,children:(t,s)=>{var l=B(),u=h(_(l),2);O(u,{js:`
            import PocketBase from 'pocketbase';

            const pb = new PocketBase('http://127.0.0.1:8090');

            ...

            const record1 = await pb.collection('posts').getOne('RECORD_ID', {
                expand: 'relField1,relField2.subRelField',
            });
        `,dart:`
            import 'package:pocketbase/pocketbase.dart';

            final pb = PocketBase('http://127.0.0.1:8090');

            ...

            final record1 = await pb.collection('posts').getOne('RECORD_ID',
              expand: 'relField1,relField2.subRelField',
            );
        `});var p=h(u,12),m=h(x(p)),g=x(m);N(g,{});var v=h(g);k(v,{}),f(m),f(p);var S=h(p,4),w=x(S);e(w,5,()=>n,e=>e.code,(e,t)=>{var n=R();let s;var l=y(n,!0);c(()=>{s=d(n,1,`tab-item`,null,s,{active:o(r)===o(t).code}),i(l,o(t).code)}),C(`click`,n,()=>b(r,o(t).code)),a(e,n)}),f(w);var T=h(w,2);e(T,5,()=>n,e=>e.code,(e,t)=>{var n=z();let i;var s=x(n);D(s,{get content(){return o(t).body}}),f(n),c(()=>i=d(n,1,`tab-item`,null,i,{active:o(r)===o(t).code})),a(e,n)}),f(T),f(S),a(t,l)},$$slots:{default:!0}})}var H=n(`<button> </button>`),U=n(`<div><!></div>`),W=n(`<div class="content m-b-sm"><p>Creates a new collection <em>Record</em>.</p> <p>Depending on the collection's <code>createRule</code> value, the access to this action may or may not
            have been restricted.</p> <p class="txt-hint"><em>You could find individual generated records API documentation from the Dashboard.</em></p></div> <!> <h6 class="m-b-xs">API details</h6> <div class="api-route alert alert-success"><strong class="label label-primary">POST</strong> <div class="content">/api/collections/<code>collectionIdOrName</code>/records</div></div> <div class="section-title">Path parameters</div> <table class="table-compact table-border m-b-base"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><tr><td>collectionIdOrName</td><td><span class="label">String</span></td><td>ID or name of the record's collection.</td></tr></tbody></table> <div class="section-title">Body Parameters</div> <table class="table-compact table-border"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><tr><td><div class="inline-flex"><span class="label label-warning">Optional</span> <span>id</span></div></td><td><span class="label">String</span></td><td><strong>15 characters string</strong> to store as record ID. <br/> If not set, it will be auto generated.</td></tr><tr><td colspan="3" class="txt-hint">Schema fields</td></tr><tr><td colspan="3"><strong>Any field from the collection's schema.</strong></td></tr><tr><td colspan="3" class="txt-hint">Additional auth record fields</td></tr><tr><td><div class="inline-flex"><span class="label label-success">Required</span> <span>password</span></div></td><td><span class="label">String</span></td><td>Auth record password.</td></tr><tr><td><div class="inline-flex"><span class="label label-success">Required</span> <span>passwordConfirm</span></div></td><td><span class="label">String</span></td><td>Auth record password confirmation.</td></tr></tbody></table> <small class="block txt-hint m-t-10 m-b-base">Body parameters could be sent as <em>JSON</em> or <em>multipart/form-data</em>. <br/> File upload is supported only through <em>multipart/form-data</em>.</small> <div class="section-title">Query parameters</div> <table class="table-compact table-border m-b-lg"><thead><tr><th>Param</th><th>Type</th><th width="60%">Description</th></tr></thead><tbody><!><!></tbody></table> <div class="section-title">Responses</div> <div class="tabs"><div class="tabs-header compact combined left"></div> <div class="tabs-content"></div></div>`,1);function G(t){let n=[{code:200,body:`
                {
                  "collectionId": "a98f514eb05f454",
                  "collectionName": "demo",
                  "id": "ae40239d2bc4477",
                  "updated": "2022-06-25 11:03:50.052",
                  "created": "2022-06-25 11:03:35.163",
                  "title": "Lorem ipsum"
                }
            `},{code:400,body:`
                {
                  "status": 400,
                  "message": "Failed to create record.",
                  "data": {
                    "title": {
                      "code": "validation_required",
                      "message": "Missing required value."
                    }
                  }
                }
            `},{code:403,body:`
                {
                  "status": 403,
                  "message": "Only superusers can perform this action.",
                  "data": {}
                }
            `},{code:404,body:`
                {
                  "status": 404,
                  "message": "The requested resource wasn't found. Missing collection context.",
                  "data": {}
                }
            `}],r=u(n[0].code);E(t,{single:!0,title:`Create record`,children:(t,s)=>{var l=W(),u=h(_(l),2);O(u,{js:`
            import PocketBase from 'pocketbase';

            const pb = new PocketBase('http://127.0.0.1:8090');

            ...

            const record = await pb.collection('demo').create({
                title: 'Lorem ipsum',
            });
        `,dart:`
            import 'package:pocketbase/pocketbase.dart';

            final pb = PocketBase('http://127.0.0.1:8090');

            ...

            final record = await pb.collection('demo').create(body: {
                'title': 'Lorem ipsum',
            });
        `});var p=h(u,18),m=h(x(p)),g=x(m);N(g,{});var v=h(g);k(v,{}),f(m),f(p);var S=h(p,4),w=x(S);e(w,5,()=>n,e=>e.code,(e,t)=>{var n=H();let s;var l=y(n,!0);c(()=>{s=d(n,1,`tab-item`,null,s,{active:o(r)===o(t).code}),i(l,o(t).code)}),C(`click`,n,()=>b(r,o(t).code)),a(e,n)}),f(w);var T=h(w,2);e(T,5,()=>n,e=>e.code,(e,t)=>{var n=U();let i;var s=x(n);D(s,{get content(){return o(t).body}}),f(n),c(()=>i=d(n,1,`tab-item`,null,i,{active:o(r)===o(t).code})),a(e,n)}),f(T),f(S),a(t,l)},$$slots:{default:!0}})}var ee=n(`<button> </button>`),te=n(`<div><!></div>`),K=n(`<div class="content m-b-sm"><p>Updates an existing collection <em>Record</em>.</p> <p>Depending on the collection's <code>updateRule</code> value, the access to this action may or may not
            have been restricted.</p> <p class="txt-hint"><em>You could find individual generated records API documentation from the Dashboard.</em></p></div> <!> <h6 class="m-b-xs">API details</h6> <div class="api-route alert alert-warning"><strong class="label label-primary">PATCH</strong> <div class="content">/api/collections/<code>collectionIdOrName</code>/records/<code>recordId</code></div></div> <div class="section-title">Path parameters</div> <table class="table-compact table-border m-b-base"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><tr><td>collectionIdOrName</td><td><span class="label">String</span></td><td>ID or name of the record's collection.</td></tr><tr><td>recordId</td><td><span class="label">String</span></td><td>ID of the record to update.</td></tr></tbody></table> <div class="section-title">Body Parameters</div> <table class="table-compact table-border"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><tr><td colspan="3" class="txt-hint">Schema fields</td></tr><tr><td colspan="3"><strong>Any field from the collection's schema.</strong></td></tr><tr><td colspan="3" class="txt-hint">Additional auth record fields</td></tr><tr><td><div class="inline-flex"><span class="label label-warning">Optional</span> <span>oldPassword</span></div></td><td><span class="label">String</span></td><td>Old auth record password. <br/> This field is required only when changing the record password. Superusers and auth records
                    with "Manage" access can skip this field.</td></tr><tr><td><div class="inline-flex"><span class="label label-warning">Optional</span> <span>password</span></div></td><td><span class="label">String</span></td><td>New auth record password.</td></tr><tr><td><div class="inline-flex"><span class="label label-warning">Optional</span> <span>passwordConfirm</span></div></td><td><span class="label">String</span></td><td>New auth record password confirmation.</td></tr></tbody></table> <small class="block txt-hint m-t-10 m-b-base">Body parameters could be sent as <em>JSON</em> or <em>multipart/form-data</em>. <br/> File upload is supported only through <em>multipart/form-data</em>.</small> <div class="section-title">Query parameters</div> <table class="table-compact table-border m-b-lg"><thead><tr><th>Param</th><th>Type</th><th width="60%">Description</th></tr></thead><tbody><!><!></tbody></table> <div class="section-title">Responses</div> <div class="tabs"><div class="tabs-header compact combined left"></div> <div class="tabs-content"></div></div>`,1);function q(t){let n=[{code:200,body:`
                {
                  "collectionId": "a98f514eb05f454",
                  "collectionName": "demo",
                  "id": "ae40239d2bc4477",
                  "updated": "2022-06-25 11:03:50.052",
                  "created": "2022-06-25 11:03:35.163",
                  "title": "Lorem ipsum"
                }
            `},{code:400,body:`
                {
                  "status": 400,
                  "message": "Failed to create record.",
                  "data": {
                    "title": {
                      "code": "validation_required",
                      "message": "Missing required value."
                    }
                  }
                }
            `},{code:403,body:`
                {
                  "status": 403,
                  "message": "Only superusers can perform this action.",
                  "data": {}
                }
            `},{code:404,body:`
                {
                  "status": 404,
                  "message": "The requested resource wasn't found. Missing collection context.",
                  "data": {}
                }
            `}],r=u(n[0].code);E(t,{single:!0,title:`Update record`,children:(t,s)=>{var l=K(),u=h(_(l),2);O(u,{js:`
            import PocketBase from 'pocketbase';

            const pb = new PocketBase('http://127.0.0.1:8090');

            ...

            const record = await pb.collection('demo').update('YOUR_RECORD_ID', {
                title: 'Lorem ipsum',
            });
        `,dart:`
            import 'package:pocketbase/pocketbase.dart';

            final pb = PocketBase('http://127.0.0.1:8090');

            ...

            final record = await pb.collection('demo').update('YOUR_RECORD_ID', body: {
                'title': 'Lorem ipsum',
            });
        `});var p=h(u,18),m=h(x(p)),g=x(m);N(g,{});var v=h(g);k(v,{}),f(m),f(p);var S=h(p,4),w=x(S);e(w,5,()=>n,e=>e.code,(e,t)=>{var n=ee();let s;var l=y(n,!0);c(()=>{s=d(n,1,`tab-item`,null,s,{active:o(r)===o(t).code}),i(l,o(t).code)}),C(`click`,n,()=>b(r,o(t).code)),a(e,n)}),f(w);var T=h(w,2);e(T,5,()=>n,e=>e.code,(e,t)=>{var n=te();let i;var s=x(n);D(s,{get content(){return o(t).body}}),f(n),c(()=>i=d(n,1,`tab-item`,null,i,{active:o(r)===o(t).code})),a(e,n)}),f(T),f(S),a(t,l)},$$slots:{default:!0}})}var J=n(`<button> </button>`),Y=n(`<div><!></div>`),X=n(`<div class="content m-b-sm"><p>Deletes a single collection <em>Record</em> by its ID.</p> <p>Depending on the collection's <code>deleteRule</code> value, the access to this action may or may not
            have been restricted.</p> <p class="txt-hint"><em>You could find individual generated records API documentation from the Dashboard.</em></p></div> <!> <h6 class="m-b-xs">API details</h6> <div class="api-route alert alert-danger"><strong class="label label-primary">DELETE</strong> <div class="content">/api/collections/<code>collectionIdOrName</code>/records/<code>recordId</code></div></div> <div class="section-title">Path parameters</div> <table class="table-compact table-border m-b-base"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><tr><td>collectionIdOrName</td><td><span class="label">String</span></td><td>ID or name of the record's collection.</td></tr><tr><td>recordId</td><td><span class="label">String</span></td><td>ID of the record to delete.</td></tr></tbody></table> <div class="section-title">Responses</div> <div class="tabs"><div class="tabs-header compact combined left"></div> <div class="tabs-content"></div></div>`,1);function Z(t){let n=[{code:204,body:`null`},{code:400,body:`
                {
                  "status": 400,
                  "message": "Failed to delete record. Make sure that the record is not part of a required relation reference.",
                  "data": {}
                }
            `},{code:403,body:`
                {
                  "status": 403,
                  "message": "Only superusers can perform this action.",
                  "data": {}
                }
            `},{code:404,body:`
                {
                  "status": 404,
                  "message": "The requested resource wasn't found.",
                  "data": {}
                }
            `}],r=u(n[0].code);E(t,{single:!0,title:`Delete record`,children:(t,s)=>{var l=X(),u=h(_(l),2);O(u,{js:`
            import PocketBase from 'pocketbase';

            const pb = new PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection('demo').delete('YOUR_RECORD_ID');
        `,dart:`
            import 'package:pocketbase/pocketbase.dart';

            final pb = PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection('demo').delete('YOUR_RECORD_ID');
        `});var p=h(u,12),m=x(p);e(m,5,()=>n,e=>e.code,(e,t)=>{var n=J();let s;var l=y(n,!0);c(()=>{s=d(n,1,`tab-item`,null,s,{active:o(r)===o(t).code}),i(l,o(t).code)}),C(`click`,n,()=>b(r,o(t).code)),a(e,n)}),f(m);var g=h(m,2);e(g,5,()=>n,e=>e.code,(e,t)=>{var n=Y();let i;var s=x(n);D(s,{get content(){return o(t).body}}),f(n),c(()=>i=d(n,1,`tab-item`,null,i,{active:o(r)===o(t).code})),a(e,n)}),f(g),f(p),a(t,l)},$$slots:{default:!0}})}var Q=n(`<button> </button>`),ne=n(`<div><!></div>`),re=n(`<div class="content m-b-sm"><p>Batch and transactional create/update/upsert/delete of multiple records in a single request.</p></div> <div class="alert alert-warning"><div class="icon"><i class="ri-error-warning-line"></i></div> <div class="content"><p>The batch Web API need to be explicitly enabled and configured from the <em>Dashboard > Settings > Application</em>.</p> <p>Because this endpoint processes the requests in a single read&write transaction, other queries
                may queue up and it could degrade the performance of your application if not used with proper
                care and configuration <em>(some recommendations: prefer using the smallest possible max processing time and body
                    size limits; avoid large file uploads over slow S3 networks and custom hooks that
                    communicate with slow external APIs)</em>.</p></div></div> <!> <h6 class="m-b-xs">API details</h6> <div class="api-route alert alert-success"><strong class="label label-primary">POST</strong> <div class="content">/api/batch</div></div> <div class="section-title">Body Parameters</div> <p>Body parameters could be sent as <em>application/json</em> or <em>multipart/form-data</em>. <br/> File upload is supported only via <em>multipart/form-data</em> (see below for more details).</p> <table class="table-compact table-border m-b-base"><thead><tr><th>Param</th><th width="80%">Description</th></tr></thead><tbody><tr><td valign="top"><div class="flex txt-nowrap"><span class="label label-success">Required</span> <span>requests</span></div></td><td><span class="label"></span> - List of the requests to process. <p>The supported batch request actions are:</p> <ul><li>record create - <code></code></li> <li>record update - <code></code></li> <li>record upsert - <code></code> <br/> <small class="txt-hint">(the body must have <code class="txt-sm">id</code> field)</small></li> <li>record delete - <code></code></li></ul> <p>Each batch Request element have the following properties:</p> <ul><li><code>url path</code> <em>(could include query parameters)</em></li> <li><code>method</code> <em>(GET, POST, PUT, PATCH, DELETE)</em></li> <li><code>headers</code> <br/> <em>(custom per-request <code>Authorization</code> header is not supported at the moment,
                                aka. all batch requests have the same auth state)</em></li> <li><code>body</code></li></ul> <p><strong>NB!</strong> When the batch request is send as <code>multipart/form-data</code>, the regular batch action fields are expected to be
                        submitted as serialized json under the <code>@jsonPayload</code> field and file keys
                        need to follow the pattern <code>requests.N.fileField</code> or <code>requests[N].fileField</code> <em>(this is usually handled transparently by the SDKs when their specific object
                            notation is used)</em>. <br/> If you don't use the SDKs or prefer manually to construct the <code>FormData</code> body, then it could look something like: <!></p></td></tr></tbody></table> <div class="section-title">Responses</div> <div class="tabs"><div class="tabs-header compact combined left"></div> <div class="tabs-content"></div></div>`,1);function ie(t){let n=[{code:200,body:`
              [
                {
                  "status": 200,
                  "body": {
                    "collectionId": "a98f514eb05f454",
                    "collectionName": "demo",
                    "id": "ae40239d2bc4477",
                    "updated": "2022-06-25 11:03:50.052",
                    "created": "2022-06-25 11:03:35.163",
                    "title": "test1",
                    "document": "file_a98f51.txt"
                  }
                },
                {
                  "status": 200,
                  "body": {
                    "collectionId": "a98f514eb05f454",
                    "collectionName": "demo",
                    "id": "31y1gc447bc9602",
                    "updated": "2022-06-25 11:03:50.052",
                    "created": "2022-06-25 11:03:35.163",
                    "title": "test2",
                    "document": "file_f514eb0.txt"
                  }
                },
              ]
            `},{code:400,body:`
                {
                  "status": 400,
                  "message": "Batch transaction failed.",
                  "data": {
                    "requests": {
                      "1": {
                        "code": "batch_request_failed",
                        "message": "Batch request failed.",
                        "response": {
                          "status": 400,
                          "message": "Failed to create record.",
                          "data": {
                            "title": {
                              "code": "validation_min_text_constraint",
                              "message": "Must be at least 3 character(s).",
                              "params": { "min": 3 }
                            }
                          }
                        }
                      }
                    }
                  }
                }
            `},{code:403,body:`
                {
                  "status": 403,
                  "message": "Batch requests are not allowed.",
                  "data": {}
                }
            `}],r=u(n[0].code);E(t,{single:!0,title:`Batch create/update/upsert/delete records`,children:(t,s)=>{var l=re(),u=h(_(l),4);O(u,{js:`
            import PocketBase from 'pocketbase';

            const pb = new PocketBase('http://127.0.0.1:8090');

            ...

            const batch = pb.createBatch();

            batch.collection('example1').create({ ... });
            batch.collection('example2').update('RECORD_ID', { ... });
            batch.collection('example3').delete('RECORD_ID');
            batch.collection('example4').upsert({ ... });

            const result = await batch.send();
        `,dart:`
            import 'package:pocketbase/pocketbase.dart';

            final pb = PocketBase('http://127.0.0.1:8090');

            ...

            final batch = pb.createBatch();

            batch.collection('example1').create(body: { ... });
            batch.collection('example2').update('RECORD_ID', body: { ... });
            batch.collection('example3').delete('RECORD_ID');
            batch.collection('example4').upsert(body: { ... });

            final result = await batch.send();
        `});var p=h(u,10),m=h(x(p)),g=x(m),v=h(x(g)),w=x(v);w.textContent=`Array<Request>`;var T=h(w,4),E=x(T),k=h(x(E));k.textContent=`POST /api/collections/{collection}/records`,f(E);var A=h(E,2),j=h(x(A));j.textContent=`PATCH /api/collections/{collection}/records/{id}`,f(A);var M=h(A,2),N=h(x(M));N.textContent=`PUT /api/collections/{collection}/records`,S(4),f(M);var P=h(M,2),F=h(x(P));F.textContent=`DELETE /api/collections/{collection}/records/{id}`,f(P),f(T);var I=h(T,6),L=h(x(I),16);D(L,{language:`javascript`,content:`
                                const formData = new FormData();

                                formData.append("@jsonPayload", JSON.stringify({
                                    requests: [
                                        {
                                            method: "POST",
                                            url: "/api/collections/example/records?expand=user",
                                            body: { title: "test1" },
                                        },
                                        {
                                            method: "PATCH",
                                            url: "/api/collections/example/records/RECORD_ID",
                                            body: { title: "test2" },
                                        },
                                        {
                                            method: "DELETE",
                                            url: "/api/collections/example/records/RECORD_ID",
                                        },
                                    ]
                                }))

                                // file for the first request
                                formData.append("requests.0.document", new File(...))

                                // file for the second request
                                formData.append("requests.1.document", new File(...))
                            `}),f(I),f(v),f(g),f(m),f(p);var R=h(p,4),z=x(R);e(z,5,()=>n,e=>e.code,(e,t)=>{var n=Q();let s;var l=y(n,!0);c(()=>{s=d(n,1,`tab-item`,null,s,{active:o(r)===o(t).code}),i(l,o(t).code)}),C(`click`,n,()=>b(r,o(t).code)),a(e,n)}),f(z);var B=h(z,2);e(B,5,()=>n,e=>e.code,(e,t)=>{var n=ne();let i;var s=x(n);D(s,{get content(){return o(t).body}}),f(n),c(()=>i=d(n,1,`tab-item`,null,i,{active:o(r)===o(t).code})),a(e,n)}),f(B),f(R),a(t,l)},$$slots:{default:!0}})}var ae=n(`<button> </button>`),oe=n(`<div><!></div>`),se=n(`<div class="content m-b-sm"><p>Returns a public list with the allowed collection authentication methods.</p></div> <!> <h6 class="m-b-xs">API details</h6> <div class="api-route alert alert-info"><strong class="label label-primary">GET</strong> <div class="content">/api/collections/<code>collectionIdOrName</code>/auth-methods</div></div> <div class="section-title">Path parameters</div> <table class="table-compact table-border m-b-base"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><tr><td>collectionIdOrName</td><td><span class="label">String</span></td><td>ID or name of the auth collection.</td></tr></tbody></table> <div class="section-title">Query parameters</div> <table class="table-compact table-border m-b-base"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><!></tbody></table> <div class="section-title">Responses</div> <div class="tabs"><div class="tabs-header compact combined left"></div> <div class="tabs-content"></div></div>`,1);function ce(t){let n=[{code:200,body:`
                {
                  "password": {
                    "enabled": true,
                    "identityFields": ["email"]
                  },
                  "oauth2": {
                    "enabled": true,
                    "providers": [
                      {
                        "name": "github",
                        "displayName": "GitHub",
                        "state": "nT7SLxzXKAVMeRQJtxSYj9kvnJAvGk",
                        "authURL": "https://github.com/login/oauth/authorize?client_id=test&code_challenge=fcf8WAhNI6uCLJYgJubLyWXHvfs8xghoLe3zksBvxjE&code_challenge_method=S256&response_type=code&scope=read%3Auser+user%3Aemail&state=nT7SLxzXKAVMeRQJtxSYj9kvnJAvGk&redirect_uri=",
                        "codeVerifier": "PwBG5OKR2IyQ7siLrrcgWHFwLLLAeUrz7PS1nY4AneG",
                        "codeChallenge": "fcf8WAhNI6uCLJYgJubLyWXHvfs8xghoLe3zksBvxjE",
                        "codeChallengeMethod": "S256"
                      }
                    ]
                  },
                  "mfa": {
                    "enabled": false,
                    "duration": 0
                  },
                  "otp": {
                    "enabled": false,
                    "duration": 0
                  }
                }
            `}],r=u(n[0].code);E(t,{single:!0,title:`List auth methods`,children:(t,s)=>{var l=se(),u=h(_(l),2);O(u,{js:`
            import PocketBase from 'pocketbase';

            const pb = new PocketBase('http://127.0.0.1:8090');

            ...

            const result = await pb.collection('users').listAuthMethods();
        `,dart:`
            import 'package:pocketbase/pocketbase.dart';

            final pb = PocketBase('http://127.0.0.1:8090');

            ...

            final result = await pb.collection('users').listAuthMethods();
        `});var p=h(u,12),m=h(x(p)),g=x(m);k(g,{}),f(m),f(p);var v=h(p,4),S=x(v);e(S,5,()=>n,e=>e.code,(e,t)=>{var n=ae();let s;var l=y(n,!0);c(()=>{s=d(n,1,`tab-item`,null,s,{active:o(r)===o(t).code}),i(l,o(t).code)}),C(`click`,n,()=>b(r,o(t).code)),a(e,n)}),f(S);var w=h(S,2);e(w,5,()=>n,e=>e.code,(e,t)=>{var n=oe();let i;var s=x(n);D(s,{get content(){return o(t).body}}),f(n),c(()=>i=d(n,1,`tab-item`,null,i,{active:o(r)===o(t).code})),a(e,n)}),f(w),f(v),a(t,l)},$$slots:{default:!0}})}var le=n(`<button> </button>`),ue=n(`<div><!></div>`),de=n(`<div class="content m-b-sm"><p>Authenticate a single auth record by combination of a password and a unique identity field (e.g.
            email).</p></div> <!> <h6 class="m-b-xs">API details</h6> <div class="api-route alert alert-success"><strong class="label label-primary">POST</strong> <div class="content">/api/collections/<code>collectionIdOrName</code>/auth-with-password</div></div> <div class="section-title">Path parameters</div> <table class="table-compact table-border m-b-base"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><tr><td>collectionIdOrName</td><td><span class="label">String</span></td><td>ID or name of the auth collection.</td></tr></tbody></table> <div class="section-title">Body Parameters</div> <table class="table-compact table-border"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><tr><td><div class="inline-flex"><span class="label label-success">Required</span> <span class="txt">identity</span></div></td><td><span class="label">String</span></td><td>Auth record username or email address.</td></tr><tr><td><div class="inline-flex"><span class="label label-success">Required</span> <span class="txt">password</span></div></td><td><span class="label">String</span></td><td>Auth record password.</td></tr><tr><td><div class="inline-flex"><span class="label label-warning">Optional</span> <span class="txt">identityField</span></div></td><td><span class="label">String</span></td><td>A specific identity field to use (by default fallbacks to the first matching one).</td></tr></tbody></table> <small class="block txt-hint m-t-10 m-b-base">Body parameters could be sent as <em>JSON</em> or <em>multipart/form-data</em>.</small> <div class="section-title">Query parameters</div> <table class="table-compact table-border m-b-base"><thead><tr><th>Param</th><th>Type</th><th width="60%">Description</th></tr></thead><tbody><!><!></tbody></table> <div class="section-title">Responses</div> <div class="tabs"><div class="tabs-header compact combined left"></div> <div class="tabs-content"></div></div>`,1);function fe(t){let n=[{code:200,body:`
                {
                  "token": "eyJhbGciOiJIUzI1NiJ9.eyJpZCI6IjRxMXhsY2xtZmxva3UzMyIsInR5cGUiOiJhdXRoUmVjb3JkIiwiY29sbGVjdGlvbklkIjoiX3BiX3VzZXJzX2F1dGhfIiwiZXhwIjoyMjA4OTg1MjYxfQ.UwD8JvkbQtXpymT09d7J6fdA0aP9g4FJ1GPh_ggEkzc",
                  "record": {
                    "id": "8171022dc95a4ed",
                    "collectionId": "d2972397d45614e",
                    "collectionName": "users",
                    "created": "2022-06-24 06:24:18.434Z",
                    "updated": "2022-06-24 06:24:18.889Z",
                    "username": "test@example.com",
                    "email": "test@example.com",
                    "verified": false,
                    "emailVisibility": true,
                    "someCustomField": "example 123"
                  }
                }
            `},{code:400,body:`
                {
                  "status": 400,
                  "message": "An error occurred while submitting the form.",
                  "data": {
                    "password": {
                      "code": "validation_required",
                      "message": "Missing required value."
                    }
                  }
                }
            `}],r=u(n[0].code);E(t,{single:!0,title:`Auth with password`,children:(t,s)=>{var l=de(),u=h(_(l),2);O(u,{js:`
            import PocketBase from 'pocketbase';

            const pb = new PocketBase('http://127.0.0.1:8090');

            ...

            const authData = await pb.collection('users').authWithPassword(
                'YOUR_USERNAME_OR_EMAIL',
                'YOUR_PASSWORD',
            );

            // after the above you can also access the auth data from the authStore
            console.log(pb.authStore.isValid);
            console.log(pb.authStore.token);
            console.log(pb.authStore.record.id);

            // "logout" the last authenticated record
            pb.authStore.clear();
        `,dart:`
            import 'package:pocketbase/pocketbase.dart';

            final pb = PocketBase('http://127.0.0.1:8090');

            ...

            final authData = await pb.collection('users').authWithPassword(
              'YOUR_USERNAME_OR_EMAIL',
              'YOUR_PASSWORD',
            );

            // after the above you can also access the auth data from the authStore
            print(pb.authStore.isValid);
            print(pb.authStore.token);
            print(pb.authStore.record.id);

            // "logout" the last authenticated record
            pb.authStore.clear();
        `});var p=h(u,18),m=h(x(p)),g=x(m);N(g,{});var v=h(g);k(v,{prefix:`record.`}),f(m),f(p);var S=h(p,4),w=x(S);e(w,5,()=>n,e=>e.code,(e,t)=>{var n=le();let s;var l=y(n,!0);c(()=>{s=d(n,1,`tab-item`,null,s,{active:o(r)===o(t).code}),i(l,o(t).code)}),C(`click`,n,()=>b(r,o(t).code)),a(e,n)}),f(w);var T=h(w,2);e(T,5,()=>n,e=>e.code,(e,t)=>{var n=ue();let i;var s=x(n);D(s,{get content(){return o(t).body}}),f(n),c(()=>i=d(n,1,`tab-item`,null,i,{active:o(r)===o(t).code})),a(e,n)}),f(T),f(S),a(t,l)},$$slots:{default:!0}})}var pe=n(`<button> </button>`),me=n(`<div><!></div>`),he=n(`<div class="content m-b-sm"><p>Authenticate with an OAuth2 provider and returns a new auth token and record data.</p> <p>This action usually should be called right after the provider login page redirect.</p> <p>You could also check the <a href="/docs/authentication#web-oauth2-integration">OAuth2 web integration example</a>.</p></div> <!> <h6 class="m-b-xs">API details</h6> <div class="api-route alert alert-success"><strong class="label label-primary">POST</strong> <div class="content">/api/collections/<code>collectionIdOrName</code>/auth-with-oauth2</div></div> <div class="section-title">Path parameters</div> <table class="table-compact table-border m-b-base"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><tr><td>collectionIdOrName</td><td><span class="label">String</span></td><td>ID or name of the auth collection.</td></tr></tbody></table> <div class="section-title">Body Parameters</div> <table class="table-compact table-border"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><tr><td><div class="inline-flex"><span class="label label-success">Required</span> <span class="txt">provider</span></div></td><td><span class="label">String</span></td><td>The name of the OAuth2 client provider (e.g. "google").</td></tr><tr><td><div class="inline-flex"><span class="label label-success">Required</span> <span class="txt">code</span></div></td><td><span class="label">String</span></td><td>The authorization code returned from the initial request.</td></tr><tr><td><div class="inline-flex"><span class="label label-success">Required</span> <span class="txt">codeVerifier</span></div></td><td><span class="label">String</span></td><td>The code verifier sent with the initial request as part of the code_challenge.</td></tr><tr><td><div class="inline-flex"><span class="label label-success">Required</span> <span class="txt">redirectUrl</span></div></td><td><span class="label">String</span></td><td>The redirect url sent with the initial request.</td></tr><tr><td valign="top"><div class="inline-flex"><span class="label label-warning">Optional</span> <span>createData</span></div></td><td valign="top"><span class="label">Object</span></td><td valign="top"><p>Optional data that will be used when creating the auth record on OAuth2 sign-up.</p> <p>The created auth record must comply with the same requirements and validations in the
                        regular <strong>create</strong> action. <br/> <em>The data can only be in <code>json</code>, aka. <code>multipart/form-data</code> and
                            files upload currently are not supported during OAuth2 sign-ups.</em></p></td></tr></tbody></table> <small class="block txt-hint m-t-10 m-b-base">Body parameters could be sent as <em>JSON</em> or <em>multipart/form-data</em>.</small> <div class="section-title">Query parameters</div> <table class="table-compact table-border m-b-base"><thead><tr><th>Param</th><th>Type</th><th width="60%">Description</th></tr></thead><tbody><!><!></tbody></table> <div class="section-title">Responses</div> <div class="tabs"><div class="tabs-header compact combined left"></div> <div class="tabs-content"></div></div>`,1);function ge(t){let n=[{code:200,body:`
                {
                  "token": "eyJhbGciOiJIUzI1NiJ9.eyJpZCI6IjRxMXhsY2xtZmxva3UzMyIsInR5cGUiOiJhdXRoUmVjb3JkIiwiY29sbGVjdGlvbklkIjoiX3BiX3VzZXJzX2F1dGhfIiwiZXhwIjoyMjA4OTg1MjYxfQ.UwD8JvkbQtXpymT09d7J6fdA0aP9g4FJ1GPh_ggEkzc",
                  "record": {
                    "id": "8171022dc95a4ed",
                    "collectionId": "d2972397d45614e",
                    "collectionName": "users",
                    "created": "2022-06-24 06:24:18.434Z",
                    "updated": "2022-06-24 06:24:18.889Z",
                    "username": "test@example.com",
                    "email": "test@example.com",
                    "verified": true,
                    "emailVisibility": false,
                    "someCustomField": "example 123"
                  },
                  "meta": {
                    "id": "abc123",
                    "name": "John Doe",
                    "username": "john.doe",
                    "email": "test@example.com",
                    "isNew": false,
                    "avatarURL": "https://example.com/avatar.png",
                    "rawUser": {...},
                    "accessToken": "...",
                    "refreshToken": "...",
                    "expiry": "..."
                  }
                }
            `},{code:400,body:`
                {
                  "status": 400,
                  "message": "An error occurred while submitting the form.",
                  "data": {
                    "provider": {
                      "code": "validation_required",
                      "message": "Missing required value."
                    }
                  }
                }
            `}],r=u(n[0].code);E(t,{single:!0,title:`Auth with OAuth2`,children:(t,s)=>{var l=he(),u=h(_(l),2);O(u,{js:`
            import PocketBase from 'pocketbase';

            const pb = new PocketBase('http://127.0.0.1:8090');

            ...

            const authData = await pb.collection('users').authWithOAuth2Code(
                'google',
                'CODE',
                'VERIFIER',
                'REDIRECT_URL',
                // optional data that will be used for the new account on OAuth2 sign-up
                {
                  'name': 'test',
                },
            );

            // after the above you can also access the auth data from the authStore
            console.log(pb.authStore.isValid);
            console.log(pb.authStore.token);
            console.log(pb.authStore.record.id);

            // "logout" the last authenticated record
            pb.authStore.clear();
        `,dart:`
            import 'package:pocketbase/pocketbase.dart';

            final pb = PocketBase('http://127.0.0.1:8090');

            ...

            final authData = await pb.collection('users').authWithOAuth2Code(
              'google',
              'CODE',
              'VERIFIER',
              'REDIRECT_URL',
              // optional data that will be used for the new account on OAuth2 sign-up
              createData: {
                'name': 'test',
              },
            );

            // after the above you can also access the auth data from the authStore
            print(pb.authStore.isValid);
            print(pb.authStore.token);
            print(pb.authStore.record.id);

            // "logout" the last authenticated record
            pb.authStore.clear();
        `});var p=h(u,18),m=h(x(p)),g=x(m);N(g,{});var v=h(g);k(v,{prefix:`record.`}),f(m),f(p);var S=h(p,4),w=x(S);e(w,5,()=>n,e=>e.code,(e,t)=>{var n=pe();let s;var l=y(n,!0);c(()=>{s=d(n,1,`tab-item`,null,s,{active:o(r)===o(t).code}),i(l,o(t).code)}),C(`click`,n,()=>b(r,o(t).code)),a(e,n)}),f(w);var T=h(w,2);e(T,5,()=>n,e=>e.code,(e,t)=>{var n=me();let i;var s=x(n);D(s,{get content(){return o(t).body}}),f(n),c(()=>i=d(n,1,`tab-item`,null,i,{active:o(r)===o(t).code})),a(e,n)}),f(T),f(S),a(t,l)},$$slots:{default:!0}})}var _e=n(`<button> </button>`),ve=n(`<div><!></div>`),ye=n(`<div class="api-route alert alert-success"><strong class="label label-primary">POST</strong> <div class="content">/api/collections/<code>collectionIdOrName</code>/request-otp</div></div> <div class="section-title">Path parameters</div> <table class="table-compact table-border m-b-base"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><tr><td>collectionIdOrName</td><td><span class="label">String</span></td><td>ID or name of the auth collection.</td></tr></tbody></table> <div class="section-title">Body Parameters</div> <table class="table-compact table-border m-b-base"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><tr><td><div class="inline-flex"><span class="label label-success">Required</span> <span>email</span></div></td><td><span class="label">String</span></td><td>The auth record email address to send the OTP request (if exists).</td></tr></tbody></table> <div class="section-title">Responses</div> <div class="tabs"><div class="tabs-header compact combined left"></div> <div class="tabs-content"></div></div>`,1);function be(t,n){p(n,!1);let g=u(200),S=u([]);r(()=>w,()=>{b(S,[{code:200,body:JSON.stringify({otpId:w.randomString(15)},null,2)},{code:400,body:`
                {
                  "status": 400,
                  "message": "An error occurred while validating the submitted data.",
                  "data": {
                    "email": {
                      "code": "validation_is_email",
                      "message": "Must be a valid email address."
                    }
                  }
                }
            `},{code:429,body:`
                {
                  "status": 429,
                  "message": "You've send too many OTP requests, please try again later.",
                  "data": {}
                }
            `}])}),l(),v();var T=ye(),E=h(_(T),12),O=x(E);e(O,5,()=>o(S),e=>e.code,(e,t)=>{var n=_e();let r;var l=y(n,!0);c(()=>{r=d(n,1,`tab-item`,null,r,{active:o(g)===o(t).code}),i(l,(o(t),s(()=>o(t).code)))}),C(`click`,n,()=>b(g,o(t).code)),a(e,n)}),f(O);var k=h(O,2);e(k,5,()=>o(S),e=>e.code,(e,t)=>{var n=ve();let r;var i=x(n);D(i,{get content(){return o(t),s(()=>o(t).body)}}),f(n),c(()=>r=d(n,1,`tab-item`,null,r,{active:o(g)===o(t).code})),a(e,n)}),f(k),f(E),a(t,T),m()}var xe=n(`<button> </button>`),Se=n(`<div><!></div>`),Ce=n(`<div class="api-route alert alert-success"><strong class="label label-primary">POST</strong> <div class="content">/api/collections/<code>collectionIdOrName</code>/auth-with-otp</div></div> <div class="section-title">Path parameters</div> <table class="table-compact table-border m-b-base"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><tr><td>collectionIdOrName</td><td><span class="label">String</span></td><td>ID or name of the auth collection.</td></tr></tbody></table> <div class="section-title">Body Parameters</div> <table class="table-compact table-border m-b-base"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><tr><td><div class="inline-flex"><span class="label label-success">Required</span> <span>otpId</span></div></td><td><span class="label">String</span></td><td>The id of the OTP request.</td></tr><tr><td><div class="inline-flex"><span class="label label-success">Required</span> <span>password</span></div></td><td><span class="label">String</span></td><td>The one-time password.</td></tr></tbody></table> <div class="section-title">Query parameters</div> <table class="table-compact table-border m-b-base"><thead><tr><th>Param</th><th>Type</th><th width="60%">Description</th></tr></thead><tbody><!><!></tbody></table> <div class="section-title">Responses</div> <div class="tabs"><div class="tabs-header compact combined left"></div> <div class="tabs-content"></div></div>`,1);function we(t,n){p(n,!1);let g=u(200),v=u([]);r(()=>{},()=>{b(v,[{code:200,body:`
                {
                  "token": "eyJhbGciOiJIUzI1NiJ9.eyJpZCI6IjRxMXhsY2xtZmxva3UzMyIsInR5cGUiOiJhdXRoUmVjb3JkIiwiY29sbGVjdGlvbklkIjoiX3BiX3VzZXJzX2F1dGhfIiwiZXhwIjoyMjA4OTg1MjYxfQ.UwD8JvkbQtXpymT09d7J6fdA0aP9g4FJ1GPh_ggEkzc",
                  "record": {
                    "id": "8171022dc95a4ed",
                    "collectionId": "d2972397d45614e",
                    "collectionName": "users",
                    "created": "2022-06-24 06:24:18.434Z",
                    "updated": "2022-06-24 06:24:18.889Z",
                    "username": "test@example.com",
                    "email": "test@example.com",
                    "verified": false,
                    "emailVisibility": true,
                    "someCustomField": "example 123"
                  }
                }
            `},{code:400,body:`
                {
                  "status": 400,
                  "message": "Failed to authenticate.",
                  "data": {
                    "otpId": {
                      "code": "validation_required",
                      "message": "Missing required value."
                    }
                  }
                }
            `}])}),l();var S=Ce(),w=h(_(S),12),T=h(x(w)),E=x(T);N(E,{});var O=h(E);k(O,{prefix:`record.`}),f(T),f(w);var A=h(w,4),j=x(A);e(j,5,()=>o(v),e=>e.code,(e,t)=>{var n=xe();let r;var l=y(n,!0);c(()=>{r=d(n,1,`tab-item`,null,r,{active:o(g)===o(t).code}),i(l,(o(t),s(()=>o(t).code)))}),C(`click`,n,()=>b(g,o(t).code)),a(e,n)}),f(j);var M=h(j,2);e(M,5,()=>o(v),e=>e.code,(e,t)=>{var n=Se();let r;var i=x(n);D(i,{get content(){return o(t),s(()=>o(t).body)}}),f(n),c(()=>r=d(n,1,`tab-item`,null,r,{active:o(g)===o(t).code})),a(e,n)}),f(M),f(A),a(t,S),m()}var Te=n(`<button><div class="txt"> </div></button>`),Ee=n(`<div><!></div>`),De=n(`<div class="content m-b-sm"><p>Authenticate a single auth record with one-time/short-lived password (OTP).</p> <p>On successful authentication the user will be also marked as verified (if the OTP source is email and the user is not verified already).</p> <p>Note that when requesting an OTP we return an <code>otpId</code> even if a user with the provided email
            doesn't exist as a very basic enumeration protection.</p></div> <!> <h6 class="m-b-xs">API details</h6> <div class="tabs"><div class="tabs-header compact"></div> <div class="tabs-content"></div></div>`,1);function Oe(n){let r=[{title:`OTP Request`,component:be},{title:`OTP Auth`,component:we}],s=u(0);E(n,{single:!0,title:`Auth with OTP`,children:(n,l)=>{var u=De(),p=h(_(u),2);O(p,{js:`
            import PocketBase from 'pocketbase';

            const pb = new PocketBase('http://127.0.0.1:8090');

            ...

            // send OTP email to the provided auth record
            const req = await pb.collection('users').requestOTP('test@example.com');

            // ... show a screen/popup to enter the password from the email ...

            // authenticate with the requested OTP id and the email password
            const authData = await pb.collection('users').authWithOTP(req.otpId, "YOUR_OTP");

            // after the above you can also access the auth data from the authStore
            console.log(pb.authStore.isValid);
            console.log(pb.authStore.token);
            console.log(pb.authStore.record.id);

            // "logout"
            pb.authStore.clear();
        `,dart:`
            import 'package:pocketbase/pocketbase.dart';

            final pb = PocketBase('http://127.0.0.1:8090');

            ...

            // send OTP email to the provided auth record
            final req = await pb.collection('users').requestOTP('test@example.com');

            // ... show a screen/popup to enter the password from the email ...

            // authenticate with the requested OTP id and the email password
            final authData = await pb.collection('users').authWithOTP(req.otpId, "YOUR_OTP");

            // after the above you can also access the auth data from the authStore
            print(pb.authStore.isValid);
            print(pb.authStore.token);
            print(pb.authStore.record.id);

            // "logout"
            pb.authStore.clear();
        `});var m=h(p,4),v=x(m);e(v,5,()=>r,g,(e,t,n)=>{var r=Te();let l;var u=x(r),p=y(u,!0);f(r),c(()=>{l=d(r,1,`tab-item`,null,l,{active:o(s)==n}),i(p,o(t).title)}),C(`click`,r,()=>b(s,n)),a(e,r)}),f(v);var S=h(v,2);e(S,5,()=>r,g,(e,n,r)=>{var i=Ee();let l;var u=x(i);t(u,()=>o(n).component,(e,t)=>{t(e,{})}),f(i),c(()=>l=d(i,1,`tab-item`,null,l,{active:o(s)==r})),a(e,i)}),f(S),f(m),a(n,u)},$$slots:{default:!0}})}var ke=n(`<button> </button>`),Ae=n(`<div><!></div>`),je=n(`<div class="content m-b-sm"><p>Returns a new auth response (token and user data) for already authenticated auth record.</p> <p><em>This method is usually called by users on page/screen reload to ensure that the previously
                stored data in <code>pb.authStore</code> is still valid and up-to-date.</em></p></div> <!> <h6 class="m-b-xs">API details</h6> <div class="api-route alert alert-success"><strong class="label label-primary">POST</strong> <div class="content">/api/collections/<code>collectionIdOrName</code>/auth-refresh</div> <small class="txt-hint auth-header">Requires <code>Authorization:TOKEN</code></small></div> <div class="section-title">Path parameters</div> <table class="table-compact table-border m-b-base"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><tr><td>collectionIdOrName</td><td><span class="label">String</span></td><td>ID or name of the auth collection.</td></tr></tbody></table> <div class="section-title">Query parameters</div> <table class="table-compact table-border m-b-base"><thead><tr><th>Param</th><th>Type</th><th width="60%">Description</th></tr></thead><tbody><!><!></tbody></table> <div class="section-title">Responses</div> <div class="tabs"><div class="tabs-header compact combined left"></div> <div class="tabs-content"></div></div>`,1);function Me(t){let n=[{code:200,body:`
                {
                  "token": "eyJhbGciOiJIUzI1NiJ9.eyJpZCI6IjRxMXhsY2xtZmxva3UzMyIsInR5cGUiOiJhdXRoUmVjb3JkIiwiY29sbGVjdGlvbklkIjoiX3BiX3VzZXJzX2F1dGhfIiwiZXhwIjoyMjA4OTg1MjYxfQ.UwD8JvkbQtXpymT09d7J6fdA0aP9g4FJ1GPh_ggEkzc",
                  "record": {
                    "id": "8171022dc95a4ed",
                    "collectionId": "d2972397d45614e",
                    "collectionName": "users",
                    "created": "2022-06-24 06:24:18.434Z",
                    "updated": "2022-06-24 06:24:18.889Z",
                    "username": "test@example.com",
                    "email": "test@example.com",
                    "verified": false,
                    "emailVisibility": true,
                    "someCustomField": "example 123"
                  }
                }
            `},{code:401,body:`
                {
                  "status": 401,
                  "message": "The request requires valid record authorization token to be set.",
                  "data": {}
                }
            `},{code:403,body:`
                {
                  "status": 403,
                  "message": "The authorized record model is not allowed to perform this action.",
                  "data": {}
                }
            `},{code:404,body:`
                {
                  "status": 404,
                  "message": "Missing auth record context.",
                  "data": {}
                }
            `}],r=u(n[0].code);E(t,{single:!0,title:`Auth refresh`,children:(t,s)=>{var l=je(),u=h(_(l),2);O(u,{js:`
            import PocketBase from 'pocketbase';

            const pb = new PocketBase('http://127.0.0.1:8090');

            ...

            const authData = await pb.collection('users').authRefresh();

            // after the above you can also access the refreshed auth data from the authStore
            console.log(pb.authStore.isValid);
            console.log(pb.authStore.token);
            console.log(pb.authStore.record.id);
        `,dart:`
            import 'package:pocketbase/pocketbase.dart';

            final pb = PocketBase('http://127.0.0.1:8090');

            ...

            final authData = await pb.collection('users').authRefresh();

            // after the above you can also access the refreshed auth data from the authStore
            print(pb.authStore.isValid);
            print(pb.authStore.token);
            print(pb.authStore.record.id);
        `});var p=h(u,12),m=h(x(p)),g=x(m);N(g,{});var v=h(g);k(v,{prefix:`record.`}),f(m),f(p);var S=h(p,4),w=x(S);e(w,5,()=>n,e=>e.code,(e,t)=>{var n=ke();let s;var l=y(n,!0);c(()=>{s=d(n,1,`tab-item`,null,s,{active:o(r)===o(t).code}),i(l,o(t).code)}),C(`click`,n,()=>b(r,o(t).code)),a(e,n)}),f(w);var T=h(w,2);e(T,5,()=>n,e=>e.code,(e,t)=>{var n=Ae();let i;var s=x(n);D(s,{get content(){return o(t).body}}),f(n),c(()=>i=d(n,1,`tab-item`,null,i,{active:o(r)===o(t).code})),a(e,n)}),f(T),f(S),a(t,l)},$$slots:{default:!0}})}var Ne=n(`<button> </button>`),Pe=n(`<div><!></div>`),Fe=n(`<div class="api-route alert alert-success"><strong class="label label-primary">POST</strong> <div class="content">/api/collections/<code>collectionIdOrName</code>/request-verification</div></div> <div class="section-title">Body Parameters</div> <table class="table-compact table-border m-b-base"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><tr><td><div class="inline-flex"><span class="label label-success">Required</span> <span>email</span></div></td><td><span class="label">String</span></td><td>The auth record email address to send the verification request (if exists).</td></tr></tbody></table> <div class="section-title">Responses</div> <div class="tabs"><div class="tabs-header compact combined left"></div> <div class="tabs-content"></div></div>`,1);function Ie(t,n){p(n,!1);let g=u(204),v=u([]);r(()=>{},()=>{b(v,[{code:204,body:`null`},{code:400,body:`
                {
                  "status": 400,
                  "message": "An error occurred while validating the submitted data.",
                  "data": {
                    "email": {
                      "code": "validation_required",
                      "message": "Missing required value."
                    }
                  }
                }
            `}])}),l();var S=Fe(),w=h(_(S),8),T=x(w);e(T,5,()=>o(v),e=>e.code,(e,t)=>{var n=Ne();let r;var l=y(n,!0);c(()=>{r=d(n,1,`tab-item`,null,r,{active:o(g)===o(t).code}),i(l,(o(t),s(()=>o(t).code)))}),C(`click`,n,()=>b(g,o(t).code)),a(e,n)}),f(T);var E=h(T,2);e(E,5,()=>o(v),e=>e.code,(e,t)=>{var n=Pe();let r;var i=x(n);D(i,{get content(){return o(t),s(()=>o(t).body)}}),f(n),c(()=>r=d(n,1,`tab-item`,null,r,{active:o(g)===o(t).code})),a(e,n)}),f(E),f(w),a(t,S),m()}var Le=n(`<button> </button>`),Re=n(`<div><!></div>`),ze=n(`<div class="api-route alert alert-success"><strong class="label label-primary">POST</strong> <div class="content">/api/collections/<code>collectionIdOrName</code>/confirm-verification</div></div> <div class="section-title">Body Parameters</div> <table class="table-compact table-border m-b-base"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><tr><td><div class="inline-flex"><span class="label label-success">Required</span> <span>token</span></div></td><td><span class="label">String</span></td><td>The token from the verification request email.</td></tr></tbody></table> <div class="section-title">Responses</div> <div class="tabs"><div class="tabs-header compact combined left"></div> <div class="tabs-content"></div></div>`,1);function Be(t,n){p(n,!1);let g=u(204),v=u([]);r(()=>{},()=>{b(v,[{code:204,body:`null`},{code:400,body:`
                {
                  "status": 400,
                  "message": "An error occurred while validating the submitted data.",
                  "data": {
                    "token": {
                      "code": "validation_required",
                      "message": "Missing required value."
                    }
                  }
                }
            `}])}),l();var S=ze(),w=h(_(S),8),T=x(w);e(T,5,()=>o(v),e=>e.code,(e,t)=>{var n=Le();let r;var l=y(n,!0);c(()=>{r=d(n,1,`tab-item`,null,r,{active:o(g)===o(t).code}),i(l,(o(t),s(()=>o(t).code)))}),C(`click`,n,()=>b(g,o(t).code)),a(e,n)}),f(T);var E=h(T,2);e(E,5,()=>o(v),e=>e.code,(e,t)=>{var n=Re();let r;var i=x(n);D(i,{get content(){return o(t),s(()=>o(t).body)}}),f(n),c(()=>r=d(n,1,`tab-item`,null,r,{active:o(g)===o(t).code})),a(e,n)}),f(E),f(w),a(t,S),m()}var Ve=n(`<button><div class="txt"> </div></button>`),He=n(`<div><!></div>`),Ue=n(`<div class="content m-b-sm"><p>Sends auth record email verification request.</p></div> <!> <h6 class="m-b-xs">API details</h6> <div class="tabs"><div class="tabs-header compact"></div> <div class="tabs-content"></div></div>`,1);function We(n){let r=[{title:`Request verification`,component:Ie},{title:`Confirm verification`,component:Be}],s=u(0);E(n,{single:!0,title:`Verification`,children:(n,l)=>{var u=Ue(),p=h(_(u),2);O(p,{js:`
            import PocketBase from 'pocketbase';

            const pb = new PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection('users').requestVerification('test@example.com');

            // ---
            // (optional) in your custom confirmation page:
            // ---

            await pb.collection('users').confirmVerification('VERIFICATION_TOKEN');
        `,dart:`
            import 'package:pocketbase/pocketbase.dart';

            final pb = PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection('users').requestVerification('test@example.com');

            // ---
            // (optional) in your custom confirmation page:
            // ---

            await pb.collection('users').confirmVerification('VERIFICATION_TOKEN');
        `});var m=h(p,4),v=x(m);e(v,5,()=>r,g,(e,t,n)=>{var r=Ve();let l;var u=x(r),p=y(u,!0);f(r),c(()=>{l=d(r,1,`tab-item`,null,l,{active:o(s)==n}),i(p,o(t).title)}),C(`click`,r,()=>b(s,n)),a(e,r)}),f(v);var S=h(v,2);e(S,5,()=>r,g,(e,n,r)=>{var i=He();let l;var u=x(i);t(u,()=>o(n).component,(e,t)=>{t(e,{})}),f(i),c(()=>l=d(i,1,`tab-item`,null,l,{active:o(s)==r})),a(e,i)}),f(S),f(m),a(n,u)},$$slots:{default:!0}})}var Ge=n(`<button> </button>`),Ke=n(`<div><!></div>`),qe=n(`<div class="api-route alert alert-success"><strong class="label label-primary">POST</strong> <div class="content">/api/collections/<code>collectionIdOrName</code>/request-password-reset</div></div> <div class="section-title">Body Parameters</div> <table class="table-compact table-border m-b-base"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><tr><td><div class="inline-flex"><span class="label label-success">Required</span> <span>email</span></div></td><td><span class="label">String</span></td><td>The auth record email address to send the password reset request (if exists).</td></tr></tbody></table> <div class="section-title">Responses</div> <div class="tabs"><div class="tabs-header compact combined left"></div> <div class="tabs-content"></div></div>`,1);function Je(t,n){p(n,!1);let g=u(204),v=u([]);r(()=>{},()=>{b(v,[{code:204,body:`null`},{code:400,body:`
                {
                  "status": 400,
                  "message": "An error occurred while validating the submitted data.",
                  "data": {
                    "email": {
                      "code": "validation_required",
                      "message": "Missing required value."
                    }
                  }
                }
            `}])}),l();var S=qe(),w=h(_(S),8),T=x(w);e(T,5,()=>o(v),e=>e.code,(e,t)=>{var n=Ge();let r;var l=y(n,!0);c(()=>{r=d(n,1,`tab-item`,null,r,{active:o(g)===o(t).code}),i(l,(o(t),s(()=>o(t).code)))}),C(`click`,n,()=>b(g,o(t).code)),a(e,n)}),f(T);var E=h(T,2);e(E,5,()=>o(v),e=>e.code,(e,t)=>{var n=Ke();let r;var i=x(n);D(i,{get content(){return o(t),s(()=>o(t).body)}}),f(n),c(()=>r=d(n,1,`tab-item`,null,r,{active:o(g)===o(t).code})),a(e,n)}),f(E),f(w),a(t,S),m()}var Ye=n(`<button> </button>`),Xe=n(`<div><!></div>`),Ze=n(`<div class="api-route alert alert-success"><strong class="label label-primary">POST</strong> <div class="content">/api/collections/<code>collectionIdOrName</code>/confirm-password-reset</div></div> <div class="section-title">Body Parameters</div> <table class="table-compact table-border m-b-base"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><tr><td><div class="inline-flex"><span class="label label-success">Required</span> <span>token</span></div></td><td><span class="label">String</span></td><td>The token from the password reset request email.</td></tr><tr><td><div class="inline-flex"><span class="label label-success">Required</span> <span>password</span></div></td><td><span class="label">String</span></td><td>The new password to set.</td></tr><tr><td><div class="inline-flex"><span class="label label-success">Required</span> <span>passwordConfirm</span></div></td><td><span class="label">String</span></td><td>The new password confirmation.</td></tr></tbody></table> <div class="section-title">Responses</div> <div class="tabs"><div class="tabs-header compact combined left"></div> <div class="tabs-content"></div></div>`,1);function Qe(t,n){p(n,!1);let g=u(204),v=u([]);r(()=>{},()=>{b(v,[{code:204,body:`null`},{code:400,body:`
                {
                  "status": 400,
                  "message": "An error occurred while validating the submitted data.",
                  "data": {
                    "token": {
                      "code": "validation_required",
                      "message": "Missing required value."
                    }
                  }
                }
            `}])}),l();var S=Ze(),w=h(_(S),8),T=x(w);e(T,5,()=>o(v),e=>e.code,(e,t)=>{var n=Ye();let r;var l=y(n,!0);c(()=>{r=d(n,1,`tab-item`,null,r,{active:o(g)===o(t).code}),i(l,(o(t),s(()=>o(t).code)))}),C(`click`,n,()=>b(g,o(t).code)),a(e,n)}),f(T);var E=h(T,2);e(E,5,()=>o(v),e=>e.code,(e,t)=>{var n=Xe();let r;var i=x(n);D(i,{get content(){return o(t),s(()=>o(t).body)}}),f(n),c(()=>r=d(n,1,`tab-item`,null,r,{active:o(g)===o(t).code})),a(e,n)}),f(E),f(w),a(t,S),m()}var $e=n(`<button><div class="txt"> </div></button>`),et=n(`<div><!></div>`),tt=n(`<div class="content m-b-sm"><p>Sends auth record password reset email request.</p> <p>On successful password reset all previously issued auth tokens for the specific record will be
            invalidated (and the user will be marked as verified if not already).</p></div> <!> <h6 class="m-b-xs">API details</h6> <div class="tabs"><div class="tabs-header compact"></div> <div class="tabs-content"></div></div>`,1);function nt(n){let r=[{title:`Request password reset`,component:Je},{title:`Confirm password reset`,component:Qe}],s=u(0);E(n,{single:!0,title:`Password reset`,children:(n,l)=>{var u=tt(),p=h(_(u),2);O(p,{js:`
            import PocketBase from 'pocketbase';

            const pb = new PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection('users').requestPasswordReset('test@example.com');

            // ---
            // (optional) in your custom confirmation page:
            // ---

            // note: all previous user auth tokens will be invalidated
            // (and the user will be marked as verified if not already)
            await pb.collection('users').confirmPasswordReset(
                'RESET_TOKEN',
                'NEW_PASSWORD',
                'NEW_PASSWORD_CONFIRM',
            );
        `,dart:`
            import 'package:pocketbase/pocketbase.dart';

            final pb = PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection('users').requestPasswordReset('test@example.com');

            // ---
            // (optional) in your custom confirmation page:
            // ---

            // note: all previous user auth tokens will be invalidated
            // (and the user will be marked as verified if not already)
            await pb.collection('users').confirmPasswordReset(
              'RESET_TOKEN',
              'NEW_PASSWORD',
              'NEW_PASSWORD_CONFIRM',
            );
        `});var m=h(p,4),v=x(m);e(v,5,()=>r,g,(e,t,n)=>{var r=$e();let l;var u=x(r),p=y(u,!0);f(r),c(()=>{l=d(r,1,`tab-item`,null,l,{active:o(s)==n}),i(p,o(t).title)}),C(`click`,r,()=>b(s,n)),a(e,r)}),f(v);var S=h(v,2);e(S,5,()=>r,g,(e,n,r)=>{var i=et();let l;var u=x(i);t(u,()=>o(n).component,(e,t)=>{t(e,{})}),f(i),c(()=>l=d(i,1,`tab-item`,null,l,{active:o(s)==r})),a(e,i)}),f(S),f(m),a(n,u)},$$slots:{default:!0}})}var rt=n(`<button> </button>`),it=n(`<div><!></div>`),at=n(`<div class="api-route alert alert-success"><strong class="label label-primary">POST</strong> <div class="content">/api/collections/<code>collectionIdOrName</code>/request-email-change</div> <p class="txt-hint txt-sm txt-right">Requires <code>Authorization:TOKEN</code></p></div> <div class="section-title">Body Parameters</div> <table class="table-compact table-border m-b-base"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><tr><td><div class="inline-flex"><span class="label label-success">Required</span> <span>newEmail</span></div></td><td><span class="label">String</span></td><td>The new email address to send the change email request.</td></tr></tbody></table> <div class="section-title">Responses</div> <div class="tabs"><div class="tabs-header compact combined left"></div> <div class="tabs-content"></div></div>`,1);function ot(t,n){p(n,!1);let g=u(204),v=u([]);r(()=>{},()=>{b(v,[{code:204,body:`null`},{code:400,body:`
                {
                  "status": 400,
                  "message": "An error occurred while validating the submitted data.",
                  "data": {
                    "newEmail": {
                      "code": "validation_required",
                      "message": "Missing required value."
                    }
                  }
                }
            `},{code:401,body:`
                {
                  "status": 401,
                  "message": "The request requires valid record authorization token to be set.",
                  "data": {}
                }
            `},{code:403,body:`
                {
                  "status": 403,
                  "message": "The authorized record model is not allowed to perform this action.",
                  "data": {}
                }
            `}])}),l();var S=at(),w=h(_(S),8),T=x(w);e(T,5,()=>o(v),e=>e.code,(e,t)=>{var n=rt();let r;var l=y(n,!0);c(()=>{r=d(n,1,`tab-item`,null,r,{active:o(g)===o(t).code}),i(l,(o(t),s(()=>o(t).code)))}),C(`click`,n,()=>b(g,o(t).code)),a(e,n)}),f(T);var E=h(T,2);e(E,5,()=>o(v),e=>e.code,(e,t)=>{var n=it();let r;var i=x(n);D(i,{get content(){return o(t),s(()=>o(t).body)}}),f(n),c(()=>r=d(n,1,`tab-item`,null,r,{active:o(g)===o(t).code})),a(e,n)}),f(E),f(w),a(t,S),m()}var st=n(`<button> </button>`),ct=n(`<div><!></div>`),lt=n(`<div class="api-route alert alert-success"><strong class="label label-primary">POST</strong> <div class="content">/api/collections/<code>collectionIdOrName</code>/confirm-email-change</div></div> <div class="section-title">Body Parameters</div> <table class="table-compact table-border m-b-base"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><tr><td><div class="inline-flex"><span class="label label-success">Required</span> <span>token</span></div></td><td><span class="label">String</span></td><td>The token from the change email request email.</td></tr><tr><td><div class="inline-flex"><span class="label label-success">Required</span> <span>password</span></div></td><td><span class="label">String</span></td><td>The account password to confirm the email change.</td></tr></tbody></table> <div class="section-title">Responses</div> <div class="tabs"><div class="tabs-header compact combined left"></div> <div class="tabs-content"></div></div>`,1);function ut(t,n){p(n,!1);let g=u(204),v=u([]);r(()=>{},()=>{b(v,[{code:204,body:`null`},{code:400,body:`
                {
                  "status": 400,
                  "message": "An error occurred while validating the submitted data.",
                  "data": {
                    "token": {
                      "code": "validation_required",
                      "message": "Missing required value."
                    }
                  }
                }
            `}])}),l();var S=lt(),w=h(_(S),8),T=x(w);e(T,5,()=>o(v),e=>e.code,(e,t)=>{var n=st();let r;var l=y(n,!0);c(()=>{r=d(n,1,`tab-item`,null,r,{active:o(g)===o(t).code}),i(l,(o(t),s(()=>o(t).code)))}),C(`click`,n,()=>b(g,o(t).code)),a(e,n)}),f(T);var E=h(T,2);e(E,5,()=>o(v),e=>e.code,(e,t)=>{var n=ct();let r;var i=x(n);D(i,{get content(){return o(t),s(()=>o(t).body)}}),f(n),c(()=>r=d(n,1,`tab-item`,null,r,{active:o(g)===o(t).code})),a(e,n)}),f(E),f(w),a(t,S),m()}var dt=n(`<button><div class="txt"> </div></button>`),ft=n(`<div><!></div>`),$=n(`<div class="content m-b-sm"><p>Sends auth record email change request.</p> <p>On successful email change all previously issued auth tokens for the specific record will be
            invalidated (and the user will be marked as verified if not already).</p></div> <!> <h6 class="m-b-xs">API details</h6> <div class="tabs"><div class="tabs-header compact"></div> <div class="tabs-content"></div></div>`,1);function pt(n){let r=[{title:`Request email change`,component:ot},{title:`Confirm email change`,component:ut}],s=u(0);E(n,{single:!0,title:`Email change`,children:(n,l)=>{var u=$(),p=h(_(u),2);O(p,{js:`
            import PocketBase from 'pocketbase';

            const pb = new PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection('users').authWithPassword('test@example.com', '1234567890');

            await pb.collection('users').requestEmailChange('new@example.com');

            // ---
            // (optional) in your custom confirmation page:
            // ---

            // note: all previous user auth tokens will be invalidated
            // (and the user will be marked as verified if not already)
            await pb.collection('users').confirmEmailChange('EMAIL_CHANGE_TOKEN', 'YOUR_PASSWORD');
        `,dart:`
            import 'package:pocketbase/pocketbase.dart';

            final pb = PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection('users').authWithPassword('test@example.com', '1234567890');

            await pb.collection('users').requestEmailChange('new@example.com');

            ...

            // ---
            // (optional) in your custom confirmation page:
            // ---

            // note: all previous user auth tokens will be invalidated
            // (and the user will be marked as verified if not already)
            await pb.collection('users').confirmEmailChange('EMAIL_CHANGE_TOKEN', 'YOUR_PASSWORD');
        `});var m=h(p,4),v=x(m);e(v,5,()=>r,g,(e,t,n)=>{var r=dt();let l;var u=x(r),p=y(u,!0);f(r),c(()=>{l=d(r,1,`tab-item`,null,l,{active:o(s)==n}),i(p,o(t).title)}),C(`click`,r,()=>b(s,n)),a(e,r)}),f(v);var S=h(v,2);e(S,5,()=>r,g,(e,n,r)=>{var i=ft();let l;var u=x(i);t(u,()=>o(n).component,(e,t)=>{t(e,{})}),f(i),c(()=>l=d(i,1,`tab-item`,null,l,{active:o(s)==r})),a(e,i)}),f(S),f(m),a(n,u)},$$slots:{default:!0}})}var mt=n(`<button> </button>`),ht=n(`<div><!></div>`),gt=n(`<div class="content m-b-sm"><p>Impersonate allows you to authenticate as a different user by generating a <strong>nonrefreshable</strong> auth token.</p> <p>Only superusers can perform this action.</p></div> <!> <h6 class="m-b-xs">API details</h6> <div class="api-route alert alert-success"><strong class="label label-primary">POST</strong> <div class="content">/api/collections/<code>collectionIdOrName</code>/impersonate/<code>id</code></div> <small class="txt-hint auth-header">Requires <code>Authorization:TOKEN</code></small></div> <div class="section-title">Path parameters</div> <table class="table-compact table-border m-b-base"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><tr><td>collectionIdOrName</td><td><span class="label">String</span></td><td>ID or name of the auth collection.</td></tr><tr><td>id</td><td><span class="label">String</span></td><td>ID of the auth record to impersonate.</td></tr></tbody></table> <div class="section-title">Body Parameters</div> <table class="table-compact table-border"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><tr><td><div class="inline-flex"><span class="label label-warning">Optional</span> <span class="txt">duration</span></div></td><td><span class="label">Number</span></td><td>Optional custom JWT duration for the <code>exp</code> claim (in seconds). <br/> If not set or 0, it fallbacks to the default collection auth token duration option.</td></tr></tbody></table> <small class="block txt-hint m-t-10 m-b-base">Body parameters could be sent as <em>JSON</em> or <em>multipart/form-data</em>.</small> <div class="section-title">Query parameters</div> <table class="table-compact table-border m-b-base"><thead><tr><th>Param</th><th>Type</th><th width="60%">Description</th></tr></thead><tbody><!><!></tbody></table> <div class="section-title">Responses</div> <div class="tabs"><div class="tabs-header compact combined left"></div> <div class="tabs-content"></div></div>`,1);function _t(t){let n=[{code:200,body:`
                {
                  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb2xsZWN0aW9uSWQiOiJfcGJjX2MwcHdrZXNjcXMiLCJleHAiOjE3MzAzNjgxMTUsImlkIjoicXkwMmMxdDBueDBvanFuIiwicmVmcmVzaGFibGUiOmZhbHNlLCJ0eXBlIjoiYXV0aCJ9.1JOaE54TyPdDLf0mb0T6roIYeh8Y1HfJvDlYZADMN4U",
                  "record": {
                    "id": "8171022dc95a4ed",
                    "collectionId": "d2972397d45614e",
                    "collectionName": "users",
                    "created": "2022-06-24 06:24:18.434Z",
                    "updated": "2022-06-24 06:24:18.889Z",
                    "username": "test@example.com",
                    "email": "test@example.com",
                    "verified": false,
                    "emailVisibility": true,
                    "someCustomField": "example 123"
                  }
                }
            `},{code:400,body:`
                {
                  "status": 400,
                  "message": "The request requires valid record authorization token to be set.",
                  "data": {
                    "duration": {
                      "code": "validation_min_greater_equal_than_required",
                      "message": "Must be no less than 0."
                    }
                  }
                }
            `},{code:401,body:`
                {
                  "status": 401,
                  "message": "An error occurred while validating the submitted data.",
                  "data": {}
                }
            `},{code:403,body:`
                {
                  "status": 403,
                  "message": "The authorized record model is not allowed to perform this action.",
                  "data": {}
                }
            `},{code:404,body:`
                {
                  "status": 404,
                  "message": "The requested resource wasn't found.",
                  "data": {}
                }
            `}],r=u(n[0].code);E(t,{single:!0,title:`Impersonate`,children:(t,s)=>{var l=gt(),u=h(_(l),2);O(u,{js:`
            import PocketBase from 'pocketbase';

            const pb = new PocketBase('http://127.0.0.1:8090');

            ...

            // authenticate as superuser
            await pb.collection("_superusers").authWithPassword("test@example.com", "1234567890");

            // impersonate
            // (the custom token duration is optional and must be in seconds)
            const impersonateClient = pb.collection("users").impersonate("USER_RECORD_ID", 3600)

            // log the impersonate token and user data
            console.log(impersonateClient.authStore.token);
            console.log(impersonateClient.authStore.record);

            // send requests as the impersonated user
            impersonateClient.collection("example").getFullList();
        `,dart:`
            import 'package:pocketbase/pocketbase.dart';

            final pb = PocketBase('http://127.0.0.1:8090');

            ...

            // authenticate as superuser
            await pb.collection("_superusers").authWithPassword("test@example.com", "1234567890");

            // impersonate
            // (the custom token duration is optional and must be in seconds)
            final impersonateClient = pb.collection("users").impersonate("USER_RECORD_ID", 3600)

            // log the impersonate token and user data
            print(impersonateClient.authStore.token);
            print(impersonateClient.authStore.record);

            // send requests as the impersonated user
            impersonateClient.collection("example").getFullList();
        `});var p=h(u,18),m=h(x(p)),g=x(m);N(g,{});var v=h(g);k(v,{prefix:`record.`}),f(m),f(p);var S=h(p,4),w=x(S);e(w,5,()=>n,e=>e.code,(e,t)=>{var n=mt();let s;var l=y(n,!0);c(()=>{s=d(n,1,`tab-item`,null,s,{active:o(r)===o(t).code}),i(l,o(t).code)}),C(`click`,n,()=>b(r,o(t).code)),a(e,n)}),f(w);var T=h(w,2);e(T,5,()=>n,e=>e.code,(e,t)=>{var n=ht();let i;var s=x(n);D(s,{get content(){return o(t).body}}),f(n),c(()=>i=d(n,1,`tab-item`,null,i,{active:o(r)===o(t).code})),a(e,n)}),f(T),f(S),a(t,l)},$$slots:{default:!0}})}var vt=n(`<!> <div class="accordions"><!> <!> <!> <!> <!> <!></div> <!> <div class="accordions"><!> <!> <!> <!> <!> <!> <!> <!> <!></div>`,1);function yt(e){var t=vt(),n=_(t);T(n,{title:`CRUD actions`});var r=h(n,2),i=x(r);L(i,{});var o=h(i,2);V(o,{});var s=h(o,2);G(s,{});var c=h(s,2);q(c,{});var l=h(c,2);Z(l,{}),ie(h(l,2),{}),f(r);var u=h(r,2);T(u,{title:`Auth record actions`});var d=h(u,2),p=x(d);ce(p,{});var m=h(p,2);fe(m,{});var g=h(m,2);ge(g,{});var v=h(g,2);Oe(v,{});var y=h(v,2);Me(y,{});var b=h(y,2);We(b,{});var S=h(b,2);nt(S,{});var C=h(S,2);pt(C,{}),_t(h(C,2),{}),f(d),a(e,t)}export{yt as component};