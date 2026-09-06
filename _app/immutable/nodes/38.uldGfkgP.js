import{I as e,P as t,X as n,_ as r,bt as i,gt as a,ht as o,it as s,nt as c,o as l,tt as u,yt as d}from"../chunks/BDLcFjNi.js";import"../chunks/xihTtKlq.js";import"../chunks/C3kXMaAy.js";import{t as f}from"../chunks/BnicrACe.js";import{t as p}from"../chunks/CKGhWLYV.js";import{t as m}from"../chunks/CKC416Ky.js";var h=e(`<p>PocketBase exposes several test mocks and stubs (eg. <code>tests.TestApp</code>, <code>tests.ApiScenario</code>, <code>tests.MockMultipartData</code>, etc.) to help you write unit and
    integration tests for your app.</p> <p>You could find more information in the <a target="_blank" rel="noreferrer noopener"><code>github.com/pocketbase/pocketbase/tests</code></a> sub package, but here is a simple example.</p> <!> <!> <p>Let's say that we have a custom API route <code>GET /my/hello</code> that requires superuser authentication:</p> <!> <!> <p>Now we have to prepare our test/mock data. There are several ways you can approach this, but the easiest
    one would be to start your application with a custom <code>test_pb_data</code> directory, e.g.:</p> <!> <p>Go to your browser and create the test data via the Dashboard (both collections and records). Once
    completed you can stop the server (you could also commit <code>test_pb_data</code> to your repo).</p> <!> <p>To test the example endpoint, we want to:</p> <ul><li>ensure it handles only GET requests</li> <li>ensure that it can be accessed only by superusers</li> <li>check if the response body is properly set</li></ul> <p>Below is a simple integration test for the above test cases. We'll also use the test data created in the
    previous step.</p> <!>`,1);function g(e,g){a(g,!1),l();var _=h(),v=s(c(_),2),y=s(u(v));d(),i(v);var b=s(v,2);m(b,{});var x=s(b,2);f(x,{title:`1. Setup`});var S=s(x,4);p(S,{language:`go`,content:`
        // main.go
        package main

        import (
            "log"
            "net/http"

            "github.com/pocketbase/pocketbase"
            "github.com/pocketbase/pocketbase/apis"
            "github.com/pocketbase/pocketbase/core"
        )

        func bindAppHooks(app core.App) {
            app.OnServe().BindFunc(func(se *core.ServeEvent) error {
                se.Router.Get("/my/hello", func(e *core.RequestEvent) error {
                    return e.JSON(http.StatusOK, "Hello world!")
                }).Bind(apis.RequireSuperuserAuth())

                return se.Next()
            })
        }

        func main() {
            app := pocketbase.New()

            bindAppHooks(app)

            if err := app.Start(); err != nil {
                log.Fatal(err)
            }
        }
    `});var C=s(S,2);f(C,{title:`2. Prepare test data`});var w=s(C,4);p(w,{content:`./pocketbase serve --dir="./test_pb_data" --automigrate=0`});var T=s(w,4);f(T,{title:`3. Integration test`});var E=s(T,8);p(E,{language:`go`,content:`
        // main_test.go
        package main

        import (
            "net/http"
            "testing"

            "github.com/pocketbase/pocketbase/core"
            "github.com/pocketbase/pocketbase/tests"
        )

        const testDataDir = "./test_pb_data"

        func generateToken(collectionNameOrId string, email string) (string, error) {
            app, err := tests.NewTestApp(testDataDir)
            if err != nil {
                return "", err
            }
            defer app.Cleanup()

            record, err := app.FindAuthRecordByEmail(collectionNameOrId, email)
            if err != nil {
                return "", err
            }

            return record.NewAuthToken()
        }

        func TestHelloEndpoint(t *testing.T) {
            recordToken, err := generateToken("users", "test@example.com")
            if err != nil {
                t.Fatal(err)
            }

            superuserToken, err := generateToken(core.CollectionNameSuperusers, "test@example.com")
            if err != nil {
                t.Fatal(err)
            }

            // set up the test ApiScenario app instance
            setupTestApp := func(t testing.TB) *tests.TestApp {
                testApp, err := tests.NewTestApp(testDataDir)
                if err != nil {
                    t.Fatal(err)
                }
                // no need to cleanup since scenario.Test() will do that for us
                // defer testApp.Cleanup()

                bindAppHooks(testApp)

                return testApp
            }

            scenarios := []tests.ApiScenario{
                {
                    Name:            "try with different http method, e.g. POST",
                    Method:          http.MethodPost,
                    URL:             "/my/hello",
                    ExpectedStatus:  405,
                    ExpectedContent: []string{"\\"data\\":{}"},
                    TestAppFactory:  setupTestApp,
                },
                {
                    Name:            "try as guest (aka. no Authorization header)",
                    Method:          http.MethodGet,
                    URL:             "/my/hello",
                    ExpectedStatus:  401,
                    ExpectedContent: []string{"\\"data\\":{}"},
                    TestAppFactory:  setupTestApp,
                },
                {
                    Name:   "try as authenticated app user",
                    Method: http.MethodGet,
                    URL:    "/my/hello",
                    Headers: map[string]string{
                        "Authorization": recordToken,
                    },
                    ExpectedStatus:  401,
                    ExpectedContent: []string{"\\"data\\":{}"},
                    TestAppFactory:  setupTestApp,
                },
                {
                    Name:   "try as authenticated superuser",
                    Method: http.MethodGet,
                    URL:    "/my/hello",
                    Headers: map[string]string{
                        "Authorization": superuserToken,
                    },
                    ExpectedStatus:  200,
                    ExpectedContent: []string{"Hello world!"},
                    TestAppFactory:  setupTestApp,
                },
            }

            for _, scenario := range scenarios {
                scenario.Test(t)
            }
        }
    `}),n(()=>r(y,`href`,`https://pkg.go.dev/github.com/pocketbase/pocketbase/tests`)),t(e,_),o()}export{g as component};