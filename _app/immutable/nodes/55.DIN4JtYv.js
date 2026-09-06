import{I as e,P as t,it as n,nt as r,yt as i}from"../chunks/BDLcFjNi.js";import"../chunks/xihTtKlq.js";import"../chunks/C3kXMaAy.js";import{t as a}from"../chunks/BnicrACe.js";import{t as o}from"../chunks/CKGhWLYV.js";import{t as s}from"../chunks/CKC416Ky.js";var c=e(`<!> <!> <p>You can use the global <code>$http.send(config)</code> helper to send HTTP requests to external services. <br/> This could be used for example to retrieve data from external data sources, to make custom requests to a payment
    provider API, etc.</p> <p>Below is a list with all currently supported config options and their defaults.</p> <!> <p class="m-t-sm">Here is an example that will enrich a single book record with some data based on its ISBN details from
    openlibrary.org.</p> <!> <!> <p>In order to send <code>multipart/form-data</code> requests (ex. uploading files) the request <code>body</code> must be a <code>FormData</code> instance.</p> <p>PocketBase JSVM's <code>FormData</code> has the same APIs as its <a href="https://developer.mozilla.org/en-US/docs/Web/API/FormData" target="_blank" rel="noopener noreferrer">browser equivalent</a> with the main difference that for file values instead of <code>Blob</code> it accepts <a href="/jsvm/modules/_filesystem.html" target="_blank" rel="noopener noreferrer"><code>$filesystem.File</code></a>.</p> <!> <!> <p>As of now there is no support for streamed responses or server-sent events (SSE). The <code>$http.send</code> call blocks and returns the entire response body at once.</p> <p>For this and other more advanced use cases you'll have to <a href="/docs/go-overview/">extend PocketBase with Go</a>.</p>`,1);function l(e){var l=c(),u=r(l);s(u,{});var d=n(u,2);a(d,{title:`Overview`});var f=n(d,6);o(f,{language:`javascript`,content:`
        // throws on timeout or network connectivity error
        const res = $http.send({
            url:     "",
            method:  "GET",
            body:    "", // ex. JSON.stringify({"test": 123}) or new FormData()
            headers: {}, // ex. {"content-type": "application/json"}
            timeout: 120, // in seconds
        })

        console.log(res.headers)    // the response headers (ex. res.headers['X-Custom'][0])
        console.log(res.cookies)    // the response cookies (ex. res.cookies.sessionId.value)
        console.log(res.statusCode) // the response HTTP status code
        console.log(res.body)       // the response body as plain bytes array
        console.log(res.json)       // the response body as parsed json array or map
    `});var p=n(f,4);o(p,{language:`javascript`,content:`
        onRecordCreateRequest((e) => {
            let isbn = e.record.get("isbn");

            // try to update with the published date from the openlibrary API
            try {
                const res = $http.send({
                    url: "https://openlibrary.org/isbn/" + isbn + ".json",
                    headers: {"content-type": "application/json"}
                })

                if (res.statusCode == 200) {
                    e.record.set("published", res.json.publish_date)
                }
            } catch (err) {
                e.app.logger().error("Failed to retrieve book data", "error", err);
            }

            return e.next()
        }, "books")
    `});var m=n(p,2);a(m,{title:`multipart/form-data requests`,tag:`h5`});var h=n(m,6);o(h,{language:`javascript`,content:`
        const formData = new FormData();

        formData.append("title", "Hello world!")
        formData.append("documents", $filesystem.fileFromBytes("doc1", "doc1.txt"))
        formData.append("documents", $filesystem.fileFromBytes("doc2", "doc2.txt"))

        const res = $http.send({
            url:    "https://...",
            method: "POST",
            body:   formData,
        })

        console.log(res.statusCode)
    `});var g=n(h,2);a(g,{title:`Limitations`}),i(4),t(e,l)}export{l as component};