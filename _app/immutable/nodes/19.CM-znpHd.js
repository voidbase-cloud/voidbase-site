import{I as e,P as t,S as n,V as r,X as i,at as a,b as o,bt as s,it as c,nt as l,st as u,tt as d,yt as f,z as p}from"../chunks/BDLcFjNi.js";import"../chunks/xihTtKlq.js";import"../chunks/C3kXMaAy.js";import{t as m}from"../chunks/JhE-H64I.js";import{t as h}from"../chunks/BnicrACe.js";import{t as g}from"../chunks/CKGhWLYV.js";import{t as _}from"../chunks/CfPCrhHi.js";import{t as v}from"../chunks/CKC416Ky.js";var y=`
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>OAuth2 links page</title>
    <script src="https://code.jquery.com/jquery-3.7.1.slim.min.js"><\/script>
</head>
<body>
    <ul id="list">
        <li>Loading OAuth2 providers...</li>
    </ul>

    <script type="module">
        import PocketBase from "https://cdn.jsdelivr.net/gh/pocketbase/js-sdk@master/dist/pocketbase.es.mjs"

        const pb          = new PocketBase("http://127.0.0.1:8090");
        const redirectURL = "http://127.0.0.1:8090/redirect.html";

        const authMethods = await pb.collection("users").listAuthMethods();
        const providers   = authMethods.oauth2?.providers || [];
        const listItems   = [];

        for (const provider of providers) {
            const $li = $(\`<li><a>Login with \${provider.name}</a></li>\`);

            $li.find("a")
                .attr("href", provider.authURL + redirectURL)
                .data("provider", provider)
                .click(function () {
                    // store provider's data on click for verification in the redirect page
                    localStorage.setItem("provider", JSON.stringify($(this).data("provider")));
                });

            listItems.push($li);
        }

        $("#list").html(listItems.length ? listItems : "<li>No OAuth2 providers.</li>");
    <\/script>
</body>
</html>
`,b=`
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>OAuth2 redirect page</title>
</head>
<body>
    <pre id="content">Authenticating...</pre>

    <script type="module">
        import PocketBase from "https://cdn.jsdelivr.net/gh/pocketbase/js-sdk@master/dist/pocketbase.es.mjs"

        const pb          = new PocketBase("http://127.0.0.1:8090");
        const redirectURL = "http://127.0.0.1:8090/redirect.html";
        const contentEl   = document.getElementById("content");

        // parse the query parameters from the redirected url
        const params = (new URL(window.location)).searchParams;

        // load the previously stored provider's data
        const provider = JSON.parse(localStorage.getItem("provider"))

        // compare the redirect's state param and the stored provider's one
        if (provider.state !== params.get("state")) {
            contentEl.innerText = "State parameters don't match.";
        } else {
            // authenticate
            pb.collection("users").authWithOAuth2Code(
                provider.name,
                params.get("code"),
                provider.codeVerifier,
                redirectURL,
                // pass any optional user create data
                {
                    emailVisibility: false,
                }
            ).then((authData) => {
                contentEl.innerText = JSON.stringify(authData, null, 2);
            }).catch((err) => {
                contentEl.innerText = "Failed to exchange code.\\n" + err;
            });
        }
    <\/script>
</body>
</html>
`,x=e(`<div class="alert alert-info m-t-10 m-b-10"><div class="icon"><i class="ri-information-line"></i></div> <div class="content"><p>Before starting, you'll need to create an OAuth2 app in the provider's dashboard in order to get a <strong>Client Id</strong> and <strong>Client Secret</strong>, and register a redirect URL <i class="ri-question-line link-hint"></i>.</p> <p>Once you have obtained the <strong>Client Id</strong> and <strong>Client Secret</strong>, you can
            enable and configure the provider from your PocketBase auth collection options (<em class="txt-sm"></em>).</p></div></div> <div class="tabs"><div class="tabs-header compact left"><button>All in one (<em>recommended</em>)</button> <button>Manual code exchange</button></div> <div class="tabs-content"><div><p>This method handles everything within a single call without having to define custom redirects,
                deeplinks or even page reload.</p> <p><strong>When creating your OAuth2 app, for a callback/redirect URL you have to use the <code class="txt-bold">https://yourdomain.com/api/oauth2-redirect</code></strong> (<em>or when testing locally - <code>http://127.0.0.1:8090/api/oauth2-redirect</code></em>).</p> <div class="clearfix m-b-xs"></div> <!></div> <div><p>When authenticating manually with OAuth2 code you'll need 2 endpoints:</p> <ul><li>somewhere to show the "Login with ..." links</li> <li>somewhere to handle the provider's redirect in order to exchange the auth code for token</li></ul> <p>Here is a simple web example:</p> <ol><li class="m-b-xs"><p><strong>Links page</strong> (e.g. https://127.0.0.1:8090 serving <code>pb_public/index.html</code>):</p> <!></li> <li class="m-b-xs"><p><strong>Redirect handler page</strong> (e.g. https://127.0.0.1:8090/redirect.html serving <code>pb_public/redirect.html</code>):</p> <!></li></ol> <div class="alert alert-info m-t-xs"><div class="icon"><i class="ri-information-line"></i></div> <div class="content"><p>When using the "Manual code exchange" flow for sign-in with Apple your redirect
                        handler must accept <code>POST</code> requests in order to receive the name and the
                        email of the Apple user. If you just need the Apple user id, you can keep the redirect
                        handler <code>GET</code> but you'll need to replace in the Apple authorization url <code>response_mode=form_post</code> with <code>response_mode=query</code>.</p></div></div></div></div></div>`,1);function S(e){let h=`all_in_one`,v=`manual`,S=a(h);var C=x(),w=l(C),T=c(d(w),2),E=d(T),D=c(d(E),5);n(D,(e,t)=>m?.(e,t),()=>`For the "All in one" flow it should be 
https://yourdomain.com/api/oauth2-redirect.

For the "Manual code exchange" flow, the redirect URL is your own custom endpoint.`),f(),s(E);var O=c(E,2),k=c(d(O),5);k.textContent=`PocketBase > Collections >
                {YOUR_COLLECTION}
                > Edit collection (settings cogwheel) > Options
                > OAuth2`,f(),s(O),s(T),s(w);var A=c(w,2),j=d(A),M=d(j);let N;var P=c(M,2);let F;s(j);var I=c(j,2),L=d(I);let R;var z=c(d(L),6);_(z,{js:`
                    import PocketBase from 'pocketbase';

                    const pb = new PocketBase('https://pocketbase.io');

                    ...

                    // This method initializes a one-off realtime subscription and will
                    // open a popup window with the OAuth2 vendor page to authenticate.
                    //
                    // Once the external OAuth2 sign-in/sign-up flow is completed, the popup
                    // window will be automatically closed and the OAuth2 data sent back
                    // to the user through the previously established realtime connection.
                    //
                    // If the popup is being blocked on Safari, make sure that your click handler is not using async/await.
                    pb.collection('users').authWithOAuth2({
                        provider: 'google'
                    }).then((authData) => {
                        console.log(authData)

                        // after the above you can also access the auth data from the authStore
                        console.log(pb.authStore.isValid);
                        console.log(pb.authStore.token);
                        console.log(pb.authStore.record.id);

                        // "logout" the last authenticated record
                        pb.authStore.clear();
                    });
                `,dart:`
                    import 'package:pocketbase/pocketbase.dart';
                    import 'package:url_launcher/url_launcher.dart';

                    final pb = PocketBase('https://pocketbase.io');

                    ...

                    // This method initializes a one-off realtime subscription and will
                    // call the provided urlCallback with the OAuth2 vendor url to authenticate.
                    //
                    // Once the external OAuth2 sign-in/sign-up flow is completed, the browser
                    // window will be automatically closed and the OAuth2 data sent back
                    // to the user through the previously established realtime connection.
                    //
                    // Note that it requires the app and realtime connection to remain active in the background!
                    // For Android 15+ check the note in https://github.com/pocketbase/dart-sdk#oauth2-and-android-15.
                    final authData = await pb.collection('users').authWithOAuth2('google', (url) async {
                      // or use flutter_custom_tabs to make the transitions between native and web content more seamless
                      await launchUrl(url);
                    });

                    // after the above you can also access the auth data from the authStore
                    print(pb.authStore.isValid);
                    print(pb.authStore.token);
                    print(pb.authStore.record.id);

                    // "logout" the last authenticated record
                    pb.authStore.clear();
                `}),s(L);var B=c(L,2);let V;var H=c(d(B),6),U=d(H),W=c(d(U),2);g(W,{language:`html`,get content(){return y}}),s(U);var G=c(U,2),K=c(d(G),2);g(K,{language:`html`,get content(){return b}}),s(G),s(H),f(2),s(B),s(I),s(A),i(()=>{N=o(M,1,`tab-item active`,null,N,{active:r(S)===h}),F=o(P,1,`tab-item active`,null,F,{active:r(S)===v}),R=o(L,1,`tab-item`,null,R,{active:r(S)===h}),V=o(B,1,`tab-item`,null,V,{active:r(S)===v})}),p(`click`,M,()=>u(S,h)),p(`click`,P,()=>u(S,v)),t(e,C)}var C=e(`<!> <!> <p>A single client is considered authenticated as long as it sends valid <code>Authorization:YOUR_AUTH_TOKEN</code> header with the request.</p> <p>The PocketBase Web APIs are fully stateless and there are no sessions in the traditional sense (even the
    tokens are not stored in the database).</p> <p>Because there are no sessions and we don't store the tokens on the server there is also no logout
    endpoint. To "logout" a user you can simply disregard the token from your local state (aka. <code>pb.authStore.clear()</code> if you use the SDKs).</p> <p>The auth token could be generated either through the specific auth collection Web APIs or programmatically
    via Go/JS.</p> <p>All allowed auth collection methods can be configured individually from the specific auth collection
    options.</p> <div class="alert alert-info m-t-sm m-b-sm"><div class="icon"><i class="ri-information-line"></i></div> <div class="content"><p>Note that PocketBase admins (aka. <code>_superusers</code>) are similar to the regular auth
            collection records with 2 caveats:</p> <ul><li>OAuth2 is not supported as auth method for the <code>_superusers</code> collection</li> <li>Superusers can access and modify anything (collection API rules are ignored)</li></ul></div></div> <!> <div class="content m-b-xs"><p>To authenticate with password you must enable the <em>Identity/Password</em> auth collection option <em>(see also <a href="/docs/api-records/#auth-with-password" target="_blank" class="txt-sm">Web API reference</a> )</em>.</p> <p>The default identity field is the <code>email</code> but you can configure any other unique field like
        "username" (it must have a UNIQUE index).</p></div> <!> <!> <div class="content m-b-xs"><p>To authenticate with email code you must enable the <em>One-time password (OTP)</em> auth collection option <em>(see also <a href="/docs/api-records/#auth-with-otp" target="_blank" class="txt-sm">Web API reference</a> )</em>.</p> <p>The usual flow is the user typing manually the received password from their email but you can also
        adjust the default email template from the collection options and add a url containing the OTP and its
        id as query parameters <em>(you have access to <code></code> and <code></code> placeholders)</em>.</p> <p>Note that when requesting an OTP we return an <code>otpId</code> even if a user with the provided email
        doesn't exist as a very rudimentary enumeration protection (it doesn't create or send anything).</p> <p>On successful OTP validation, by default the related user email will be automatically marked as
        "verified".</p></div> <div class="alert alert-warning m-b-sm"><div class="icon"><i class="ri-error-warning-line"></i></div> <div class="content"><p>Keep in mind that OTP as a standalone authentication method could be less secure compared to the
            other methods because the generated password is usually 0-9 digits and there is a risk of it being
            guessed or enumerated (especially when a longer duration time is configured).</p> <p>For security critical applications OTP is recommended to be used in combination with the other
            auth methods and the <a href="#multi-factor-authentication">Multi-factor authentication</a> option.</p></div></div> <!> <!> <p>You can also authenticate your users with an OAuth2 provider (Google, GitHub, Microsoft, etc.). See the
    section below for example integrations.</p> <!> <!> <div class="content m-b-xs"><p>PocketBase v0.23+ introduced optional Multi-factor authentication (MFA).</p> <p>If enabled, it requires the user to authenticate with any 2 different auth methods from above (the
        order doesn't matter). <br/> The expected flow is:</p> <ol><li>User authenticates with "Auth method A".</li> <li>On success, a 401 response is sent with <code></code> as JSON body (the MFA
            "session" is stored in the <code>_mfas</code> system collection).</li> <li>User authenticates with "Auth method B" as usual <strong>but adds the <code>mfaId</code> from the previous step as body or query parameter</strong>.</li> <li>On success, a regular auth response is returned, aka. token + auth record data.</li></ol> <p>Below is an example for email/password + OTP authentication:</p></div> <!> <!> <div class="content m-b-xs"><p>Superusers have the option to generate tokens and authenticate as anyone else via the <a href="/docs/api-records#impersonate">Impersonate endpoint</a> .</p> <p><strong>The generated impersonate auth tokens can have custom duration but are not renewable!</strong></p> <p>For convenience the official SDKs creates and returns a standalone client that keeps the token state
        in memory, aka. only for the duration of the impersonate client instance.</p></div> <!> <!> <div class="content m-b-xs"><p>While PocketBase doesn't have "API keys" in the traditional sense, as a side effect of the support for
        users impersonation, for such cases you can use instead the generated nonrenewable <code>_superusers</code> impersonate auth token. <br/> You can generate such token via the above impersonate API or from the <em></em>:</p></div> <img src="/images/screenshots/impersonate.png" alt="Screenshot of the _superusers impersonate popup" class="screenshot"/> <div class="alert alert-danger m-t-xs m-b-xs"><div class="icon"><i class="ri-alert-line"></i></div> <div class="content"><p>Because of the security implications (superusers can execute, access and modify anything), use the
            generated <code>_superusers</code> tokens with extreme care and only for internal <strong>server-to-server</strong> communication.</p> <p>To invalidate already issued tokens, you need to change the individual superuser account password
            (or if you want to reset the tokens for all superusers - change the shared auth token secret from
            the <code>_superusers</code> collection options).</p></div></div> <!> <p>PocketBase doesn't have a dedicated token verification endpoint, but if you want to verify an existing
    auth token from a 3rd party app you can send an <a href="/docs/api-records/#auth-refresh">Auth refresh</a> call, aka. <code>pb.collection("users").authRefresh()</code>.</p> <p>On valid token - it returns a new token with refreshed <code>exp</code> claim and the latest user data.</p> <p>Otherwise - returns an error response.</p> <p>Note that calling <code>authRefresh</code> doesn't invalidate previously issued tokens and you can safely disregard
    the new one if you don't need it (as mentioned in the beginning - PocketBase doesn't store the tokens on the
    server).</p> <p>Performance wise, the used <code>HS256</code> algorithm for generating the JWT has very little to no
    impact and it is essentially the same in terms of response time as calling <code>getOne("USER_ID")</code> <em>(see <a href="https://github.com/pocketbase/benchmarks/blob/master/results/hetzner_cax11.md#user-auth-refresh" target="_blank" rel="noopener noreferrer">benchmarks</a>)</em>.</p>`,1);function w(e){var n=C(),r=l(n);v(r,{});var i=c(r,2);h(i,{title:`Overview`});var a=c(i,14);h(a,{title:`Authenticate with password`});var o=c(a,4);_(o,{js:`
        import PocketBase from 'pocketbase';

        const pb = new PocketBase('http://127.0.0.1:8090');

        ...

        const authData = await pb.collection("users").authWithPassword('test@example.com', '1234567890');

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

        final authData = await pb.collection("users").authWithPassword('test@example.com', '1234567890');

        // after the above you can also access the auth data from the authStore
        print(pb.authStore.isValid);
        print(pb.authStore.token);
        print(pb.authStore.record.id);

        // "logout" the last authenticated record
        pb.authStore.clear();
    `});var u=c(o,2);h(u,{title:`Authenticate with OTP`});var p=c(u,2),m=c(d(p),2),g=c(d(m)),y=c(d(g));y.textContent=`{OTP}`;var b=c(y,2);b.textContent=`{OTP_ID}`,f(),s(g),f(),s(m),f(4),s(p);var x=c(p,4);_(x,{js:`
        import PocketBase from 'pocketbase';

        const pb = new PocketBase('http://127.0.0.1:8090');

        ...

        // send OTP email to the provided auth record
        const result = await pb.collection('users').requestOTP('test@example.com');

        // ... show a screen/popup to enter the password from the email ...

        // authenticate with the requested OTP id and the email password
        const authData = await pb.collection('users').authWithOTP(result.otpId, "YOUR_OTP");

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
        final result = await pb.collection('users').requestOTP('test@example.com');

        // ... show a screen/popup to enter the password from the email ...

        // authenticate with the requested OTP id and the email password
        final authData = await pb.collection('users').authWithOTP(result.otpId, "YOUR_OTP");

        // after the above you can also access the auth data from the authStore
        print(pb.authStore.isValid);
        print(pb.authStore.token);
        print(pb.authStore.record.id);

        // "logout"
        pb.authStore.clear();
    `});var w=c(x,2);h(w,{title:`Authenticate with OAuth2`});var T=c(w,4);S(T,{});var E=c(T,2);h(E,{title:`Multi-factor authentication`});var D=c(E,2),O=c(d(D),4),k=c(d(O),2),A=c(d(k));A.textContent=`{"mfaId": "..."}`,f(3),s(k),f(4),s(O),f(2),s(D);var j=c(D,2);_(j,{js:`
        import PocketBase from 'pocketbase';

        const pb = new PocketBase('http://127.0.0.1:8090');

        ...

        try {
          await pb.collection('users').authWithPassword('test@example.com', '1234567890');
        } catch (err) {
          const mfaId = err.response?.mfaId;
          if (!mfaId) {
            throw err; // not mfa -> rethrow
          }

          // the user needs to authenticate again with another auth method, for example OTP
          const result = await pb.collection('users').requestOTP('test@example.com');
          // ... show a modal for users to check their email and to enter the received code ...
          await pb.collection('users').authWithOTP(result.otpId, 'EMAIL_CODE', { 'mfaId': mfaId });
        }
    `,dart:`
        import 'package:pocketbase/pocketbase.dart';

        final pb = PocketBase('http://127.0.0.1:8090');

        ...

        try {
          await pb.collection('users').authWithPassword('test@example.com', '1234567890');
        } on ClientException catch (e) {
          final mfaId = e.response['mfaId'];
          if (mfaId == null) {
            throw e; // not mfa -> rethrow
          }

          // the user needs to authenticate again with another auth method, for example OTP
          final result = await pb.collection('users').requestOTP('test@example.com');
          // ... show a modal for users to check their email and to enter the received code ...
          await pb.collection('users').authWithOTP(result.otpId, 'EMAIL_CODE', query: { 'mfaId': mfaId });
        }
    `});var M=c(j,2);h(M,{title:`Users impersonation`});var N=c(M,4);_(N,{js:`
        import PocketBase from 'pocketbase';

        const pb = new PocketBase('http://127.0.0.1:8090');

        ...

        // authenticate as superuser
        await pb.collection("_superusers").authWithPassword("test@example.com", "1234567890");

        // impersonate
        // (the custom token duration is in seconds and it is optional)
        const impersonateClient = await pb.collection("users").impersonate("USER_RECORD_ID", 3600)

        // log the impersonate token and user data
        console.log(impersonateClient.authStore.token);
        console.log(impersonateClient.authStore.record);

        // send requests as the impersonated user
        const items = await impersonateClient.collection("example").getFullList();
    `,dart:`
        import 'package:pocketbase/pocketbase.dart';

        final pb = PocketBase('http://127.0.0.1:8090');

        ...

        // authenticate as superuser
        await pb.collection("_superusers").authWithPassword("test@example.com", "1234567890");

        // impersonate
        // (the custom token duration is in seconds and it is optional)
        final impersonateClient = await pb.collection("users").impersonate("USER_RECORD_ID", 3600)

        // log the impersonate token and user data
        print(impersonateClient.authStore.token);
        print(impersonateClient.authStore.record);

        // send requests as the impersonated user
        final items = await impersonateClient.collection("example").getFullList();
    `});var P=c(N,2);h(P,{title:`API keys`});var F=c(P,2),I=d(F),L=c(d(I),5);L.textContent=`Dashboard > Collections > _superusers > {select superuser} > "Impersonate" dropdown option`,f(),s(I),s(F);var R=c(F,6);h(R,{title:`Auth token verification`}),f(10),t(e,n)}export{w as component};