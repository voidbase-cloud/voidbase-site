import{I as e,P as t,it as n,nt as r}from"../chunks/BDLcFjNi.js";import"../chunks/xihTtKlq.js";import"../chunks/C3kXMaAy.js";import{t as i}from"../chunks/BnicrACe.js";import{t as a}from"../chunks/CKGhWLYV.js";import{t as o}from"../chunks/CKC416Ky.js";var s=e(`<p>PocketBase provides a simple abstraction for sending emails via the <code>$app.newMailClient()</code> helper.</p> <p>Depending on your configured mail settings (<em>Dashboard > Settings > Mail settings</em>) it will use the <code>sendmail</code> command or a SMTP client.</p> <!> <!> <p>You can send your own custom emails from everywhere within the app (hooks, middlewares, routes, etc.) by
    using <code>$app.newMailClient().send(message)</code>. Here is an example of sending a custom email after
    user registration:</p> <!> <!> <p>If you want to overwrite the default system emails for forgotten password, verification, etc., you can
    adjust the default templates available from the <em>Dashboard > Collections > Edit collection > Options</em> .</p> <p>Alternatively, you can also apply individual changes by binding to one of the <a href="/docs/js-event-hooks/#mailer-hooks">mailer hooks</a>. Here is an example of appending a Record
    field value to the subject using the <code>onMailerRecordPasswordResetSend</code> hook:</p> <!>`,1);function c(e){var c=s(),l=n(r(c),4);o(l,{});var u=n(l,2);i(u,{title:`Send custom email`});var d=n(u,4);a(d,{language:`go`,content:`
        onRecordCreateRequest((e) => {
            e.next()

            const message = new MailerMessage({
                from: {
                    address: e.app.settings().meta.senderAddress,
                    name:    e.app.settings().meta.senderName,
                },
                to:      [{address: e.record.email()}],
                subject: "YOUR_SUBJECT...",
                html:    "YOUR_HTML_BODY...",
                // bcc, cc and custom headers are also supported...
            })

            e.app.newMailClient().send(message)
        }, "users")
    `});var f=n(d,2);i(f,{title:`Overwrite system emails`});var p=n(f,6);a(p,{language:`javascript`,content:`
        onMailerRecordPasswordResetSend((e) => {
            // modify the subject
            e.message.subject += (" " + e.record.get("name"))

            e.next()
        })
    `}),t(e,c)}export{c as component};