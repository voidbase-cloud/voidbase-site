import{I as e,P as t,X as n,_ as r,bt as i,gt as a,ht as o,it as s,nt as c,o as l,tt as u,yt as d}from"../chunks/BDLcFjNi.js";import"../chunks/xihTtKlq.js";import"../chunks/C3kXMaAy.js";import{t as f}from"../chunks/CKGhWLYV.js";import{t as p}from"../chunks/CfPCrhHi.js";var m=e(`<p>By default PocketBase sends realtime events only for Record create/update/delete operations (<em>and for the OAuth2 auth redirect</em>), but you are free to send custom realtime messages to the connected clients via the <a target="_blank" rel="noopener noreferrer"><code>app.SubscriptionsBroker()</code></a> instance.</p> <p><a target="_blank" rel="noopener noreferrer"><code>app.SubscriptionsBroker().Clients()</code></a> returns all connected <a target="_blank" rel="noopener noreferrer"><code>subscriptions.Client</code></a> indexed by their unique connection id.</p> <p><a target="_blank" rel="noopener noreferrer"><code>app.SubscriptionsBroker().ChunkedClients(size)</code></a> is similar but returns the result as a chunked slice allowing you to split the iteration across several goroutines
    (usually combined with <a href="https://pkg.go.dev/golang.org/x/sync/errgroup" target="_blank" rel="noopener noreferrer"><code>errgroup</code></a> ).</p> <p>The current auth record associated with a client could be accessed through <code>client.Get(apis.RealtimeClientAuthKey)</code></p> <div class="alert alert-info m-t-xs m-b-xs"><div class="icon"><i class="ri-information-line"></i></div> <div class="content"><p>Note that a single authenticated user could have more than one active realtime connection (aka.
            multiple clients). This could happen for example when opening the same app in different tabs,
            browsers, devices, etc.</p></div></div> <p>Below you can find a minimal code sample that sends a JSON payload to all clients subscribed to the
    "example" topic:</p> <!> <p>From the client-side, users can listen to the custom subscription topic by doing something like:</p> <!>`,1);function h(e,h){a(h,!1),l();var g=m(),_=c(g),v=s(u(_),3);d(),i(_);var y=s(_,2),b=u(y),x=s(b,2);d(),i(y);var S=s(y,2),C=u(S);d(3),i(S);var w=s(S,8);f(w,{language:`go`,content:`
        func notify(app core.App, subscription string, data any) error {
            rawData, err := json.Marshal(data)
            if err != nil {
                return err
            }

            message := subscriptions.Message{
                Name: subscription,
                Data: rawData,
            }

            group := new(errgroup.Group)

            chunks := app.SubscriptionsBroker().ChunkedClients(300)

            for _, chunk := range chunks {
                group.Go(func() error {
                    for _, client := range chunk {
                        if !client.HasSubscription(subscription) {
                            continue
                        }

                        client.Send(message)
                    }

                    return nil
                })
            }

            return group.Wait()
        }

        err := notify(app, "example", map[string]any{"test": 123})
        if err != nil {
            return err
        }
    `});var T=s(w,4);p(T,{js:`
        import PocketBase from 'pocketbase';

        const pb = new PocketBase('http://127.0.0.1:8090');

        ...

        await pb.realtime.subscribe('example', (e) => {
            console.log(e)
        })
    `,dart:`
        import 'package:pocketbase/pocketbase.dart';

        final pb = PocketBase('http://127.0.0.1:8090');

        ...

        await pb.realtime.subscribe('example', (e) {
            print(e)
        })
    `}),n(()=>{r(v,`href`,`https://pkg.go.dev/github.com/pocketbase/pocketbase/core#BaseApp.SubscriptionsBroker`),r(b,`href`,`https://pkg.go.dev/github.com/pocketbase/pocketbase/tools/subscriptions#Broker.Clients`),r(x,`href`,`https://pkg.go.dev/github.com/pocketbase/pocketbase/tools/subscriptions#Client`),r(C,`href`,`https://pkg.go.dev/github.com/pocketbase/pocketbase/tools/subscriptions#Broker.ChunkedClients`)}),t(e,g),o()}export{h as component};