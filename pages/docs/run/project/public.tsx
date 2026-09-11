// pb_public: the static half of an instance.
import CodeBlock from "@/components/CodeBlock";
import { hl } from "@/lib/hl";

const TREE = hl.markdown`Inside \`pb_public/\`:

- \`index.html\`
- \`404.html\`: optional; a copy of \`index.html\` is used when there is none
- \`assets/\`
- \`favicon.ico\`
- \`_redirects\`: optional
`;

const BUILD = hl.bash`# build your frontend wherever it lives, then put the output here
cd ../web && bun run build
rm -rf ../blog-api/pb_public && cp -r dist ../blog-api/pb_public`;

const REDIRECTS = hl.text`/old-post/:slug   /posts/:slug        301
/download         https://example.com/dl  302
https://api.example.com/  /_/  302`;

const ELSEWHERE = hl.bash`voidbase serve --publicDir ../web/dist
voidbase deploy --public-dir ../web/dist`;

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
      <CodeBlock {...TREE} />
      <p>
        An <code>index.html</code> here is the site. Requests that match a file get that file; requests that match
        nothing get <code>404.html</code>, or a copy of <code>index.html</code> when the build did not make one,
        which is what a single-page app wants so its own router can handle the path. <code>/api</code> and{" "}
        <code>/_/</code> are never affected.
      </p>
      <p>
        One difference between the two runtimes: <code>voidbase serve</code> answers a deep link with the shell and
        status 200, as PocketBase does. On Cloudflare everything outside <code>/api</code> is served by the asset
        layer without invoking the Worker, which answers a miss with the nearest <code>404.html</code>, so a deep
        link gets the same shell with status 404. The body is identical and the client router boots as usual.
      </p>

      <h2>Getting a build in there</h2>
      <p>
        There is no bundler here on purpose: build your frontend with whatever it already uses, and copy the output
        in. A line in your deploy script is usually the whole integration.
      </p>
      <CodeBlock {...BUILD} />
      <p>
        A frontend served this way is same-origin with its API, which means the SDK needs no address at all:{" "}
        <code>new PocketBase("/")</code> and no CORS to think about.
      </p>

      <h2>The files crawlers ask for</h2>
      <p>
        <code>/robots.txt</code>, <code>/sitemap.xml</code> and <code>/llms.txt</code> are answered by the{" "}
        <code>seo</code> plugin when this directory has no such file: robots keeps crawlers out of the panel and the
        API and names the sitemap, the sitemap lists the site root and one entry per record of each collection{" "}
        <code>VOIDBASE_SITEMAP</code> declares (only a publicly listable collection is read), and llms.txt describes
        the instance and its machine-readable endpoints for the crawlers that are not search engines. A real file
        here wins over the generated answer.
      </p>

      <h2>Redirects</h2>
      <p>
        A <code>_redirects</code> file in the directory is read on deploy, in the syntax Netlify and Cloudflare Pages
        use: source, destination, optional status.
      </p>
      <CodeBlock {...REDIRECTS} />
      <p>
        Path-only rules are uploaded with the assets as Cloudflare's own <code>_redirects</code>, evaluated before
        the Worker runs. A rule whose source names a host becomes a redirect rule on the zone instead, tagged with
        the Worker's name so a redeploy replaces exactly its own rules, which is how one instance behind several
        domains can answer differently per hostname. That second kind needs the deploy token to carry the zone's
        Single Redirect permission, and without it the deploy prints the rules to create by hand and carries on.
      </p>

      <h2>Somewhere else, if you prefer</h2>
      <p>
        Point at another directory, so a frontend build can stay where it is built rather than being copied. The
        directory has to contain an <code>index.html</code>, and the deploy refuses before touching anything if it
        does not. <code>VOIDBASE_DEPLOY_PUBLIC_DIR</code> does the same for a deploy from the environment.
      </p>
      <CodeBlock {...ELSEWHERE} />
    </>
  );
}
