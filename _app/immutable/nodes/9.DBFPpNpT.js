import{A as e,I as t,N as n,P as r,V as i,X as a,at as o,b as s,bt as c,it as l,nt as u,rt as d,st as f,tt as p,yt as m,z as h}from"../chunks/BDLcFjNi.js";import"../chunks/xihTtKlq.js";import"../chunks/C3kXMaAy.js";import{t as g}from"../chunks/B6gCHVlt.js";import{t as _}from"../chunks/CKGhWLYV.js";import{t as v}from"../chunks/CfPCrhHi.js";import{t as y}from"../chunks/DK-N8Yuz.js";import{t as b}from"../chunks/zqPRTk6w.js";import{t as x}from"../chunks/BMrla5zq.js";var S=t(`<button> </button>`),C=t(`<div><!></div>`),w=t(`<div class="content m-b-sm"><p>Returns a paginated Collections list.</p> <p>Only superusers can perform this action.</p></div> <!> <h6 class="m-b-xs">API details</h6> <div class="api-route alert alert-info"><strong class="label label-primary">GET</strong> <div class="content">/api/collections</div> <small class="txt-hint auth-header">Requires <code>Authorization:TOKEN</code></small></div> <div class="section-title">Query parameters</div> <table class="table-compact table-border m-b-base"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><tr><td id="query-page">page</td><td><span class="label">Number</span></td><td>The page (aka. offset) of the paginated list (<em>default to 1</em>).</td></tr><tr><td id="query-perPage">perPage</td><td><span class="label">Number</span></td><td>The max returned collections per page (<em>default to 30</em>).</td></tr><tr><td id="query-sort">sort</td><td><span class="label">String</span></td><td><div class="content"><p>Specify the <em>ORDER BY</em> fields.</p> <p>Add <code>-</code> / <code>+</code> (default) in front of the attribute for DESC /
                            ASC order, e.g.:</p> <!> <p><strong>Supported collection sort fields:</strong> <br/> <code>@random</code>, <code>id</code>, <code>created</code>, <code>updated</code>, <code>name</code>, <code>type</code>, <code>system</code></p></div></td></tr><tr><td id="query-filter">filter</td><td><span class="label">String</span></td><td><div class="content"><p>Filter expression to filter/search the returned collections list, e.g.:</p> <!> <p><strong>Supported collection filter fields:</strong> <br/> <code>id</code>, <code>created</code>, <code>updated</code>, <code>name</code>, <code>type</code>, <code>system</code></p> <!></div></td></tr><!><!></tbody></table> <div class="section-title">Responses</div> <div class="tabs"><div class="tabs-header compact combined left"></div> <div class="tabs-content"></div></div>`,1);function T(t){let T=[{code:200,body:`
                {
                  "page": 1,
                  "perPage": 2,
                  "totalItems": 10,
                  "totalPages": 5,
                  "items": [
                    {
                      "id": "_pbc_344172009",
                      "listRule": null,
                      "viewRule": null,
                      "createRule": null,
                      "updateRule": null,
                      "deleteRule": null,
                      "name": "users",
                      "type": "auth",
                      "fields": [
                        {
                          "autogeneratePattern": "[a-z0-9]{15}",
                          "hidden": false,
                          "id": "text3208210256",
                          "max": 15,
                          "min": 15,
                          "name": "id",
                          "pattern": "^[a-z0-9]+$",
                          "presentable": false,
                          "primaryKey": true,
                          "required": true,
                          "system": true,
                          "type": "text"
                        },
                        {
                          "cost": 0,
                          "hidden": true,
                          "id": "password901924565",
                          "max": 0,
                          "min": 8,
                          "name": "password",
                          "pattern": "",
                          "presentable": false,
                          "required": true,
                          "system": true,
                          "type": "password"
                        },
                        {
                          "autogeneratePattern": "[a-zA-Z0-9]{50}",
                          "hidden": true,
                          "id": "text2504183744",
                          "max": 60,
                          "min": 30,
                          "name": "tokenKey",
                          "pattern": "",
                          "presentable": false,
                          "primaryKey": false,
                          "required": true,
                          "system": true,
                          "type": "text"
                        },
                        {
                          "exceptDomains": null,
                          "hidden": false,
                          "id": "email3885137012",
                          "name": "email",
                          "onlyDomains": null,
                          "presentable": false,
                          "required": true,
                          "system": true,
                          "type": "email"
                        },
                        {
                          "hidden": false,
                          "id": "bool1547992806",
                          "name": "emailVisibility",
                          "presentable": false,
                          "required": false,
                          "system": true,
                          "type": "bool"
                        },
                        {
                          "hidden": false,
                          "id": "bool256245529",
                          "name": "verified",
                          "presentable": false,
                          "required": false,
                          "system": true,
                          "type": "bool"
                        },
                        {
                          "autogeneratePattern": "",
                          "hidden": false,
                          "id": "text1579384326",
                          "max": 255,
                          "min": 0,
                          "name": "name",
                          "pattern": "",
                          "presentable": false,
                          "primaryKey": false,
                          "required": false,
                          "system": false,
                          "type": "text"
                        },
                        {
                          "hidden": false,
                          "id": "file376926767",
                          "maxSelect": 1,
                          "maxSize": 0,
                          "mimeTypes": [
                            "image/jpeg",
                            "image/png",
                            "image/svg+xml",
                            "image/gif",
                            "image/webp"
                          ],
                          "name": "avatar",
                          "presentable": false,
                          "protected": false,
                          "required": false,
                          "system": false,
                          "thumbs": null,
                          "type": "file"
                        },
                        {
                          "hidden": false,
                          "id": "autodate2990389176",
                          "name": "created",
                          "onCreate": true,
                          "onUpdate": false,
                          "presentable": false,
                          "system": false,
                          "type": "autodate"
                        },
                        {
                          "hidden": false,
                          "id": "autodate3332085495",
                          "name": "updated",
                          "onCreate": true,
                          "onUpdate": true,
                          "presentable": false,
                          "system": false,
                          "type": "autodate"
                        }
                      ],
                      "indexes": [
                        "CREATE UNIQUE INDEX \`idx_tokenKey__pbc_344172009\` ON \`users\` (\`tokenKey\`)",
                        "CREATE UNIQUE INDEX \`idx_email__pbc_344172009\` ON \`users\` (\`email\`) WHERE \`email\` != ''"
                      ],
                      "system": false,
                      "authRule": "",
                      "manageRule": null,
                      "authAlert": {
                        "enabled": true,
                        "emailTemplate": {
                          "subject": "Login from a new location",
                          "body": "..."
                        }
                      },
                      "oauth2": {
                        "enabled": false,
                        "mappedFields": {
                          "id": "",
                          "name": "name",
                          "username": "",
                          "avatarURL": "avatar"
                        },
                        "providers": [
                            {
                                "pkce": null,
                                "name": "google",
                                "clientId": "abc",
                                "authURL": "",
                                "tokenURL": "",
                                "userInfoURL": "",
                                "displayName": "",
                                "extra": null
                            }
                        ]
                      },
                      "passwordAuth": {
                        "enabled": true,
                        "identityFields": [
                          "email"
                        ]
                      },
                      "mfa": {
                        "enabled": false,
                        "duration": 1800,
                        "rule": ""
                      },
                      "otp": {
                        "enabled": false,
                        "duration": 180,
                        "length": 8,
                        "emailTemplate": {
                          "subject": "OTP for {APP_NAME}",
                          "body": "..."
                        }
                      },
                      "authToken": {
                        "duration": 604800
                      },
                      "passwordResetToken": {
                        "duration": 1800
                      },
                      "emailChangeToken": {
                        "duration": 1800
                      },
                      "verificationToken": {
                        "duration": 259200
                      },
                      "fileToken": {
                        "duration": 180
                      },
                      "verificationTemplate": {
                        "subject": "Verify your {APP_NAME} email",
                        "body": "..."
                      },
                      "resetPasswordTemplate": {
                        "subject": "Reset your {APP_NAME} password",
                        "body": "..."
                      },
                      "confirmEmailChangeTemplate": {
                        "subject": "Confirm your {APP_NAME} new email address",
                        "body": "..."
                      }
                    },
                    {
                      "id": "_pbc_2287844090",
                      "listRule": null,
                      "viewRule": null,
                      "createRule": null,
                      "updateRule": null,
                      "deleteRule": null,
                      "name": "posts",
                      "type": "base",
                      "fields": [
                        {
                          "autogeneratePattern": "[a-z0-9]{15}",
                          "hidden": false,
                          "id": "text3208210256",
                          "max": 15,
                          "min": 15,
                          "name": "id",
                          "pattern": "^[a-z0-9]+$",
                          "presentable": false,
                          "primaryKey": true,
                          "required": true,
                          "system": true,
                          "type": "text"
                        },
                        {
                          "autogeneratePattern": "",
                          "hidden": false,
                          "id": "text724990059",
                          "max": 0,
                          "min": 0,
                          "name": "title",
                          "pattern": "",
                          "presentable": false,
                          "primaryKey": false,
                          "required": false,
                          "system": false,
                          "type": "text"
                        },
                        {
                          "hidden": false,
                          "id": "autodate2990389176",
                          "name": "created",
                          "onCreate": true,
                          "onUpdate": false,
                          "presentable": false,
                          "system": false,
                          "type": "autodate"
                        },
                        {
                          "hidden": false,
                          "id": "autodate3332085495",
                          "name": "updated",
                          "onCreate": true,
                          "onUpdate": true,
                          "presentable": false,
                          "system": false,
                          "type": "autodate"
                        }
                      ],
                      "indexes": [],
                      "system": false
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
                  "message": "Only superusers can perform this action.",
                  "data": {}
                }
            `}],E=o(T[0].code);g(t,{single:!0,title:`List collections`,children:(t,o)=>{var g=w(),D=l(u(g),2);v(D,{js:`
            import PocketBase from 'pocketbase';

            const pb = new PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection("_superusers").authWithPassword('test@example.com', '1234567890');

            // fetch a paginated collections list
            const pageResult = await pb.collections.getList(1, 100, {
                filter: 'created >= "2022-01-01 00:00:00"',
            });

            // you can also fetch all collections at once via getFullList
            const collections = await pb.collections.getFullList({ sort: '-created' });

            // or fetch only the first collection that matches the specified filter
            const collection = await pb.collections.getFirstListItem('type="auth"');
        `,dart:`
            import 'package:pocketbase/pocketbase.dart';

            final pb = PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection("_superusers").authWithPassword('test@example.com', '1234567890');

            // fetch a paginated collections list
            final pageResult = await pb.collections.getList(
                page: 1,
                perPage: 100,
                filter: 'created >= "2022-01-01 00:00:00"',
            );

            // you can also fetch all collections at once via getFullList
            final collections = await pb.collections.getFullList(sort: '-created');

            // or fetch only the first collection that matches the specified filter
            final collection = await pb.collections.getFirstListItem('type="auth"');
        `});var O=l(D,8),k=l(p(O)),A=l(p(k),2),j=l(p(A),2),M=p(j),N=l(p(M),4);_(N,{content:`
                                // DESC by created and ASC by id
                                ?sort=-created,id
                            `}),m(2),c(M),c(j),c(A);var P=l(A),F=l(p(P),2),I=p(F),L=l(p(I),2);_(L,{content:`
                                ?filter=(name~'abc' && created>'2022-01-01')
                            `});var R=l(L,4);b(R,{}),c(I),c(F),c(P);var z=l(P);y(z,{});var B=l(z);x(B,{}),c(k),c(O);var V=l(O,4),H=p(V);e(H,5,()=>T,e=>e.code,(e,t)=>{var o=S();let c;var l=d(o,!0);a(()=>{c=s(o,1,`tab-item`,null,c,{active:i(E)===i(t).code}),n(l,i(t).code)}),h(`click`,o,()=>f(E,i(t).code)),r(e,o)}),c(H);var U=l(H,2);e(U,5,()=>T,e=>e.code,(e,t)=>{var n=C();let o;var l=p(n);_(l,{get content(){return i(t).body}}),c(n),a(()=>o=s(n,1,`tab-item`,null,o,{active:i(E)===i(t).code})),r(e,n)}),c(U),c(V),r(t,g)},$$slots:{default:!0}})}var E=t(`<button> </button>`),D=t(`<div><!></div>`),O=t(`<div class="content m-b-sm"><p>Returns a single Collection by its ID or name.</p> <p>Only superusers can perform this action.</p></div> <!> <h6 class="m-b-xs">API details</h6> <div class="api-route alert alert-info"><strong class="label label-primary">GET</strong> <div class="content">/api/collections/<code>collectionIdOrName</code></div> <small class="txt-hint auth-header">Requires <code>Authorization:TOKEN</code></small></div> <div class="section-title">Path parameters</div> <table class="table-compact table-border m-b-base"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><tr><td>collectionIdOrName</td><td><span class="label">String</span></td><td>ID or name of the collection to view.</td></tr></tbody></table> <div class="section-title">Query parameters</div> <table class="table-compact table-border m-b-base"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><!></tbody></table> <div class="section-title">Responses</div> <div class="tabs"><div class="tabs-header compact combined left"></div> <div class="tabs-content"></div></div>`,1);function k(t){let m=[{code:200,body:`
                {
                  "id": "_pbc_2287844090",
                  "listRule": null,
                  "viewRule": null,
                  "createRule": null,
                  "updateRule": null,
                  "deleteRule": null,
                  "name": "posts",
                  "type": "base",
                  "fields": [
                    {
                      "autogeneratePattern": "[a-z0-9]{15}",
                      "hidden": false,
                      "id": "text3208210256",
                      "max": 15,
                      "min": 15,
                      "name": "id",
                      "pattern": "^[a-z0-9]+$",
                      "presentable": false,
                      "primaryKey": true,
                      "required": true,
                      "system": true,
                      "type": "text"
                    },
                    {
                      "autogeneratePattern": "",
                      "hidden": false,
                      "id": "text724990059",
                      "max": 0,
                      "min": 0,
                      "name": "title",
                      "pattern": "",
                      "presentable": false,
                      "primaryKey": false,
                      "required": false,
                      "system": false,
                      "type": "text"
                    },
                    {
                      "hidden": false,
                      "id": "autodate2990389176",
                      "name": "created",
                      "onCreate": true,
                      "onUpdate": false,
                      "presentable": false,
                      "system": false,
                      "type": "autodate"
                    },
                    {
                      "hidden": false,
                      "id": "autodate3332085495",
                      "name": "updated",
                      "onCreate": true,
                      "onUpdate": true,
                      "presentable": false,
                      "system": false,
                      "type": "autodate"
                    }
                  ],
                  "indexes": [],
                  "system": false
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
            `}],b=o(m[0].code);g(t,{single:!0,title:`View collection`,children:(t,o)=>{var g=O(),x=l(u(g),2);v(x,{js:`
            import PocketBase from 'pocketbase';

            const pb = new PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection("_superusers").authWithPassword('test@example.com', '1234567890');

            const collection = await pb.collections.getOne('demo');
        `,dart:`
            import 'package:pocketbase/pocketbase.dart';

            final pb = PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection("_superusers").authWithPassword('test@example.com', '1234567890');

            final collection = await pb.collections.getOne('demo');
        `});var S=l(x,12),C=l(p(S)),w=p(C);y(w,{}),c(C),c(S);var T=l(S,4),k=p(T);e(k,5,()=>m,e=>e.code,(e,t)=>{var o=E();let c;var l=d(o,!0);a(()=>{c=s(o,1,`tab-item`,null,c,{active:i(b)===i(t).code}),n(l,i(t).code)}),h(`click`,o,()=>f(b,i(t).code)),r(e,o)}),c(k);var A=l(k,2);e(A,5,()=>m,e=>e.code,(e,t)=>{var n=D();let o;var l=p(n);_(l,{get content(){return i(t).body}}),c(n),a(()=>o=s(n,1,`tab-item`,null,o,{active:i(b)===i(t).code})),r(e,n)}),c(A),c(T),r(t,g)},$$slots:{default:!0}})}var A=t(`<button> </button>`),j=t(`<div><!></div>`),M=t(`<div class="content m-b-sm"><p>Creates a new Collection.</p> <p>Only superusers can perform this action.</p></div> <!> <h6 class="m-b-xs">API details</h6> <div class="api-route alert alert-success"><strong class="label label-primary">POST</strong> <div class="content">/api/collections</div> <small class="txt-hint auth-header">Requires <code>Authorization:TOKEN</code></small></div> <div class="section-title">Body Parameters</div> <p class="txt-hint">Body parameters could be sent as <em>JSON</em> or <em>multipart/form-data</em>.</p> <!> <div class="section-title">Query parameters</div> <table class="table-compact table-border m-b-base"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><!></tbody></table> <div class="section-title">Responses</div> <div class="tabs"><div class="tabs-header compact combined left"></div> <div class="tabs-content"></div></div>`,1);function N(t){let m=[{code:200,body:`
                {
                  "id": "_pbc_2287844090",
                  "listRule": null,
                  "viewRule": null,
                  "createRule": null,
                  "updateRule": null,
                  "deleteRule": null,
                  "name": "posts",
                  "type": "base",
                  "fields": [
                    {
                      "autogeneratePattern": "[a-z0-9]{15}",
                      "hidden": false,
                      "id": "text3208210256",
                      "max": 15,
                      "min": 15,
                      "name": "id",
                      "pattern": "^[a-z0-9]+$",
                      "presentable": false,
                      "primaryKey": true,
                      "required": true,
                      "system": true,
                      "type": "text"
                    },
                    {
                      "autogeneratePattern": "",
                      "hidden": false,
                      "id": "text724990059",
                      "max": 0,
                      "min": 0,
                      "name": "title",
                      "pattern": "",
                      "presentable": false,
                      "primaryKey": false,
                      "required": false,
                      "system": false,
                      "type": "text"
                    },
                    {
                      "hidden": false,
                      "id": "autodate2990389176",
                      "name": "created",
                      "onCreate": true,
                      "onUpdate": false,
                      "presentable": false,
                      "system": false,
                      "type": "autodate"
                    },
                    {
                      "hidden": false,
                      "id": "autodate3332085495",
                      "name": "updated",
                      "onCreate": true,
                      "onUpdate": true,
                      "presentable": false,
                      "system": false,
                      "type": "autodate"
                    }
                  ],
                  "indexes": [],
                  "system": false
                }
            `},{code:400,body:`
                {
                  "status": 400,
                  "message": "An error occurred while submitting the form.",
                  "data": {
                    "title": {
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
            `},{code:403,body:`
                {
                  "status": 403,
                  "message": "The authorized record is not allowed to perform this action.",
                  "data": {}
                }
            `}],b=o(m[0].code);g(t,{single:!0,title:`Create collection`,children:(t,o)=>{var g=M(),x=l(u(g),2);v(x,{js:`
            import PocketBase from 'pocketbase';

            const pb = new PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection("_superusers").authWithPassword('test@example.com', '1234567890');

            // create base collection
            const base = await pb.collections.create({
                name: 'exampleBase',
                type: 'base',
                fields: [
                    {
                        name: 'title',
                        type: 'text',
                        required: true,
                        min: 10,
                    },
                    {
                        name: 'status',
                        type: 'bool',
                    },
                ],
            });

            // create auth collection
            const auth = await pb.collections.create({
                name: 'exampleAuth',
                type: 'auth',
                createRule: 'id = @request.auth.id',
                updateRule: 'id = @request.auth.id',
                deleteRule: 'id = @request.auth.id',
                fields: [
                    {
                        name: 'name',
                        type: 'text',
                    }
                ],
                passwordAuth: {
                    enabled: true,
                    identityFields: ['email']
                },
            });

            // create view collection
            const view = await pb.collections.create({
                name: 'exampleView',
                type: 'view',
                listRule: '@request.auth.id != ""',
                viewRule: null,
                // the schema will be autogenerated from the below query
                viewQuery: 'SELECT id, name from posts',
            });
        `,dart:`
            import 'package:pocketbase/pocketbase.dart';

            final pb = PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection("_superusers").authWithPassword('test@example.com', '1234567890');

            // create base collection
            final base = await pb.collections.create(body: {
                'name': 'exampleBase',
                'type': 'base',
                'fields': [
                    {
                        'name': 'title',
                        'type': 'text',
                        'required': true,
                        'min': 10,
                    },
                    {
                        'name': 'status',
                        'type': 'bool',
                    },
                ],
            });

            // create auth collection
            final auth = await pb.collections.create(body: {
                'name': 'exampleAuth',
                'type': 'auth',
                'createRule': 'id = @request.auth.id',
                'updateRule': 'id = @request.auth.id',
                'deleteRule': 'id = @request.auth.id',
                'fields': [
                    {
                        'name': 'name',
                        'type': 'text',
                    }
                ],
                'passwordAuth': {
                    'enabled': true,
                    'identityFields': ['email']
                },
            });

            // create view collection
            final view = await pb.collections.create(body: {
                'name': 'exampleView',
                'type': 'view',
                'listRule': '@request.auth.id != ""',
                'viewRule': null,
                // the schema will be autogenerated from the below query
                'viewQuery': 'SELECT id, name from posts',
            });
        `});var S=l(x,10);_(S,{content:`
        {
            // 15 characters string to store as collection ID.
            // If not set, it will be auto generated.
            id (optional): string

            // Unique collection name (used as a table name for the records table).
            name (required):  string

            // Type of the collection.
            // If not set, the collection type will be "base" by default.
            type (optional): "base" | "view" | "auth"

            // List with the collection fields.
            // This field is optional and autopopulated for "view" collections based on the viewQuery.
            fields (required|optional): Array<Field>

            // The collection indexes and unique constraints.
            // Note that "view" collections don't support indexes.
            indexes (optional): Array<string>

            // Marks the collection as "system" to prevent being renamed, deleted or modify its API rules.
            system (optional): boolean

            // CRUD API rules
            listRule (optional):   null|string
            viewRule (optional):   null|string
            createRule (optional): null|string
            updateRule (optional): null|string
            deleteRule (optional): null|string

            // -------------------------------------------------------
            // view options
            // -------------------------------------------------------

            viewQuery (required):  string

            // -------------------------------------------------------
            // auth options
            // -------------------------------------------------------

            // API rule that gives admin-like permissions to allow fully managing the auth record(s),
            // e.g. changing the password without requiring to enter the old one, directly updating the
            // verified state or email, etc. This rule is executed in addition to the createRule and updateRule.
            manageRule (optional): null|string

            // API rule that could be used to specify additional record constraints applied after record
            // authentication and right before returning the auth token response to the client.
            //
            // For example, to allow only verified users you could set it to "verified = true".
            //
            // Set it to empty string to allow any Auth collection record to authenticate.
            //
            // Set it to null to disallow authentication altogether for the collection.
            authRule (optional): null|string

            // AuthAlert defines options related to the auth alerts on new device login.
            authAlert (optional): {
                enabled (optional): boolean
                emailTemplate (optional): {
                    subject (required): string
                    body (required):    string
                }
            }

            // OAuth2 specifies whether OAuth2 auth is enabled for the collection
            // and which OAuth2 providers are allowed.
            oauth2 (optional): {
                enabled (optional): boolean
                mappedFields (optional): {
                    id (optional):        string
                    name (optional):      string
                    username (optional):  string
                    avatarURL (optional): string
                }
                providers (optional): [
                    {
                        name (required):         string
                        clientId (required):     string
                        clientSecret (required): string
                        authURL (optional):      string
                        tokenURL (optional):     string
                        userInfoURL (optional):  string
                        displayName (optional):  string
                        pkce (optional):         null|boolean
                        extra (optional):        null|Object<string,any>
                    }
                ]
            }

            // PasswordAuth defines options related to the collection password authentication.
            passwordAuth (optional): {
                enabled (optional):        boolean
                identityFields (required): Array<string>
            }

            // MFA defines options related to the Multi-factor authentication (MFA).
            mfa (optional):{
                enabled (optional):  boolean
                duration (required): number
                rule (optional):     string
            }

            // OTP defines options related to the One-time password authentication (OTP).
            otp (optional): {
                enabled (optional):  boolean
                duration (required): number
                length (required):   number
                emailTemplate (optional): {
                    subject (required): string
                    body (required):    string
                }
            }

            // Token configurations.
            authToken (optional): {
                duration (required): number
                secret (required):   string
            }
            passwordResetToken (optional): {
                duration (required): number
                secret (required):   string
            }
            emailChangeToken (optional): {
                duration (required): number
                secret (required):   string
            }
            verificationToken (optional): {
                duration (required): number
                secret (required):   string
            }
            fileToken (optional): {
                duration (required): number
                secret (required):   string
            }

            // Default email templates.
            verificationTemplate (optional): {
                subject (required): string
                body (required):    string
            }
            resetPasswordTemplate (optional): {
                subject (required): string
                body (required):    string
            }
            confirmEmailChangeTemplate (optional): {
                subject (required): string
                body (required):    string
            }
        }
    `});var C=l(S,4),w=l(p(C)),T=p(w);y(T,{}),c(w),c(C);var E=l(C,4),D=p(E);e(D,5,()=>m,e=>e.code,(e,t)=>{var o=A();let c;var l=d(o,!0);a(()=>{c=s(o,1,`tab-item`,null,c,{active:i(b)===i(t).code}),n(l,i(t).code)}),h(`click`,o,()=>f(b,i(t).code)),r(e,o)}),c(D);var O=l(D,2);e(O,5,()=>m,e=>e.code,(e,t)=>{var n=j();let o;var l=p(n);_(l,{get content(){return i(t).body}}),c(n),a(()=>o=s(n,1,`tab-item`,null,o,{active:i(b)===i(t).code})),r(e,n)}),c(O),c(E),r(t,g)},$$slots:{default:!0}})}var P=t(`<button> </button>`),F=t(`<div><!></div>`),I=t(`<div class="content m-b-sm"><p>Updates a single Collection by its ID or name.</p> <p>Only superusers can perform this action.</p></div> <!> <h6 class="m-b-xs">API details</h6> <div class="api-route alert alert-warning"><strong class="label label-primary">PATCH</strong> <div class="content">/api/collections/<code>collectionIdOrName</code></div> <small class="txt-hint auth-header">Requires <code>Authorization:TOKEN</code></small></div> <div class="section-title">Path parameters</div> <table class="table-compact table-border m-b-base"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><tr><td>collectionIdOrName</td><td><span class="label">String</span></td><td>ID or name of the collection to view.</td></tr></tbody></table> <div class="section-title">Body Parameters</div> <p class="txt-hint">Body parameters could be sent as <em>JSON</em> or <em>multipart/form-data</em>.</p> <!> <div class="section-title">Query parameters</div> <table class="table-compact table-border m-b-base"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><!></tbody></table> <div class="section-title">Responses</div> <div class="tabs"><div class="tabs-header compact combined left"></div> <div class="tabs-content"></div></div>`,1);function L(t){let m=[{code:200,body:`
                {
                  "id": "_pbc_2287844090",
                  "listRule": null,
                  "viewRule": null,
                  "createRule": null,
                  "updateRule": null,
                  "deleteRule": null,
                  "name": "posts",
                  "type": "base",
                  "fields": [
                    {
                      "autogeneratePattern": "[a-z0-9]{15}",
                      "hidden": false,
                      "id": "text3208210256",
                      "max": 15,
                      "min": 15,
                      "name": "id",
                      "pattern": "^[a-z0-9]+$",
                      "presentable": false,
                      "primaryKey": true,
                      "required": true,
                      "system": true,
                      "type": "text"
                    },
                    {
                      "autogeneratePattern": "",
                      "hidden": false,
                      "id": "text724990059",
                      "max": 0,
                      "min": 0,
                      "name": "title",
                      "pattern": "",
                      "presentable": false,
                      "primaryKey": false,
                      "required": false,
                      "system": false,
                      "type": "text"
                    },
                    {
                      "hidden": false,
                      "id": "autodate2990389176",
                      "name": "created",
                      "onCreate": true,
                      "onUpdate": false,
                      "presentable": false,
                      "system": false,
                      "type": "autodate"
                    },
                    {
                      "hidden": false,
                      "id": "autodate3332085495",
                      "name": "updated",
                      "onCreate": true,
                      "onUpdate": true,
                      "presentable": false,
                      "system": false,
                      "type": "autodate"
                    }
                  ],
                  "indexes": [],
                  "system": false
                }
            `},{code:400,body:`
                {
                  "status": 400,
                  "message": "An error occurred while submitting the form.",
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
            `},{code:403,body:`
                {
                  "status": 403,
                  "message": "The authorized record is not allowed to perform this action.",
                  "data": {}
                }
            `}],b=o(m[0].code);g(t,{single:!0,title:`Update collection`,children:(t,o)=>{var g=I(),x=l(u(g),2);v(x,{js:`
            import PocketBase from 'pocketbase';

            const pb = new PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection("_superusers").authWithPassword('test@example.com', '123456');

            const collection = await pb.collections.update('demo', {
                name: 'new_demo',
                listRule: 'created > "2022-01-01 00:00:00"',
            });
        `,dart:`
            import 'package:pocketbase/pocketbase.dart';

            final pb = PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection("_superusers").authWithPassword('test@example.com', '123456');

            final collection = await pb.collections.update('demo', body: {
                'name': 'new_demo',
                'listRule': 'created > "2022-01-01 00:00:00"',
            });
        `});var S=l(x,14);_(S,{content:`
        {
            // Unique collection name (used as a table name for the records table).
            name (required):  string

            // List with the collection fields.
            // This field is optional and autopopulated for "view" collections based on the viewQuery.
            fields (required|optional): Array<Field>

            // The collection indexes and unique constriants.
            // Note that "view" collections don't support indexes.
            indexes (optional): Array<string>

            // Marks the collection as "system" to prevent being renamed, deleted or modify its API rules.
            system (optional): boolean

            // CRUD API rules
            listRule (optional):   null|string
            viewRule (optional):   null|string
            createRule (optional): null|string
            updateRule (optional): null|string
            deleteRule (optional): null|string

            // -------------------------------------------------------
            // view options
            // -------------------------------------------------------

            viewQuery (required):  string

            // -------------------------------------------------------
            // auth options
            // -------------------------------------------------------

            // API rule that gives admin-like permissions to allow fully managing the auth record(s),
            // e.g. changing the password without requiring to enter the old one, directly updating the
            // verified state or email, etc. This rule is executed in addition to the createRule and updateRule.
            manageRule (optional): null|string

            // API rule that could be used to specify additional record constraints applied after record
            // authentication and right before returning the auth token response to the client.
            //
            // For example, to allow only verified users you could set it to "verified = true".
            //
            // Set it to empty string to allow any Auth collection record to authenticate.
            //
            // Set it to null to disallow authentication altogether for the collection.
            authRule (optional): null|string

            // AuthAlert defines options related to the auth alerts on new device login.
            authAlert (optional): {
                enabled (optional): boolean
                emailTemplate (optional): {
                    subject (required): string
                    body (required):    string
                }
            }

            // OAuth2 specifies whether OAuth2 auth is enabled for the collection
            // and which OAuth2 providers are allowed.
            oauth2 (optional): {
                enabled (optional): boolean
                mappedFields (optional): {
                    id (optional):        string
                    name (optional):      string
                    username (optional):  string
                    avatarURL (optional): string
                }
                providers (optional): [
                    {
                        name (required):         string
                        clientId (required):     string
                        clientSecret (required): string
                        authURL (optional):      string
                        tokenURL (optional):     string
                        userInfoURL (optional):  string
                        displayName (optional):  string
                        pkce (optional):         null|boolean
                        extra (optional):        null|Object<string,any>
                    }
                ]
            }

            // PasswordAuth defines options related to the collection password authentication.
            passwordAuth (optional): {
                enabled (optional):        boolean
                identityFields (required): Array<string>
            }

            // MFA defines options related to the Multi-factor authentication (MFA).
            mfa (optional):{
                enabled (optional):  boolean
                duration (required): number
                rule (optional):     string
            }

            // OTP defines options related to the One-time password authentication (OTP).
            otp (optional): {
                enabled (optional):  boolean
                duration (required): number
                length (required):   number
                emailTemplate (optional): {
                    subject (required): string
                    body (required):    string
                }
            }

            // Token configurations.
            authToken (optional): {
                duration (required): number
                secret (required):   string
            }
            passwordResetToken (optional): {
                duration (required): number
                secret (required):   string
            }
            emailChangeToken (optional): {
                duration (required): number
                secret (required):   string
            }
            verificationToken (optional): {
                duration (required): number
                secret (required):   string
            }
            fileToken (optional): {
                duration (required): number
                secret (required):   string
            }

            // Default email templates.
            verificationTemplate (optional): {
                subject (required): string
                body (required):    string
            }
            resetPasswordTemplate (optional): {
                subject (required): string
                body (required):    string
            }
            confirmEmailChangeTemplate (optional): {
                subject (required): string
                body (required):    string
            }
        }
    `});var C=l(S,4),w=l(p(C)),T=p(w);y(T,{}),c(w),c(C);var E=l(C,4),D=p(E);e(D,5,()=>m,e=>e.code,(e,t)=>{var o=P();let c;var l=d(o,!0);a(()=>{c=s(o,1,`tab-item`,null,c,{active:i(b)===i(t).code}),n(l,i(t).code)}),h(`click`,o,()=>f(b,i(t).code)),r(e,o)}),c(D);var O=l(D,2);e(O,5,()=>m,e=>e.code,(e,t)=>{var n=F();let o;var l=p(n);_(l,{get content(){return i(t).body}}),c(n),a(()=>o=s(n,1,`tab-item`,null,o,{active:i(b)===i(t).code})),r(e,n)}),c(O),c(E),r(t,g)},$$slots:{default:!0}})}var R=t(`<button> </button>`),z=t(`<div><!></div>`),B=t(`<div class="content m-b-sm"><p>Deletes a single Collection by its ID or name.</p> <p>Only superusers can perform this action.</p></div> <!> <h6 class="m-b-xs">API details</h6> <div class="api-route alert alert-danger"><strong class="label label-primary">DELETE</strong> <div class="content">/api/collections/<code>collectionIdOrName</code></div> <small class="txt-hint auth-header">Requires <code>Authorization:TOKEN</code></small></div> <div class="section-title">Path parameters</div> <table class="table-compact table-border m-b-base"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><tr><td>collectionIdOrName</td><td><span class="label">String</span></td><td>ID or name of the collection to view.</td></tr></tbody></table> <div class="section-title">Responses</div> <div class="tabs"><div class="tabs-header compact combined left"></div> <div class="tabs-content"></div></div>`,1);function V(t){let m=[{code:204,body:`null`},{code:400,body:`
                {
                  "status": 400,
                  "message": "Failed to delete collection. Make sure that the collection is not referenced by other collections.",
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
            `},{code:404,body:`
                {
                  "status": 404,
                  "message": "The requested resource wasn't found.",
                  "data": {}
                }
            `}],y=o(m[0].code);g(t,{single:!0,title:`Delete collection`,children:(t,o)=>{var g=B(),b=l(u(g),2);v(b,{js:`
            import PocketBase from 'pocketbase';

            const pb = new PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection("_superusers").authWithPassword('test@example.com', '1234567890');

            await pb.collections.delete('demo');
        `,dart:`
            import 'package:pocketbase/pocketbase.dart';

            final pb = PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection("_superusers").authWithPassword('test@example.com', '1234567890');

            await pb.collections.delete('demo');
        `});var x=l(b,12),S=p(x);e(S,5,()=>m,e=>e.code,(e,t)=>{var o=R();let c;var l=d(o,!0);a(()=>{c=s(o,1,`tab-item`,null,c,{active:i(y)===i(t).code}),n(l,i(t).code)}),h(`click`,o,()=>f(y,i(t).code)),r(e,o)}),c(S);var C=l(S,2);e(C,5,()=>m,e=>e.code,(e,t)=>{var n=z();let o;var l=p(n);_(l,{get content(){return i(t).body}}),c(n),a(()=>o=s(n,1,`tab-item`,null,o,{active:i(y)===i(t).code})),r(e,n)}),c(C),c(x),r(t,g)},$$slots:{default:!0}})}var H=t(`<button> </button>`),U=t(`<div><!></div>`),W=t(`<div class="content m-b-sm"><p>Deletes all the records of a single collection (including their related files and cascade delete
            enabled relations).</p> <p>Only superusers can perform this action.</p></div> <!> <h6 class="m-b-xs">API details</h6> <div class="api-route alert alert-danger"><strong class="label label-primary">DELETE</strong> <div class="content">/api/collections/<code>collectionIdOrName</code>/truncate</div> <small class="txt-hint auth-header">Requires <code>Authorization:TOKEN</code></small></div> <div class="section-title">Path parameters</div> <table class="table-compact table-border m-b-base"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><tr><td>collectionIdOrName</td><td><span class="label">String</span></td><td>ID or name of the collection to truncate.</td></tr></tbody></table> <div class="section-title">Responses</div> <div class="tabs"><div class="tabs-header compact combined left"></div> <div class="tabs-content"></div></div>`,1);function G(t){let m=[{code:204,body:`null`},{code:400,body:`
                {
                  "status": 400,
                  "message": "Failed to truncate collection (most likely due to required cascade delete record references).",
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
            `},{code:404,body:`
                {
                  "status": 404,
                  "message": "The requested resource wasn't found.",
                  "data": {}
                }
            `}],y=o(m[0].code);g(t,{single:!0,title:`Truncate collection`,children:(t,o)=>{var g=W(),b=l(u(g),2);v(b,{js:`
            import PocketBase from 'pocketbase';

            const pb = new PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection("_superusers").authWithPassword('test@example.com', '1234567890');

            await pb.collections.truncate('demo');
        `,dart:`
            import 'package:pocketbase/pocketbase.dart';

            final pb = PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection("_superusers").authWithPassword('test@example.com', '1234567890');

            await pb.collections.truncate('demo');
        `});var x=l(b,12),S=p(x);e(S,5,()=>m,e=>e.code,(e,t)=>{var o=H();let c;var l=d(o,!0);a(()=>{c=s(o,1,`tab-item`,null,c,{active:i(y)===i(t).code}),n(l,i(t).code)}),h(`click`,o,()=>f(y,i(t).code)),r(e,o)}),c(S);var C=l(S,2);e(C,5,()=>m,e=>e.code,(e,t)=>{var n=U();let o;var l=p(n);_(l,{get content(){return i(t).body}}),c(n),a(()=>o=s(n,1,`tab-item`,null,o,{active:i(y)===i(t).code})),r(e,n)}),c(C),c(x),r(t,g)},$$slots:{default:!0}})}var K=t(`<button> </button>`),q=t(`<div><!></div>`),J=t(`<div class="content m-b-sm"><p>Bulk imports the provided <em>Collections</em> configuration.</p> <p>Only superusers can perform this action.</p></div> <!> <h6 class="m-b-xs">API details</h6> <div class="api-route alert alert-warning"><strong class="label label-primary">PUT</strong> <div class="content">/api/collections/import</div> <small class="txt-hint auth-header">Requires <code>Authorization:TOKEN</code></small></div> <div class="section-title">Body Parameters</div> <table class="table-compact table-border"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><tr><td><div class="inline-flex"><span class="label label-success">Required</span> <span class="txt">collections</span></div></td><td><span class="label"></span></td><td>List of collections to import (replace and create).</td></tr><tr><td><div class="inline-flex"><span class="label label-warning">Optional</span> <span class="txt">deleteMissing</span></div></td><td><span class="label">Boolean</span></td><td>If <em>true</em> all existing collections and schema fields that are not present in the
                    imported configuration <strong>will be deleted</strong>, including their related records
                    data (default to <em>false</em>).</td></tr></tbody></table> <small class="block txt-hint m-t-10 m-b-base">Body parameters could be sent as <em>JSON</em> or <em>multipart/form-data</em>.</small> <div class="section-title">Responses</div> <div class="tabs"><div class="tabs-header compact combined left"></div> <div class="tabs-content"></div></div>`,1);function Y(t){let y=[{code:204,body:`null`},{code:400,body:`
                {
                  "status": 400,
                  "message": "An error occurred while submitting the form.",
                  "data": {
                    "collections": {
                      "code": "collections_import_failure",
                      "message": "Failed to import the collections configuration."
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
            `}],b=o(y[0].code);g(t,{single:!0,title:`Import collections`,children:(t,o)=>{var g=J(),x=l(u(g),2);v(x,{js:`
            import PocketBase from 'pocketbase';

            const pb = new PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection("_superusers").authWithPassword('test@example.com', '1234567890');

            const importData = [
                {
                    name: 'collection1',
                    schema: [
                        {
                            name: 'status',
                            type: 'bool',
                        },
                    ],
                },
                {
                    name: 'collection2',
                    schema: [
                        {
                            name: 'title',
                            type: 'text',
                        },
                    ],
                },
            ];

            await pb.collections.import(importData, false);
        `,dart:`
            import 'package:pocketbase/pocketbase.dart';

            final pb = PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection("_superusers").authWithPassword('test@example.com', '1234567890');

            final importData = [
                CollectionModel(
                    name: "collection1",
                    schema: [
                        SchemaField(name: "status", type: "bool"),
                    ],
                ),
                CollectionModel(
                    name: "collection2",
                    schema: [
                        SchemaField(name: "title", type: "text"),
                    ],
                ),
            ];

            await pb.collections.import(importData, deleteMissing: false);
        `});var S=l(x,8),C=l(p(S)),w=p(C),T=l(p(w)),E=p(T);E.textContent=`Array<Collection>`,c(T),m(),c(w),m(),c(C),c(S);var D=l(S,6),O=p(D);e(O,5,()=>y,e=>e.code,(e,t)=>{var o=K();let c;var l=d(o,!0);a(()=>{c=s(o,1,`tab-item`,null,c,{active:i(b)===i(t).code}),n(l,i(t).code)}),h(`click`,o,()=>f(b,i(t).code)),r(e,o)}),c(O);var k=l(O,2);e(k,5,()=>y,e=>e.code,(e,t)=>{var n=q();let o;var l=p(n);_(l,{get content(){return i(t).body}}),c(n),a(()=>o=s(n,1,`tab-item`,null,o,{active:i(b)===i(t).code})),r(e,n)}),c(k),c(D),r(t,g)},$$slots:{default:!0}})}var X=t(`<button> </button>`),Z=t(`<div><!></div>`),Q=t(`<div class="content m-b-sm"><p>Returns an object with all of the collection types and their default fields <em>(used primarily in the Dashboard UI)</em>.</p> <p>Only superusers can perform this action.</p></div> <!> <h6 class="m-b-xs">API details</h6> <div class="api-route alert alert-info"><strong class="label label-primary">GET</strong> <div class="content">/api/collections/meta/scaffolds</div> <small class="txt-hint auth-header">Requires <code>Authorization:TOKEN</code></small></div> <div class="section-title">Responses</div> <div class="tabs"><div class="tabs-header compact combined left"></div> <div class="tabs-content"></div></div>`,1);function $(t){let m=[{code:200,body:`
                {
                    "auth": {
                        "id": "",
                        "listRule": null,
                        "viewRule": null,
                        "createRule": null,
                        "updateRule": null,
                        "deleteRule": null,
                        "name": "",
                        "type": "auth",
                        "fields": [
                            {
                                "autogeneratePattern": "[a-z0-9]{15}",
                                "hidden": false,
                                "id": "text3208210256",
                                "max": 15,
                                "min": 15,
                                "name": "id",
                                "pattern": "^[a-z0-9]+$",
                                "presentable": false,
                                "primaryKey": true,
                                "required": true,
                                "system": true,
                                "type": "text"
                            },
                            {
                                "cost": 0,
                                "hidden": true,
                                "id": "password901924565",
                                "max": 0,
                                "min": 8,
                                "name": "password",
                                "pattern": "",
                                "presentable": false,
                                "required": true,
                                "system": true,
                                "type": "password"
                            },
                            {
                                "autogeneratePattern": "[a-zA-Z0-9]{50}",
                                "hidden": true,
                                "id": "text2504183744",
                                "max": 60,
                                "min": 30,
                                "name": "tokenKey",
                                "pattern": "",
                                "presentable": false,
                                "primaryKey": false,
                                "required": true,
                                "system": true,
                                "type": "text"
                            },
                            {
                                "exceptDomains": null,
                                "hidden": false,
                                "id": "email3885137012",
                                "name": "email",
                                "onlyDomains": null,
                                "presentable": false,
                                "required": true,
                                "system": true,
                                "type": "email"
                            },
                            {
                                "hidden": false,
                                "id": "bool1547992806",
                                "name": "emailVisibility",
                                "presentable": false,
                                "required": false,
                                "system": true,
                                "type": "bool"
                            },
                            {
                                "hidden": false,
                                "id": "bool256245529",
                                "name": "verified",
                                "presentable": false,
                                "required": false,
                                "system": true,
                                "type": "bool"
                            }
                        ],
                        "indexes": [
                            "CREATE UNIQUE INDEX \`idx_tokenKey_hclGvwhtqG\` ON \`test\` (\`tokenKey\`)",
                            "CREATE UNIQUE INDEX \`idx_email_eyxYyd3gp1\` ON \`test\` (\`email\`) WHERE \`email\` != ''"
                        ],
                        "created": "",
                        "updated": "",
                        "system": false,
                        "authRule": "",
                        "manageRule": null,
                        "authAlert": {
                            "enabled": true,
                            "emailTemplate": {
                                "subject": "Login from a new location",
                                "body": "..."
                            }
                        },
                        "oauth2": {
                            "providers": [],
                            "mappedFields": {
                                "id": "",
                                "name": "",
                                "username": "",
                                "avatarURL": ""
                            },
                            "enabled": false
                        },
                        "passwordAuth": {
                            "enabled": true,
                            "identityFields": [
                                "email"
                            ]
                        },
                        "mfa": {
                            "enabled": false,
                            "duration": 1800,
                            "rule": ""
                        },
                        "otp": {
                            "enabled": false,
                            "duration": 180,
                            "length": 8,
                            "emailTemplate": {
                                "subject": "OTP for {APP_NAME}",
                                "body": "..."
                            }
                        },
                        "authToken": {
                            "duration": 604800
                        },
                        "passwordResetToken": {
                            "duration": 1800
                        },
                        "emailChangeToken": {
                            "duration": 1800
                        },
                        "verificationToken": {
                            "duration": 259200
                        },
                        "fileToken": {
                            "duration": 180
                        },
                        "verificationTemplate": {
                            "subject": "Verify your {APP_NAME} email",
                            "body": "..."
                        },
                        "resetPasswordTemplate": {
                            "subject": "Reset your {APP_NAME} password",
                            "body": "..."
                        },
                        "confirmEmailChangeTemplate": {
                            "subject": "Confirm your {APP_NAME} new email address",
                            "body": "..."
                        }
                    },
                    "base": {
                        "id": "",
                        "listRule": null,
                        "viewRule": null,
                        "createRule": null,
                        "updateRule": null,
                        "deleteRule": null,
                        "name": "",
                        "type": "base",
                        "fields": [
                            {
                                "autogeneratePattern": "[a-z0-9]{15}",
                                "hidden": false,
                                "id": "text3208210256",
                                "max": 15,
                                "min": 15,
                                "name": "id",
                                "pattern": "^[a-z0-9]+$",
                                "presentable": false,
                                "primaryKey": true,
                                "required": true,
                                "system": true,
                                "type": "text"
                            }
                        ],
                        "indexes": [],
                        "created": "",
                        "updated": "",
                        "system": false
                    },
                    "view": {
                        "id": "",
                        "listRule": null,
                        "viewRule": null,
                        "createRule": null,
                        "updateRule": null,
                        "deleteRule": null,
                        "name": "",
                        "type": "view",
                        "fields": [],
                        "indexes": [],
                        "created": "",
                        "updated": "",
                        "system": false,
                        "viewQuery": ""
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
            `},{code:404,body:`
                {
                  "status": 404,
                  "message": "The requested resource wasn't found.",
                  "data": {}
                }
            `}],y=o(m[0].code);g(t,{single:!0,title:`Scaffolds`,children:(t,o)=>{var g=Q(),b=l(u(g),2);v(b,{js:`
            import PocketBase from 'pocketbase';

            const pb = new PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection("_superusers").authWithPassword('test@example.com', '1234567890');

            const scaffolds = await pb.collections.getScaffolds();
        `,dart:`
            import 'package:pocketbase/pocketbase.dart';

            final pb = PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection("_superusers").authWithPassword('test@example.com', '1234567890');

            final scaffolds = await pb.collections.getScaffolds();
        `});var x=l(b,8),S=p(x);e(S,5,()=>m,e=>e.code,(e,t)=>{var o=X();let c;var l=d(o,!0);a(()=>{c=s(o,1,`tab-item`,null,c,{active:i(y)===i(t).code}),n(l,i(t).code)}),h(`click`,o,()=>f(y,i(t).code)),r(e,o)}),c(S);var C=l(S,2);e(C,5,()=>m,e=>e.code,(e,t)=>{var n=Z();let o;var l=p(n);_(l,{get content(){return i(t).body}}),c(n),a(()=>o=s(n,1,`tab-item`,null,o,{active:i(y)===i(t).code})),r(e,n)}),c(C),c(x),r(t,g)},$$slots:{default:!0}})}var ee=t(`<button> </button>`),te=t(`<div><!></div>`),ne=t(`<div class="content m-b-sm"><p>Tests the specified view query and returns a sample of its resulting records and fields <em>(used primarily in the Dashboard UI)</em>.</p> <p>Only superusers can perform this action.</p></div> <!> <h6 class="m-b-xs">API details</h6> <div class="api-route alert alert-success"><strong class="label label-primary">POSt</strong> <div class="content">/api/collections/meta/dry-run-view</div> <small class="txt-hint auth-header">Requires <code>Authorization:TOKEN</code></small></div> <div class="section-title">Body Parameters</div> <table class="table-compact table-border m-b-base"><thead><tr><th>Param</th><th>Type</th><th width="50%">Description</th></tr></thead><tbody><tr><td><div class="inline-flex"><span class="label label-success">Required</span> <span>query</span></div></td><td><span class="label">String</span></td><td>The SQL SELECT query to execute.</td></tr></tbody></table> <div class="section-title">Responses</div> <div class="tabs"><div class="tabs-header compact combined left"></div> <div class="tabs-content"></div></div>`,1);function re(t){let m=[{code:200,body:`
                {
                    "fields": [
                        {
                            "autogeneratePattern": "",
                            "help": "",
                            "hidden": false,
                            "id": "text3208210256",
                            "max": 0,
                            "min": 0,
                            "name": "id",
                            "pattern": "^[a-z0-9]+$",
                            "presentable": false,
                            "primaryKey": true,
                            "required": true,
                            "system": true,
                            "type": "text"
                        }
                    ],
                    "sample": [
                        {
                            "collectionId": "pbc_469256437",
                            "collectionName": "temp_view_AFM1r",
                            "id": "p6dnlyu5kczgvzr"
                        }
                    ]
                }
            `},{code:400,body:`
                {
                  "status": 400,
                  "message": "Invalid view query. Raw error: ...",
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
            `}],y=o(m[0].code);g(t,{single:!0,title:`Dry run view query`,children:(t,o)=>{var g=ne(),b=l(u(g),2);v(b,{js:`
            import PocketBase from 'pocketbase';

            const pb = new PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection("_superusers").authWithPassword('test@example.com', '1234567890');

            const result = await pb.collections.dryRunViewQuery("SELECT id FROM users");
        `,dart:`
            import 'package:pocketbase/pocketbase.dart';

            final pb = PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection("_superusers").authWithPassword('test@example.com', '1234567890');

            final result = await pb.collections.dryRunViewQuery("SELECT id FROM users");
        `});var x=l(b,12),S=p(x);e(S,5,()=>m,e=>e.code,(e,t)=>{var o=ee();let c;var l=d(o,!0);a(()=>{c=s(o,1,`tab-item`,null,c,{active:i(y)===i(t).code}),n(l,i(t).code)}),h(`click`,o,()=>f(y,i(t).code)),r(e,o)}),c(S);var C=l(S,2);e(C,5,()=>m,e=>e.code,(e,t)=>{var n=te();let o;var l=p(n);_(l,{get content(){return i(t).body}}),c(n),a(()=>o=s(n,1,`tab-item`,null,o,{active:i(y)===i(t).code})),r(e,n)}),c(C),c(x),r(t,g)},$$slots:{default:!0}})}var ie=t(`<button> </button>`),ae=t(`<div><!></div>`),oe=t(`<div class="content m-b-sm"><p>Returns a list with all configurable OAuth2 providers <em>(used primarily in the Dashboard UI)</em>.</p> <p>Only superusers can perform this action.</p></div> <!> <h6 class="m-b-xs">API details</h6> <div class="api-route alert alert-info"><strong class="label label-primary">GET</strong> <div class="content">/api/collections/meta/oauth2-providers</div> <small class="txt-hint auth-header">Requires <code>Authorization:TOKEN</code></small></div> <div class="section-title">Responses</div> <div class="tabs"><div class="tabs-header compact combined left"></div> <div class="tabs-content"></div></div>`,1);function se(t){let m=[{code:200,body:`
                [
                    {
                        "name": "apple",
                        "displayName": "Apple",
                        "logo": "..."
                    },
                    {
                        "name": "google",
                        "displayName": "Google",
                        "logo": "..."
                    },
                    {
                        "name": "microsoft",
                        "displayName": "Microsoft",
                        "logo": "..."
                    },
                    ...
                ]
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
            `}],y=o(m[0].code);g(t,{single:!0,title:`List all configurable OAuth2 providers`,children:(t,o)=>{var g=oe(),b=l(u(g),2);v(b,{js:`
            import PocketBase from 'pocketbase';

            const pb = new PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection("_superusers").authWithPassword('test@example.com', '1234567890');

            const providers = await pb.collections.getAllOAuth2Providers();
        `,dart:`
            import 'package:pocketbase/pocketbase.dart';

            final pb = PocketBase('http://127.0.0.1:8090');

            ...

            await pb.collection("_superusers").authWithPassword('test@example.com', '1234567890');

            final providers = await pb.collections.getAllOAuth2Providers();
        `});var x=l(b,8),S=p(x);e(S,5,()=>m,e=>e.code,(e,t)=>{var o=ie();let c;var l=d(o,!0);a(()=>{c=s(o,1,`tab-item`,null,c,{active:i(y)===i(t).code}),n(l,i(t).code)}),h(`click`,o,()=>f(y,i(t).code)),r(e,o)}),c(S);var C=l(S,2);e(C,5,()=>m,e=>e.code,(e,t)=>{var n=ae();let o;var l=p(n);_(l,{get content(){return i(t).body}}),c(n),a(()=>o=s(n,1,`tab-item`,null,o,{active:i(y)===i(t).code})),r(e,n)}),c(C),c(x),r(t,g)},$$slots:{default:!0}})}var ce=t(`<div class="accordions"><!> <!> <!> <!> <!> <!> <!> <!> <!> <!></div>`);function le(e){var t=ce(),n=p(t);T(n,{});var i=l(n,2);k(i,{});var a=l(i,2);N(a,{});var o=l(a,2);L(o,{});var s=l(o,2);V(s,{});var u=l(s,2);G(u,{});var d=l(u,2);Y(d,{});var f=l(d,2);$(f,{});var m=l(f,2);re(m,{}),se(l(m,2),{}),c(t),r(e,t)}export{le as component};