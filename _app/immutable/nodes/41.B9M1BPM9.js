import{A as e,I as t,N as n,P as r,V as i,X as a,_ as o,bt as s,it as c,j as l,nt as u,rt as d,tt as f}from"../chunks/BDLcFjNi.js";import"../chunks/xihTtKlq.js";import"../chunks/C3kXMaAy.js";import{t as p}from"../chunks/BnicrACe.js";import{t as m}from"../chunks/CKGhWLYV.js";import{t as h}from"../chunks/CKC416Ky.js";import{t as g}from"../chunks/Dornr7Xw.js";var _=t(`<li><a target="_blank" rel="noopener noreferrer"><code> </code></a></li>`),v=t(`<p>Collections are usually managed via the Dashboard interface, but there are some situations where you may
    want to create or edit a collection programmatically (usually as part of a <a href="/docs/js-migrations">DB migration</a>). You can find all available Collection related operations
    and methods in <a href="/jsvm/modules/_app.html" target="_blank" rel="noopener noreferrer"><code>$app</code></a> and <a href="/jsvm/classes/Collection.html" target="_blank" rel="noopener noreferrer"><code>Collection</code></a> , but below are listed some of the most common ones:</p> <!> <!> <!> <p class="txt-hint">All single collection retrieval methods throw an error if no collection is found.</p> <!> <!> <p class="txt-hint">All multiple collections retrieval methods return an empty array if no collections are found.</p> <!> <!> <p>In addition to the above query helpers, you can also create custom Collection queries using <a href="/jsvm/functions/_app.collectionQuery.html" target="_blank" rel="noopener noreferrer"><code>$app.collectionQuery()</code></a> method. It returns a SELECT DB builder that can be used with the same methods described in the <a href="/docs/js-database">Database guide</a>.</p> <!> <!> <div class="alert alert-info m-t-sm m-b-sm"><div class="icon"><i class="ri-information-line"></i></div> <div class="content"><p>All collection fields <em>(with exception of the <code>JSONField</code>)</em> are non-nullable and
            use a zero-default for their respective type as fallback value when missing.</p></div></div> <ul></ul> <!> <!> <!> <!> <!> <!>`,1);function y(t){var y=v(),b=c(u(y),2);h(b,{});var x=c(b,2);p(x,{title:`Fetch collections`});var S=c(x,2);p(S,{title:`Fetch single collection`,tag:`h5`});var C=c(S,4);m(C,{language:`javascript`,content:`
        let collection = $app.findCollectionByNameOrId("example")
    `});var w=c(C,2);p(w,{title:`Fetch multiple collections`,tag:`h5`});var T=c(w,4);m(T,{language:`javascript`,content:`
        let allCollections = $app.findAllCollections(/* optional types */)

        // only specific types
        let authAndViewCollections = $app.findAllCollections("auth", "view")
    `});var E=c(T,2);p(E,{title:`Custom collection query`,tag:`h5`});var D=c(E,4);m(D,{language:`javascript`,content:`
        let collections = arrayOf(new Collection)

        $app.collectionQuery().
            andWhere($dbx.hashExp({"viewRule": null})).
            orderBy("created DESC").
            all(collections)
    `});var O=c(D,2);p(O,{title:`Field definitions`});var k=c(O,4);e(k,5,()=>g,l,(e,t)=>{var c=_(),l=f(c),u=f(l),p=d(u);s(l),s(c),a(()=>{o(l,`href`,`/jsvm/classes/${i(t)??``}.html`),n(p,`new ${i(t)??``}({ ... })`)}),r(e,c)}),s(k);var A=c(k,2);p(A,{title:`Create new collection`});var j=c(A,2);m(j,{language:`javascript`,content:`
        // missing default options, system fields like id, email, etc. are initialized automatically
        // and will be merged with the provided configuration
        let collection = new Collection({
            type:       "base", // base | auth | view
            name:       "example",
            listRule:   null,
            viewRule:   "@request.auth.id != ''",
            createRule: "",
            updateRule: "@request.auth.id != ''",
            deleteRule: null,
            fields: [
                {
                    name:     "title",
                    type:     "text",
                    required: true,
                    max: 10,
                },
                {
                    name:          "user",
                    type:          "relation",
                    required:      true,
                    maxSelect:     1,
                    collectionId:  "ae40239d2bc4477",
                    cascadeDelete: true,
                },
            ],
            indexes: [
                "CREATE UNIQUE INDEX idx_user ON example (user)"
            ],
        })

        // validate and persist
        // (use saveNoValidate to skip fields validation)
        $app.save(collection)
    `});var M=c(j,2);p(M,{title:`Update existing collection`});var N=c(M,2);m(N,{language:`javascript`,content:`
        let collection = $app.findCollectionByNameOrId("example")

        // change the collection name
        collection.name = "example_update"

        // add new editor field
        collection.fields.add(new EditorField({
            name:     "description",
            required: true,
        }))

        // change existing field
        // (returns a pointer and direct modifications are allowed without the need of reinsert)
        let titleField = collection.fields.getByName("title")
        titleField.min = 10

        // or: collection.indexes.push("CREATE INDEX idx_example_title ON example (title)")
        collection.addIndex("idx_example_title", false, "title", "")

        // validate and persist
        // (use saveNoValidate to skip fields validation)
        $app.save(collection)
    `});var P=c(N,2);p(P,{title:`Delete collection`});var F=c(P,2);m(F,{language:`javascript`,content:`
        let collection = $app.findCollectionByNameOrId("example")

        $app.delete(collection)
    `}),r(t,y)}export{y as component};