// pb_migrations: the schema, written down.
import CodeBlock from "@/components/CodeBlock";
import { hl } from "@/lib/hl";

const FILE = hl.javascript`/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const posts = new Collection({
    type: "base",
    name: "posts",
    listRule: "published = true",
    viewRule: "published = true",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id = author.id",
    deleteRule: "@request.auth.id = author.id",
    fields: [
      { name: "title", type: "text", required: true, max: 200 },
      { name: "body", type: "editor" },
      { name: "published", type: "bool" },
      { name: "author", type: "relation", required: true, collectionId: app.findCollectionByNameOrId("users").id, maxSelect: 1 },
      { name: "created", type: "autodate", onCreate: true },
      { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
    ],
  });
  app.save(posts);
}, (app) => {
  app.delete(app.findCollectionByNameOrId("posts"));   // the way back, for parity
});`;

const FIELD = hl.javascript`migrate((app) => {
  const posts = app.findCollectionByNameOrId("posts");
  posts.fields.addAt(3, new BoolField({ name: "featured" }));
  app.save(posts);
}, (app) => {
  const posts = app.findCollectionByNameOrId("posts");
  posts.fields.removeById(posts.fields.getByName("featured").id);
  app.save(posts);
});`;

const IMPORT = hl.bash`voidbase import collections.json --url https://blog-api.example.workers.dev --admin you@example.com:your-password`;

export default function DocsProjectMigrations() {
  return (
    <>
      <h1>pb_migrations</h1>
      <p className="docs-lead">
        The schema as code. Each file runs once, in filename order, and is recorded so it never runs again. This is
        how the collection you designed in the panel on your machine reaches production, and how the next person to
        clone the repository gets the same database you have.
      </p>

      <h2>A migration</h2>
      <p>
        A file exports nothing; it calls <code>migrate</code> with the change and the way back. Name files so they
        sort in the order they should run, which is why the convention is a timestamp prefix:{" "}
        <code>1725712800_posts.js</code>.
      </p>
      <CodeBlock {...FILE} />

      <p>Changing an existing collection is the same shape:</p>
      <CodeBlock {...FIELD} />

      <h2>When they run</h2>
      <p>
        Locally, on the next start. On Cloudflare, on the first request after a deploy, in file order, each recorded
        in the instance's own migrations table. A deploy therefore carries its schema with it, and there is nothing
        to remember to run.
      </p>
      <div className="alert alert-info">
        <div className="content">
          <p className="m-0">
            The down function is kept for parity but there is no command to run it. Roll a mistake forward with
            another migration rather than back, which is what you would want in production anyway.
          </p>
        </div>
      </div>

      <h2>Getting one written for you</h2>
      <p>
        Designing a collection in the admin panel is faster than writing it out, so the usual loop is: design it in
        the panel, then export it. The panel's Collections screen has an export, and the JSON it produces can be
        applied to another instance directly:
      </p>
      <CodeBlock {...IMPORT} />
      <p>
        That is the right tool for copying a schema between instances you already have. For a schema that travels
        with the repository and applies itself on deploy, write the migration file: it is the version-controlled
        answer, and it is the one that works for someone cloning the project tomorrow.
      </p>

      <h2>Where to read on</h2>
      <p>
        The format is PocketBase's, and its{" "}
        <a href="https://pocketbase.io/docs/js-migrations/" target="_blank" rel="noreferrer noopener">
          JS migrations
        </a>{" "}
        page documents every collection option, field type and helper, all of which apply here unchanged.
      </p>
    </>
  );
}
