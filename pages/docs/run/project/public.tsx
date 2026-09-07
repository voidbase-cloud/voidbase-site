// pb_public: the static half of an instance.
import CodeBlock from "@/components/CodeBlock";

const TREE = `pb_public/
├─ index.html
├─ 404.html          optional; a copy of index.html is used when there is none
├─ assets/
└─ favicon.ico`;

const BUILD = `# build your frontend wherever it lives, then put the output here
cd ../web && bun run build
rm -rf ../blog-api/pb_public && cp -r dist ../blog-api/pb_public`;

const REDIRECTS = `/old-post/:slug   /posts/:slug        301
/download         https://example.com/dl  302`;

export default function DocsProjectPublic() {
  return (
    <>
      <h1>pb_public</h1>
      <p className="docs-lead">
        Static files served at <code>/</code> by the same instance that serves the API. A single-page app, a landing
        page, a documentation build: anything that is files. It is optional, and an instance without it is simply an
        API.
      </p>

      <h2>What goes in it</h2>
      <CodeBlock language="bash" content={TREE} />
      <p>
        An <code>index.html</code> here is the site. Requests that match a file get that file; requests that match
        nothing get <code>404.html</code>, or a copy of <code>index.html</code> when the build did not make one,
        which is what a single-page app wants so its own router can handle the path. <code>/api</code> and{" "}
        <code>/_/</code> are never affected.
      </p>

      <h2>Getting a build in there</h2>
      <p>
        There is no bundler here on purpose: build your frontend with whatever it already uses, and copy the output
        in. A line in your deploy script is usually the whole integration.
      </p>
      <CodeBlock language="bash" content={BUILD} />
      <p>
        A frontend served this way is same-origin with its API, which means the SDK needs no address at all:{" "}
        <code>new PocketBase("/")</code> and no CORS to think about.
      </p>

      <h2>Redirects</h2>
      <p>
        A <code>_redirects</code> file in the directory is read on deploy, in the syntax Netlify and Cloudflare Pages
        use: source, destination, optional status.
      </p>
      <CodeBlock language="bash" content={REDIRECTS} />
      <p>
        Path-only rules are served at the edge, before the Worker runs. A rule whose source names a host becomes a
        redirect rule on the zone instead, which is how one instance behind several domains can answer differently
        per hostname. That second kind needs the deploy token to carry the zone's redirect permission, and the
        deploy says so if it cannot write them.
      </p>

      <h2>Somewhere else, if you prefer</h2>
      <p>
        <code>--public-dir &lt;path&gt;</code> on <code>serve</code> and <code>deploy</code> points at another
        directory, so a frontend build can stay where it is built rather than being copied. The directory has to
        contain an <code>index.html</code>, and the deploy refuses before touching anything if it does not.
      </p>
    </>
  );
}
