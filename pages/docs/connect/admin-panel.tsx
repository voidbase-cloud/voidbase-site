// Connecting from a browser. The panel is PocketBase's, unmodified, so this page says where it is and what it is
// for, and sends people to the documentation that covers its screens.
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

      <h2>No account yet?</h2>
      <p>
        Whoever runs the instance creates it. If that is you, every page under{" "}
        <a href="/docs/run/standalone">Run an instance</a> makes one as part of the setup, and it is a single command
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
    </>
  );
}
