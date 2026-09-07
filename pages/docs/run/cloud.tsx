// The hosted path. It exists and it works, but it is still moving, so this page says so plainly rather than
// documenting something that will have changed by the time anyone follows it.
import { Link } from "@void/react";

export default function DocsCloud() {
  return (
    <>
      <h1>voidbase cloud</h1>
      <p className="docs-lead">
        <span className="label label-warning">Experimental</span> A full guide is coming.
      </p>

      <p>
        voidbase cloud creates instances in a Cloudflare account for you, without a project or a deploy command of
        your own: sign in, name an instance, and it is provisioned with its database, storage and custom domain
        attached. It exists and it works, and you can try it from <Link href="/cloud">the cloud page</Link>.
      </p>

      <p>
        It is not documented in full yet, because it is still changing in ways that would make a guide wrong rather
        than merely incomplete. Until it settles, the three paths above are the supported ways to run an instance, and
        every one of them puts it in an account you control.
      </p>

      <h2>In the meantime</h2>
      <ul>
        <li>
          <Link href="/docs/run/standalone">Standalone</Link> if you want to see it working now.
        </li>
        <li>
          <Link href="/docs/run/npm">With npm</Link> if you want it in a repository and on Cloudflare.
        </li>
        <li>
          <Link href="/docs/run/stack">The voidbase stack</Link> if the backend and the site are one application.
        </li>
      </ul>
    </>
  );
}
