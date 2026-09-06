import{I as e,P as t,it as n,nt as r,yt as i}from"../chunks/BDLcFjNi.js";import"../chunks/xihTtKlq.js";import"../chunks/C3kXMaAy.js";import{t as a}from"../chunks/CKGhWLYV.js";var o=e(`<p>You can register custom console commands using <code>app.RootCmd.AddCommand(cmd)</code>, where <code>cmd</code> is a <a href="https://pkg.go.dev/github.com/spf13/cobra" target="_blank" rel="noopener noreferrer">cobra</a> command.</p> <p>Here is an example:</p> <!> <p>To run the command you can build your Go application and execute:</p> <!> <div class="alert alert-info m-t-sm m-b-sm"><div class="icon"><i class="ri-information-line"></i></div> <div class="content"><p>Keep in mind that the console commands execute in their own separate app process and run
            independently from the main <code>serve</code> command (aka. hook and realtime events between different
            processes are not shared with one another).</p></div></div>`,1);function s(e){var s=o(),c=n(r(s),4);a(c,{language:`go`,content:`
        package main

        import (
            "log"

            "github.com/pocketbase/pocketbase"
            "github.com/spf13/cobra"
        )

        func main() {
            app := pocketbase.New()

            app.RootCmd.AddCommand(&cobra.Command{
                Use: "hello",
                Run: func(cmd *cobra.Command, args []string) {
                    log.Println("Hello world!")
                },
            })

            if err := app.Start(); err != nil {
                log.Fatal(err)
            }
        }
    `});var l=n(c,4);a(l,{language:`html`,content:`
        # or "go run main.go hello"
        ./myapp hello
    `}),i(2),t(e,s)}export{s as component};