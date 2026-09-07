// Connecting from an application. The SDK is PocketBase's own, so this page shows enough to get a request working
// and then points at the documentation that already covers the rest properly.
import CodeBlock from "@/components/CodeBlock";

const INSTALL = `bun add pocketbase        # or: npm install pocketbase`;

const USAGE = `import PocketBase from "pocketbase";

const pb = new PocketBase("https://your-instance.example.com");

// sign in; the token is kept in pb.authStore and sent with every request after this
await pb.collection("users").authWithPassword("you@example.com", "your-password");

// read, with filtering, sorting and related records in one call
const posts = await pb.collection("posts").getList(1, 20, {
  filter: "published = true && author.verified = true",
  sort: "-created",
  expand: "author",
});

// write
await pb.collection("posts").create({ title: "Hello", body: "...", author: pb.authStore.record?.id });

// and follow changes as they happen, over one connection
pb.collection("posts").subscribe("*", (e) => console.log(e.action, e.record));`;

export default function DocsSdk() {
  return (
    <>
      <h1>Connect with the SDK</h1>
      <p className="docs-lead">
        voidbase answers PocketBase's API, so the client library is PocketBase's, installed from npm and pointed at
        your instance. Nothing about it is voidbase-specific.
      </p>

      <h2>Install it</h2>
      <CodeBlock language="bash" content={INSTALL} />

      <h2>Use it</h2>
      <p>
        The only thing you supply is the address of your instance. Everything after that is the SDK's own API, and
        works exactly as its documentation says.
      </p>
      <CodeBlock language="javascript" content={USAGE} />

      <p>
        The auth token lives in <code>pb.authStore</code>, so signing in once covers the rest of the session, and in a
        browser it is persisted for you. File URLs come from <code>pb.files.getURL(record, filename)</code>, with a{" "}
        <code>thumb</code> option for a resized version.
      </p>

      <div className="alert alert-info">
        <div className="content">
          <p className="m-0">
            One SDK instance for the whole application is the intended pattern on the client side. On a server, make
            one per request instead, so one user's token never leaks into another user's call.
          </p>
        </div>
      </div>

      <h2>Where to read on</h2>
      <p>All of this applies to voidbase without translation:</p>
      <ul>
        <li>
          <a href="https://github.com/pocketbase/js-sdk" target="_blank" rel="noreferrer noopener" className="txt-bold">
            The JavaScript SDK
          </a>{" "}
          <span className="txt-hint">every method, and the SDKs for other languages, which speak the same API</span>
        </li>
        <li>
          <a href="https://pocketbase.io/docs/api-records/" target="_blank" rel="noreferrer noopener" className="txt-bold">
            Records API
          </a>{" "}
          <span className="txt-hint">what each endpoint accepts and returns</span>
        </li>
        <li>
          <a href="https://pocketbase.io/docs/api-rules-and-filters/" target="_blank" rel="noreferrer noopener" className="txt-bold">
            API rules and filters
          </a>{" "}
          <span className="txt-hint">the query and permission language</span>
        </li>
        <li>
          <a href="https://pocketbase.io/docs/authentication/" target="_blank" rel="noreferrer noopener" className="txt-bold">
            Authentication
          </a>{" "}
          <span className="txt-hint">password, OAuth2, one-time codes and multi-factor sign-in</span>
        </li>
        <li>
          <a href="https://pocketbase.io/docs/files-handling/" target="_blank" rel="noreferrer noopener" className="txt-bold">
            Files
          </a>{" "}
          <span className="txt-hint">uploads, protected files and thumbnails</span>
        </li>
      </ul>

      <p className="txt-hint txt-sm">
        No instance to point at yet? <a href="/docs/run/standalone">Run one</a> in about a minute.
      </p>
    </>
  );
}
