import{A as e,I as t,N as n,P as r,V as i,X as a,at as o,b as s,bt as c,it as l,nt as u,rt as d,st as f,tt as p,yt as m,z as h}from"../chunks/BDLcFjNi.js";import"../chunks/xihTtKlq.js";import"../chunks/C3kXMaAy.js";import{t as g}from"../chunks/B6gCHVlt.js";import{t as _}from"../chunks/CKGhWLYV.js";import{t as v}from"../chunks/CfPCrhHi.js";var y=t(`<div class="api-route alert alert-info"><strong class="label label-primary">GET</strong> <div class="content">/api/realtime</div></div> <p>Establishes a new SSE connection and immediately sends a <code>PB_CONNECT</code> SSE event with the
            created client ID.</p> <p class="txt-hint"><strong>NB!</strong> The user/superuser authorization happens during the first <a href="/docs/api-realtime#set-subscriptions">Set subscriptions</a> call.</p> <p>If the connected client doesn't receive any new messages for 5 minutes, the server will send a
            disconnect signal (this is to prevent forgotten/leaked connections). The connection will be
            automatically reestablished if the client is still active (e.g. the browser tab is still open).</p>`,1),b=t(`<button> </button>`),x=t(`<div><!></div>`),S=t(`<div class="api-route alert alert-success"><strong class="label label-primary">POST</strong> <div class="content">/api/realtime</div></div> <div class="content m-b-sm"><p>Sets new active client's subscriptions (and auto unsubscribes from the previous ones).</p> <p>If <code>Authorization</code> header is set, will authorize the client SSE connection with the
                associated user or superuser.</p></div> <div class="section-title">Body Parameters</div> <table class="table-compact table-border"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><tr><td><div class="inline-flex"><span class="label label-success">Required</span> <span>clientId</span></div></td><td><span class="label">String</span></td><td>ID of the SSE client connection.</td></tr><tr><td><div class="inline-flex"><span class="label label-warning">Optional</span> <span>subscriptions</span></div></td><td><span class="label"></span></td><td><p>The new client subscriptions to set in the format: <br/> <code>COLLECTION_ID_OR_NAME/*</code> or <code>COLLECTION_ID_OR_NAME/RECORD_ID</code>.</p> <p>You can also attach optional query and header parameters as serialized json to a
                            single topic using the <code>options</code> query parameter, e.g.: <!></p> <p>Leave empty to unsubscribe from everything.</p></td></tr></tbody></table> <small class="block txt-hint m-t-10 m-b-base">Body parameters could be sent as <em>JSON</em> or <em>multipart/form-data</em>.</small> <div class="section-title">Responses</div> <div class="tabs"><div class="tabs-header compact left"></div> <div class="tabs-content"></div></div>`,1),C=t(`<p>The Realtime API is implemented via Server-Sent Events (SSE). Generally, it consists of 2 operations:</p> <ol><li>establish SSE connection</li> <li>submit client subscriptions</li></ol> <p>SSE events are sent for <strong>create</strong>, <strong>update</strong> and <strong>delete</strong> record operations.</p> <div class="alert alert-info m-t-10 m-b-sm"><div class="icon"><i class="ri-information-line"></i></div> <div class="content"><p><strong>You could subscribe to a single record or to an entire collection.</strong></p> <p>When you subscribe to a <strong>single record</strong>, the collection's <strong>ViewRule</strong> will be used to determine whether the subscriber has access to receive the
            event message.</p> <p>When you subscribe to an <strong>entire collection</strong>, the collection's <strong>ListRule</strong> will be used to determine whether the subscriber has access to receive the
            event message.</p></div></div> <div class="accordions m-b-base"><!> <!></div> <p class="txt-bold">All of this is seamlessly handled by the SDKs using just the <code>subscribe</code> and <code>unsubscribe</code> methods:</p> <!>`,1);function w(t){let w=[{code:204,body:`null`},{code:400,body:`
                {
                  "status": 400,
                  "message": "Something went wrong while processing your request.",
                  "data": {
                    "clientId": {
                      "code": "validation_required",
                      "message": "Missing required value."
                    }
                  }
                }
            `},{code:403,body:`
                {
                  "status": 403,
                  "message": "The current and the previous request authorization don't match.",
                  "data": {}
                }
            `},{code:404,body:`
                {
                  "status": 404,
                  "message": "Missing or invalid client id.",
                  "data": {}
                }
            `}],T=o(w[0].code);var E=C(),D=l(u(E),8),O=p(D);g(O,{single:!0,title:`Connect`,children:(e,t)=>{var n=y();m(6),r(e,n)},$$slots:{default:!0}});var k=l(O,2);g(k,{single:!0,title:`Set subscriptions`,children:(t,o)=>{var g=S(),v=l(u(g),6),y=l(p(v)),C=l(p(y)),E=l(p(C)),D=p(E);D.textContent=`Array<String>`,c(E);var O=l(E),k=l(p(O),2),A=l(p(k),3);_(A,{content:`
                            COLLECTION_ID_OR_NAME/RECORD_ID?options={"query": {"abc": "123"}, "headers": {"x-token": "..."}}
                            `}),c(k),m(2),c(O),c(C),c(y),c(v);var j=l(v,6),M=p(j);e(M,5,()=>w,e=>e.code,(e,t)=>{var o=b();let c;var l=d(o,!0);a(()=>{c=s(o,1,`tab-item`,null,c,{active:i(T)===i(t).code}),n(l,i(t).code)}),h(`click`,o,()=>f(T,i(t).code)),r(e,o)}),c(M);var N=l(M,2);e(N,5,()=>w,e=>e.code,(e,t)=>{var n=x();let o;var l=p(n);_(l,{get content(){return i(t).body}}),c(n),a(()=>o=s(n,1,`tab-item`,null,o,{active:i(T)===i(t).code})),r(e,n)}),c(N),c(j),r(t,g)},$$slots:{default:!0}}),c(D);var A=l(D,4);v(A,{js:`
        import PocketBase from 'pocketbase';

        const pb = new PocketBase('http://127.0.0.1:8090');

        ...

        // (Optionally) authenticate
        await pb.collection('users').authWithPassword('test@example.com', '1234567890');

        // Subscribe to changes in any record in the collection
        pb.collection('example').subscribe('*', function (e) {
            console.log(e.action);
            console.log(e.record);
        }, { /* other options like expand, custom headers, etc. */ });


        // Subscribe to changes only in the specified record
        pb.collection('example').subscribe('RECORD_ID', function (e) {
            console.log(e.action);
            console.log(e.record);
        }, { /* other options like expand, custom headers, etc. */ });


        // Unsubscribe
        pb.collection('example').unsubscribe('RECORD_ID'); // remove all 'RECORD_ID' subscriptions
        pb.collection('example').unsubscribe('*'); // remove all '*' topic subscriptions
        pb.collection('example').unsubscribe(); // remove all subscriptions in the collection
    `,dart:`
        import 'package:pocketbase/pocketbase.dart';

        final pb = PocketBase('http://127.0.0.1:8090');

        ...

        // (Optionally) authenticate
        await pb.collection('users').authWithPassword('test@example.com', '1234567890');

        // Subscribe to changes in any record in the collection
        pb.collection('example').subscribe('*', (e) {
            print(e.action);
            print(e.record);
        }, /* other options like expand, custom headers, etc. */);


        // Subscribe to changes only in the specified record
        pb.collection('example').subscribe('RECORD_ID', (e) {
            print(e.action);
            print(e.record);
        }, /* other options like expand, custom headers, etc. */);


        // Unsubscribe
        pb.collection('example').unsubscribe('RECORD_ID'); // remove all 'RECORD_ID' subscriptions
        pb.collection('example').unsubscribe('*'); // remove all '*' topic subscriptions
        pb.collection('example').unsubscribe(); // remove all subscriptions in the collection
    `}),r(t,E)}export{w as component};