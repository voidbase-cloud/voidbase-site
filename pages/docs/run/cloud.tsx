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

      <h2>Updating</h2>
      <p>
        There is nothing for you to run. voidbase cloud provisions an instance from the release it is holding, and we
        publish a new release into it when one is out. New instances are created on the newest release from that
        moment.
      </p>
      <p>
        Instances that already exist stay on the release they were created with. Moving a running instance onto a
        newer one in place is the piece that is missing, and it is why this page still says experimental. It is on{" "}
        <Link href="/docs/roadmap">the roadmap</Link>. Until it lands, an instance you want to keep on a version of
        your choosing is better made from <Link href="/docs/run/npm">the CLI</Link>, where{" "}
        <code>voidbase update</code> and <code>voidbase deploy</code> are yours to run whenever you want them.
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
