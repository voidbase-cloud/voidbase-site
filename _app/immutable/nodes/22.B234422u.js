import{A as e,I as t,N as n,P as r,V as i,X as a,_ as o,bt as s,gt as c,ht as l,it as u,j as d,lt as f,nt as p,o as m,rt as h,tt as g,yt as _}from"../chunks/BDLcFjNi.js";import"../chunks/xihTtKlq.js";import"../chunks/C3kXMaAy.js";import{t as v}from"../chunks/BnicrACe.js";import{t as y}from"../chunks/CKGhWLYV.js";import{t as b}from"../chunks/CKC416Ky.js";import{t as x}from"../chunks/Dornr7Xw.js";var S=t(`<li><a target="_blank" rel="noopener noreferrer"><code> </code></a></li>`),C=t(`<p>Collections are usually managed via the Dashboard interface, but there are some situations where you may
    want to create or edit a collection programmatically (usually as part of a <a href="/docs/go-migrations">DB migration</a>). You can find all available Collection related operations
    and methods in <a target="_blank" rel="noopener noreferrer"><code>core.App</code></a> and <a target="_blank" rel="noopener noreferrer"><code>core.Collection</code></a> , but below are listed some of the most common ones:</p> <!> <!> <!> <p class="txt-hint">All single collection retrieval methods return <code>nil</code> and <code>sql.ErrNoRows</code> error if no
    collection is found.</p> <!> <!> <p class="txt-hint">All multiple collections retrieval methods return empty slice and <code>nil</code> error if no collections
    are found.</p> <!> <!> <p>In addition to the above query helpers, you can also create custom Collection queries using <a target="_blank" rel="noopener noreferrer"><code>CollectionQuery()</code></a> method. It returns a SELECT DB builder that can be used with the same methods described in the <a href="/docs/go-database">Database guide</a>.</p> <!> <!>  <!> <!> <ul></ul> <!> <!> <!> <!> <!> <!>`,1);function w(t,w){c(w,!1),m();var T=C(),E=p(T),D=u(g(E),3),O=u(D,2);_(),s(E);var k=u(E,2);b(k,{});var A=u(k,2);v(A,{title:`Fetch collections`});var j=u(A,2);v(j,{title:`Fetch single collection`,tag:`h5`});var M=u(j,4);y(M,{language:`go`,content:`
        collection, err := app.FindCollectionByNameOrId("example")
    `});var N=u(M,2);v(N,{title:`Fetch multiple collections`,tag:`h5`});var P=u(N,4);y(P,{language:`go`,content:`
        allCollections, err := app.FindAllCollections()

        authAndViewCollections, err := app.FindAllCollections(core.CollectionTypeAuth, core.CollectionTypeView)
    `});var F=u(P,2);v(F,{title:`Custom collection query`,tag:`h5`});var I=u(F,2),L=u(g(I));_(3),s(I);var R=u(I,2);y(R,{language:`go`,content:`
        import (
            "github.com/pocketbase/dbx"
            "github.com/pocketbase/pocketbase/core"
        )

        ...

        func FindSystemCollections(app core.App) ([]*core.Collection, error) {
            collections := []*core.Collection{}

            err := app.CollectionQuery().
                AndWhere(dbx.HashExp{"system": true}).
                OrderBy("created DESC").
                All(&collections)

            if err != nil {
                return nil, err
            }

            return collections, nil
        }
    `});var z=u(R,2);v(z,{title:`Collection properties`});var B=u(z,2);{let e=f(()=>`
        Id      string
        Name    string
        Type    string // "base", "view", "auth"
        System  bool // !prevent collection rename, deletion and rules change of internal collections like _superusers
        Fields  core.FieldsList
        Indexes types.JSONArray[string]
        Created types.DateTime
        Updated types.DateTime

        // CRUD rules
        ListRule   *string
        ViewRule   *string
        CreateRule *string
        UpdateRule *string
        DeleteRule *string

        // "view" type specific options
        // (see https://github.com/voidbase-cloud/voidbase/blob/master/core/collection_model_view_options.go)
        ViewQuery string

        // "auth" type specific options
        // (see https://github.com/voidbase-cloud/voidbase/blob/master/core/collection_model_auth_options.go)
        AuthRule                   *string
        ManageRule                 *string
        AuthAlert                  core.AuthAlertConfig
        OAuth2                     core.OAuth2Config
        PasswordAuth               core.PasswordAuthConfig
        MFA                        core.MFAConfig
        OTP                        core.OTPConfig
        AuthToken                  core.TokenConfig
        PasswordResetToken         core.TokenConfig
        EmailChangeToken           core.TokenConfig
        VerificationToken          core.TokenConfig
        FileToken                  core.TokenConfig
        VerificationTemplate       core.EmailTemplate
        ResetPasswordTemplate      core.EmailTemplate
        ConfirmEmailChangeTemplate core.EmailTemplate
    `);y(B,{language:`go`,get content(){return i(e)}})}var V=u(B,2);v(V,{title:`Field definitions`});var H=u(V,2);e(H,5,()=>x,d,(e,t)=>{var c=S(),l=g(c),u=g(l),d=h(u);s(l),s(c),a(()=>{o(l,`href`,`https://pkg.go.dev/github.com/pocketbase/pocketbase/core#${i(t)??``}`),n(d,`core.${i(t)??``}`)}),r(e,c)}),s(H);var U=u(H,2);v(U,{title:`Create new collection`});var W=u(U,2);y(W,{language:`go`,content:`
        import (
            "github.com/pocketbase/pocketbase/core"
            "github.com/pocketbase/pocketbase/tools/types"
        )

        ...

        // core.NewAuthCollection("example")
        // core.NewViewCollection("example")
        collection := core.NewBaseCollection("example")

        // set rules
        collection.ViewRule = types.Pointer("@request.auth.id != ''")
        collection.CreateRule = types.Pointer("@request.auth.id != '' && @request.body.user = @request.auth.id")
        collection.UpdateRule = types.Pointer(\`
            @request.auth.id != '' &&
            user = @request.auth.id &&
            (@request.body.user:isset = false || @request.body.user = @request.auth.id)
        \`)

        // add text field
        collection.Fields.Add(&core.TextField{
            Name:     "title",
            Required: true,
            Max:      100,
        })

        // add relation field
        usersCollection, err := app.FindCollectionByNameOrId("users")
        if err != nil {
            return err
        }
        collection.Fields.Add(&core.RelationField{
            Name:          "user",
            Required:      true,
            Max:           100,
            CascadeDelete: true,
            CollectionId:  usersCollection.Id,
        })

        // add autodate/timestamp fields (created/updated)
        collection.Fields.Add(&core.AutodateField{
            Name:     "created",
            OnCreate: true,
        })
        collection.Fields.Add(&core.AutodateField{
            Name:     "updated",
            OnCreate: true,
            OnUpdate: true,
        })

        // or: collection.Indexes = []string{"CREATE UNIQUE INDEX idx_example_user ON example (user)"}
        collection.AddIndex("idx_example_user", true, "user", "")

        // validate and persist
        // (use SaveNoValidate to skip fields validation)
        err = app.Save(collection)
        if err != nil {
            return err
        }
    `});var G=u(W,2);v(G,{title:`Update existing collection`});var K=u(G,2);y(K,{language:`go`,content:`
        import (
            "github.com/pocketbase/pocketbase/core"
            "github.com/pocketbase/pocketbase/tools/types"
        )

        ...

        collection, err := app.FindCollectionByNameOrId("example")
        if err != nil {
            return err
        }

        // change rule
        collection.DeleteRule = types.Pointer("@request.auth.id != ''")

        // add new editor field
        collection.Fields.Add(&core.EditorField{
            Name:     "description",
            Required: true,
        })

        // change existing field
        // (returns a pointer and direct modifications are allowed without the need of reinsert)
        titleField := collection.Fields.GetByName("title").(*core.TextField)
        titleField.Min = 10

        // or: collection.Indexes = append(collection.Indexes, "CREATE INDEX idx_example_title ON example (title)")
        collection.AddIndex("idx_example_title", false, "title", "")

        // validate and persist
        // (use SaveNoValidate to skip fields validation)
        err = app.Save(collection)
        if err != nil {
            return err
        }
    `});var q=u(K,2);v(q,{title:`Delete collection`});var J=u(q,2);y(J,{language:`go`,content:`
        collection, err := app.FindCollectionByNameOrId("example")
        if err != nil {
            return err
        }

        err = app.Delete(collection)
        if err != nil {
            return err
        }
    `}),a(()=>{o(D,`href`,`https://pkg.go.dev/github.com/pocketbase/pocketbase/core#App`),o(O,`href`,`https://pkg.go.dev/github.com/pocketbase/pocketbase/core#Collection`),o(L,`href`,`https://pkg.go.dev/github.com/pocketbase/pocketbase/core#CollectionQuery`)}),r(t,T),l()}export{w as component};