// Connecting from an application. The SDK is voidbase's fork of PocketBase's JavaScript SDK: the same client, with
// typed collections, a plugin surface and an offline queue added. This page shows enough to get a request working
// and then points at the documentation that covers the rest.
import CodeBlock from "@/components/CodeBlock";
import { hl } from "@/lib/hl";

const INSTALL = hl.bash`bun add @voidbase-cloud/sdk        # or: npm install @voidbase-cloud/sdk`;

const USAGE = hl.javascript`import PocketBase from "@voidbase-cloud/sdk";

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

const TYPES = hl.bash`voidbase types --url https://your-instance.example.com --token <superuser token>
# writes src/voidbase.ts: one interface per collection and a Collections map`;

const TYPED = hl.typescript`import { VoidBase } from "@voidbase-cloud/sdk";
import type { Collections } from "./voidbase";

const pb = new VoidBase<Collections>("https://your-instance.example.com");

const post = await pb.collection("posts").getOne("RECORD_ID"); // PostsRecord
post.title;                                                      // string
post.titel;                                                      // compile error
post.expand?.author;                                             // UsersRecord | undefined`;

const OFFLINE = hl.typescript`import PocketBase from "@voidbase-cloud/sdk";
import { offline } from "@voidbase-cloud/sdk/offline";

const pb = new PocketBase("https://your-instance.example.com").use(offline());

// a write with no network is queued and replayed when the connection is back
await pb.collection("notes").create({ text: "written on the train" });
pb.offline.pending; // what is still waiting`;

export default function DocsSdk() {
  return (
    <>
      <h1>Connect with the SDK</h1>
      <p className="docs-lead">
        voidbase answers PocketBase's API, so the client is PocketBase's JavaScript SDK. voidbase publishes a fork of
        it, <code>@voidbase-cloud/sdk</code>, that adds typed collections, a plugin surface and an offline queue.
        The upstream <code>pocketbase</code> package works unchanged too.
      </p>

      <h2>Install it</h2>
      <CodeBlock {...INSTALL} />

      <h2>Use it</h2>
      <p>
        The only thing you supply is the address of your instance. Everything after that is the SDK's own API, and
        works exactly as its documentation says.
      </p>
      <CodeBlock {...USAGE} />

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

      <h2>Type it from your instance</h2>
      <p>
        <code>voidbase types</code> reads the instance's own API description and writes one interface per collection.
        <code>VoidBase</code> takes that map and types <code>collection(name)</code> from it, so a renamed field is a
        compile error at the call rather than an empty value at runtime. Run it again when the collections change.
      </p>
      <CodeBlock {...TYPES} />
      <CodeBlock {...TYPED} />

      <h2>Plugins and the offline queue</h2>
      <p>
        <code>pb.use(plugin)</code> installs a plugin once, and plugins hook the request path with{" "}
        <code>pb.hooks.beforeSend</code>, <code>afterSend</code> and <code>onError</code>. The first one shipped is the
        offline queue, from its own entry point so an application that does not want it does not carry it.
      </p>
      <CodeBlock {...OFFLINE} />

      <h2>Where to read on</h2>
      <p>All of this applies to voidbase without translation:</p>
      <ul>
        <li>
          <a href="https://github.com/voidbase-cloud/voidbase-js-sdk" target="_blank" rel="noreferrer noopener" className="txt-bold">
            @voidbase-cloud/sdk
          </a>{" "}
          <span className="txt-hint">the fork: what it adds, and the upstream SDK's own documentation below it</span>
        </li>
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
