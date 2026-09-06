function e(e=!1){return``}var t=`
<div class="alert alert-warning m-t-xs m-b-xs">
    <div class="content">
        Note that if you want to hide existing or add new computed Record fields prefer using the
        <a href="#onrecordenrich"><code>OnRecordEnrich</code></a>
        hook because it is less error-prone and it is triggered
        by all builtin Record responses (including when sending realtime Record events).
    </div>
</div>
`;function n(e,t){return`
        // fires for every ${t.toLowerCase()}
        ${e}((e) => {
            // e.app
            // e.${t}

            e.next()
        })

        // fires only for "users" and "articles" ${t.toLowerCase()}s
        ${e}((e) => {
            // e.app
            // e.${t}

            e.next()
        }, "users", "articles")
    `}function r(e,t){return`
        // fires for every ${t.toLowerCase()}
        ${e}((e) => {
            // e.app
            // e.${t}
            // e.error

            e.next()
        })

        // fires only for "users" and "articles" ${t.toLowerCase()}s
        ${e}((e) => {
            // e.app
            // e.${t}
            // e.error

            e.next()
        }, "users", "articles")
    `}function i(e,t){return`
        package main

        import (
            "log"

            "github.com/pocketbase/pocketbase"
            "github.com/pocketbase/pocketbase/core"
        )

        func main() {
            app := pocketbase.New()

            // fires for every ${t.toLowerCase()}
            app.${e}().BindFunc(func(e *core.${t}Event) error {
                // e.App
                // e.${t}

                return e.Next()
            })

            // fires only for "users" and "articles" ${t.toLowerCase()}s
            app.${e}("users", "articles").BindFunc(func(e *core.${t}Event) error {
                // e.App
                // e.${t}

                return e.Next()
            })

            if err := app.Start(); err != nil {
                log.Fatal(err)
            }
        }
    `}function a(e,t){return`
        package main

        import (
            "log"

            "github.com/pocketbase/pocketbase"
            "github.com/pocketbase/pocketbase/core"
        )

        func main() {
            app := pocketbase.New()

            // fires for every ${t.toLowerCase()}
            app.${e}().BindFunc(func(e *core.${t}ErrorEvent) error {
                // e.App
                // e.${t}
                // e.Error

                return e.Next()
            })

            // fires only for "users" and "articles" ${t.toLowerCase()}s
            app.${e}("users", "articles").BindFunc(func(e *core.${t}ErrorEvent) error {
                // e.App
                // e.${t}
                // e.Error

                return e.Next()
            })

            if err := app.Start(); err != nil {
                log.Fatal(err)
            }
        }
    `}function o(t=`Model`){let n=`
        <p>
            <code>On${t}Validate</code> is called every time when a ${t} is being validated,
            e.g. triggered by <code>App.Validate()</code> or <code>App.Save()</code>.
        </p>
    `;return t==`Model`?(n+=`
        <p class="txt-bold">
            For convenience, if you want to listen to only the Record or Collection models
            events without doing manual type assertion, you can use the equivalent <code>OnRecord*</code> and <code>OnCollection*</code> proxy hooks.
        </p>
        `,n+=e(!0)):n+=e(!1),n}function s(t=`Model`){let n=`
        <p>
            <code>On${t}Create</code> is triggered every time when a new ${t} is being created,
            e.g. triggered by <code>App.Save()</code>.
        </p>
        <p>
            Operations BEFORE the <code>e.Next()</code> execute before the ${t} validation
            and the INSERT DB statement.
        </p>
        <p>
            Operations AFTER the <code>e.Next()</code> execute after the ${t} validation
            and the INSERT DB statement.
        </p>
        <div class="alert alert-warning m-t-xs m-b-xs">
            <div class="content">
                Note that successful execution doesn't guarantee that the ${t}
                is persisted in the database since its wrapping transaction may
                not have been committed yet.
                If you want to listen to only the actual persisted events, you can
                bind to <code>On${t}AfterCreateSuccess</code> or <code>On${t}AfterCreateError</code> hooks.
            </div>
        </div>
    `;return t==`Model`?(n+=`
        <p class="txt-bold">
            For convenience, if you want to listen to only the Record or Collection models
            events without doing manual type assertion, you can use the equivalent <code>OnRecord*</code> and <code>OnCollection*</code> proxy hooks.
        </p>
        `,n+=e(!0)):n+=e(!1),n}function c(t=`Model`){let n=`
        <p>
            <code>On${t}CreateExecute</code> is triggered after successful ${t} validation
            and right before the model INSERT DB statement execution.
        </p>
        <p>
            Usually it is triggered as part of the <code>App.Save()</code> in the following firing order:
            <br>
            <code>On${t}Create</code>
            <br>
            <span class="txt-mono">&nbsp;-> </span>
            <code>On${t}Validate</code> (skipped with <code>App.SaveNoValidate()</code>)
            <br>
            <span class="txt-mono">&nbsp;-> </span>
            <code>On${t}CreateExecute</code>
        </p>
        <div class="alert alert-warning m-t-xs m-b-xs">
            <div class="content">
                Note that successful execution doesn't guarantee that the ${t}
                is persisted in the database since its wrapping transaction may
                not have been committed yet.
                If you want to listen to only the actual persisted events, you can
                bind to <code>On${t}AfterCreateSuccess</code> or <code>On${t}AfterCreateError</code> hooks.
            </div>
        </div>
    `;return t==`Model`?(n+=`
        <p class="txt-bold">
            For convenience, if you want to listen to only the Record or Collection models
            events without doing manual type assertion, you can use the equivalent <code>OnRecord*</code> and <code>OnCollection*</code> proxy hooks.
        </p>
        `,n+=e(!0)):n+=e(!1),n}function l(t=`Model`){let n=`
        <p>
            <code>On${t}AfterCreateSuccess</code> is triggered after each successful
            ${t} DB create persistence.
        </p>
        <div class="alert alert-warning m-t-xs m-b-xs">
            <div class="content">
                Note that when a ${t} is persisted as part of a transaction,
                this hook is delayed and executed only AFTER the transaction has been committed.
                This hook is NOT triggered in case the transaction fails/rollbacks.
            </div>
        </div>
    `;return t==`Model`?(n+=`
        <p class="txt-bold">
            For convenience, if you want to listen to only the Record or Collection models
            events without doing manual type assertion, you can use the equivalent <code>OnRecord*</code> and <code>OnCollection*</code> proxy hooks.
        </p>
        `,n+=e(!0)):n+=e(!1),n}function u(t=`Model`){let n=`
        <p>
            <code>On${t}AfterCreateError</code> is triggered after each failed
            ${t} DB create persistence.
        </p>
        <div class="alert alert-warning m-t-xs m-b-xs">
            <div class="content">
                Note that the execution of this hook is either immediate or delayed
                depending on the error:
                <br>
                <ul>
                    <li><strong>immediate</strong> on <code>App.Save()</code> failure</li>
                    <li><strong>delayed</strong> on transaction rollback</li>
                </ul>
            </div>
        </div>
    `;return t==`Model`?(n+=`
        <p class="txt-bold">
            For convenience, if you want to listen to only the Record or Collection models
            events without doing manual type assertion, you can use the equivalent <code>OnRecord*</code> and <code>OnCollection*</code> proxy hooks.
        </p>
        `,n+=e(!0)):n+=e(!1),n}function d(t=`Model`){let n=`
        <p>
            <code>On${t}Update</code> is triggered every time when a new ${t} is being updated,
            e.g. triggered by <code>App.Save()</code>.
        </p>
        <p>
            Operations BEFORE the <code>e.Next()</code> execute before the ${t} validation
            and the UPDATE DB statement.
        </p>
        <p>
            Operations AFTER the <code>e.Next()</code> execute after the ${t} validation
            and the UPDATE DB statement.
        </p>
        <div class="alert alert-warning m-t-xs m-b-xs">
            <div class="content">
                Note that successful execution doesn't guarantee that the ${t}
                is persisted in the database since its wrapping transaction may
                not have been committed yet.
                If you want to listen to only the actual persisted events, you can
                bind to <code>On${t}AfterUpdateSuccess</code> or <code>On${t}AfterUpdateError</code> hooks.
            </div>
        </div>
    `;return t==`Model`?(n+=`
        <p class="txt-bold">
            For convenience, if you want to listen to only the Record or Collection models
            events without doing manual type assertion, you can use the equivalent <code>OnRecord*</code> and <code>OnCollection*</code> proxy hooks.
        </p>
        `,n+=e(!0)):n+=e(!1),n}function f(t=`Model`){let n=`
        <p>
            <code>On${t}UpdateExecute</code> is triggered after successful ${t} validation
            and right before the model UPDATE DB statement execution.
        </p>
        <p>
            Usually it is triggered as part of the <code>App.Save()</code> in the following firing order:
            <br>
            <code>On${t}Update</code>
            <br>
            <span class="txt-mono">&nbsp;-> </span>
            <code>On${t}Validate</code> (skipped with <code>App.SaveNoValidate()</code>)
            <br>
            <span class="txt-mono">&nbsp;-> </span>
            <code>On${t}UpdateExecute</code>
        </p>
        <div class="alert alert-warning m-t-xs m-b-xs">
            <div class="content">
                Note that successful execution doesn't guarantee that the ${t}
                is persisted in the database since its wrapping transaction may
                not have been committed yet.
                If you want to listen to only the actual persisted events, you can
                bind to <code>On${t}AfterUpdateSuccess</code> or <code>On${t}AfterUpdateError</code> hooks.
            </div>
        </div>
    `;return t==`Model`?(n+=`
        <p class="txt-bold">
            For convenience, if you want to listen to only the Record or Collection models
            events without doing manual type assertion, you can use the equivalent <code>OnRecord*</code> and <code>OnCollection*</code> proxy hooks.
        </p>
        `,n+=e(!0)):n+=e(!1),n}function p(t=`Model`){let n=`
        <p>
            <code>On${t}AfterUpdateSuccess</code> is triggered after each successful
            ${t} DB update persistence.
        </p>
        <div class="alert alert-warning m-t-xs m-b-xs">
            <div class="content">
                Note that when a ${t} is persisted as part of a transaction,
                this hook is delayed and executed only AFTER the transaction has been committed.
                This hook is NOT triggered in case the transaction fails/rollbacks.
            </div>
        </div>
    `;return t==`Model`?(n+=`
        <p class="txt-bold">
            For convenience, if you want to listen to only the Record or Collection models
            events without doing manual type assertion, you can use the equivalent <code>OnRecord*</code> and <code>OnCollection*</code> proxy hooks.
        </p>
        `,n+=e(!0)):n+=e(!1),n}function m(t=`Model`){let n=`
        <p>
            <code>On${t}AfterUpdateError</code> is triggered after each failed
            ${t} DB update persistence.
        </p>
        <div class="alert alert-warning m-t-xs m-b-xs">
            <div class="content">
                Note that the execution of this hook is either immediate or delayed
                depending on the error:
                <br>
                <ul>
                    <li><strong>immediate</strong> on <code>App.Save()</code> failure</li>
                    <li><strong>delayed</strong> on transaction rollback</li>
                </ul>
            </div>
        </div>
    `;return t==`Model`?(n+=`
        <p class="txt-bold">
            For convenience, if you want to listen to only the Record or Collection models
            events without doing manual type assertion, you can use the equivalent <code>OnRecord*</code> and <code>OnCollection*</code> proxy hooks.
        </p>
        `,n+=e(!0)):n+=e(!1),n}function h(t=`Model`){let n=`
        <p>
            <code>On${t}Delete</code> is triggered every time when a new ${t} is being deleted,
            e.g. triggered by <code>App.Delete()</code>.
        </p>
        <p>
            Operations BEFORE the <code>e.Next()</code> execute before the ${t} validation
            and the UPDATE DB statement.
        </p>
        <p>
            Operations AFTER the <code>e.Next()</code> execute after the ${t} validation
            and the UPDATE DB statement.
        </p>
        <div class="alert alert-warning m-t-xs m-b-xs">
            <div class="content">
                Note that successful execution doesn't guarantee that the ${t}
                is deleted from the database since its wrapping transaction may
                not have been committed yet.
                If you want to listen to only the actual persisted deleted events, you can
                bind to <code>On${t}AfterDeleteSuccess</code> or <code>On${t}AfterDeleteError</code> hooks.
            </div>
        </div>
    `;return t==`Model`?(n+=`
        <p class="txt-bold">
            For convenience, if you want to listen to only the Record or Collection models
            events without doing manual type assertion, you can use the equivalent <code>OnRecord*</code> and <code>OnCollection*</code> proxy hooks.
        </p>
        `,n+=e(!0)):n+=e(!1),n}function g(t=`Model`){let n=`
        <p>
            <code>On${t}DeleteExecute</code> is triggered after the internal delete checks and
            right before the ${t} the model DELETE DB statement execution.
        </p>
        <p>
            Usually it is triggered as part of the <code>App.Delete()</code> in the following firing order:
            <br>
            <code>On${t}Delete</code>
            <br>
            <span class="txt-mono">&nbsp;-> </span>
            internal delete checks
            <br>
            <span class="txt-mono">&nbsp;-> </span>
            <code>On${t}DeleteExecute</code>
        </p>
        <div class="alert alert-warning m-t-xs m-b-xs">
            <div class="content">
                Note that successful execution doesn't guarantee that the ${t}
                is deleted from the database since its wrapping transaction may
                not have been committed yet.
                If you want to listen to only the actual persisted events, you can
                bind to <code>On${t}AfterDeleteSuccess</code> or <code>On${t}AfterDeleteError</code> hooks.
            </div>
        </div>
    `;return t==`Model`?(n+=`
        <p class="txt-bold">
            For convenience, if you want to listen to only the Record or Collection models
            events without doing manual type assertion, you can use the equivalent <code>OnRecord*</code> and <code>OnCollection*</code> proxy hooks.
        </p>
        `,n+=e(!0)):n+=e(!1),n}function _(t=`Model`){let n=`
        <p>
            <code>On${t}AfterDeleteSuccess</code> is triggered after each successful
            ${t} DB delete persistence.
        </p>
        <div class="alert alert-warning m-t-xs m-b-xs">
            <div class="content">
                Note that when a ${t} is deleted as part of a transaction,
                this hook is delayed and executed only AFTER the transaction has been committed.
                This hook is NOT triggered in case the transaction fails/rollbacks.
            </div>
        </div>
    `;return t==`Model`?(n+=`
        <p class="txt-bold">
            For convenience, if you want to listen to only the Record or Collection models
            events without doing manual type assertion, you can use the equivalent <code>OnRecord*</code> and <code>OnCollection*</code> proxy hooks.
        </p>
        `,n+=e(!0)):n+=e(!1),n}function v(t=`Model`){let n=`
        <p>
            <code>On${t}AfterDeleteError</code> is triggered after each failed
            ${t} DB delete persistence.
        </p>
        <div class="alert alert-warning m-t-xs m-b-xs">
            <div class="content">
                Note that the execution of this hook is either immediate or delayed
                depending on the error:
                <br>
                <ul>
                    <li><strong>immediate</strong> on <code>App.Delete()</code> failure</li>
                    <li><strong>delayed</strong> on transaction rollback</li>
                </ul>
            </div>
        </div>
    `;return t==`Model`?(n+=`
        <p class="txt-bold">
            For convenience, if you want to listen to only the Record or Collection models
            events without doing manual type assertion, you can use the equivalent <code>OnRecord*</code> and <code>OnCollection*</code> proxy hooks.
        </p>
        `,n+=e(!0)):n+=e(!1),n}var y=[{title:`App hooks`,hooks:{OnBootstrap:{html:`
                    <p>
                        <code>OnBootstrap</code> hook is triggered when initializing the main
                        application resources (db, app settings, etc).
                    </p>
                    <p>Note that attempting to access the database before the <code>e.Next()</code> call will result in an error.</p>
                `,js:`
                    onBootstrap((e) => {
                        e.next()

                        // e.app
                    })
                `,go:`
                    package main

                    import (
                        "log"

                        "github.com/pocketbase/pocketbase"
                        "github.com/pocketbase/pocketbase/core"
                    )

                    func main() {
                        app := pocketbase.New()

                        app.OnBootstrap().BindFunc(func(e *core.BootstrapEvent) error {
                            if err := e.Next(); err != nil {
                                return err
                            }

                            // e.App

                            return nil
                        })

                        if err := app.Start(); err != nil {
                            log.Fatal(err)
                        }
                    }
                `},OnServe:{html:`
                    <code>OnServe</code> hook is triggered when the app web server is started
                    (after starting the TCP listener but before initializing the blocking serve task),
                    allowing you to adjust its options and attach new routes or middlewares.
                `,js:``,go:`
                    package main

                    import (
                        "log"
                        "net/http"

                        "github.com/pocketbase/pocketbase"
                        "github.com/pocketbase/pocketbase/apis"
                        "github.com/pocketbase/pocketbase/core"
                    )

                    func main() {
                        app := pocketbase.New()

                        app.OnServe().BindFunc(func(e *core.ServeEvent) error {
                            // register new "GET /hello" route
                            e.Router.GET("/hello", func(e *core.RequestEvent) error {
                                return e.String(200, "Hello world!")
                            }).Bind(apis.RequireAuth())

                            return e.Next()
                        })

                        if err := app.Start(); err != nil {
                            log.Fatal(err)
                        }
                    }
                `},OnSettingsReload:{html:`
                    <p>
                        <code>OnSettingsReload</code> hook is triggered every time when the <code>App.Settings()</code>
                        is being replaced with a new state.
                    </p>
                    <p>
                        Calling <code>e.App.Settings()</code> after <code>e.Next()</code> returns the new state.
                    </p>
                `,js:`
                    onSettingsReload((e) => {
                        e.next()

                        // e.app.settings()
                    })
                `,go:`
                    package main

                    import (
                        "log"

                        "github.com/pocketbase/pocketbase"
                        "github.com/pocketbase/pocketbase/core"
                    )

                    func main() {
                        app := pocketbase.New()

                        app.OnSettingsReload().BindFunc(func(e *core.SettingsReloadEvent) error {
                            if err := e.Next(); err != nil {
                                return err
                            }

                            // e.App.Settings()

                            return nil
                        })

                        if err := app.Start(); err != nil {
                            log.Fatal(err)
                        }
                    }
                `},OnBackupCreate:{html:`
                    <code>OnBackupCreate</code> is triggered on each <code>App.CreateBackup</code> call.
                `,js:`
                    onBackupCreate((e) => {
                        // e.app
                        // e.name    - the name of the backup to create
                        // e.exclude - list of pb_data dir entries to exclude from the backup
                    })
                `,go:`
                    package main

                    import (
                        "log"

                        "github.com/pocketbase/pocketbase"
                        "github.com/pocketbase/pocketbase/core"
                    )

                    func main() {
                        app := pocketbase.New()

                        app.OnBackupCreate().BindFunc(func(e *core.BackupEvent) error {
                            // e.App
                            // e.Name    - the name of the backup to create
                            // e.Exclude - list of pb_data dir entries to exclude from the backup

                            return e.Next()
                        })

                        if err := app.Start(); err != nil {
                            log.Fatal(err)
                        }
                    }
                `},OnBackupRestore:{html:`
                    <code>OnBackupRestore</code> is triggered before app backup restore (aka. on <code>App.RestoreBackup</code> call).
                `,js:`
                    onBackupRestore((e) => {
                        // e.app
                        // e.name    - the name of the backup to restore
                        // e.exclude - list of dir entries to exclude from the backup
                    })
                `,go:`
                    package main

                    import (
                        "log"

                        "github.com/pocketbase/pocketbase"
                        "github.com/pocketbase/pocketbase/core"
                    )

                    func main() {
                        app := pocketbase.New()

                        app.OnBackupRestore().BindFunc(func(e *core.BackupEvent) error {
                            // e.App
                            // e.Name    - the name of the backup to restore
                            // e.Exclude - list of dir entries to exclude from the backup

                            return e.Next()
                        })

                        if err := app.Start(); err != nil {
                            log.Fatal(err)
                        }
                    }
                `},OnTerminate:{html:`
                    <code>OnTerminate</code> hook is triggered when the app is in the process
                    of being terminated (ex. on <code>SIGTERM</code> signal).
                    <br />
                    Note that the app could be terminated abruptly without awaiting the hook completion.
                `,js:`
                    onTerminate((e) => {
                        // e.app
                        // e.isRestart
                    })
                `,go:`
                    package main

                    import (
                        "log"

                        "github.com/pocketbase/pocketbase"
                        "github.com/pocketbase/pocketbase/core"
                    )

                    func main() {
                        app := pocketbase.New()

                        app.OnTerminate().BindFunc(func(e *core.TerminateEvent) error {
                            // e.App
                            // e.IsRestart

                            return e.Next()
                        })

                        if err := app.Start(); err != nil {
                            log.Fatal(err)
                        }
                    }
                `}}},{title:`Mailer hooks`,hooks:{OnMailerSend:{html:`
                    <p>
                        <code>OnMailerSend</code> hook is triggered every time when a new email is
                        being sent using the <code>App.NewMailClient()</code> instance.
                    </p>
                    <p>It allows intercepting the email message or to use a custom mailer client.</p>
                `,js:`
                    onMailerSend((e) => {
                        // e.app
                        // e.mailer
                        // e.message

                        // ex. change the mail subject
                        e.message.subject = "new subject"

                        e.next()
                    })
                `,go:`
                    package main

                    import (
                        "log"

                        "github.com/pocketbase/pocketbase"
                        "github.com/pocketbase/pocketbase/core"
                    )

                    func main() {
                        app := pocketbase.New()

                        app.OnMailerSend().BindFunc(func(e *core.MailerEvent) error {
                            // e.App
                            // e.Mailer
                            // e.Message

                            // ex. change the mail subject
                            e.Message.Subject = "new subject"

                            return e.Next()
                        })

                        if err := app.Start(); err != nil {
                            log.Fatal(err)
                        }
                    }
                `},OnMailerRecordAuthAlertSend:{html:`
                    <p>
                        <code>OnMailerRecordAuthAlertSend</code> hook is triggered when
                        sending a new device login auth alert email, allowing you to
                        intercept and customize the email message that is being sent.
                    </p>
                    ${e()}
                `,js:`
                    onMailerRecordAuthAlertSend((e) => {
                        // e.app
                        // e.mailer
                        // e.message
                        // e.record
                        // e.meta.info

                        // ex. change the mail subject
                        e.message.subject = "new subject"

                        e.next()
                    })
                `,go:`
                    package main

                    import (
                        "log"

                        "github.com/pocketbase/pocketbase"
                        "github.com/pocketbase/pocketbase/core"
                    )

                    func main() {
                        app := pocketbase.New()

                        app.OnMailerRecordAuthAlertSend().BindFunc(func(e *core.MailerRecordEvent) error {
                            // e.App
                            // e.Mailer
                            // e.Message
                            // e.Record
                            // e.Meta["info"].(string)

                            // ex. change the mail subject
                            e.Message.Subject = "new subject"

                            return e.Next()
                        })

                        if err := app.Start(); err != nil {
                            log.Fatal(err)
                        }
                    }
                `},OnMailerRecordPasswordResetSend:{html:`
                    <p>
                        <code>OnMailerRecordPasswordResetSend</code> hook is triggered when
                        sending a password reset email to an auth record, allowing
                        you to intercept and customize the email message that is being sent.
                    </p>
                    ${e()}
                `,js:`
                    onMailerRecordPasswordResetSend((e) => {
                        // e.app
                        // e.mailer
                        // e.message
                        // e.record
                        // e.meta.token

                        // ex. change the mail subject
                        e.message.subject = "new subject"

                        e.next()
                    })
                `,go:`
                    package main

                    import (
                        "log"

                        "github.com/pocketbase/pocketbase"
                        "github.com/pocketbase/pocketbase/core"
                    )

                    func main() {
                        app := pocketbase.New()

                        app.OnMailerRecordPasswordResetSend().BindFunc(func(e *core.MailerRecordEvent) error {
                            // e.App
                            // e.Mailer
                            // e.Message
                            // e.Record
                            // e.Meta["token"].(string)

                            // ex. change the mail subject
                            e.Message.Subject = "new subject"

                            return e.Next()
                        })

                        if err := app.Start(); err != nil {
                            log.Fatal(err)
                        }
                    }
                `},OnMailerRecordVerificationSend:{html:`
                    <p>
                        <code>OnMailerRecordVerificationSend</code> hook is triggered when
                        sending a verification email to an auth record, allowing
                        you to intercept and customize the email message that is being sent.
                    </p>
                    ${e()}
                `,js:`
                    onMailerRecordVerificationSend((e) => {
                        // e.app
                        // e.mailer
                        // e.message
                        // e.record
                        // e.meta.token

                        // ex. change the mail subject
                        e.message.subject = "new subject"

                        e.next()
                    })
                `,go:`
                    package main

                    import (
                        "log"

                        "github.com/pocketbase/pocketbase"
                        "github.com/pocketbase/pocketbase/core"
                    )

                    func main() {
                        app := pocketbase.New()

                        app.OnMailerRecordVerificationSend().BindFunc(func(e *core.MailerRecordEvent) error {
                            // e.App
                            // e.Mailer
                            // e.Message
                            // e.Record
                            // e.Meta["token"].(string)

                            // ex. change the mail subject
                            e.Message.Subject = "new subject"

                            return e.Next()
                        })

                        if err := app.Start(); err != nil {
                            log.Fatal(err)
                        }
                    }
                `},OnMailerRecordEmailChangeSend:{html:`
                    <p>
                        <code>OnMailerRecordEmailChangeSend</code> hook is triggered when sending a
                        confirmation new address email to an auth record, allowing
                        you to intercept and customize the email message that is being sent.
                    </p>
                    ${e()}
                `,js:`
                    onMailerRecordEmailChangeSend((e) => {
                        // e.app
                        // e.mailer
                        // e.message
                        // e.record
                        // e.meta.token
                        // e.meta.newEmail

                        // ex. change the mail subject
                        e.message.subject = "new subject"

                        e.next()
                    })
                `,go:`
                    package main

                    import (
                        "log"

                        "github.com/pocketbase/pocketbase"
                        "github.com/pocketbase/pocketbase/core"
                    )

                    func main() {
                        app := pocketbase.New()

                        app.OnMailerRecordEmailChangeSend().BindFunc(func(e *core.MailerRecordEvent) error {
                            // e.App
                            // e.Mailer
                            // e.Message
                            // e.Record
                            // e.Meta["token"].(string)
                            // e.Meta["newEmail"].(string)

                            // ex. change the mail subject
                            e.Message.Subject = "new subject"

                            return e.Next()
                        })

                        if err := app.Start(); err != nil {
                            log.Fatal(err)
                        }
                    }
                `},OnMailerRecordOTPSend:{html:`
                    <p>
                        <code>OnMailerRecordOTPSend</code> hook is triggered when sending an OTP email
                        to an auth record, allowing you to intercept and customize the
                        email message that is being sent.
                    </p>
                    ${e()}
                `,js:`
                    onMailerRecordOTPSend((e) => {
                        // e.app
                        // e.mailer
                        // e.message
                        // e.record
                        // e.meta.otpId
                        // e.meta.password

                        // ex. change the mail subject
                        e.message.subject = "new subject"

                        e.next()
                    })
                `,go:`
                    package main

                    import (
                        "log"

                        "github.com/pocketbase/pocketbase"
                        "github.com/pocketbase/pocketbase/core"
                    )

                    func main() {
                        app := pocketbase.New()

                        app.OnMailerRecordOTPSend().BindFunc(func(e *core.MailerRecordEvent) error {
                            // e.App
                            // e.Mailer
                            // e.Message
                            // e.Record
                            // e.Meta["otpId"].(string)
                            // e.Meta["password"].(string)

                            // ex. change the mail subject
                            e.Message.Subject = "new subject"

                            return e.Next()
                        })

                        if err := app.Start(); err != nil {
                            log.Fatal(err)
                        }
                    }
                `}}},{title:`Realtime hooks`,hooks:{OnRealtimeConnectRequest:{html:`
                    <p>
                        <code>OnRealtimeConnectRequest</code> hook is triggered when establishing the SSE client connection.
                    </p>
                    <p>
                        Any execution after e.Next() of a hook handler happens after the client disconnects.
                    </p>
                `,js:`
                    onRealtimeConnectRequest((e) => {
                        // e.app
                        // e.client
                        // e.idleTimeout
                        // and all RequestEvent fields...

                        e.next()
                    })
                `,go:`
                    package main

                    import (
                        "log"

                        "github.com/pocketbase/pocketbase"
                        "github.com/pocketbase/pocketbase/core"
                    )

                    func main() {
                        app := pocketbase.New()

                        app.OnRealtimeConnectRequest().BindFunc(func(e *core.RealtimeConnectRequestEvent) error {
                            // e.App
                            // e.Client
                            // e.IdleTimeout
                            // and all RequestEvent fields...

                            return e.Next()
                        })

                        if err := app.Start(); err != nil {
                            log.Fatal(err)
                        }
                    }
                `},OnRealtimeSubscribeRequest:{html:`
                    <code>OnRealtimeSubscribeRequest</code> hook is triggered when updating the
                    client subscriptions, allowing you to further validate and
                    modify the submitted change.
                `,js:`
                    onRealtimeSubscribeRequest((e) => {
                        // e.app
                        // e.client
                        // e.subscriptions
                        // and all RequestEvent fields...

                        e.next()
                    })
                `,go:`
                    package main

                    import (
                        "log"

                        "github.com/pocketbase/pocketbase"
                        "github.com/pocketbase/pocketbase/core"
                    )

                    func main() {
                        app := pocketbase.New()

                        app.OnRealtimeSubscribeRequest().BindFunc(func(e *core.RealtimeSubscribeRequestEvent) error {
                            // e.App
                            // e.Client
                            // e.Subscriptions
                            // and all RequestEvent fields...

                            return e.Next()
                        })

                        if err := app.Start(); err != nil {
                            log.Fatal(err)
                        }
                    }
                `},OnRealtimeMessageSend:{html:`
                    <code>OnRealtimeMessageSend</code> hook is triggered when sending an SSE message to a client.
                `,js:`
                    onRealtimeMessageSend((e) => {
                        // e.app
                        // e.client
                        // e.message
                        // and all original connect RequestEvent fields...

                        e.next()
                    })
                `,go:`
                    package main

                    import (
                        "log"

                        "github.com/pocketbase/pocketbase"
                        "github.com/pocketbase/pocketbase/core"
                    )

                    func main() {
                        app := pocketbase.New()

                        app.OnRealtimeMessageSend().BindFunc(func(e *core.RealtimeMessageEvent) error {
                            // e.App
                            // e.Client
                            // e.Message
                            // and all original connect RequestEvent fields...

                            return e.Next()
                        })

                        if err := app.Start(); err != nil {
                            log.Fatal(err)
                        }
                    }
                `}}},{title:`Record model hooks`,description:`
            <div class="alert alert-info">
                <div class="icon">
                    <i class="ri-information-line"></i>
                </div>
                <div class="content">
                    <p>These are lower level Record model hooks and could be triggered from anywhere (custom console command, scheduled cron job, when calling <code>e.Save(record)</code>, etc.) and therefore they have no access to the request context!</p>
                    <p>If you want to intercept the builtin Web APIs and to access their request body, query parameters, headers or the request auth state, then please use the designated
                        <a href="#request-hooks">Record <code>*Request</code> hooks</a>
                    .</p>
                </div>
            </div>
        `,hooks:{OnRecordEnrich:{html:`
                    <p>
                        <code>OnRecordEnrich</code> is triggered every time when a record is enriched
                        - as part of the builtin Record responses, during realtime message serialization, or when <code>apis.EnrichRecord</code> is invoked.
                    </p>
                    <p>
                        It could be used for example to redact/hide or add computed temporary
                        Record model props only for the specific request info.
                    </p>
                    ${e(!1)}
                `,js:`
                    onRecordEnrich((e) => {
                        // skip for superuser requests to avoid conflicts with the dashboard UI
                        if (e.requestInfo.hasSuperuserAuth()) {
                            return e.next()
                        }

                        // hide one or more fields
                        e.record.hide("role")

                        // add new custom field for registered users
                        if (e.requestInfo.auth?.collection()?.name == "users") {
                            e.record.withCustomData(true) // for security custom props require to be enabled explicitly
                            e.record.set("computedScore", e.record.get("score") * e.requestInfo.auth.get("base"))
                        }

                        e.next()
                    }, "posts")
                `,go:`
                    package main

                    import (
                        "log"

                        "github.com/pocketbase/pocketbase"
                        "github.com/pocketbase/pocketbase/core"
                    )

                    func main() {
                        app := pocketbase.New()

                        app.OnRecordEnrich("posts").BindFunc(func(e *core.RecordEnrichEvent) error {
                            // skip for superuser requests to avoid conflicts with the dashboard UI
                            if e.RequestInfo.HasSuperuserAuth() {
                                return e.Next()
                            }

                            // hide one or more fields
                            e.Record.Hide("role")

                            // add new custom field for registered users
                            if e.RequestInfo.Auth != nil && e.RequestInfo.Auth.Collection().Name == "users" {
                                e.Record.WithCustomData(true) // for security requires explicitly allowing it
                                e.Record.Set("computedScore", e.Record.GetInt("score") * e.RequestInfo.Auth.GetInt("base"))
                            }

                            return e.Next()
                        })

                        if err := app.Start(); err != nil {
                            log.Fatal(err)
                        }
                    }
                `},OnRecordValidate:{html:`
                    <p>
                        <code>OnRecordValidate</code> is a Record proxy model hook of <code>OnModelValidate</code>.
                    </p>
                    ${o(`Record`)}
                `,js:n(`onRecordValidate`,`record`),go:i(`OnRecordValidate`,`Record`)}}},{title:`Record model create hooks`,tag:`h6`,hooks:{OnRecordCreate:{html:`
                    <p>
                        <code>OnRecordCreate</code> is a Record proxy model hook of <code>OnModelCreate</code>.
                    </p>
                    ${s(`Record`)}
                `,js:n(`onRecordCreate`,`record`),go:i(`OnRecordCreate`,`Record`)},OnRecordCreateExecute:{html:`
                    <p>
                        <code>OnRecordCreateExecute</code> is a Record proxy model hook of <code>OnModelCreateExecute</code>.
                    </p>
                    ${c(`Record`)}
                `,js:n(`onRecordCreateExecute`,`record`),go:i(`OnRecordCreateExecute`,`Record`)},OnRecordAfterCreateSuccess:{html:`
                    <p>
                        <code>OnRecordAfterCreateSuccess</code> is a Record proxy model hook of <code>OnModelAfterCreateSuccess</code>.
                    </p>
                    ${l(`Record`)}
                `,js:n(`onRecordAfterCreateSuccess`,`record`),go:i(`OnRecordAfterCreateSuccess`,`Record`)},OnRecordAfterCreateError:{html:`
                    <p>
                        <code>OnRecordAfterCreateError</code> is a Record proxy model hook of <code>OnModelAfterCreateError</code>.
                    </p>
                    ${u(`Record`)}
                `,js:r(`onRecordAfterCreateError`,`record`),go:a(`OnRecordAfterCreateError`,`Record`)}}},{title:`Record model update hooks`,tag:`h6`,hooks:{OnRecordUpdate:{html:`
                    <p>
                        <code>OnRecordUpdate</code> is a Record proxy model hook of <code>OnModelUpdate</code>.
                    </p>
                    ${d(`Record`)}
                `,js:n(`onRecordUpdate`,`record`),go:i(`OnRecordUpdate`,`Record`)},OnRecordUpdateExecute:{html:`
                    <p>
                        <code>OnRecordUpdateExecute</code> is a Record proxy model hook of <code>OnModelUpdateExecute</code>.
                    </p>
                    ${f(`Record`)}
                `,js:n(`onRecordUpdateExecute`,`record`),go:i(`OnRecordUpdateExecute`,`Record`)},OnRecordAfterUpdateSuccess:{html:`
                    <p>
                        <code>OnRecordAfterUpdateSuccess</code> is a Record proxy model hook of <code>OnModelAfterUpdateSuccess</code>.
                    </p>
                    ${p(`Record`)}
                `,js:n(`onRecordAfterUpdateSuccess`,`record`),go:i(`OnRecordAfterUpdateSuccess`,`Record`)},OnRecordAfterUpdateError:{html:`
                    <p>
                        <code>OnRecordAfterUpdateError</code> is a Record proxy model hook of <code>OnModelAfterUpdateError</code>.
                    </p>
                    ${m(`Record`)}
                `,js:r(`onRecordAfterUpdateError`,`record`),go:a(`OnRecordAfterUpdateError`,`Record`)}}},{title:`Record model delete hooks`,tag:`h6`,hooks:{OnRecordDelete:{html:`
                    <p>
                        <code>OnRecordDelete</code> is a Record proxy model hook of <code>OnModelDelete</code>.
                    </p>
                    ${h(`Record`)}
                `,js:n(`onRecordDelete`,`record`),go:i(`OnRecordDelete`,`Record`)},OnRecordDeleteExecute:{html:`
                    <p>
                        <code>OnRecordDeleteExecute</code> is a Record proxy model hook of <code>OnModelDeleteExecute</code>.
                    </p>
                    ${g(`Record`)}
                `,js:n(`onRecordDeleteExecute`,`record`),go:i(`OnRecordDeleteExecute`,`Record`)},OnRecordAfterDeleteSuccess:{html:`
                    <p>
                        <code>OnRecordAfterDeleteSuccess</code> is a Record proxy model hook of <code>OnModelAfterDeleteSuccess</code>.
                    </p>
                    ${_(`Record`)}
                `,js:n(`onRecordAfterDeleteSuccess`,`record`),go:i(`OnRecordAfterDeleteSuccess`,`Record`)},OnRecordAfterDeleteError:{html:`
                    <p>
                        <code>OnRecordAfterDeleteError</code> is a Record proxy model hook of <code>OnModelAfterDeleteError</code>.
                    </p>
                    ${v(`Record`)}
                `,js:r(`onRecordAfterDeleteError`,`record`),go:a(`OnRecordAfterDeleteError`,`Record`)}}},{title:`Collection model hooks`,description:`
            <div class="alert alert-info">
                <div class="icon">
                    <i class="ri-information-line"></i>
                </div>
                <div class="content">
                    <p>These are lower level Collection model hooks and could be triggered from anywhere (custom console command, scheduled cron job, when calling <code>e.Save(collection)</code>, etc.) and therefore they have no access to the request context!</p>
                    <p>If you want to intercept the builtin Web APIs and to access their request body, query parameters, headers or the request auth state, then please use the designated
                        <a href="#collection-request-hooks">Collection <code>*Request</code> hooks</a>
                    .</p>
                </div>
            </div>
        `,hooks:{OnCollectionValidate:{html:`
                    <p>
                        <code>OnCollectionValidate</code> is a Collection proxy model hook of <code>OnModelValidate</code>.
                    </p>
                    ${o(`Collection`)}
                `,js:n(`onCollectionValidate`,`collection`),go:i(`OnCollectionValidate`,`Collection`)}}},{title:`Collection mode create hooks`,tag:`h6`,hooks:{OnCollectionCreate:{html:`
                    <p>
                        <code>OnCollectionCreate</code> is a Collection proxy model hook of <code>OnModelCreate</code>.
                    </p>
                    ${s(`Collection`)}
                `,js:n(`onCollectionCreate`,`collection`),go:i(`OnCollectionCreate`,`Collection`)},OnCollectionCreateExecute:{html:`
                    <p>
                        <code>OnCollectionCreateExecute</code> is a Collection proxy model hook of <code>OnModelCreateExecute</code>.
                    </p>
                    ${c(`Collection`)}
                `,js:n(`onCollectionCreateExecute`,`collection`),go:i(`OnCollectionCreateExecute`,`Collection`)},OnCollectionAfterCreateSuccess:{html:`
                    <p>
                        <code>OnCollectionAfterCreateSuccess</code> is a Collection proxy model hook of <code>OnModelAfterCreateSuccess</code>.
                    </p>
                    ${l(`Collection`)}
                `,js:n(`onCollectionAfterCreateSuccess`,`collection`),go:i(`OnCollectionAfterCreateSuccess`,`Collection`)},OnCollectionAfterCreateError:{html:`
                    <p>
                        <code>OnCollectionAfterCreateError</code> is a Collection proxy model hook of <code>OnModelAfterCreateError</code>.
                    </p>
                    ${u(`Collection`)}
                `,js:r(`onCollectionAfterCreateError`,`collection`),go:a(`OnCollectionAfterCreateError`,`Collection`)}}},{title:`Collection mode update hooks`,tag:`h6`,hooks:{OnCollectionUpdate:{html:`
                    <p>
                        <code>OnCollectionUpdate</code> is a Collection proxy model hook of <code>OnModelUpdate</code>.
                    </p>
                    ${d(`Collection`)}
                `,js:n(`onCollectionUpdate`,`collection`),go:i(`OnCollectionUpdate`,`Collection`)},OnCollectionUpdateExecute:{html:`
                    <p>
                        <code>OnCollectionUpdateExecute</code> is a Collection proxy model hook of <code>OnModelUpdateExecute</code>.
                    </p>
                    ${f(`Collection`)}
                `,js:n(`onCollectionUpdateExecute`,`collection`),go:i(`OnCollectionUpdateExecute`,`Collection`)},OnCollectionAfterUpdateSuccess:{html:`
                    <p>
                        <code>OnCollectionAfterUpdateSuccess</code> is a Collection proxy model hook of <code>OnModelAfterUpdateSuccess</code>.
                    </p>
                    ${p(`Collection`)}
                `,js:n(`onCollectionAfterUpdateSuccess`,`collection`),go:i(`OnCollectionAfterUpdateSuccess`,`Collection`)},OnCollectionAfterUpdateError:{html:`
                    <p>
                        <code>OnCollectionAfterUpdateError</code> is a Collection proxy model hook of <code>OnModelAfterUpdateError</code>.
                    </p>
                    ${m(`Collection`)}
                `,js:r(`onCollectionAfterUpdateError`,`collection`),go:a(`OnCollectionAfterUpdateError`,`Collection`)}}},{title:`Collection mode delete hooks`,tag:`h6`,hooks:{OnCollectionDelete:{html:`
                    <p>
                        <code>OnCollectionDelete</code> is a Collection proxy model hook of <code>OnModelDelete</code>.
                    </p>
                    ${h(`Collection`)}
                `,js:n(`onCollectionDelete`,`collection`),go:i(`OnCollectionDelete`,`Collection`)},OnCollectionDeleteExecute:{html:`
                    <p>
                        <code>OnCollectionDeleteExecute</code> is a Collection proxy model hook of <code>OnModelDeleteExecute</code>.
                    </p>
                    ${g(`Collection`)}
                `,js:n(`onCollectionDeleteExecute`,`collection`),go:i(`OnCollectionDeleteExecute`,`Collection`)},OnCollectionAfterDeleteSuccess:{html:`
                    <p>
                        <code>OnCollectionAfterDeleteSuccess</code> is a Collection proxy model hook of <code>OnModelAfterDeleteSuccess</code>.
                    </p>
                    ${_(`Collection`)}
                `,js:n(`onCollectionAfterDeleteSuccess`,`collection`),go:i(`OnCollectionAfterDeleteSuccess`,`Collection`)},OnCollectionAfterDeleteError:{html:`
                    <p>
                        <code>OnCollectionAfterDeleteError</code> is a Collection proxy model hook of <code>OnModelAfterDeleteError</code>.
                    </p>
                    ${v(`Collection`)}
                `,js:r(`onCollectionAfterDeleteError`,`collection`),go:a(`OnCollectionAfterDeleteError`,`Collection`)}}},{title:`Request hooks`,description:`
            <div class="alert alert-info">
                <div class="icon">
                    <i class="ri-information-line"></i>
                </div>
                <div class="content">
                    <p>The request hooks are triggered only when the corresponding API request endpoint is accessed.</p>
                </div>
            </div>
        `},{title:`Record CRUD request hooks`,tag:`h6`,hooks:{OnRecordsListRequest:{html:`
                    <p>
                        <code>OnRecordsListRequest</code> hook is triggered on each API Records list request.
                        Could be used to validate or modify the response before returning it to the client.
                    </p>
                    ${t}
                    ${e()}
                `,js:`
                    // fires for every collection
                    onRecordsListRequest((e) => {
                        // e.app
                        // e.collection
                        // e.records
                        // e.result
                        // and all RequestEvent fields...

                        e.next()
                    })

                    // fires only for "users" and "articles" collections
                    onRecordsListRequest((e) => {
                        // e.app
                        // e.collection
                        // e.records
                        // e.result
                        // and all RequestEvent fields...

                        e.next()
                    }, "users", "articles")
                `,go:`
                    package main

                    import (
                        "log"

                        "github.com/pocketbase/pocketbase"
                        "github.com/pocketbase/pocketbase/core"
                    )

                    func main() {
                        app := pocketbase.New()

                        // fires for every collection
                        app.OnRecordsListRequest().BindFunc(func(e *core.RecordsListRequestEvent) error {
                            // e.App
                            // e.Collection
                            // e.Records
                            // e.Result
                            // and all RequestEvent fields...

                            return e.Next()
                        })

                        // fires only for "users" and "articles" collections
                        app.OnRecordsListRequest("users", "articles").BindFunc(func(e *core.RecordsListRequestEvent) error {
                            // e.App
                            // e.Collection
                            // e.Records
                            // e.Result
                            // and all RequestEvent fields...

                            return e.Next()
                        })

                        if err := app.Start(); err != nil {
                            log.Fatal(err)
                        }
                    }
                `},OnRecordViewRequest:{html:`
                    <p>
                        <code>OnRecordViewRequest</code> hook is triggered on each API Record view request.
                        Could be used to validate or modify the response before returning it to the client.
                    </p>
                    ${t}
                    ${e()}
                `,js:`
                    // fires for every collection
                    onRecordViewRequest((e) => {
                        // e.app
                        // e.collection
                        // e.record
                        // and all RequestEvent fields...

                        e.next()
                    })

                    // fires only for "users" and "articles" collections
                    onRecordViewRequest((e) => {
                        // e.app
                        // e.collection
                        // e.record
                        // and all RequestEvent fields...

                        e.next()
                    }, "users", "articles")
                `,go:`
                    package main

                    import (
                        "log"

                        "github.com/pocketbase/pocketbase"
                        "github.com/pocketbase/pocketbase/core"
                    )

                    func main() {
                        app := pocketbase.New()

                        // fires for every collection
                        app.OnRecordViewRequest().BindFunc(func(e *core.RecordRequestEvent) error {
                            // e.App
                            // e.Collection
                            // e.Record
                            // and all RequestEvent fields...

                            return e.Next()
                        })

                        // fires only for "users" and "articles" collections
                        app.OnRecordViewRequest("users", "articles").BindFunc(func(e *core.RecordRequestEvent) error {
                            log.Println(e.HttpContext)
                            log.Println(e.Record)
                            return nil
                        })

                        if err := app.Start(); err != nil {
                            log.Fatal(err)
                        }
                    }
                `},OnRecordCreateRequest:{html:`
                    <p>
                        <code>OnRecordCreateRequest</code> hook is triggered on each API Record create request.
                        <br/>
                        Could be used to additionally validate the request data or implement
                        completely different persistence behavior.
                    </p>
                    ${e()}
                `,js:`
                    // fires for every collection
                    onRecordCreateRequest((e) => {
                        // e.app
                        // e.collection
                        // e.record
                        // and all RequestEvent fields...

                        e.next()
                    })

                    // fires only for "users" and "articles" collections
                    onRecordCreateRequest((e) => {
                        // e.app
                        // e.collection
                        // e.record
                        // and all RequestEvent fields...

                        e.next()
                    }, "users", "articles")
                `,go:`
                    package main

                    import (
                        "log"

                        "github.com/pocketbase/pocketbase"
                        "github.com/pocketbase/pocketbase/core"
                    )

                    func main() {
                        app := pocketbase.New()

                        // fires for every collection
                        app.OnRecordCreateRequest().BindFunc(func(e *core.RecordRequestEvent) error {
                            // e.App
                            // e.Collection
                            // e.Record
                            // and all RequestEvent fields...

                            return e.Next()
                        })

                        // fires only for "users" and "articles" collections
                        app.OnRecordCreateRequest("users", "articles").BindFunc(func(e *core.RecordRequestEvent) error {
                            // e.App
                            // e.Collection
                            // e.Record
                            // and all RequestEvent fields...

                            return e.Next()
                        })

                        if err := app.Start(); err != nil {
                            log.Fatal(err)
                        }
                    }
                `},OnRecordUpdateRequest:{html:`
                    <p>
                        <code>OnRecordUpdateRequest</code> hook is triggered on each API Record update request.
                        <br/>
                        Could be used to additionally validate the request data or implement
                        completely different persistence behavior.
                    </p>
                    ${e()}
                `,js:`
                    // fires for every collection
                    onRecordUpdateRequest((e) => {
                        // e.app
                        // e.collection
                        // e.record
                        // and all RequestEvent fields...

                        e.next()
                    })

                    // fires only for "users" and "articles" collections
                    onRecordUpdateRequest((e) => {
                        // e.app
                        // e.collection
                        // e.record
                        // and all RequestEvent fields...

                        e.next()
                    }, "users", "articles")
                `,go:`
                    package main

                    import (
                        "log"

                        "github.com/pocketbase/pocketbase"
                        "github.com/pocketbase/pocketbase/core"
                    )

                    func main() {
                        app := pocketbase.New()

                        // fires for every collection
                        app.OnRecordUpdateRequest().BindFunc(func(e *core.RecordRequestEvent) error {
                            // e.App
                            // e.Collection
                            // e.Record
                            // and all RequestEvent fields...

                            return e.Next()
                        })

                        // fires only for "users" and "articles" collections
                        app.OnRecordUpdateRequest("users", "articles").BindFunc(func(e *core.RecordRequestEvent) error {
                            // e.App
                            // e.Collection
                            // e.Record
                            // and all RequestEvent fields...

                            return e.Next()
                        })

                        if err := app.Start(); err != nil {
                            log.Fatal(err)
                        }
                    }
                `},OnRecordDeleteRequest:{html:`
                    <p>
                        <code>OnRecordDeleteRequest</code> hook is triggered on each API Record delete request.
                        <br/>
                        Could be used to additionally validate the request data or implement
                        completely different delete behavior.
                    </p>
                    ${e()}
                `,js:`
                    // fires for every collection
                    onRecordDeleteRequest((e) => {
                        // e.app
                        // e.collection
                        // e.record
                        // and all RequestEvent fields...

                        e.next()
                    })

                    // fires only for "users" and "articles" collections
                    onRecordDeleteRequest((e) => {
                        // e.app
                        // e.collection
                        // e.record
                        // and all RequestEvent fields...

                        e.next()
                    }, "users", "articles")
                `,go:`
                    package main

                    import (
                        "log"

                        "github.com/pocketbase/pocketbase"
                        "github.com/pocketbase/pocketbase/core"
                    )

                    func main() {
                        app := pocketbase.New()

                        // fires for every collection
                        app.OnRecordDeleteRequest().BindFunc(func(e *core.RecordRequestEvent) error {
                            // e.App
                            // e.Collection
                            // e.Record
                            // and all RequestEvent fields...

                            return e.Next()
                        })

                        // fires only for "users" and "articles" collections
                        app.OnRecordDeleteRequest("users", "articles").BindFunc(func(e *core.RecordRequestEvent) error {
                            // e.App
                            // e.Collection
                            // e.Record
                            // and all RequestEvent fields...

                            return e.Next()
                        })

                        if err := app.Start(); err != nil {
                            log.Fatal(err)
                        }
                    }
                `}}},{title:`Record auth request hooks`,tag:`h6`,hooks:{OnRecordAuthRequest:{html:`
                    <p>
                        <code>OnRecordAuthRequest</code> hook is triggered on each successful API
                        record authentication request (sign-in, token refresh, etc.).
                        Could be used to additionally validate or modify the authenticated
                        record data and token.
                    </p>
                    ${e()}
                `,js:`
                    // fires for every auth collection
                    onRecordAuthRequest((e) => {
                        // e.app
                        // e.record
                        // e.token
                        // e.meta
                        // e.authMethod
                        // and all RequestEvent fields...

                        e.next()
                    })

                    // fires only for "users" and "managers" auth collections
                    onRecordAuthRequest((e) => {
                        // e.app
                        // e.record
                        // e.token
                        // e.meta
                        // e.authMethod
                        // and all RequestEvent fields...

                        e.next()
                    }, "users", "managers")
                `,go:`
                    package main

                    import (
                        "log"

                        "github.com/pocketbase/pocketbase"
                        "github.com/pocketbase/pocketbase/core"
                    )

                    func main() {
                        app := pocketbase.New()

                        // fires for every auth collection
                        app.OnRecordAuthRequest().BindFunc(func(e *core.RecordAuthRequestEvent) error {
                            // e.App
                            // e.Record
                            // e.Token
                            // e.Meta
                            // e.AuthMethod
                            // and all RequestEvent fields...

                            return e.Next()
                        })

                        // fires only for "users" and "managers" auth collections
                        app.OnRecordAuthRequest("users", "managers").BindFunc(func(e *core.RecordAuthRequestEvent) error {
                            // e.App
                            // e.Record
                            // e.Token
                            // e.Meta
                            // e.AuthMethod
                            // and all RequestEvent fields...

                            return e.Next()
                        })

                        if err := app.Start(); err != nil {
                            log.Fatal(err)
                        }
                    }
                `},OnRecordAuthRefreshRequest:{html:`
                    <p>
                        <code>OnRecordAuthRefreshRequest</code> hook is triggered on each Record
                        auth refresh API request (right before generating a new auth token).
                    </p>
                    <p>
                        Could be used to additionally validate the request data or implement
                        completely different auth refresh behavior.
                    </p>
                    ${e()}
                `,js:`
                    // fires for every auth collection
                    onRecordAuthRefreshRequest((e) => {
                        // e.app
                        // e.collection
                        // e.record
                        // and all RequestEvent fields...

                        e.next()
                    })

                    // fires only for "users" and "managers" auth collections
                    onRecordAuthRefreshRequest((e) => {
                        // e.app
                        // e.collection
                        // e.record
                        // and all RequestEvent fields...

                        e.next()
                    }, "users", "managers")
                `,go:`
                    package main

                    import (
                        "log"

                        "github.com/pocketbase/pocketbase"
                        "github.com/pocketbase/pocketbase/core"
                    )

                    func main() {
                        app := pocketbase.New()

                        // fires for every auth collection
                        app.OnRecordAuthRefreshRequest().BindFunc(func(e *core.RecordAuthWithOAuth2RequestEvent) error {
                            // e.App
                            // e.Collection
                            // e.Record
                            // and all RequestEvent fields...

                            return e.Next()
                        })

                        // fires only for "users" and "managers" auth collections
                        app.OnRecordAuthRefreshRequest("users", "managers").BindFunc(func(e *core.RecordAuthWithOAuth2RequestEvent) error {
                            // e.App
                            // e.Collection
                            // e.Record
                            // and all RequestEvent fields...

                            return e.Next()
                        })

                        if err := app.Start(); err != nil {
                            log.Fatal(err)
                        }
                    }
                `},OnRecordAuthWithPasswordRequest:{html:`
                    <p>
                        <code>OnRecordAuthWithPasswordRequest</code> hook is triggered on each
                        Record auth with password API request.
                    </p>
                    <p class="txt-bold">
                        <code>e.Record</code> could be <code>nil</code> if no matching identity is found, allowing
                        you to manually locate a different Record model (by reassigning <code>e.Record</code>).
                    </p>
                    ${e()}
                `,js:`
                    // fires for every auth collection
                    onRecordAuthWithPasswordRequest((e) => {
                        // e.app
                        // e.collection
                        // e.record (could be null)
                        // e.identity
                        // e.identityField
                        // e.password
                        // and all RequestEvent fields...

                        e.next()
                    })

                    // fires only for "users" and "managers" auth collections
                    onRecordAuthWithPasswordRequest((e) => {
                        // e.app
                        // e.collection
                        // e.record (could be null)
                        // e.identity
                        // e.identityField
                        // e.password
                        // and all RequestEvent fields...

                        e.next()
                    }, "users", "managers")
                `,go:`
                    package main

                    import (
                        "log"

                        "github.com/pocketbase/pocketbase"
                        "github.com/pocketbase/pocketbase/core"
                    )

                    func main() {
                        app := pocketbase.New()

                        // fires for every auth collection
                        app.OnRecordAuthWithPasswordRequest().BindFunc(func(e *core.RecordAuthWithPasswordRequestEvent) error {
                            // e.App
                            // e.Collection
                            // e.Record (could be nil)
                            // e.Identity
                            // e.IdentityField
                            // e.Password
                            // and all RequestEvent fields...

                            return e.Next()
                        })

                        // fires only for "users" and "managers" auth collections
                        app.OnRecordAuthWithPasswordRequest("users", "managers").BindFunc(func(e *core.RecordAuthWithPasswordRequestEvent) error {
                            // e.App
                            // e.Collection
                            // e.Record (could be nil)
                            // e.Identity
                            // e.IdentityField
                            // e.Password
                            // and all RequestEvent fields...

                            return e.Next()
                        })

                        if err := app.Start(); err != nil {
                            log.Fatal(err)
                        }
                    }
                `},OnRecordAuthWithOAuth2Request:{html:`
                    <p>
                        <code>OnRecordAuthWithOAuth2Request</code> hook is triggered on each Record
                        OAuth2 sign-in/sign-up API request (after token exchange and before external provider linking).
                    </p>
                    <p>
                        If <code>e.Record</code> is not set, then the OAuth2
                        request will try to create a new auth record.
                        <br>
                        To assign or link a different existing record model you can
                        change the <code>e.Record</code> field.
                    </p>
                    ${e()}
                `,js:`
                    // fires for every auth collection
                    onRecordAuthWithOAuth2Request((e) => {
                        // e.app
                        // e.collection
                        // e.providerName
                        // e.providerClient
                        // e.record (could be null)
                        // e.oauth2User
                        // e.createData
                        // e.isNewRecord
                        // and all RequestEvent fields...

                        e.next()
                    })

                    // fires only for "users" and "managers" auth collections
                    onRecordAuthWithOAuth2Request((e) => {
                        // e.app
                        // e.collection
                        // e.providerName
                        // e.providerClient
                        // e.record (could be null)
                        // e.oauth2User
                        // e.createData
                        // e.isNewRecord
                        // and all RequestEvent fields...

                        e.next()
                    }, "users", "managers")
                `,go:`
                    package main

                    import (
                        "log"

                        "github.com/pocketbase/pocketbase"
                        "github.com/pocketbase/pocketbase/core"
                    )

                    func main() {
                        app := pocketbase.New()

                        // fires for every auth collection
                        app.OnRecordAuthWithOAuth2Request().BindFunc(func(e *core.RecordAuthWithOAuth2RequestEvent) error {
                            // e.App
                            // e.Collection
                            // e.ProviderName
                            // e.ProviderClient
                            // e.Record (could be nil)
                            // e.OAuth2User
                            // e.CreateData
                            // e.IsNewRecord
                            // and all RequestEvent fields...

                            return e.Next()
                        })

                        // fires only for "users" and "managers" auth collections
                        app.OnRecordAuthWithOAuth2Request("users", "managers").BindFunc(func(e *core.RecordAuthWithOAuth2RequestEvent) error {
                            // e.App
                            // e.Collection
                            // e.ProviderName
                            // e.ProviderClient
                            // e.Record (could be nil)
                            // e.OAuth2User
                            // e.CreateData
                            // e.IsNewRecord
                            // and all RequestEvent fields...

                            return e.Next()
                        })

                        if err := app.Start(); err != nil {
                            log.Fatal(err)
                        }
                    }
                `},OnRecordRequestPasswordResetRequest:{html:`
                    <p>
                        <code>OnRecordRequestPasswordResetRequest</code> hook is triggered on
                        each Record request password reset API request.
                    </p>
                    <p>
                        Could be used to additionally validate the request data or implement
                        completely different password reset behavior.
                    </p>
                    ${e()}
                `,js:`
                    // fires for every auth collection
                    onRecordRequestPasswordResetRequest((e) => {
                        // e.app
                        // e.collection
                        // e.record
                        // and all RequestEvent fields...

                        e.next()
                    })

                    // fires only for "users" and "managers" auth collections
                    onRecordRequestPasswordResetRequest((e) => {
                        // e.app
                        // e.collection
                        // e.record
                        // and all RequestEvent fields...

                        e.next()
                    }, "users", "managers")
                `,go:`
                    package main

                    import (
                        "log"

                        "github.com/pocketbase/pocketbase"
                        "github.com/pocketbase/pocketbase/core"
                    )

                    func main() {
                        app := pocketbase.New()

                        // fires for every auth collection
                        app.OnRecordRequestPasswordResetRequest().BindFunc(func(e *core.RecordRequestPasswordResetRequestEvent) error {
                            // e.App
                            // e.Collection
                            // e.Record
                            // and all RequestEvent fields...

                            return e.Next()
                        })

                        // fires only for "users" and "managers" auth collections
                        app.OnRecordRequestPasswordResetRequest("users", "managers").BindFunc(func(e *core.RecordRequestPasswordResetRequestEvent) error {
                            // e.App
                            // e.Collection
                            // e.Record
                            // and all RequestEvent fields...

                            return e.Next()
                        })

                        if err := app.Start(); err != nil {
                            log.Fatal(err)
                        }
                    }
                `},OnRecordConfirmPasswordResetRequest:{html:`
                    <p>
                        <code>OnRecordConfirmPasswordResetRequest</code> hook is triggered on
                        each Record confirm password reset API request.
                    </p>
                    <p>
                        Could be used to additionally validate the request data or implement
                        completely different persistence behavior.
                    </p>
                    ${e()}
                `,js:`
                    // fires for every auth collection
                    onRecordConfirmPasswordResetRequest((e) => {
                        // e.app
                        // e.collection
                        // e.record
                        // and all RequestEvent fields...

                        e.next()
                    })

                    // fires only for "users" and "managers" auth collections
                    onRecordConfirmPasswordResetRequest((e) => {
                        // e.app
                        // e.collection
                        // e.record
                        // and all RequestEvent fields...

                        e.next()
                    }, "users", "managers")
                `,go:`
                    package main

                    import (
                        "log"

                        "github.com/pocketbase/pocketbase"
                        "github.com/pocketbase/pocketbase/core"
                    )

                    func main() {
                        app := pocketbase.New()

                        // fires for every auth collection
                        app.OnRecordConfirmPasswordResetRequest().BindFunc(func(e *core.RecordConfirmPasswordResetRequestEvent) error {
                            // e.App
                            // e.Collection
                            // e.Record
                            // and all RequestEvent fields...

                            return e.Next()
                        })

                        // fires only for "users" and "managers" auth collections
                        app.OnRecordConfirmPasswordResetRequest("users", "managers").BindFunc(func(e *core.RecordConfirmPasswordResetRequestEvent) error {
                            // e.App
                            // e.Collection
                            // e.Record
                            // and all RequestEvent fields...

                            return e.Next()
                        })

                        if err := app.Start(); err != nil {
                            log.Fatal(err)
                        }
                    }
                `},OnRecordRequestVerificationRequest:{html:`
                    <p>
                        <code>OnRecordRequestVerificationRequest</code> hook is triggered on
                        each Record request verification API request.
                    </p>
                    <p>
                        Could be used to additionally validate the loaded request data or implement
                        completely different verification behavior.
                    </p>
                    ${e()}
                `,js:`
                    // fires for every auth collection
                    onRecordRequestVerificationRequest((e) => {
                        // e.app
                        // e.collection
                        // e.record
                        // and all RequestEvent fields...

                        e.next()
                    })

                    // fires only for "users" and "managers" auth collections
                    onRecordRequestVerificationRequest((e) => {
                        // e.app
                        // e.collection
                        // e.record
                        // and all RequestEvent fields...

                        e.next()
                    }, "users", "managers")
                `,go:`
                    package main

                    import (
                        "log"

                        "github.com/pocketbase/pocketbase"
                        "github.com/pocketbase/pocketbase/core"
                    )

                    func main() {
                        app := pocketbase.New()

                        // fires for every auth collection
                        app.OnRecordRequestVerificationRequest().BindFunc(func(e *core.RecordRequestVerificationRequestEvent) error {
                            // e.App
                            // e.Collection
                            // e.Record
                            // and all RequestEvent fields...

                            return e.Next()
                        })

                        // fires only for "users" and "managers" auth collections
                        app.OnRecordRequestVerificationRequest("users", "managers").BindFunc(func(e *core.RecordRequestVerificationRequestEvent) error {
                            // e.App
                            // e.Collection
                            // e.Record
                            // and all RequestEvent fields...

                            return e.Next()
                        })

                        if err := app.Start(); err != nil {
                            log.Fatal(err)
                        }
                    }
                `},OnRecordConfirmVerificationRequest:{html:`
                    <p>
                        <code>OnRecordConfirmVerificationRequest</code> hook is triggered on each
                        Record confirm verification API request.
                    </p>
                    <p>
                        Could be used to additionally validate the request data or implement
                        completely different persistence behavior.
                    </p>
                    ${e()}
                `,js:`
                    // fires for every auth collection
                    onRecordConfirmVerificationRequest((e) => {
                        // e.app
                        // e.collection
                        // e.record
                        // and all RequestEvent fields...

                        e.next()
                    })

                    // fires only for "users" and "managers" auth collections
                    onRecordConfirmVerificationRequest((e) => {
                        // e.app
                        // e.collection
                        // e.record
                        // and all RequestEvent fields...

                        e.next()
                    }, "users", "managers")
                `,go:`
                    package main

                    import (
                        "log"

                        "github.com/pocketbase/pocketbase"
                        "github.com/pocketbase/pocketbase/core"
                    )

                    func main() {
                        app := pocketbase.New()

                        // fires for every auth collection
                        app.OnRecordConfirmVerificationRequest().BindFunc(func(e *core.RecordConfirmVerificationRequestEvent) error {
                            // e.App
                            // e.Collection
                            // e.Record
                            // and all RequestEvent fields...

                            return e.Next()
                        })

                        // fires only for "users" and "managers" auth collections
                        app.OnRecordConfirmVerificationRequest("users", "managers").BindFunc(func(e *core.RecordConfirmVerificationRequestEvent) error {
                            // e.App
                            // e.Collection
                            // e.Record
                            // and all RequestEvent fields...

                            return e.Next()
                        })

                        if err := app.Start(); err != nil {
                            log.Fatal(err)
                        }
                    }
                `},OnRecordRequestEmailChangeRequest:{html:`
                    <p>
                        <code>OnRecordRequestEmailChangeRequest</code> hook is triggered on each
                        Record request email change API request.
                    </p>
                    <p>
                        Could be used to additionally validate the request data or implement
                        completely different request email change behavior.
                    </p>
                    ${e()}
                `,js:`
                    // fires for every auth collection
                    onRecordRequestEmailChangeRequest((e) => {
                        // e.app
                        // e.collection
                        // e.record
                        // e.newEmail
                        // and all RequestEvent fields...

                        e.next()
                    })

                    // fires only for "users" and "managers" auth collections
                    onRecordRequestEmailChangeRequest((e) => {
                        // e.app
                        // e.collection
                        // e.record
                        // e.newEmail
                        // and all RequestEvent fields...

                        e.next()
                    }, "users", "managers")
                `,go:`
                    package main

                    import (
                        "log"

                        "github.com/pocketbase/pocketbase"
                        "github.com/pocketbase/pocketbase/core"
                    )

                    func main() {
                        app := pocketbase.New()

                        // fires for every auth collection
                        app.OnRecordRequestEmailChangeRequest().BindFunc(func(e *core.RecordRequestEmailChangeRequestEvent) error {
                            // e.App
                            // e.Collection
                            // e.Record
                            // e.NewEmail
                            // and all RequestEvent fields...

                            return e.Next()
                        })

                        // fires only for "users" and "managers" auth collections
                        app.OnRecordRequestEmailChangeRequest("users", "managers").BindFunc(func(e *core.RecordRequestEmailChangeRequestEvent) error {
                            // e.App
                            // e.Collection
                            // e.Record
                            // e.NewEmail
                            // and all RequestEvent fields...

                            return e.Next()
                        })

                        if err := app.Start(); err != nil {
                            log.Fatal(err)
                        }
                    }
                `},OnRecordConfirmEmailChangeRequest:{html:`
                    <p>
                        <code>OnRecordConfirmEmailChangeRequest</code> hook is triggered on each
                        Record confirm email change API request.
                    </p>
                    <p>
                       Could be used to additionally validate the request data or implement
                       completely different persistence behavior.
                    </p>
                    ${e()}
                `,js:`
                    // fires for every auth collection
                    onRecordConfirmEmailChangeRequest((e) => {
                        // e.app
                        // e.collection
                        // e.record
                        // e.newEmail
                        // and all RequestEvent fields...

                        e.next()
                    })

                    // fires only for "users" and "managers" auth collections
                    onRecordConfirmEmailChangeRequest((e) => {
                        // e.app
                        // e.collection
                        // e.record
                        // e.newEmail
                        // and all RequestEvent fields...

                        e.next()
                    }, "users", "managers")
                `,go:`
                    package main

                    import (
                        "log"

                        "github.com/pocketbase/pocketbase"
                        "github.com/pocketbase/pocketbase/core"
                    )

                    func main() {
                        app := pocketbase.New()

                        // fires for every auth collection
                        app.OnRecordConfirmEmailChangeRequest().BindFunc(func(e *core.RecordConfirmEmailChangeRequestEvent) error {
                            // e.App
                            // e.Collection
                            // e.Record
                            // e.NewEmail
                            // and all RequestEvent fields...

                            return e.Next()
                        })

                        // fires only for "users" and "managers" auth collections
                        app.OnRecordConfirmEmailChangeRequest("users", "managers").BindFunc(func(e *core.RecordConfirmEmailChangeRequestEvent) error {
                            // e.App
                            // e.Collection
                            // e.Record
                            // e.NewEmail
                            // and all RequestEvent fields...

                            return e.Next()
                        })

                        if err := app.Start(); err != nil {
                            log.Fatal(err)
                        }
                    }
                `},OnRecordRequestOTPRequest:{html:`
                    <p>
                        <code>OnRecordRequestOTPRequest</code> hook is triggered on each Record
                        request OTP API request.
                    </p>
                    <p class="txt-bold">
                        <code>e.Record</code> could be <code>nil</code> if no user with the requested email is found, allowing
                        you to manually create a new Record or locate a different Record model (by reassigning <code>e.Record</code>).
                    </p>
                    ${e()}
                `,js:`
                    // fires for every auth collection
                    onRecordRequestOTPRequest((e) => {
                        // e.app
                        // e.collection
                        // e.record (could be null)
                        // e.password
                        // and all RequestEvent fields...

                        e.next()
                    })

                    // fires only for "users" and "managers" auth collections
                    onRecordRequestOTPRequest((e) => {
                        // e.app
                        // e.collection
                        // e.record (could be null)
                        // e.password
                        // and all RequestEvent fields...

                        e.next()
                    }, "users", "managers")
                `,go:`
                    package main

                    import (
                        "log"

                        "github.com/pocketbase/pocketbase"
                        "github.com/pocketbase/pocketbase/core"
                    )

                    func main() {
                        app := pocketbase.New()

                        // fires for every auth collection
                        app.OnRecordRequestOTPRequest().BindFunc(func(e *core.RecordCreateOTPRequestEvent) error {
                            // e.App
                            // e.Collection
                            // e.Record (could be nil)
                            // e.Password
                            // and all RequestEvent fields...

                            return e.Next()
                        })

                        // fires only for "users" and "managers" auth collections
                        app.OnRecordRequestOTPRequest("users", "managers").BindFunc(func(e *core.RecordCreateOTPRequestEvent) error {
                            // e.App
                            // e.Collection
                            // e.Record (could be nil)
                            // e.Password
                            // and all RequestEvent fields...

                            return e.Next()
                        })

                        if err := app.Start(); err != nil {
                            log.Fatal(err)
                        }
                    }
                `},OnRecordAuthWithOTPRequest:{html:`
                    <p>
                        <code>OnRecordAuthWithOTPRequest</code> hook is triggered on each Record
                        auth with OTP API request.
                    </p>
                    ${e()}
                `,js:`
                    // fires for every auth collection
                    onRecordAuthWithOTPRequest((e) => {
                        // e.app
                        // e.collection
                        // e.record
                        // e.otp
                        // and all RequestEvent fields...

                        e.next()
                    })

                    // fires only for "users" and "managers" auth collections
                    onRecordAuthWithOTPRequest((e) => {
                        // e.app
                        // e.collection
                        // e.record
                        // e.otp
                        // and all RequestEvent fields...

                        e.next()
                    }, "users", "managers")
                `,go:`
                    package main

                    import (
                        "log"

                        "github.com/pocketbase/pocketbase"
                        "github.com/pocketbase/pocketbase/core"
                    )

                    func main() {
                        app := pocketbase.New()

                        // fires for every auth collection
                        app.OnRecordAuthWithOTPRequest().BindFunc(func(e *core.RecordAuthWithOTPRequestEvent) error {
                            // e.App
                            // e.Collection
                            // e.Record
                            // e.OTP
                            // and all RequestEvent fields...

                            return e.Next()
                        })

                        // fires only for "users" and "managers" auth collections
                        app.OnRecordAuthWithOTPRequest("users", "managers").BindFunc(func(e *core.RecordAuthWithOTPRequestEvent) error {
                            // e.App
                            // e.Collection
                            // e.Record
                            // e.OTP
                            // and all RequestEvent fields...

                            return e.Next()
                        })

                        if err := app.Start(); err != nil {
                            log.Fatal(err)
                        }
                    }
                `}}},{title:`Batch request hooks`,tag:`h6`,hooks:{OnBatchRequest:{html:`
                    <p><code>OnBatchRequest</code> hook is triggered on each API batch request.</p>
                    <p>Could be used to additionally validate or modify the submitted batch requests.</p>
                    <p>This hook will also fire the corresponding <code>OnRecordCreateRequest</code>, <code>OnRecordUpdateRequest</code>, <code>OnRecordDeleteRequest</code> hooks, where <code>e.App</code> is the batch transactional app.</p>
                `,js:`
                    onBatchRequest((e) => {
                        // e.app
                        // e.batch
                        // and all RequestEvent fields...

                        e.next()
                    })
                `,go:`
                    package main

                    import (
                        "log"

                        "github.com/pocketbase/pocketbase"
                        "github.com/pocketbase/pocketbase/core"
                    )

                    func main() {
                        app := pocketbase.New()

                        app.OnBatchRequest().BindFunc(func(e *core.BatchRequestEvent) error {
                            // e.App
                            // e.Batch
                            // and all RequestEvent fields...

                            return e.Next()
                        })

                        if err := app.Start(); err != nil {
                            log.Fatal(err)
                        }
                    }
                `}}},{title:`File request hooks`,tag:`h6`,hooks:{OnFileDownloadRequest:{html:`
                    <code>OnFileDownloadRequest</code> hook is triggered before each API File download request.
                    Could be used to validate or modify the file response before returning it to the client.
                `,js:`
                    onFileDownloadRequest((e) => {
                        // e.app
                        // e.collection
                        // e.record
                        // e.fileField
                        // e.servedPath
                        // e.servedName
                        // and all RequestEvent fields...

                        e.next()
                    })
                `,go:`
                    package main

                    import (
                        "log"

                        "github.com/pocketbase/pocketbase"
                        "github.com/pocketbase/pocketbase/core"
                    )

                    func main() {
                        app := pocketbase.New()

                        app.OnFileDownloadRequest().BindFunc(func(e *core.FileDownloadRequestEvent) error {
                            // e.App
                            // e.Collection
                            // e.Record
                            // e.FileField
                            // e.ServedPath
                            // e.ServedName
                            // and all RequestEvent fields...

                            return e.Next()
                        })

                        if err := app.Start(); err != nil {
                            log.Fatal(err)
                        }
                    }
                `},OnFileTokenRequest:{html:`
                    <p>
                        <code>OnFileTokenRequest</code> hook is triggered on each auth file token API request.
                    </p>
                    ${e()}
                `,js:`
                    // fires for every auth model
                    onFileTokenRequest((e) => {
                        // e.app
                        // e.record
                        // e.token
                        // and all RequestEvent fields...

                        e.next();
                    })

                    // fires only for "users"
                    onFileTokenRequest((e) => {
                        // e.app
                        // e.record
                        // e.token
                        // and all RequestEvent fields...

                        e.next();
                    }, "users")
                `,go:`
                    package main

                    import (
                        "log"

                        "github.com/pocketbase/pocketbase"
                        "github.com/pocketbase/pocketbase/core"
                    )

                    func main() {
                        app := pocketbase.New()

                        // fires for every auth model
                        app.OnFileTokenRequest().BindFunc(func(e *core.FileTokenRequestEvent) error {
                            // e.App
                            // e.Record
                            // e.Token
                            // and all RequestEvent fields...

                            return e.Next();
                        })

                        // fires only for "users"
                        app.OnFileTokenRequest("users").BindFunc(func(e *core.FileTokenRequestEvent) error {
                            // e.App
                            // e.Record
                            // e.Token
                            // and all RequestEvent fields...

                            return e.Next();
                        })

                        if err := app.Start(); err != nil {
                            log.Fatal(err)
                        }
                    }
                `}}},{title:`Collection request hooks`,tag:`h6`,hooks:{OnCollectionsListRequest:{html:`
                    <code>OnCollectionsListRequest</code> hook is triggered on each API Collections list request.
                    Could be used to validate or modify the response before returning it to the client.
                `,js:`
                    onCollectionsListRequest((e) => {
                        // e.app
                        // e.collections
                        // e.result
                        // and all RequestEvent fields...

                        e.next()
                    })
                `,go:`
                    package main

                    import (
                        "log"

                        "github.com/pocketbase/pocketbase"
                        "github.com/pocketbase/pocketbase/core"
                    )

                    func main() {
                        app := pocketbase.New()

                        app.OnCollectionsListRequest().BindFunc(func(e *core.CollectionsListRequestEvent) error {
                            // e.App
                            // e.Collections
                            // e.Result
                            // and all RequestEvent fields...

                            return e.Next()
                        })

                        if err := app.Start(); err != nil {
                            log.Fatal(err)
                        }
                    }
                `},OnCollectionViewRequest:{html:`
                    <code>OnCollectionViewRequest</code> hook is triggered on each API Collection view request.
                    Could be used to validate or modify the response before returning it to the client.
                `,js:`
                    onCollectionViewRequest((e) => {
                        // e.app
                        // e.collection
                        // and all RequestEvent fields...

                        e.next()
                    })
                `,go:`
                    package main

                    import (
                        "log"

                        "github.com/pocketbase/pocketbase"
                        "github.com/pocketbase/pocketbase/core"
                    )

                    func main() {
                        app := pocketbase.New()

                        app.OnCollectionViewRequest().BindFunc(func(e *core.CollectionRequestEvent) error {
                            // e.App
                            // e.Collection
                            // and all RequestEvent fields...

                            return e.Next()
                        })

                        if err := app.Start(); err != nil {
                            log.Fatal(err)
                        }
                    }
                `},OnCollectionCreateRequest:{html:`
                    <code>OnCollectionCreateRequest</code> hook is triggered on each API Collection create request.
                    <br/>
                    Could be used to additionally validate the request data or implement
                    completely different persistence behavior.
                `,js:`
                    onCollectionCreateRequest((e) => {
                        // e.app
                        // e.collection
                        // and all RequestEvent fields...

                        e.next()
                    })
                `,go:`
                    package main

                    import (
                        "log"

                        "github.com/pocketbase/pocketbase"
                        "github.com/pocketbase/pocketbase/core"
                    )

                    func main() {
                        app := pocketbase.New()

                        app.OnCollectionCreateRequest().BindFunc(func(e *core.CollectionRequestEvent) error {
                            // e.App
                            // e.Collection
                            // and all RequestEvent fields...

                            return e.Next()
                        })

                        if err := app.Start(); err != nil {
                            log.Fatal(err)
                        }
                    }
                `},OnCollectionUpdateRequest:{html:`
                    <code>OnCollectionUpdateRequest</code> hook is triggered on each API Collection update request.
                    <br/>
                    Could be used to additionally validate the request data or implement
                    completely different persistence behavior.
                `,js:`
                    onCollectionUpdateRequest((e) => {
                        // e.app
                        // e.collection
                        // and all RequestEvent fields...

                        e.next()
                    })
                `,go:`
                    package main

                    import (
                        "log"

                        "github.com/pocketbase/pocketbase"
                        "github.com/pocketbase/pocketbase/core"
                    )

                    func main() {
                        app := pocketbase.New()

                        app.OnCollectionUpdateRequest().BindFunc(func(e *core.CollectionRequestEvent) error {
                            // e.App
                            // e.Collection
                            // and all RequestEvent fields...

                            return e.Next()
                        })

                        if err := app.Start(); err != nil {
                            log.Fatal(err)
                        }
                    }
                `},OnCollectionDeleteRequest:{html:`
                    <code>OnCollectionDeleteRequest</code> hook is triggered on each API Collection delete request.
                    <br/>
                    Could be used to additionally validate the request data or implement
                    completely different delete behavior.
                `,js:`
                    onCollectionDeleteRequest((e) => {
                        // e.app
                        // e.collection
                        // and all RequestEvent fields...

                        e.next()
                    })
                `,go:`
                    package main

                    import (
                        "log"

                        "github.com/pocketbase/pocketbase"
                        "github.com/pocketbase/pocketbase/core"
                    )

                    func main() {
                        app := pocketbase.New()

                        app.OnCollectionDeleteRequest().BindFunc(func(e *core.CollectionRequestEvent) error {
                            // e.App
                            // e.Collection
                            // and all RequestEvent fields...

                            return e.Next()
                        })

                        if err := app.Start(); err != nil {
                            log.Fatal(err)
                        }
                    }
                `},OnCollectionsImportRequest:{html:`
                    <code>OnCollectionsImportRequest</code> hook is triggered on each API
                    collections import request.
                    <br/>
                    Could be used to additionally validate the imported collections or
                    to implement completely different import behavior.
                `,js:`
                    onCollectionsImportRequest((e) => {
                        // e.app
                        // e.collectionsData
                        // e.deleteMissing

                        e.next()
                    })
                `,go:`
                    package main

                    import (
                        "log"

                        "github.com/pocketbase/pocketbase"
                        "github.com/pocketbase/pocketbase/core"
                    )

                    func main() {
                        app := pocketbase.New()

                        app.OnCollectionsImportRequest().BindFunc(func(e *core.CollectionsImportRequestEvent) error {
                            // e.App
                            // e.CollectionsData
                            // e.DeleteMissing

                            return e.Next()
                        })

                        if err := app.Start(); err != nil {
                            log.Fatal(err)
                        }
                    }
                `}}},{title:`Settings request hooks`,tag:`h6`,hooks:{OnSettingsListRequest:{html:`
                    <code>OnSettingsListRequest</code> hook is triggered on each API Settings list request.
                    <br/>
                    Could be used to validate or modify the response before returning it to the client.
                `,js:`
                    onSettingsListRequest((e) => {
                        // e.app
                        // e.settings
                        // and all RequestEvent fields...

                        e.next()
                    })
                `,go:`
                    package main

                    import (
                        "log"

                        "github.com/pocketbase/pocketbase"
                        "github.com/pocketbase/pocketbase/core"
                    )

                    func main() {
                        app := pocketbase.New()

                        app.OnSettingsListRequest().BindFunc(func(e *core.SettingsListRequestEvent) error {
                            // e.App
                            // e.Settings
                            // and all RequestEvent fields...

                            return e.Next()
                        })

                        if err := app.Start(); err != nil {
                            log.Fatal(err)
                        }
                    }
                `},OnSettingsUpdateRequest:{html:`
                    <code>OnSettingsUpdateRequest</code> hook is triggered on each API Settings update request.
                    <br/>
                    Could be used to additionally validate the request data or
                    implement completely different persistence behavior.
                `,js:`
                    onSettingsUpdateRequest((e) => {
                        // e.app
                        // e.oldSettings
                        // e.newSettings
                        // and all RequestEvent fields...

                        e.next()
                    })
                `,go:`
                    package main

                    import (
                        "log"

                        "github.com/pocketbase/pocketbase"
                        "github.com/pocketbase/pocketbase/core"
                    )

                    func main() {
                        app := pocketbase.New()

                        app.OnSettingsUpdateRequest().BindFunc(func(e *core.SettingsUpdateRequestEvent) error {
                            // e.App
                            // e.OldSettings
                            // e.NewSettings
                            // and all RequestEvent fields...

                            return e.Next()
                        })

                        if err := app.Start(); err != nil {
                            log.Fatal(err)
                        }
                    }
                `}}},{title:`Base model hooks`,description:`
            <div class="alert alert-info">
                <div class="icon">
                    <i class="ri-information-line"></i>
                </div>
                <div class="content">
                    <p>The Model hooks are fired for all PocketBase structs that implements the Model DB interface - Record, Collection, Log, etc.</p>
                    <p>
                        For convenience, if you want to listen to only the Record or Collection DB model
                        events without doing manual type assertion, you can use the
                        <a href="#record-model-hooks"><code>OnRecord*</code></a>
                        and
                        <a href="#collection-model-hooks"><code>OnCollection*</code></a>
                        proxy hooks above.
                    </p>
                </div>
            </div>
        `,hooks:{OnModelValidate:{html:o(`Model`),js:n(`onModelValidate`,`model`),go:i(`OnModelValidate`,`Model`)}}},{title:`Base model create hooks`,tag:`h6`,hooks:{OnModelCreate:{html:s(`Model`),js:n(`onModelCreate`,`model`),go:i(`OnModelCreate`,`Model`)},OnModelCreateExecute:{html:c(`Model`),js:n(`onModelCreateExecute`,`model`),go:i(`OnModelCreateExecute`,`Model`)},OnModelAfterCreateSuccess:{html:l(`Model`),js:n(`onModelAfterCreateSuccess`,`model`),go:i(`OnModelAfterCreateSuccess`,`Model`)},OnModelAfterCreateError:{html:u(`Model`),js:r(`onModelAfterCreateError`,`model`),go:a(`OnModelAfterCreateError`,`Model`)}}},{title:`Base model update hooks`,tag:`h6`,hooks:{OnModelUpdate:{html:d(`Model`),js:n(`onModelUpdate`,`model`),go:i(`OnModelUpdate`,`Model`)},OnModelUpdateExecute:{html:f(`Model`),js:n(`onModelUpdateExecute`,`model`),go:i(`OnModelUpdateExecute`,`Model`)},OnModelAfterUpdateSuccess:{html:p(`Model`),js:n(`onModelAfterUpdateSuccess`,`model`),go:i(`OnModelAfterUpdateSuccess`,`Model`)},OnModelAfterUpdateError:{html:m(`Model`),js:r(`onModelAfterUpdateError`,`model`),go:a(`OnModelAfterUpdateError`,`Model`)}}},{title:`Base model delete hooks`,tag:`h6`,hooks:{OnModelDelete:{html:h(`Model`),js:n(`onModelDelete`,`model`),go:i(`OnModelDelete`,`Model`)},OnModelDeleteExecute:{html:g(`Model`),js:n(`onModelDeleteExecute`,`model`),go:i(`OnModelDeleteExecute`,`Model`)},OnModelAfterDeleteSuccess:{html:_(`Model`),js:n(`onModelAfterDeleteSuccess`,`model`),go:i(`OnModelAfterDeleteSuccess`,`Model`)},OnModelAfterDeleteError:{html:v(`Model`),js:r(`onModelAfterDeleteError`,`model`),go:a(`OnModelAfterDeleteError`,`Model`)}}}];export{y as t};