// Connecting from an application. The SDK is voidbase's fork of PocketBase's JavaScript SDK: the same client, with
// typed collections, a plugin surface and the plugins that ride on it. This page shows enough to get a request
// working and then points at the documentation that covers the rest.
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
# or --email and --password; writes src/voidbase.ts, --out for another path, --json <file> for a saved document`;

const TYPED = hl.typescript`import { VoidBase } from "@voidbase-cloud/sdk";
import type { Collections } from "./voidbase";

const pb = new VoidBase<Collections>("https://your-instance.example.com");

const post = await pb.collection("posts").getOne("RECORD_ID"); // PostsRecord
post.title;                                                      // string
post.titel;                                                      // compile error
post.expand?.author;                                             // UsersRecord | undefined
pb.collection("_superusers");                                    // not in the map: untyped, as the plain client`;

const UPSTREAM = hl.typescript`// with the upstream pocketbase package instead
import PocketBase from "pocketbase";
import type { TypedPocketBase } from "./voidbase";

const pb = new PocketBase("https://your-instance.example.com") as TypedPocketBase;`;

const PLUGIN = hl.typescript`import PocketBase, { type Plugin } from "@voidbase-cloud/sdk";

const tracing: Plugin = {
  name: "tracing",
  install(client) {
    return client.hooks.beforeSend.add((url, options) => {
      options.headers = Object.assign({}, options.headers, { "X-Trace": crypto.randomUUID() });
    });                             // what install returns is the uninstall, for client.unuse("tracing")
  },
};

const pb = new PocketBase("https://your-instance.example.com").use(tracing);`;

const OFFLINE = hl.typescript`import PocketBase from "@voidbase-cloud/sdk";
import { offline } from "@voidbase-cloud/sdk/offline";

const pb = new PocketBase("https://your-instance.example.com").use(offline());

// with the network gone, this answers at once; the replay creates this record, with this id
const post = await pb.collection("notes").create({ text: "written on the train" });
pb.offline.pending();                 // what is still waiting
await pb.offline.flush();             // or wait for the window "online" event`;

export default function DocsSdk() {
  return (
    <>
      <h1>Connect with the SDK</h1>
      <p className="docs-lead">
        voidbase answers PocketBase's API, so the client is PocketBase's JavaScript SDK. voidbase publishes a fork of
        it, <code>@voidbase-cloud/sdk</code>, kept in step with upstream, that adds typed collections, a plugin
        surface and the plugins that ride on it. The upstream <code>pocketbase</code> package works unchanged too.
      </p>

      <h2>Install it</h2>
      <CodeBlock {...INSTALL} />
      <p>
        <code>import PocketBase from "@voidbase-cloud/sdk"</code> is a drop-in for the upstream import: the default
        export is the same <code>Client</code> class, and every named export of the upstream package is exported
        under the same name.
      </p>

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
        <code>voidbase types</code> reads the instance's own API description, <code>/api/openapi.json</code> fetched
        as a superuser, and writes one file: an interface per collection (<code>PostsRecord</code>,{" "}
        <code>UsersRecord</code>, with select literals, typed <code>expand</code> for relations and the system
        fields), a <code>Collections</code> map, and a <code>TypedPocketBase</code> type. <code>VoidBase</code> takes
        the map and types <code>collection(name)</code> from it, so a renamed field is a compile error at the call
        rather than an empty value at runtime. The file imports nothing, so it compiles against whichever SDK the
        project installed. There is no watch mode: run it again when the collections change, or put it in the build.
       <code>--watch</code> keeps it in step while you
        work: it polls the instance and rewrites the file only when the generated types actually change, naming what
        moved.
      </p>
      <CodeBlock {...TYPES} />
      <CodeBlock {...TYPED} />
      <CodeBlock {...UPSTREAM} />

      <h2>Plugins</h2>
      <p>
        <code>pb.use(plugin)</code> installs a plugin once per name and returns the client;{" "}
        <code>pb.unuse(name)</code> removes it. A plugin is an object with a name and an <code>install</code>{" "}
        function, and what it sits in is the hook lists on the request path of every call:{" "}
        <code>pb.hooks.beforeSend</code>, <code>afterSend</code> and <code>onError</code>. It goes on a{" "}
        <code>Client</code> or a <code>VoidBase</code> alike.
      </p>
      <CodeBlock {...PLUGIN} />
      <p>
        Six ship with the SDK, each from its own entry point so an application that does not want one does not carry
        it:
      </p>
      <table>
        <thead>
          <tr>
            <th>Entry point</th>
            <th>What it adds</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>@voidbase-cloud/sdk/offline</code></td>
            <td>
              <code>offline()</code>: writes that survive a tunnel. A create, update or delete the network refused is
              queued, answered optimistically, persisted, and replayed in order when the connection is back.
            </td>
          </tr>
          <tr>
            <td><code>@voidbase-cloud/sdk/pwa</code></td>
            <td>
              <code>registerServiceWorker()</code>, <code>installPrompt()</code> and the <code>pwa()</code> plugin, the
              page side of the service worker a stack app's <code>pwa</code> option serves: the update prompt, the
              skip-waiting handshake, and an unregister that clears the caches.
            </td>
          </tr>
          <tr>
            <td><code>@voidbase-cloud/sdk/editable</code></td>
            <td>
              <code>editable()</code>: an element marked <code>data-vb-edit="collection:id:field"</code> becomes
              editable for a signed-in user and saves through the same <code>update</code> call and rules as any
              write; <code>data-vb-edit-markdown</code> edits the markdown source with a small toolbar.
            </td>
          </tr>
          <tr>
            <td><code>@voidbase-cloud/sdk/ai</code></td>
            <td>
              <code>ai()</code>: <code>pb.ai.chat()</code> over the instance's Workers AI route, with the instance's
              tools when the token allows them, and <code>pb.ai.conversations</code> for chats kept as records on the
              server, streamed and followed over realtime.
            </td>
          </tr>
          <tr>
            <td><code>@voidbase-cloud/sdk/payments</code></td>
            <td>
              <code>payments()</code>: checkout, portal and cancel through whichever provider the instance loaded
              (Stripe, Polar or Lemon Squeezy), and <code>mine()</code> for the customer, subscriptions and payments
              the webhooks wrote for the signed-in user.
            </td>
          </tr>
          <tr>
            <td><code>@voidbase-cloud/sdk/seo</code></td>
            <td>
              <code>seo()</code>: a page's tags from the instance, written into the head on every navigation, and{" "}
              <code>seoHead()</code> for a server-rendered page.
            </td>
          </tr>
        </tbody>
      </table>
      <p>The offline queue is the one most applications reach for first:</p>
      <CodeBlock {...OFFLINE} />

      <h2>Where to read on</h2>
      <p>All of this applies to voidbase without translation:</p>
      <ul>
        <li>
          <a href="https://github.com/voidbase-cloud/voidbase-js-sdk" target="_blank" rel="noreferrer noopener" className="txt-bold">
            @voidbase-cloud/sdk
          </a>{" "}
          <span className="txt-hint">the fork: every option of every plugin above, and the upstream SDK's own documentation below it</span>
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
      <p>
        Your own instance describes itself too: <code>/api/docs</code> is its API reference, scoped to the token you
        open it with, and <code>/api/mcp</code> is the same thing for an agent.
      </p>

      <p className="txt-hint txt-sm">
        No instance to point at yet? <a href="/docs/run/standalone">Run one</a> in about a minute.
      </p>
    </>
  );
}
