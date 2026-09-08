// pb_hooks: the directory where a project's own behaviour lives.
import CodeBlock from "@/components/CodeBlock";
import { hl } from "@/lib/hl";

const FILE = hl.javascript`/// <reference path="../pb_data/types.d.ts" />

// a new endpoint, for anything the records API does not already do
routerAdd("GET", "/api/me/summary", (e) => {
  const posts = $app.countRecords("posts", $dbx.hashExp({ author: e.auth.id }));
  return e.json(200, { email: e.auth.email(), posts });
}, $apis.requireAuth());

// something that happens whenever a record is written
onRecordCreateRequest((e) => {
  e.record.set("slug", e.record.get("title").toLowerCase().replaceAll(" ", "-"));
  e.next();                       // run the rest of the handlers, then the write itself
}, "posts");

// and something that happens on a schedule
cronAdd("digest", "0 8 * * *", () => {
  const users = $app.findRecordsByFilter("users", "verified = true", "-created", 100, 0);
  $app.logger().info("digest", "count", users.length);
});`;

const REFUSE = hl.javascript`onRecordUpdateRequest((e) => {
  if (e.record.get("locked") && !e.auth?.isSuperuser()) {
    throw new ForbiddenError("this post is locked");
  }
  e.next();
}, "posts");`;

const SHARED = hl.javascript`// pb_hooks/lib/slug.js
module.exports = { slugify: (s) => s.toLowerCase().trim().replaceAll(/[^a-z0-9]+/g, "-") };

// pb_hooks/posts.pb.js
const { slugify } = require(\`\${__hooks}/lib/slug.js\`);`;

export default function DocsProjectHooks() {
  return (
    <>
      <h1>pb_hooks</h1>
      <p className="docs-lead">
        Server-side JavaScript that runs inside the instance: endpoints the records API does not have, handlers that
        fire around writes, and work on a schedule. This is where a project stops being a database with an API and
        starts being your application.
      </p>

      <h2>The shape of it</h2>
      <p>
        Any file ending <code>.pb.js</code> in the directory is loaded, in filename order. There is no build step and
        no imports to set up: the functions below are globals.
      </p>
      <CodeBlock {...FILE} />
      <p>
        The reference comment on the first line is what makes an editor autocomplete all of it. The file it points at
        is generated into <a href="/docs/run/project/data">pb_data</a> on the first run, so run the server once
        before you start writing.
      </p>

      <h2>The three things you will write</h2>

      <h3>Endpoints</h3>
      <p>
        <code>routerAdd(method, path, handler, ...middleware)</code>. The handler gets a request event:{" "}
        <code>e.auth</code> is the signed-in record or null, <code>e.pathParam("id")</code> reads a path segment,{" "}
        <code>e.bindBody(obj)</code> parses the body, and <code>e.json(status, data)</code> answers.{" "}
        <code>$apis.requireAuth()</code> and <code>$apis.requireSuperuserAuth()</code> are the guards.
      </p>

      <h3>Event handlers</h3>
      <p>
        Every <code>on*</code> function registers a handler, and trailing arguments limit it to named collections.
        Calling <code>e.next()</code> runs the remaining handlers and then the action itself, so anything before that
        call happens first and anything after it happens once the write has gone through. Throwing instead of calling
        it refuses the request:
      </p>
      <CodeBlock {...REFUSE} />
      <p>
        The families are the ones PocketBase has: records both as models and as requests, collections, auth, files,
        realtime, settings, mail and batches, each with <code>Validate</code>, the action itself, and{" "}
        <code>After...Success</code> / <code>After...Error</code> variants.
      </p>

      <h3>Scheduled work</h3>
      <p>
        <code>cronAdd(name, expression, handler)</code>, with a standard five-field expression. On Cloudflare these
        become the Worker's own scheduled triggers, so they run whether or not anyone is visiting.
      </p>

      <h2>What is available inside</h2>
      <table>
        <thead>
          <tr>
            <th>Global</th>
            <th>What you get</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>$app</code></td>
            <td>
              The database: <code>findRecordById</code>, <code>findFirstRecordByFilter</code>,{" "}
              <code>findRecordsByFilter</code>, <code>countRecords</code>, <code>expandRecord</code>,{" "}
              <code>save</code>, <code>delete</code>, plus <code>settings()</code>, <code>logger()</code> and{" "}
              <code>newMailClient()</code>.
            </td>
          </tr>
          <tr>
            <td><code>$apis</code></td>
            <td>Route guards: <code>requireAuth</code>, <code>requireSuperuserAuth</code>, <code>requireGuestOnly</code>.</td>
          </tr>
          <tr>
            <td><code>$http</code></td>
            <td><code>send({"{"}url, method, body, headers{"}"})</code>, for calling other services.</td>
          </tr>
          <tr>
            <td><code>$security</code></td>
            <td><code>randomString</code>, <code>sha256</code>, and friends.</td>
          </tr>
          <tr>
            <td><code>$os.getenv</code></td>
            <td>Configuration, which is what <a href="/docs/run/project/secrets">pb_secrets</a> declares.</td>
          </tr>
          <tr>
            <td><code>$dbx</code></td>
            <td><code>exp</code> and <code>hashExp</code>, for building query expressions.</td>
          </tr>
        </tbody>
      </table>

      <h2>Sharing code between files</h2>
      <p>
        <code>require</code> resolves against the hooks directory, and <code>__hooks</code> is its path, so helpers
        live wherever you like inside it:
      </p>
      <CodeBlock {...SHARED} />

      <div className="alert alert-info">
        <div className="content">
          <p className="m-0">
            One difference from PocketBase worth knowing: on Cloudflare the hooks are compiled into the Worker when
            you deploy, so a change to a hook needs a deploy rather than a restart. Locally,{" "}
            <code>voidbase serve --dev</code> restarts on save.
          </p>
        </div>
      </div>

      <h2>Where to read on</h2>
      <p>
        The hook API is PocketBase's, and every function above is documented under{" "}
        <a href="https://pocketbase.io/docs/js-overview/" target="_blank" rel="noreferrer noopener">
          Extend with JavaScript
        </a>
        , with the full event list under{" "}
        <a href="https://pocketbase.io/docs/js-event-hooks/" target="_blank" rel="noreferrer noopener">
          Event hooks
        </a>
        .
      </p>
    </>
  );
}
