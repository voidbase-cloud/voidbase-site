import{I as e,P as t,V as n,X as r,_ as i,bt as a,gt as o,ht as s,it as c,lt as l,nt as u,o as d,tt as f,yt as p}from"../chunks/BDLcFjNi.js";import"../chunks/xihTtKlq.js";import"../chunks/C3kXMaAy.js";import{t as m}from"../chunks/DxB8CMVb.js";import{t as h}from"../chunks/BnicrACe.js";import{t as g}from"../chunks/CKGhWLYV.js";import{t as _}from"../chunks/CKC416Ky.js";var v=e(`<!> <!> <p><a target="_blank" rel="noopener noreferrer"><code>app.Store()</code></a> returns a concurrent-safe application memory store that you can use to store anything for the duration of the
    application process (e.g. cache, config flags, etc.).</p> <p>You can find more details about the available store methods in the <a target="_blank" rel="noopener noreferrer"><code>store.Store</code></a> documentation but the most commonly used ones are <code>Get(key)</code>, <code>Set(key, value)</code> and <code>GetOrSet(key, setFunc)</code>.</p> <!> <div class="alert alert-warning"><div class="icon"><i class="ri-error-warning-line"></i></div> <div class="content"><p>Keep in mind that the application store is also used internally usually with <code>pb*</code> prefixed keys (e.g. the collections cache is stored under the <code>pbAppCachedCollections</code> key) and changing these system keys or calling <code>RemoveAll()</code>/<code>Reset()</code> could
            have unintended side-effects.</p> <p>If you want more advanced control you can initialize your own store independent from the
            application instance via <code>store.New[K, T](nil)</code>.</p></div></div> <!> <p><em>Below are listed some of the most commonly used security helpers but you can find detailed
        documentation for all available methods in the <a target="_blank" rel="noopener noreferrer"><code>security</code></a> subpackage.</em></p> <!> <!> <!> <!> <!> <!>`,1);function y(e,y){o(y,!1),d();var b=v(),x=u(b);_(x,{});var S=c(x,2);h(S,{title:`app.Store()`});var C=c(S,2),w=f(C);p(),a(C);var T=c(C,2),E=c(f(T));p(7),a(T);var D=c(T,2);g(D,{language:`go`,content:`
        app.Store().Set("example", 123)

        v1 := app.Store().Get("example").(int) // 123

        v2 := app.Store().GetOrSet("example2", func() any {
            // this setter is invoked only once unless "example2" is removed
            // (e.g. suitable for instantiating singletons)
            return 456
        }).(int) // 456
    `});var O=c(D,4);h(O,{title:`Security helpers`});var k=c(O,2),A=f(k),j=c(f(A));p(),a(A),a(k);var M=c(k,2);h(M,{title:`Generating random strings`,tag:`h5`});var N=c(M,2);g(N,{language:`go`,content:`
        secret := security.RandomString(10) // e.g. a35Vdb10Z4

        secret := security.RandomStringWithAlphabet(5, "1234567890") // e.g. 33215
    `});var P=c(N,2);h(P,{title:`Compare strings with constant time`,tag:`h5`});var F=c(P,2);g(F,{language:`go`,content:`
        isEqual := security.Equal(hash1, hash2)
    `});var I=c(F,2);h(I,{title:`AES Encrypt/Decrypt`,tag:`h5`});var L=c(I,2);{let e=l(()=>`
        // must be random 32 characters string
        const key = "`+m.randomString(32)+`"

        encrypted, err := security.Encrypt([]byte("test"), key)
        if err != nil {
            return err
        }

        decrypted := security.Decrypt(encrypted, key) // []byte("test")
    `);g(L,{language:`go`,get content(){return n(e)}})}r(()=>{i(w,`href`,`https://pkg.go.dev/github.com/pocketbase/pocketbase/core#BaseApp.Store`),i(E,`href`,`https://pkg.go.dev/github.com/pocketbase/pocketbase/tools/store#Store`),i(j,`href`,`https://pkg.go.dev/github.com/pocketbase/pocketbase/tools/security`)}),t(e,b),s()}export{y as component};