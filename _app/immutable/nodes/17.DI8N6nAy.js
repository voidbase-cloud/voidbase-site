import{A as e,I as t,N as n,P as r,V as i,X as a,at as o,b as s,bt as c,it as l,nt as u,rt as d,st as f,tt as p,yt as m,z as h}from"../chunks/BDLcFjNi.js";import"../chunks/xihTtKlq.js";import"../chunks/C3kXMaAy.js";import{t as g}from"../chunks/B6gCHVlt.js";import{t as _}from"../chunks/CKGhWLYV.js";import{t as v}from"../chunks/CfPCrhHi.js";import{t as y}from"../chunks/DK-N8Yuz.js";var b=t(`<button> </button>`),x=t(`<div><!></div>`),S=t(`<div class="content m-b-sm"><p>Returns a list with all available application settings.</p> <p>Secret/password fields are automatically redacted with <em>******</em> characters.</p> <p>Only superusers can perform this action.</p></div> <!> <h6 class="m-b-xs">API details</h6> <div class="api-route alert alert-info"><strong class="label label-primary">GET</strong> <div class="content">/api/settings</div> <small class="txt-hint auth-header">Requires <code>Authorization:TOKEN</code></small></div> <div class="section-title">Query parameters</div> <table class="table-compact table-border m-b-base"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><!></tbody></table> <div class="section-title">Responses</div> <div class="tabs"><div class="tabs-header compact combined left"></div> <div class="tabs-content"></div></div>`,1);function C(t){let m=[{code:200,body:`
                {
                  "smtp": {
                    "enabled": false,
                    "port": 587,
                    "host": "smtp.example.com",
                    "username": "",
                    "authMethod": "",
                    "tls": true,
                    "localName": ""
                  },
                  "backups": {
                    "cron": "0 0 * * *",
                    "cronMaxKeep": 3,
                    "s3": {
                      "enabled": false,
                      "bucket": "",
                      "region": "",
                      "endpoint": "",
                      "accessKey": "",
                      "forcePathStyle": false
                    }
                  },
                  "s3": {
                    "enabled": false,
                    "bucket": "",
                    "region": "",
                    "endpoint": "",
                    "accessKey": "",
                    "forcePathStyle": false
                  },
                  "meta": {
                    "appName": "Acme",
                    "appURL": "https://example.com",
                    "senderName": "Support",
                    "senderAddress": "support@example.com",
                    "hideControls": false
                  },
                  "rateLimits": {
                    "rules": [
                      {
                        "label": "*:auth",
                        "audience": "",
                        "duration": 3,
                        "maxRequests": 2
                      },
                      {
                        "label": "*:create",
                        "audience": "",
                        "duration": 5,
                        "maxRequests": 20
                      },
                      {
                        "label": "/api/batch",
                        "audience": "",
                        "duration": 1,
                        "maxRequests": 3
                      },
                      {
                        "label": "/api/",
                        "audience": "",
                        "duration": 10,
                        "maxRequests": 300
                      }
                    ],
                    "enabled": false
                  },
                  "trustedProxy": {
                    "headers": [],
                    "useLeftmostIP": false
                  },
                  "batch": {
                    "enabled": true,
                    "maxRequests": 50,
                    "timeout": 3,
                    "maxBodySize": 0
                  },
                  "logs": {
                    "maxDays": 7,
                    "minLevel": 0,
                    "logIP": true,
                    "logAuthId": false
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
            `}],C=o(m[0].code);g(t,{single:!0,title:`List settings`,children:(t,o)=>{var g=S(),w=l(u(g),2);v(w,{js:`
            import PocketBase from 'pocketbase';

            const pb = new PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection("_superusers").authWithPassword('test@example.com', '1234567890');

            const settings = await pb.settings.getAll();
        `,dart:`
            import 'package:pocketbase/pocketbase.dart';

            final pb = PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection("_superusers").authWithPassword('test@example.com', '1234567890');

            final settings = await pb.settings.getAll();
        `});var T=l(w,8),E=l(p(T)),D=p(E);y(D,{}),c(E),c(T);var O=l(T,4),k=p(O);e(k,5,()=>m,e=>e.code,(e,t)=>{var o=b();let c;var l=d(o,!0);a(()=>{c=s(o,1,`tab-item`,null,c,{active:i(C)===i(t).code}),n(l,i(t).code)}),h(`click`,o,()=>f(C,i(t).code)),r(e,o)}),c(k);var A=l(k,2);e(A,5,()=>m,e=>e.code,(e,t)=>{var n=x();let o;var l=p(n);_(l,{get content(){return i(t).body}}),c(n),a(()=>o=s(n,1,`tab-item`,null,o,{active:i(C)===i(t).code})),r(e,n)}),c(A),c(O),r(t,g)},$$slots:{default:!0}})}var w=t(`<button> </button>`),T=t(`<div><!></div>`),E=t(`<div class="content m-b-sm"><p>Bulk updates application settings and returns the updated settings list.</p> <p>Only superusers can perform this action.</p></div> <!> <h6 class="m-b-xs">API details</h6> <div class="api-route alert alert-warning"><strong class="label label-primary">PATCH</strong> <div class="content">/api/settings</div> <small class="txt-hint auth-header">Requires <code>Authorization:TOKEN</code></small></div> <div class="section-title">Body Parameters</div> <table class="table-compact table-border"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><tr><td colspan="3" class="bg-info-alt"><strong>meta</strong> <br/> <small class="txt-hint">Application meta data (name, url, support email, etc.).</small></td></tr><tr><td class="min-width"><div class="inline-flex flex-nowrap"><span class="txt">├─</span> <span class="label label-success">Required</span> <em>appName</em></div></td><td><span class="label">String</span></td><td>The app name.</td></tr><tr><td class="min-width"><div class="inline-flex flex-nowrap"><span class="txt">├─</span> <span class="label label-success">Required</span> <em>appUrl</em></div></td><td><span class="label">String</span></td><td>The app public absolute url.</td></tr><tr><td class="min-width"><div class="inline-flex flex-nowrap"><span class="txt">├─</span> <span class="label label-warning">Optional</span> <em>hideControls</em></div></td><td><span class="label">Boolean</span></td><td>Hides the collection create and update controls from the Dashboard. <small>Useful to prevent making accidental schema changes when in production environment.</small></td></tr><tr><td class="min-width"><div class="inline-flex flex-nowrap"><span class="txt">├─</span> <span class="label label-success">Required</span> <em>senderName</em></div></td><td><span class="label">String</span></td><td>Transactional mails sender name.</td></tr><tr><td class="min-width"><div class="inline-flex flex-nowrap"><span class="txt">├─</span> <span class="label label-success">Required</span> <em>senderAddress</em></div></td><td><span class="label">String</span></td><td>Transactional mails sender address.</td></tr><tr><td colspan="3" class="bg-info-alt"><strong>logs</strong> <br/> <small class="txt-hint">App logger settings.</small></td></tr><tr><td class="min-width"><div class="inline-flex flex-nowrap"><span class="txt">└─</span> <span class="label label-warning">Optional</span> <em>maxDays</em></div></td><td><span class="label">Number</span></td><td>Max retention period. Set to <em>0</em> for no logs.</td></tr><tr><td class="min-width"><div class="inline-flex flex-nowrap"><span class="txt">└─</span> <span class="label label-warning">Optional</span> <em>minLevel</em></div></td><td><span class="label">Number</span></td><td>Specifies the minimum log persistent level. <br/> The default log levels are: <ul><li>-4: DEBUG</li> <li>0: INFO</li> <li>4: WARN</li> <li>8: ERROR</li></ul></td></tr><tr><td class="min-width"><div class="inline-flex flex-nowrap"><span class="txt">└─</span> <span class="label label-warning">Optional</span> <em>logIP</em></div></td><td><span class="label">Boolean</span></td><td>If enabled includes the client IP in the activity request logs.</td></tr><tr><td class="min-width"><div class="inline-flex flex-nowrap"><span class="txt">└─</span> <span class="label label-warning">Optional</span> <em>logAuthId</em></div></td><td><span class="label">Boolean</span></td><td>If enabled includes the authenticated record id in the activity request logs.</td></tr><tr><td colspan="3" class="bg-info-alt"><strong>backups</strong> <br/> <small class="txt-hint">App data backups settings.</small></td></tr><tr><td class="min-width"><div class="inline-flex flex-nowrap"><span class="txt">├─</span> <span class="label label-warning">Optional</span> <em>cron</em></div></td><td><span class="label">String</span></td><td>Cron expression to schedule auto backups, e.g. <code>0 0 * * *</code>.</td></tr><tr><td class="min-width"><div class="inline-flex flex-nowrap"><span class="txt">├─</span> <span class="label label-warning">Optional</span> <em>cronMaxKeep</em></div></td><td><span class="label">Number</span></td><td>The max number of cron generated backups to keep before removing older entries.</td></tr><tr><td class="min-width"><div class="inline-flex flex-nowrap"><span class="txt">└─</span> <span class="label label-warning">Optional</span> <em>s3</em></div></td><td><span class="label">Object</span></td><td>S3 configuration (the same fields as for the S3 file storage settings).</td></tr><tr><td colspan="3" class="bg-info-alt"><strong>smtp</strong> <br/> <small class="txt-hint">SMTP mail server settings.</small></td></tr><tr><td class="min-width"><div class="inline-flex flex-nowrap"><span class="txt">├─</span> <span class="label label-warning">Optional</span> <em>enabled</em></div></td><td><span class="label">Boolean</span></td><td>Enable the use of the SMTP mail server for sending emails.</td></tr><tr><td class="min-width"><div class="inline-flex flex-nowrap"><span class="txt">├─</span> <span class="label label-success">Required</span> <em>host</em></div></td><td><span class="label">String</span></td><td>Mail server host (required if SMTP is enabled).</td></tr><tr><td class="min-width"><div class="inline-flex flex-nowrap"><span class="txt">├─</span> <span class="label label-success">Required</span> <em>port</em></div></td><td><span class="label">Number</span></td><td>Mail server port (required if SMTP is enabled).</td></tr><tr><td class="min-width"><div class="inline-flex flex-nowrap"><span class="txt">├─</span> <span class="label label-warning">Optional</span> <em>username</em></div></td><td><span class="label">String</span></td><td>Mail server username.</td></tr><tr><td class="min-width"><div class="inline-flex flex-nowrap"><span class="txt">├─</span> <span class="label label-warning">Optional</span> <em>password</em></div></td><td><span class="label">String</span></td><td>Mail server password.</td></tr><tr><td class="min-width"><div class="inline-flex flex-nowrap"><span class="txt">├─</span> <span class="label label-warning">Optional</span> <em>tls</em></div></td><td><span class="label">Boolean</span></td><td>Whether to enforce TLS connection encryption. <br/> <small class="txt-hint">When <em>false</em> <em>StartTLS</em> command is send, leaving the server to decide whether
                        to upgrade the connection or not).</small></td></tr><tr><td class="min-width"><div class="inline-flex flex-nowrap"><span class="txt">├─</span> <span class="label label-warning">Optional</span> <em>authMethod</em></div></td><td><span class="label">String</span></td><td>The SMTP AUTH method to use - <em>PLAIN</em> or <em>LOGIN</em> (used mainly by Microsoft). <br/> Default to <em>PLAIN</em> if empty.</td></tr><tr><td class="min-width"><div class="inline-flex flex-nowrap"><span class="txt">└─</span> <span class="label label-warning">Optional</span> <em>localName</em></div></td><td><span class="label">String</span></td><td>Optional domain name or (IP address) to use for the initial EHLO/HELO exchange. <br/> If not explicitly set, <code>localhost</code> will be used. <br/> Note that some SMTP providers, such as Gmail SMTP-relay, requires a proper domain name and
                    and will reject attempts to use localhost.</td></tr><tr><td colspan="3" class="bg-info-alt"><strong>s3</strong> <br/> <small class="txt-hint">S3 compatible file storage settings.</small></td></tr><tr><td class="min-width"><div class="inline-flex flex-nowrap"><span class="txt">├─</span> <span class="label label-warning">Optional</span> <em>enabled</em></div></td><td><span class="label">Boolean</span></td><td>Enable the use of a S3 compatible storage.</td></tr><tr><td class="min-width"><div class="inline-flex flex-nowrap"><span class="txt">├─</span> <span class="label label-success">Required</span> <em>bucket</em></div></td><td><span class="label">String</span></td><td>S3 storage bucket (required if enabled).</td></tr><tr><td class="min-width"><div class="inline-flex flex-nowrap"><span class="txt">├─</span> <span class="label label-success">Required</span> <em>region</em></div></td><td><span class="label">String</span></td><td>S3 storage region (required if enabled).</td></tr><tr><td class="min-width"><div class="inline-flex flex-nowrap"><span class="txt">├─</span> <span class="label label-success">Required</span> <em>endpoint</em></div></td><td><span class="label">String</span></td><td>S3 storage public endpoint (required if enabled).</td></tr><tr><td class="min-width"><div class="inline-flex flex-nowrap"><span class="txt">├─</span> <span class="label label-success">Required</span> <em>accessKey</em></div></td><td><span class="label">String</span></td><td>S3 storage access key (required if enabled).</td></tr><tr><td class="min-width"><div class="inline-flex flex-nowrap"><span class="txt">├─</span> <span class="label label-success">Required</span> <em>secret</em></div></td><td><span class="label">String</span></td><td>S3 storage secret (required if enabled).</td></tr><tr><td class="min-width"><div class="inline-flex flex-nowrap"><span class="txt">└─</span> <span class="label label-warning">Optional</span> <em>forcePathStyle</em></div></td><td><span class="label">Boolean</span></td><td>Forces the S3 request to use path-style addressing, e.g.
                    "https://s3.amazonaws.com/BUCKET/KEY" instead of the default
                    "https://BUCKET.s3.amazonaws.com/KEY".</td></tr><tr><td colspan="3" class="bg-info-alt"><strong>batch</strong> <br/> <small class="txt-hint">Batch logs settings.</small></td></tr><tr><td class="min-width"><div class="inline-flex flex-nowrap"><span class="txt">├─</span> <span class="label label-warning">Optional</span> <em>enabled</em></div></td><td><span class="label">Boolean</span></td><td>Enable the batch Web APIs.</td></tr><tr><td class="min-width"><div class="inline-flex flex-nowrap"><span class="txt">├─</span> <span class="label label-success">Required</span> <em>maxRequests</em></div></td><td><span class="label">Number</span></td><td>The maximum allowed batch request to execute.</td></tr><tr><td class="min-width"><div class="inline-flex flex-nowrap"><span class="txt">├─</span> <span class="label label-success">Required</span> <em>timeout</em></div></td><td><span class="label">Number</span></td><td>The max duration in seconds to wait before cancelling the batch transaction.</td></tr><tr><td class="min-width"><div class="inline-flex flex-nowrap"><span class="txt">└─</span> <span class="label label-warning">Optional</span> <em>maxBodySize</em></div></td><td><span class="label">Number</span></td><td>The maximum allowed batch request body size in bytes. <br/> If not set, fallbacks to max ~128MB.</td></tr><tr><td colspan="3" class="bg-info-alt"><strong>rateLimits</strong> <br/> <small class="txt-hint">Rate limiter settings.</small></td></tr><tr><td class="min-width"><div class="inline-flex flex-nowrap"><span class="txt">├─</span> <span class="label label-warning">Optional</span> <em>enabled</em></div></td><td><span class="label">Boolean</span></td><td>Enable the builtin rate limiter.</td></tr><tr><td class="min-width"><div class="inline-flex flex-nowrap"><span class="txt">└─</span> <span class="label label-warning">Optional</span> <em>rules</em></div></td><td><span class="label"></span></td><td>List of rate limit rules. Each rule have: <ul><li><code>label</code> - the identifier of the rule. <br/> It could be a tag, complete path or path prerefix (when ends with \`/\`).</li> <li><code>maxRequests</code> - the max allowed number of requests per duration.</li> <li><code>duration</code> - specifies the interval (in seconds) per which to reset the
                            counted/accumulated rate limiter tokens..</li></ul></td></tr><tr><td colspan="3" class="bg-info-alt"><strong>trustedProxy</strong> <br/> <small class="txt-hint">Trusted proxy headers settings.</small></td></tr><tr><td class="min-width"><div class="inline-flex flex-nowrap"><span class="txt">├─</span> <span class="label label-warning">Optional</span> <em>headers</em></div></td><td><span class="label"></span></td><td>List of explicit trusted header(s) to check.</td></tr><tr><td class="min-width"><div class="inline-flex flex-nowrap"><span class="txt">└─</span> <span class="label label-warning">Optional</span> <em>useLeftmostIP</em></div></td><td><span class="label">Boolean</span></td><td>Specifies to use the left-mostish IP from the trusted headers.</td></tr></tbody></table> <small class="block txt-hint m-t-10 m-b-base">Body parameters could be sent as <em>JSON</em> or <em>multipart/form-data</em>.</small> <div class="section-title">Query parameters</div> <table class="table-compact table-border m-b-base"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><!></tbody></table> <div class="section-title">Responses</div> <div class="tabs"><div class="tabs-header compact combined left"></div> <div class="tabs-content"></div></div>`,1);function D(t){let b=[{code:200,body:`
                {
                  "smtp": {
                    "enabled": false,
                    "port": 587,
                    "host": "smtp.example.com",
                    "username": "",
                    "authMethod": "",
                    "tls": true,
                    "localName": ""
                  },
                  "backups": {
                    "cron": "0 0 * * *",
                    "cronMaxKeep": 3,
                    "s3": {
                      "enabled": false,
                      "bucket": "",
                      "region": "",
                      "endpoint": "",
                      "accessKey": "",
                      "forcePathStyle": false
                    }
                  },
                  "s3": {
                    "enabled": false,
                    "bucket": "",
                    "region": "",
                    "endpoint": "",
                    "accessKey": "",
                    "forcePathStyle": false
                  },
                  "meta": {
                    "appName": "Acme",
                    "appURL": "https://example.com",
                    "senderName": "Support",
                    "senderAddress": "support@example.com",
                    "hideControls": false
                  },
                  "rateLimits": {
                    "rules": [
                      {
                        "label": "*:auth",
                        "audience": "",
                        "duration": 3,
                        "maxRequests": 2
                      },
                      {
                        "label": "*:create",
                        "audience": "",
                        "duration": 5,
                        "maxRequests": 20
                      },
                      {
                        "label": "/api/batch",
                        "audience": "",
                        "duration": 1,
                        "maxRequests": 3
                      },
                      {
                        "label": "/api/",
                        "audience": "",
                        "duration": 10,
                        "maxRequests": 300
                      }
                    ],
                    "enabled": false
                  },
                  "trustedProxy": {
                    "headers": [],
                    "useLeftmostIP": false
                  },
                  "batch": {
                    "enabled": true,
                    "maxRequests": 50,
                    "timeout": 3,
                    "maxBodySize": 0
                  },
                  "logs": {
                    "maxDays": 7,
                    "minLevel": 0,
                    "logIP": true,
                    "logAuthId": false
                  }
                }
            `},{code:400,body:`
                {
                  "status": 400,
                  "message": "An error occurred while submitting the form.",
                  "data": {
                    "meta": {
                      "appName": {
                        "code": "validation_required",
                        "message": "Missing required value."
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
            `}],x=o(b[0].code);g(t,{single:!0,title:`Update settings`,children:(t,o)=>{var g=E(),S=l(u(g),2);v(S,{js:`
            import PocketBase from 'pocketbase';

            const pb = new PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection("_superusers").authWithPassword('test@example.com', '123456');

            const settings = await pb.settings.update({
                meta: {
                  appName: 'YOUR_APP',
                  appUrl: 'http://127.0.0.1:8090',
                },
            });
        `,dart:`
            import 'package:pocketbase/pocketbase.dart';

            final pb = PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection("_superusers").authWithPassword('test@example.com', '123456');

            final settings = await pb.settings.update(body: {
                'meta': {
                  'appName': 'YOUR_APP',
                  'appUrl': 'http://127.0.0.1:8090',
                },
            });
        `});var C=l(S,8),D=l(p(C)),O=l(p(D),39),k=l(p(O)),A=p(k);A.textContent=`Array<RateLimitRule>`,c(k),m(),c(O);var j=l(O,2),M=l(p(j)),N=p(M);N.textContent=`Array<String>`,c(M),m(),c(j),m(),c(D),c(C);var P=l(C,6),F=l(p(P)),I=p(F);y(I,{}),c(F),c(P);var L=l(P,4),R=p(L);e(R,5,()=>b,e=>e.code,(e,t)=>{var o=w();let c;var l=d(o,!0);a(()=>{c=s(o,1,`tab-item`,null,c,{active:i(x)===i(t).code}),n(l,i(t).code)}),h(`click`,o,()=>f(x,i(t).code)),r(e,o)}),c(R);var z=l(R,2);e(z,5,()=>b,e=>e.code,(e,t)=>{var n=T();let o;var l=p(n);_(l,{get content(){return i(t).body}}),c(n),a(()=>o=s(n,1,`tab-item`,null,o,{active:i(x)===i(t).code})),r(e,n)}),c(z),c(L),r(t,g)},$$slots:{default:!0}})}var O=t(`<button> </button>`),k=t(`<div><!></div>`),A=t(`<div class="content m-b-sm"><p>Performs S3 storage connection test.</p> <p>Only superusers can perform this action.</p></div> <!> <h6 class="m-b-xs">API details</h6> <div class="api-route alert alert-success"><strong class="label label-primary">POST</strong> <div class="content">/api/settings/test/s3</div> <small class="txt-hint auth-header">Requires <code>Authorization:TOKEN</code></small></div> <div class="section-title">Body Parameters</div> <table class="table-compact table-border"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><tr><td><div class="inline-flex"><span class="label label-success">Required</span> <span>filesystem</span></div></td><td><span class="label">String</span></td><td>The storage filesystem to test (<code>storage</code> or <code>backups</code>).</td></tr></tbody></table> <small class="block txt-hint m-t-10 m-b-base">Body parameters could be sent as <em>JSON</em> or <em>multipart/form-data</em>.</small> <div class="section-title">Responses</div> <div class="tabs"><div class="tabs-header compact combined left"></div> <div class="tabs-content"></div></div>`,1);function j(t){let m=[{code:204,body:`null`},{code:400,body:`
            {
              "status": 400,
              "message": "Failed to initialize the S3 storage. Raw error:...",
              "data": {}
            }
        `},{code:401,body:`
                {
                  "status": 401,
                  "message": "The request requires valid record authorization token.",
                  "data": {}
                }
            `}],y=o(m[0].code);g(t,{single:!0,title:`Test S3 storage connection`,children:(t,o)=>{var g=A(),b=l(u(g),2);v(b,{js:`
            import PocketBase from 'pocketbase';

            const pb = new PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection("_superusers").authWithPassword('test@example.com', '1234567890');

            await pb.settings.testS3("backups");
        `,dart:`
            import 'package:pocketbase/pocketbase.dart';

            final pb = PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection("_superusers").authWithPassword('test@example.com', '1234567890');

            await pb.settings.testS3("backups");
        `});var x=l(b,14),S=p(x);e(S,5,()=>m,e=>e.code,(e,t)=>{var o=O();let c;var l=d(o,!0);a(()=>{c=s(o,1,`tab-item`,null,c,{active:i(y)===i(t).code}),n(l,i(t).code)}),h(`click`,o,()=>f(y,i(t).code)),r(e,o)}),c(S);var C=l(S,2);e(C,5,()=>m,e=>e.code,(e,t)=>{var n=k();let o;var l=p(n);_(l,{get content(){return i(t).body}}),c(n),a(()=>o=s(n,1,`tab-item`,null,o,{active:i(y)===i(t).code})),r(e,n)}),c(C),c(x),r(t,g)},$$slots:{default:!0}})}var M=t(`<button> </button>`),N=t(`<div><!></div>`),P=t(`<div class="content m-b-sm"><p>Sends a test user email.</p> <p>Only superusers can perform this action.</p></div> <!> <h6 class="m-b-xs">API details</h6> <div class="api-route alert alert-success"><strong class="label label-primary">POST</strong> <div class="content">/api/settings/test/email</div> <small class="txt-hint auth-header">Requires <code>Authorization:TOKEN</code></small></div> <div class="section-title">Body Parameters</div> <table class="table-compact table-border"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><tr><td><div class="inline-flex"><span class="label label-warning">Optional</span> <span class="txt">collection</span></div></td><td><span class="label">String</span></td><td>The name or id of the auth collection. Fallbacks to <em>_superusers</em> if not set.</td></tr><tr><td><div class="inline-flex"><span class="label label-success">Required</span> <span class="txt">email</span></div></td><td><span class="label">String</span></td><td>The receiver of the test email.</td></tr><tr><td><div class="inline-flex"><span class="label label-success">Required</span> <span class="txt">template</span></div></td><td><span class="label">String</span></td><td>The test email template to send: <br/> <code>verification</code>, <code>password-reset</code> or <code>email-change</code>.</td></tr></tbody></table> <small class="block txt-hint m-t-10 m-b-base">Body parameters could be sent as <em>JSON</em> or <em>multipart/form-data</em>.</small> <div class="section-title">Responses</div> <div class="tabs"><div class="tabs-header compact combined left"></div> <div class="tabs-content"></div></div>`,1);function F(t){let m=[{code:204,body:`null`},{code:400,body:`
            {
              "status": 400,
              "message": "Failed to send the test email.",
              "data": {
                "email": {
                  "code": "validation_required",
                  "message": "Missing required value."
                }
              }
            }
        `},{code:401,body:`
                {
                  "status": 401,
                  "message": "The request requires valid record authorization token.",
                  "data": {}
                }
            `}],y=o(m[0].code);g(t,{single:!0,title:`Send test email`,children:(t,o)=>{var g=P(),b=l(u(g),2);v(b,{js:`
            import PocketBase from 'pocketbase';

            const pb = new PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection("_superusers").authWithPassword('test@example.com', '1234567890');

            await pb.settings.testEmail("test@example.com", "verification");
        `,dart:`
            import 'package:pocketbase/pocketbase.dart';

            final pb = PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection("_superusers").authWithPassword('test@example.com', '1234567890');

            await pb.settings.testEmail("test@example.com", "verification");
        `});var x=l(b,14),S=p(x);e(S,5,()=>m,e=>e.code,(e,t)=>{var o=M();let c;var l=d(o,!0);a(()=>{c=s(o,1,`tab-item`,null,c,{active:i(y)===i(t).code}),n(l,i(t).code)}),h(`click`,o,()=>f(y,i(t).code)),r(e,o)}),c(S);var C=l(S,2);e(C,5,()=>m,e=>e.code,(e,t)=>{var n=N();let o;var l=p(n);_(l,{get content(){return i(t).body}}),c(n),a(()=>o=s(n,1,`tab-item`,null,o,{active:i(y)===i(t).code})),r(e,n)}),c(C),c(x),r(t,g)},$$slots:{default:!0}})}var I=t(`<button> </button>`),L=t(`<div><!></div>`),R=t(`<div class="content m-b-sm"><p>Generates a new Apple OAuth2 client secret key.</p> <p>Only superusers can perform this action.</p></div> <!> <h6 class="m-b-xs">API details</h6> <div class="api-route alert alert-success"><strong class="label label-primary">POST</strong> <div class="content">/api/settings/apple/generate-client-secret</div> <small class="txt-hint auth-header">Requires <code>Authorization:TOKEN</code></small></div> <div class="section-title">Body Parameters</div> <table class="table-compact table-border"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><tr><td><div class="inline-flex"><span class="label label-success">Required</span> <span class="txt">clientId</span></div></td><td><span class="label">String</span></td><td>The identifier of your app (aka. Service ID).</td></tr><tr><td><div class="inline-flex"><span class="label label-success">Required</span> <span class="txt">teamId</span></div></td><td><span class="label">String</span></td><td>10-character string associated with your developer account (usually could be found next to
                    your name in the Apple Developer site).</td></tr><tr><td><div class="inline-flex"><span class="label label-success">Required</span> <span class="txt">keyId</span></div></td><td><span class="label">String</span></td><td>10-character key identifier generated for the "Sign in with Apple" private key associated
                    with your developer account.</td></tr><tr><td><div class="inline-flex"><span class="label label-success">Required</span> <span class="txt">privateKey</span></div></td><td><span class="label">String</span></td><td>PrivateKey is the private key associated to your app.</td></tr><tr><td><div class="inline-flex"><span class="label label-success">Required</span> <span class="txt">duration</span></div></td><td><span class="label">Number</span></td><td>Duration specifies how long the generated JWT token should be considered valid. <br/> The specified value must be in seconds and max 15777000 (~6months).</td></tr></tbody></table> <small class="block txt-hint m-t-10 m-b-base">Body parameters could be sent as <em>JSON</em> or <em>multipart/form-data</em>.</small> <div class="section-title">Responses</div> <div class="tabs"><div class="tabs-header compact combined left"></div> <div class="tabs-content"></div></div>`,1);function z(t){let m=[{code:200,body:`
                {
                    "secret": "..."
                }
            `},{code:400,body:`
                {
                  "status": 400,
                  "message": "Failed to generate client secret. Raw error:...",
                  "data": {}
                }
            `},{code:401,body:`
                {
                  "status": 401,
                  "message": "The request requires valid record authorization token.",
                  "data": {}
                }
            `}],y=o(m[0].code);g(t,{single:!0,title:`Generate Apple client secret`,children:(t,o)=>{var g=R(),b=l(u(g),2);v(b,{js:`
            import PocketBase from 'pocketbase';

            const pb = new PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection("_superusers").authWithPassword('test@example.com', '1234567890');

            await pb.settings.generateAppleClientSecret(clientId, teamId, keyId, privateKey, duration)
        `,dart:`
            import 'package:pocketbase/pocketbase.dart';

            final pb = PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection("_superusers").authWithPassword('test@example.com', '1234567890');

            await pb.settings.generateAppleClientSecret(clientId, teamId, keyId, privateKey, duration)
        `});var x=l(b,14),S=p(x);e(S,5,()=>m,e=>e.code,(e,t)=>{var o=I();let c;var l=d(o,!0);a(()=>{c=s(o,1,`tab-item`,null,c,{active:i(y)===i(t).code}),n(l,i(t).code)}),h(`click`,o,()=>f(y,i(t).code)),r(e,o)}),c(S);var C=l(S,2);e(C,5,()=>m,e=>e.code,(e,t)=>{var n=L();let o;var l=p(n);_(l,{get content(){return i(t).body}}),c(n),a(()=>o=s(n,1,`tab-item`,null,o,{active:i(y)===i(t).code})),r(e,n)}),c(C),c(x),r(t,g)},$$slots:{default:!0}})}var B=t(`<div class="accordions"><!> <!> <!> <!> <!></div>`);function V(e){var t=B(),n=p(t);C(n,{});var i=l(n,2);D(i,{});var a=l(i,2);j(a,{});var o=l(a,2);F(o,{}),z(l(o,2),{}),c(t),r(e,t)}export{V as component};