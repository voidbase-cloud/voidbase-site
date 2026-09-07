// The reference page for the layout: what each directory is for, and which ones matter on day one.
import CodeBlock from "@/components/CodeBlock";

const TREE = `my-backend/
├─ pb_hooks/        server-side JavaScript: endpoints, event handlers, scheduled work
├─ pb_migrations/   schema changes, applied in order, each one recorded so it runs once
├─ pb_public/       static files served at /
├─ pb_secrets/      what the project is configured with, and who may read each key
└─ pb_data/         the database, the uploaded files, the generated typings (git-ignored)`;

const HOOK = `/// <reference path="../pb_data/types.d.ts" />

routerAdd("GET", "/api/hello", (e) => e.json(200, { hello: "voidbase" }));

onRecordAfterCreateSuccess((e) => {
  console.log("new post:", e.record.get("title"));
  e.next();
}, "posts");

cronAdd("digest", "0 8 * * *", () => { /* every morning at eight */ });`;

export default function DocsProject() {
  return (
    <>
      <h1>What is in a project</h1>
      <p className="docs-lead">
        A voidbase project is a handful of directories, each named for what it holds. This is PocketBase's layout, and
        every directory means what it means there.
      </p>

      <CodeBlock language="bash" content={TREE} />

      <p>
        Only <code>pb_hooks/</code> and <code>pb_migrations/</code> are worth putting in version control on day one.
        The rest appear when you need them.
      </p>

      <h2>pb_hooks/</h2>
      <p>
        Server-side JavaScript, run inside the instance. <code>routerAdd</code> adds an endpoint,{" "}
        <code>onRecordCreate</code> and the other <code>on*</code> functions run around writes, and{" "}
        <code>cronAdd</code> schedules work. One file or many, any name ending <code>.pb.js</code>, loaded in
        filename order.
      </p>
      <CodeBlock language="javascript" content={HOOK} />
      <p>
        The reference comment on the first line is what makes an editor autocomplete the whole API; the file it points
        at is generated into <code>pb_data/</code> on the first run. The hook API is PocketBase's, documented under{" "}
        <a href="https://pocketbase.io/docs/js-overview/" target="_blank" rel="noreferrer noopener">
          Extend with JavaScript
        </a>
        .
      </p>

      <h2>pb_migrations/</h2>
      <p>
        Schema as code. Each file is applied once, in filename order, and recorded so it never runs twice. This is how
        a collection you designed in the panel on your machine reaches production: write the migration, commit it, and
        the next deploy applies it. The format is PocketBase's{" "}
        <a href="https://pocketbase.io/docs/js-migrations/" target="_blank" rel="noreferrer noopener">
          JS migrations
        </a>
        .
      </p>
      <p className="txt-hint txt-sm">
        The other way is the panel's own export: it gives you a collections file, and{" "}
        <code>voidbase import collections.json --url &lt;instance&gt;</code> applies it to another instance.
      </p>

      <h2>pb_public/</h2>
      <p>
        Static files served at <code>/</code>, so a built frontend can ship inside the same instance and share its
        address. An <code>index.html</code> here is the site; unknown paths get its <code>404.html</code>, while{" "}
        <code>/api</code> and <code>/_/</code> are never touched.
      </p>

      <h2>pb_secrets/</h2>
      <p>
        The project's configuration, in two files. <code>main.ts</code> declares every key and, importantly, who may
        read it. <code>secrets.json</code> holds the values on your machine and is git-ignored, so a project needs no{" "}
        <code>.env</code> at all.
      </p>
      <table>
        <thead>
          <tr>
            <th>Declared as</th>
            <th>Who can read it</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>secret()</code></td>
            <td>The deployed instance only, as an encrypted secret. Never listed, never in a build.</td>
          </tr>
          <tr>
            <td><code>server()</code></td>
            <td>Server code: your hooks and routes. A plain variable on the instance.</td>
          </tr>
          <tr>
            <td><code>browser()</code></td>
            <td>The browser too. A client build inlines the value, so treat it as public.</td>
          </tr>
          <tr>
            <td><code>local()</code></td>
            <td>Your own tooling, like the deploy token. Read on your machine and in CI, deployed nowhere.</td>
          </tr>
        </tbody>
      </table>
      <p>
        Every key must say which one it is, and a deploy refuses a value that fails its own validation, so a typo is
        caught before it reaches production rather than after.
      </p>

      <h2>pb_data/</h2>
      <p>
        Everything a running instance owns: the database, the uploaded files, and the generated typings. It is
        git-ignored, and once deployed it is not used at all, because Cloudflare's database and object storage hold
        the same things.
      </p>
    </>
  );
}
