// vb_hooks: the stack's event handlers, one per file, in TypeScript.
import CodeBlock from "@/components/CodeBlock";
import { hl } from "@/lib/hl";

const FILE = hl.typescript`// vb_hooks/slug.ts
import { defineHook } from "@voidbase-cloud/voidbase/adapter";

export default defineHook("onRecordCreateRequest", (e) => {
  e.record.set("slug", String(e.record.get("title")).toLowerCase().replaceAll(" ", "-"));
  e.next();
}, "posts");`;

const SHARED = hl.typescript`// vb_hooks/notify.ts
import { defineHook } from "@voidbase-cloud/voidbase/adapter";
import { sendDigest } from "@/shared/mail";     // the same module routes/ imports

export default defineHook("onRecordAfterCreateSuccess", async (e) => {
  await e.next();
  await sendDigest(e.record.get("author") as string);
}, "posts");`;

const GUARD = hl.typescript`import { defineHook, pb } from "@voidbase-cloud/voidbase/adapter";

export default defineHook("onRecordUpdateRequest", (e) => {
  if (e.record.get("locked") && !e.auth?.isSuperuser()) throw new pb.ForbiddenError("locked");
  e.next();
}, "posts");`;

const ROUTE = hl.typescript`// routes/api/posts/[id].ts  ->  GET /api/posts/:id
import { defineHandler } from "void";
import { authOf, pb, requireAuth } from "@voidbase-cloud/voidbase/adapter";

export const GET = defineHandler(requireAuth("users"), async (c) => {
  const post = await pb.$app.findRecordById("posts", c.req.param("id"));
  if (!post) throw new pb.NotFoundError("No such post.");
  if (post.getString("owner") !== authOf(c)?.id) throw new pb.ForbiddenError();
  return { post: post.publicExport() };
});`;

export default function DocsStackHooks() {
  return (
    <>
      <h1>vb_hooks</h1>
      <p className="docs-lead">
        Handlers that run because a record changed, whoever changed it. A route answers a call your own code makes; a
        hook fires for the SDK, for someone clicking in the admin panel, and for your own routes alike. That is the
        difference, and it is the reason this directory exists at all.
      </p>

      <h2>One hook per file</h2>
      <p>
        Any file in <code>vb_hooks/</code> whose default export is a <code>defineHook</code> is registered once, when
        the app mounts, in filename order. The first argument is the event, the last are the collections it applies
        to.
      </p>
      <CodeBlock {...FILE} />

      <p>
        It is TypeScript in the project, so it imports what everything else imports: the modules your routes use, the
        helpers in <code>src/</code>, your own types.
      </p>
      <CodeBlock {...SHARED} />

      <h2>How a handler behaves</h2>
      <p>
        <code>e.next()</code> runs the remaining handlers and then the action itself, so work before that call
        happens first and work after it happens once the write has gone through. Throwing instead refuses the request
        with that error, and the error classes come from <code>pb</code>:
      </p>
      <CodeBlock {...GUARD} />
      <p>
        The events are the ones a project's <a href="/docs/run/project/hooks">pb_hooks</a> has, with the same names
        and the same event objects: records as models and as requests, collections, auth, files, realtime, settings,
        mail and batches. That page lists them, and everything it says about <code>$app</code>, <code>$apis</code>{" "}
        and the rest is true here too, reached as <code>pb.$app</code>, <code>pb.$apis</code>, <code>pb.$os</code>{" "}
        and <code>pb.Record</code>.
      </p>

      <h2>The same data from a route</h2>
      <p>
        There is no hooks directory to write endpoints in: <code>routes/</code> is where the API goes, and a route
        that reads or writes collections imports PocketBase's API from the adapter. <code>authOf(c)</code> is the
        authenticated record, exactly as a hook's <code>e.auth</code>; <code>requireAuth</code> and{" "}
        <code>requireSuperuser</code> are the Void-shaped guards.
      </p>
      <CodeBlock {...ROUTE} />
      <p>
        <code>routerUse</code>, PocketBase's global request middleware, is a hook like any other and can be written
        here, but Void's <code>middleware/</code> means the same thing and already has a directory: every request,
        in file order, PocketBase's endpoints and the panel included. Guard on the path when a middleware is meant
        for your own routes only, because one that throws takes the whole backend with it.
      </p>

      <h2>Three mistakes the build refuses</h2>
      <table>
        <thead>
          <tr>
            <th>What you wrote</th>
            <th>What it says</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>A file in <code>vb_hooks/</code> that exports no hook</td>
            <td>That the file is attached to nothing, rather than silently never running.</td>
          </tr>
          <tr>
            <td>An event name that is not one of PocketBase's</td>
            <td>The nearest real ones, because it is almost always a typo.</td>
          </tr>
          <tr>
            <td>A <code>defineHook</code> left in <code>middleware/</code></td>
            <td>That middleware is Void's and is called with <code>(c, next)</code>, and a hook belongs here.</td>
          </tr>
        </tbody>
      </table>
      <p>
        All three are build errors rather than warnings, because each one is a handler that would otherwise never
        fire and give no sign of it.
      </p>

      <h2>Where they end up</h2>
      <p>
        The build compiles this directory, along with <code>routes/</code>, <code>middleware/</code>,{" "}
        <code>crons/</code> and <code>queues/</code>, into the generated instance's single hook bundle,{" "}
        <code>pb_hooks/void-app.js</code>, with everything they import inlined. There is nothing to register and no
        order to maintain beyond the filenames. Reading <code>pb.$app</code> outside a request, a cron tick or a
        hook throws, so a module under <code>src/</code> may register something at import time but not read.
      </p>
    </>
  );
}
