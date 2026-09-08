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
  await sendDigest(e.record.get("author") as string);
  e.next();
}, "posts");`;

const GUARD = hl.typescript`export default defineHook("onRecordUpdateRequest", (e) => {
  if (e.record.get("locked") && !e.auth?.isSuperuser()) throw new ForbiddenError("locked");
  e.next();
}, "posts");`;

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
        with that error:
      </p>
      <CodeBlock {...GUARD} />
      <p>
        The events are the ones a project's <a href="/docs/run/project/hooks">pb_hooks</a> has, with the same names
        and the same event objects: records as models and as requests, collections, auth, files, realtime, settings,
        mail and batches. That page lists them, and everything it says about <code>$app</code>, <code>$apis</code>{" "}
        and the rest is true here too.
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
            <td>That middleware is Void's and runs per request, and a hook belongs here.</td>
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
        <code>crons/</code> and <code>queues/</code>, into the generated instance's single hook bundle. There is
        nothing to register and no order to maintain beyond the filenames.
      </p>
    </>
  );
}
