// vb_migrations: collections for a stack app, beside the app's own tables.
import CodeBlock from "@/components/CodeBlock";

const FILE = `/// <reference path="../.voidbase/pb_data/types.d.ts" />

migrate((app) => {
  const posts = new Collection({
    type: "base",
    name: "posts",
    listRule: "published = true",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id = author.id",
    fields: [
      { name: "title", type: "text", required: true, max: 200 },
      { name: "body", type: "editor" },
      { name: "published", type: "bool" },
      { name: "author", type: "relation", required: true, collectionId: app.findCollectionByNameOrId("users").id, maxSelect: 1 },
    ],
  });
  app.save(posts);
}, (app) => {
  app.delete(app.findCollectionByNameOrId("posts"));
});`;

export default function DocsStackMigrations() {
  return (
    <>
      <h1>vb_migrations</h1>
      <p className="docs-lead">
        Collections, for the half of the data the admin panel and the SDK own. It is the counterpart of Void's{" "}
        <code>db/</code>, which holds the app's own tables, and the two live side by side on purpose.
      </p>

      <h2>Which database gets what</h2>
      <table>
        <thead>
          <tr>
            <th></th>
            <th><code>db/</code>, in Drizzle</th>
            <th><code>vb_migrations/</code>, as collections</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Reached by</td>
            <td>Your own code, typed end to end</td>
            <td>The SDK, the admin panel, and hooks</td>
          </tr>
          <tr>
            <td>Rules</td>
            <td>Whatever your routes enforce</td>
            <td>API rules, per collection, changeable without a deploy</td>
          </tr>
          <tr>
            <td>Good for</td>
            <td>Internal tables: sessions, jobs, anything nobody outside the app should see</td>
            <td>Content and user data: the things people read, write and administer</td>
          </tr>
        </tbody>
      </table>
      <p>
        Most apps want both, and the question to ask of any table is who else needs to touch it. If the answer is
        only your code, it is a Drizzle table. If it is the panel, the SDK or another client, make it a collection.
      </p>

      <h2>A migration</h2>
      <p>
        The format is the same as a project's <a href="/docs/run/project/migrations">pb_migrations</a>, and the
        reference path points into the generated instance rather than a local <code>pb_data</code>:
      </p>
      <CodeBlock language="javascript" content={FILE} />
      <p>
        Name files so they sort in the order they should run. They are copied into the generated instance on build,
        beside the ones generated from your Drizzle migrations, and applied in that order on the first request after
        a deploy, each recorded so it runs once.
      </p>

      <div className="alert alert-info">
        <div className="content">
          <p className="m-0">
            A migration cannot see a collection it created in the same run. Anything that needs a collection to
            already exist, like seeding rows into it, belongs in an <code>onBootstrap</code>{" "}
            <a href="/docs/run/stack/hooks">hook</a> instead.
          </p>
        </div>
      </div>

      <h2>Getting the first one written</h2>
      <p>
        Build and run the app, design the collections in the admin panel at <code>/_/</code>, then export them from
        the panel's Collections screen and save the result as a migration. After that, every change is a new file,
        and the schema travels with the repository.
      </p>
    </>
  );
}
