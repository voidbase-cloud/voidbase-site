// Connecting from a browser. The panel is PocketBase's, unmodified, so this page says where it is and what it is
// for, what voidbase puts beside it, and sends people to the documentation that covers its screens.
export default function DocsAdminPanel() {
  return (
    <>
      <h1>Connect with the admin panel</h1>
      <p className="docs-lead">
        Every instance serves the admin panel at <code>/_/</code>, so if your instance is at{" "}
        <code>https://your-instance.example.com</code> then the panel is at{" "}
        <code>https://your-instance.example.com/_/</code>.
      </p>

      <p>
        It is PocketBase's own admin panel, unmodified. Sign in with a superuser account and it is where you design
        collections and their fields, write the API rules that decide who may read and write what, browse and edit
        records, configure mail and OAuth2 providers, read logs and take backups.
      </p>

      <div className="alert alert-warning">
        <div className="content">
          <p className="m-0">
            A superuser can do anything to the instance, including deleting all of it. Give the account a real
            password, keep it to the people who need it, and set up the API rules so your application never needs
            one.
          </p>
        </div>
      </div>

      <h2>Beside it</h2>
      <p>
        <code>/api/docs</code> is the instance's own API reference: an OpenAPI document generated from the
        collections you have, scoped to the token it is opened with (nothing signed in, the public API; a user, that
        user's; a superuser, everything), read through Scalar. The document itself is <code>/api/openapi.json</code>,
        and <code>/api/mcp</code> serves the same scoping to an agent as a stateless MCP server, with the token as
        the <code>Authorization</code> header. A superuser can also read <code>/api/plugins</code>: what this
        instance loaded, where each plugin came from, and where its mail, payments and translations go.
      </p>

      <h2>Collections you did not make</h2>
      <p>
        Some of the plugins voidbase ships own a collection, and it appears in the panel like any other, with rules
        you may edit. Which ones you see depends on what the instance has turned on:
      </p>
      <table>
        <thead>
          <tr>
            <th>Collection</th>
            <th>Who writes it</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>translations</code></td>
            <td>
              The <code>translations</code> plugin, once <code>VOIDBASE_TRANSLATABLE</code> and{" "}
              <code>VOIDBASE_LOCALES</code> are set: one row per collection, record, field and locale, and the
              records API answers in the locale a request asks for.
            </td>
          </tr>
          <tr>
            <td><code>customers</code>, <code>subscriptions</code>, <code>payments</code></td>
            <td>
              The payments plugin whose key is set (Stripe, Polar or Lemon Squeezy), from its webhooks; created on
              the first request that carries a provider's key, and scoped by rule to the signed-in user.
            </td>
          </tr>
          <tr>
            <td><code>ai_conversations</code>, <code>ai_messages</code></td>
            <td>
              The <code>ai</code> plugin, for a signed-in user's chats over the instance, so a conversation survives
              the tab.
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Backups</h2>
      <p>
        Settings &gt; Backups is PocketBase's screen over voidbase's archives. An archive taken there is a{" "}
        <code>full</code> one: every table, every file, the settings with their secrets left out, and the schema,
        with a manifest that names each entry's hash; it is read back and verified after it is written, and a restore
        replaces everything and restarts the instance. Two other kinds exist through the API and{" "}
        <a href="/docs/run/cloud">the cloud page</a>: <code>data</code>, the rows and files of the non-system
        collections for moving content between instances, which a restore lands on the collections the instance
        has; and <code>schema</code>, the definitions alone. The scheduled backup writes whichever kind{" "}
        <code>VOIDBASE_BACKUP_KIND</code> names, keeps <code>VOIDBASE_BACKUP_KEEP</code> of them, and copies each one
        to the bucket <code>VOIDBASE_BACKUP_S3_*</code> names, outside the account. A restore refuses an archive
        written by a newer voidbase, and a PocketBase backup cannot be restored here.
      </p>

      <h2>No account yet?</h2>
      <p>
        Whoever runs the instance creates it. If that is you, every page under{" "}
        <a href="/docs/start">Where to start</a> makes one as part of the setup, and it is a single command
        either way.
      </p>

      <h2>Where to read on</h2>
      <p>PocketBase's documentation covers the panel screen by screen, and all of it applies here:</p>
      <ul>
        <li>
          <a href="https://pocketbase.io/docs/collections/" target="_blank" rel="noreferrer noopener" className="txt-bold">
            Collections
          </a>{" "}
          <span className="txt-hint">fields, indexes and the three kinds of collection</span>
        </li>
        <li>
          <a href="https://pocketbase.io/docs/api-rules-and-filters/" target="_blank" rel="noreferrer noopener" className="txt-bold">
            API rules and filters
          </a>{" "}
          <span className="txt-hint">the panel's most important screen, and the one to read before going live</span>
        </li>
        <li>
          <a href="https://pocketbase.io/docs/authentication/" target="_blank" rel="noreferrer noopener" className="txt-bold">
            Authentication
          </a>{" "}
          <span className="txt-hint">how users sign in, and how to configure each way</span>
        </li>
        <li>
          <a href="https://pocketbase.io/docs/going-to-production/" target="_blank" rel="noreferrer noopener" className="txt-bold">
            Going to production
          </a>{" "}
          <span className="txt-hint">what to check before opening an instance to the world</span>
        </li>
      </ul>
      <p className="txt-hint txt-sm">
        On Cloudflare, mail goes out on port 465 or 587, since 25 is blocked on Workers, or through Cloudflare from
        your own domain when <code>VOIDBASE_MAIL_DOMAIN</code> is set. The rest of what differs from PocketBase is{" "}
        <a href="https://github.com/voidbase-cloud/voidbase/blob/master/docs/differences.md" target="_blank" rel="noreferrer noopener">
          one short page
        </a>
        .
      </p>
    </>
  );
}
