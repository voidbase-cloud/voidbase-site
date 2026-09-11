// The hosted path, which is not hosted by us: voidbase.cloud is a control plane that runs in your browser and
// creates instances in your own Cloudflare account. The site keeps the sign-in and the sealed tokens; the work is
// the page's, and everything the page does is also a `voidbase cloud` command.
import { Link } from "@void/react";
import CodeBlock from "@/components/CodeBlock";
import { hl } from "@/lib/hl";

const LOGIN = hl.bash`voidbase cloud login --token <token>        # the "CLI token" the cloud page shows; --url for another site
voidbase cloud whoami                       # the user, the Cloudflare connection and its accounts, GitHub`;

const INSTANCES = hl.bash`voidbase cloud instances                    # yours, with status, release and url
voidbase cloud instances create shop        # provisioned in your own account from the site's release
                                            # --account picks one of several, --email the superuser
voidbase cloud instances upgrade shop       # to the site's current release, in place
voidbase cloud instances delete shop --yes  # the Worker, its D1, R2, queue and domains; asks first without --yes`;

const REPOS = hl.bash`voidbase cloud repos                        # the repositories linked to your instances
voidbase cloud repos create shop --template voidbase-site --name my-site --private
voidbase cloud repos link shop owner/name   # one you already have; unlink owner/name forgets it (GitHub keeps it)`;

const PLUGINS = hl.bash`voidbase cloud plugins shop --email you@example.com --password ...              # what it runs
voidbase cloud plugins shop install echo --email ... --password ...              # install name[@version] [--marketplace url]
voidbase cloud plugins shop update --email ... --password ...                    # update [name]
voidbase cloud plugins shop remove echo --email ... --password ...`;

export default function DocsCloud() {
  return (
    <>
      <h1>voidbase cloud</h1>
      <p className="docs-lead">
        Instances from a page, in your own Cloudflare account. Sign in with Cloudflare, name one, and your browser
        creates it: a Worker with the admin panel, a D1 database, an R2 bucket and a queue, owned by you and billed to
        you. voidbase.cloud never holds it.
      </p>

      <p>
        Try it from <Link href="/cloud">the cloud page</Link>. The backend of that page is itself such an instance,
        and so is <a href="https://demo.voidbase.cloud" target="_blank" rel="noreferrer noopener">the demo</a>.
      </p>

      <h2>What the site keeps, and what your browser does</h2>
      <p>
        The site keeps four things: your sign-in, your Cloudflare and GitHub tokens sealed at rest, the rows about
        your instances and repositories, and two pass-throughs that forward a call to Cloudflare's or GitHub's API
        with your token, because Cloudflare's API sends no CORS headers and neither token ever reaches the browser.
        Everything else is the page's own work, with voidbase's own code: an instance is created, upgraded and deleted
        in your account; a repository is created from a template or linked and wired to the instance; an instance's
        plugins are changed through the instance's own installer, with a session you mint on it from the page.
        Nothing is built for your instance by anyone but its own pipeline.
      </p>

      <h2>Creating one</h2>
      <p>
        Cloudflare shows which accounts and permissions the site asks for, and nothing is created until you click
        create. The form takes a name, which of your accounts it goes in, and what to start from: nothing, for a bare
        instance, or one of the site's templates, which makes a repository in your GitHub in the same click, sets its
        variables to the instance and wires the instance to deploy from it. The instance is provisioned from the
        release the site holds, and the superuser password is shown once and kept nowhere, so write it down.
      </p>
      <div className="alert alert-info">
        <div className="content">
          <p className="m-0">
            Starting from a template needs GitHub connected, which the page asks for once. The repository reads the
            instance's address from its <code>PB_VB_URL</code> variable, and one step stays in Cloudflare's dashboard
            the first time: connecting the repository under Builds so a push deploys it. The page prints the link.
          </p>
        </div>
      </div>

      <h2>The instance's card</h2>
      <p>
        What you do to a backend after making one, each a call the page makes itself. Most of them sign in to the
        instance with its superuser first, and the session is shared by the panels.
      </p>
      <table>
        <thead>
          <tr>
            <th>Panel</th>
            <th>What it does</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Plugins</td>
            <td>
              What the instance runs and where each plugin came from, what our marketplace and any other one by URL
              serve, and install, update and remove through the instance's own installer. On an instance deployed
              from a repository a change is a commit there, and its build deploys it.
            </td>
          </tr>
          <tr>
            <td>Logs</td>
            <td>The last entries, newest first, with a filter in PocketBase's syntax.</td>
          </tr>
          <tr>
            <td>Metrics</td>
            <td>Requests and errors over the last 24 hours, one bar per hour, from the instance's own logs.</td>
          </tr>
          <tr>
            <td>Backups</td>
            <td>
              The archives in the instance's storage, each verified after it is written and again on demand. Take a
              full one or a data one, download, verify, restore, delete.
            </td>
          </tr>
          <tr>
            <td>Superusers</td>
            <td>Who can open its panel. Add one, remove one; the last one stays.</td>
          </tr>
          <tr>
            <td>Payments</td>
            <td>
              Which provider answers, the webhook URL to register, and the customers, subscriptions and payments the
              webhooks wrote; or, with no provider key set, the secrets that would set one.
            </td>
          </tr>
          <tr>
            <td>Domains</td>
            <td>
              The hostnames the deploy attached and which is canonical, and the Workers Custom Domains on your zones,
              attached and detached through Cloudflare.
            </td>
          </tr>
          <tr>
            <td>Secrets</td>
            <td>The Worker's secrets by name. A value is written and never read back; the managed ones are listed only.</td>
          </tr>
        </tbody>
      </table>
      <p>
        Beside those: upgrade the instance to the site's current release in place, its database, files, domains and
        superuser kept; wire another repository to it, from a template or one you have; delete it, which takes the
        Worker and everything it owns after you type the name back.
      </p>

      <h2>Every button is a command</h2>
      <p>
        Nothing is dashboard-only. The cloud page shows a CLI token for the signed-in user, which is the same session
        the page uses and expires when it does. The commands are plain HTTP against the site, so they work from the
        standalone executable as well as the npm package, and the session is kept in{" "}
        <code>~/.config/voidbase/cloud.json</code>, mode 600.
      </p>
      <CodeBlock {...LOGIN} />
      <CodeBlock {...INSTANCES} />
      <CodeBlock {...REPOS} />
      <CodeBlock {...PLUGINS} />
      <p>
        An instance is named by its name (<code>shop</code> finds <code>vb-shop</code>) or its id, every verb takes{" "}
        <code>--json</code> for the raw result, and a verb that fails exits non-zero with the site's, Cloudflare's or
        the instance's own message.
      </p>

      <h2>Updating</h2>
      <p>
        New instances are created on the release the site holds, which we publish into it when one is out. An
        instance that already exists stays on its release until you upgrade it, from its card or with{" "}
        <code>voidbase cloud instances upgrade</code>: the same Worker, its data, secrets and domains kept, the
        migrations of the new release run on the next boot. An instance deployed from a repository is the other
        case: there the release is the repository's dependency, and a push is what changes it.
      </p>

      <h2>When you would rather hold the commands yourself</h2>
      <p>
        The instance is yours either way, and <Link href="/docs/run/npm">the npm CLI</Link> reaches the same account
        with <code>voidbase deploy</code>, <code>voidbase instances</code> and <code>voidbase destroy</code>. The
        difference is who runs the toolchain: your browser, or your machine. Moving between them is{" "}
        <code>voidbase migrate</code>, like anywhere else.
      </p>
    </>
  );
}
