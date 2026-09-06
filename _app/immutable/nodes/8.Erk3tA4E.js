import{A as e,I as t,N as n,P as r,V as i,X as a,at as o,b as s,bt as c,it as l,nt as u,rt as d,st as f,tt as p,z as m}from"../chunks/BDLcFjNi.js";import"../chunks/xihTtKlq.js";import"../chunks/C3kXMaAy.js";import{t as h}from"../chunks/B6gCHVlt.js";import{t as g}from"../chunks/CKGhWLYV.js";import{t as _}from"../chunks/CfPCrhHi.js";import{t as v}from"../chunks/DK-N8Yuz.js";var y=t(`<button> </button>`),b=t(`<div><!></div>`),x=t(`<div class="content m-b-sm"><p>Returns list with all available backup files.</p> <p>Only superusers can perform this action.</p></div> <!> <h6 class="m-b-xs">API details</h6> <div class="api-route alert alert-info"><strong class="label label-primary">GET</strong> <div class="content">/api/backups</div></div> <div class="section-title">Query parameters</div> <table class="table-compact table-border m-b-base"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><!></tbody></table> <div class="section-title">Responses</div> <div class="tabs"><div class="tabs-header compact combined left"></div> <div class="tabs-content"></div></div>`,1);function S(t){let S=[{code:200,body:`
              [
                {
                  "key": "pb_backup_20230519162514.zip",
                  "modified": "2023-05-19 16:25:57.542Z",
                  "size": 251316185
                },
                {
                  "key": "pb_backup_20230518162514.zip",
                  "modified": "2023-05-18 16:25:57.542Z",
                  "size": 251314010
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
            `}],C=o(S[0].code);h(t,{single:!0,title:`List backups`,children:(t,o)=>{var h=x(),w=l(u(h),2);_(w,{js:`
            import PocketBase from 'pocketbase';

            const pb = new PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection("_superusers").authWithPassword('test@example.com', '1234567890');

            const backups = await pb.backups.getFullList();
        `,dart:`
            import 'package:pocketbase/pocketbase.dart';

            final pb = PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection("_superusers").authWithPassword('test@example.com', '1234567890');

            final backups = await pb.backups.getFullList();
        `});var T=l(w,8),E=l(p(T)),D=p(E);v(D,{}),c(E),c(T);var O=l(T,4),k=p(O);e(k,5,()=>S,e=>e.code,(e,t)=>{var o=y();let c;var l=d(o,!0);a(()=>{c=s(o,1,`tab-item`,null,c,{active:i(C)===i(t).code}),n(l,i(t).code)}),m(`click`,o,()=>f(C,i(t).code)),r(e,o)}),c(k);var A=l(k,2);e(A,5,()=>S,e=>e.code,(e,t)=>{var n=b();let o;var l=p(n);g(l,{get content(){return i(t).body}}),c(n),a(()=>o=s(n,1,`tab-item`,null,o,{active:i(C)===i(t).code})),r(e,n)}),c(A),c(O),r(t,h)},$$slots:{default:!0}})}var C=t(`<button> </button>`),w=t(`<div><!></div>`),T=t(`<div class="content m-b-sm"><p>Creates a new app data backup.</p> <p>This action will return an error if there is another backup/restore operation already in progress.</p> <p>Only superusers can perform this action.</p></div> <!> <h6 class="m-b-xs">API details</h6> <div class="api-route alert alert-success"><strong class="label label-primary">POST</strong> <div class="content">/api/backups</div> <small class="txt-hint auth-header">Requires <code>Authorization:TOKEN</code></small></div> <div class="section-title">Body Parameters</div> <table class="table-compact table-border"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><tr><td><div class="inline-flex"><span class="label label-warning">Optional</span> <span>name</span></div></td><td><span class="label">String</span></td><td>The base name of the backup file to create. <br/> Must be in the format <code>[a-z0-9_-].zip</code> <br/> If not set, it will be auto generated.</td></tr></tbody></table> <small class="block txt-hint m-t-10 m-b-base">Body parameters could be sent as <em>JSON</em> or <em>multipart/form-data</em>.</small> <div class="section-title">Responses</div> <div class="tabs"><div class="tabs-header compact combined left"></div> <div class="tabs-content"></div></div>`,1);function E(t){let v=[{code:204,body:`null`},{code:400,body:`
                {
                  "status": 400,
                  "message": "Try again later - another backup/restore process has already been started.",
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
            `}],y=o(v[0].code);h(t,{single:!0,title:`Create backup`,children:(t,o)=>{var h=T(),b=l(u(h),2);_(b,{js:`
            import PocketBase from 'pocketbase';

            const pb = new PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection("_superusers").authWithPassword('test@example.com', '1234567890');

            await pb.backups.create('new_backup.zip');
        `,dart:`
            import 'package:pocketbase/pocketbase.dart';

            final pb = PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection("_superusers").authWithPassword('test@example.com', '1234567890');

            await pb.backups.create('new_backup.zip');
        `});var x=l(b,14),S=p(x);e(S,5,()=>v,e=>e.code,(e,t)=>{var o=C();let c;var l=d(o,!0);a(()=>{c=s(o,1,`tab-item`,null,c,{active:i(y)===i(t).code}),n(l,i(t).code)}),m(`click`,o,()=>f(y,i(t).code)),r(e,o)}),c(S);var E=l(S,2);e(E,5,()=>v,e=>e.code,(e,t)=>{var n=w();let o;var l=p(n);g(l,{get content(){return i(t).body}}),c(n),a(()=>o=s(n,1,`tab-item`,null,o,{active:i(y)===i(t).code})),r(e,n)}),c(E),c(x),r(t,h)},$$slots:{default:!0}})}var D=t(`<button> </button>`),O=t(`<div><!></div>`),k=t(`<div class="content m-b-sm"><p>Uploads an existing backup zip file.</p> <p>Only superusers can perform this action.</p></div> <!> <h6 class="m-b-xs">API details</h6> <div class="api-route alert alert-success"><strong class="label label-primary">POST</strong> <div class="content">/api/backups/upload</div> <small class="txt-hint auth-header">Requires <code>Authorization:TOKEN</code></small></div> <div class="section-title">Body Parameters</div> <table class="table-compact table-border"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><tr><td><div class="inline-flex"><span class="label label-success">Required</span> <span>file</span></div></td><td><span class="label">File</span></td><td>The zip archive to upload.</td></tr></tbody></table> <small class="block txt-hint m-t-10 m-b-base">Uploading files is supported only via <em>multipart/form-data</em>.</small> <div class="section-title">Responses</div> <div class="tabs"><div class="tabs-header compact combined left"></div> <div class="tabs-content"></div></div>`,1);function A(t){let v=[{code:204,body:`null`},{code:400,body:`
                {
                  "status": 400,
                  "message": "Something went wrong while processing your request.",
                  "data": {
                    "file": {
                        "code": "validation_invalid_mime_type",
                        "message": "\\"test_backup.txt\\" mime type must be one of: application/zip."
                      }
                    }
                  }
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
            `}],y=o(v[0].code);h(t,{single:!0,title:`Upload backup`,children:(t,o)=>{var h=k(),b=l(u(h),2);_(b,{js:`
            import PocketBase from 'pocketbase';

            const pb = new PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection("_superusers").authWithPassword('test@example.com', '1234567890');

            await pb.backups.upload({ file: new Blob([...]) });
        `,dart:`
            import 'package:pocketbase/pocketbase.dart';

            final pb = PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection("_superusers").authWithPassword('test@example.com', '1234567890');

            await pb.backups.upload(http.MultipartFile.fromBytes('file', ...));
        `});var x=l(b,14),S=p(x);e(S,5,()=>v,e=>e.code,(e,t)=>{var o=D();let c;var l=d(o,!0);a(()=>{c=s(o,1,`tab-item`,null,c,{active:i(y)===i(t).code}),n(l,i(t).code)}),m(`click`,o,()=>f(y,i(t).code)),r(e,o)}),c(S);var C=l(S,2);e(C,5,()=>v,e=>e.code,(e,t)=>{var n=O();let o;var l=p(n);g(l,{get content(){return i(t).body}}),c(n),a(()=>o=s(n,1,`tab-item`,null,o,{active:i(y)===i(t).code})),r(e,n)}),c(C),c(x),r(t,h)},$$slots:{default:!0}})}var j=t(`<button> </button>`),M=t(`<div><!></div>`),N=t(`<div class="content m-b-sm"><p>Deletes a single backup by its name.</p> <p>This action will return an error if the backup to delete is still being generated or part of a
            restore operation.</p> <p>Only superusers can perform this action.</p></div> <!> <h6 class="m-b-xs">API details</h6> <div class="api-route alert alert-success"><strong class="label label-primary">DELETE</strong> <div class="content">/api/backups/<code>key</code></div> <small class="txt-hint auth-header">Requires <code>Authorization:TOKEN</code></small></div> <div class="section-title">Path parameters</div> <table class="table-compact table-border m-b-base"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><tr><td>key</td><td><span class="label">String</span></td><td>The key of the backup file to delete.</td></tr></tbody></table> <div class="section-title">Responses</div> <div class="tabs"><div class="tabs-header compact combined left"></div> <div class="tabs-content"></div></div>`,1);function P(t){let v=[{code:204,body:`null`},{code:400,body:`
                {
                  "status": 400,
                  "message": "Try again later - another backup/restore process has already been started.",
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
            `}],y=o(v[0].code);h(t,{single:!0,title:`Delete backup`,children:(t,o)=>{var h=N(),b=l(u(h),2);_(b,{js:`
            import PocketBase from 'pocketbase';

            const pb = new PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection("_superusers").authWithPassword('test@example.com', '1234567890');

            await pb.backups.delete('pb_data_backup.zip');
        `,dart:`
            import 'package:pocketbase/pocketbase.dart';

            final pb = PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection("_superusers").authWithPassword('test@example.com', '1234567890');

            await pb.backups.delete('pb_data_backup.zip');
        `});var x=l(b,12),S=p(x);e(S,5,()=>v,e=>e.code,(e,t)=>{var o=j();let c;var l=d(o,!0);a(()=>{c=s(o,1,`tab-item`,null,c,{active:i(y)===i(t).code}),n(l,i(t).code)}),m(`click`,o,()=>f(y,i(t).code)),r(e,o)}),c(S);var C=l(S,2);e(C,5,()=>v,e=>e.code,(e,t)=>{var n=M();let o;var l=p(n);g(l,{get content(){return i(t).body}}),c(n),a(()=>o=s(n,1,`tab-item`,null,o,{active:i(y)===i(t).code})),r(e,n)}),c(C),c(x),r(t,h)},$$slots:{default:!0}})}var F=t(`<button> </button>`),I=t(`<div><!></div>`),L=t(`<div class="content m-b-sm"><p>Restore a single backup by its name and restarts the current running PocketBase process.</p> <p>This action will return an error if there is another backup/restore operation already in progress.</p> <p>Only superusers can perform this action.</p></div> <!> <h6 class="m-b-xs">API details</h6> <div class="api-route alert alert-success"><strong class="label label-primary">POST</strong> <div class="content">/api/backups/<code>key</code>/restore</div> <small class="txt-hint auth-header">Requires <code>Authorization:TOKEN</code></small></div> <div class="section-title">Path parameters</div> <table class="table-compact table-border m-b-base"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><tr><td>key</td><td><span class="label">String</span></td><td>The key of the backup file to restore.</td></tr></tbody></table> <div class="section-title">Responses</div> <div class="tabs"><div class="tabs-header compact combined left"></div> <div class="tabs-content"></div></div>`,1);function R(t){let v=[{code:204,body:`null`},{code:400,body:`
                {
                  "status": 400,
                  "message": "Try again later - another backup/restore process has already been started.",
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
            `}],y=o(v[0].code);h(t,{single:!0,title:`Restore backup`,children:(t,o)=>{var h=L(),b=l(u(h),2);_(b,{js:`
            import PocketBase from 'pocketbase';

            const pb = new PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection("_superusers").authWithPassword('test@example.com', '1234567890');

            await pb.backups.restore('pb_data_backup.zip');
        `,dart:`
            import 'package:pocketbase/pocketbase.dart';

            final pb = PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection("_superusers").authWithPassword('test@example.com', '1234567890');

            await pb.backups.restore('pb_data_backup.zip');
        `});var x=l(b,12),S=p(x);e(S,5,()=>v,e=>e.code,(e,t)=>{var o=F();let c;var l=d(o,!0);a(()=>{c=s(o,1,`tab-item`,null,c,{active:i(y)===i(t).code}),n(l,i(t).code)}),m(`click`,o,()=>f(y,i(t).code)),r(e,o)}),c(S);var C=l(S,2);e(C,5,()=>v,e=>e.code,(e,t)=>{var n=I();let o;var l=p(n);g(l,{get content(){return i(t).body}}),c(n),a(()=>o=s(n,1,`tab-item`,null,o,{active:i(y)===i(t).code})),r(e,n)}),c(C),c(x),r(t,h)},$$slots:{default:!0}})}var z=t(`<button> </button>`),B=t(`<div><!></div>`),V=t(`<div class="content m-b-base"><p>Downloads a single backup file.</p> <p>Only superusers can perform this action.</p></div> <!> <h6 class="m-b-xs">API details</h6> <div class="api-route alert alert-info"><strong class="label label-primary">GET</strong> <div class="content">/api/backups/<code>key</code></div></div> <div class="section-title">Path parameters</div> <table class="table-compact table-border m-b-base"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><tr><td>key</td><td><span class="label">String</span></td><td>The key of the backup file to download.</td></tr></tbody></table> <div class="section-title">Query parameters</div> <table class="table-compact table-border m-b-base"><thead><tr><th>Param</th><th>Type</th><th width="60%">Description</th></tr></thead><tbody><tr><td valign="top">token</td><td valign="top"><span class="label">String</span></td><td valign="top">Superuser <strong>file token</strong> for granting access to the <strong>backup file</strong>.</td></tr></tbody></table> <div class="section-title">Responses</div> <div class="tabs"><div class="tabs-header compact combined left"></div> <div class="tabs-content"></div></div>`,1);function H(t){let v=o(200),y=[{code:200,body:`[file resource]`},{code:400,body:`
                {
                  "status": 400,
                  "message": "Filesystem initialization failure.",
                  "data": {}
                }
            `},{code:404,body:`
                {
                  "status": 404,
                  "message": "The requested resource wasn't found.",
                  "data": {}
                }
            `}];h(t,{single:!0,title:`Download backup`,children:(t,o)=>{var h=V(),b=l(u(h),2);_(b,{js:`
            import PocketBase from 'pocketbase';

            const pb = new PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection("_superusers").authWithPassword('test@example.com', '1234567890');

            const token = await pb.files.getToken();

            const url = pb.backups.getDownloadUrl(token, 'pb_data_backup.zip');
        `,dart:`
            import 'package:pocketbase/pocketbase.dart';

            final pb = PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection("_superusers").authWithPassword('test@example.com', '1234567890');

            final token = await pb.files.getToken();

            final url = pb.backups.getDownloadUrl(token, 'pb_data_backup.zip');
        `});var x=l(b,16),S=p(x);e(S,5,()=>y,e=>e.code,(e,t)=>{var o=z();let c;var l=d(o,!0);a(()=>{c=s(o,1,`tab-item`,null,c,{active:i(v)===i(t).code}),n(l,i(t).code)}),m(`click`,o,()=>f(v,i(t).code)),r(e,o)}),c(S);var C=l(S,2);e(C,5,()=>y,e=>e.code,(e,t)=>{var n=B();let o;var l=p(n);g(l,{get content(){return i(t).body}}),c(n),a(()=>o=s(n,1,`tab-item`,null,o,{active:i(v)===i(t).code})),r(e,n)}),c(C),c(x),r(t,h)},$$slots:{default:!0}})}var U=t(`<div class="accordions"><!> <!> <!> <!> <!> <!></div>`);function W(e){var t=U(),n=p(t);S(n,{});var i=l(n,2);E(i,{});var a=l(i,2);A(a,{});var o=l(a,2);P(o,{});var s=l(o,2);R(s,{}),H(l(s,2),{}),c(t),r(e,t)}export{W as component};