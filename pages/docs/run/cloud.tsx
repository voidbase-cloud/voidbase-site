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
            <td>
              The last entries, newest first, with a level and a window, and an "errors only" toggle that asks for
              the 5xx answers and anything the instance recorded an error for. On an instance without the{" "}
              <code>observability</code> plugin: the last entries with a filter in PocketBase's syntax.
            </td>
          </tr>
          <tr>
            <td>Metrics</td>
            <td>
              The window's requests and errors, the error rate, p50, p95 and p99, the status split and the five
              slowest routes, over an hour or a day. On an instance without the <code>observability</code> plugin:
              requests and errors over the last 24 hours, one bar per hour, from the instance's own logs.
            </td>
          </tr>
          <tr>
            <td>Observability</td>
            <td>
              Not a panel of its own: the <code>observability</code> plugin is what Logs and Metrics read, and the
              plugin answers from one of two sources. The Analytics Engine dataset, when the instance was deployed
              with <code>--analytics</code> and carries a token to query it, holds one sampled data point per
              request, so those numbers are about all the traffic. The instance's own request log is always there
              and needs nothing, but it keeps entries at or above the log level, which is warnings and errors by
              default, so those numbers are about what went wrong rather than everything that happened. Each answer
              says which one it used, and the panel repeats it in a line. The card itself carries the last hour as
              three numbers, asked for once when you sign in to the instance.
            </td>
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
              The hostnames the <code>domains</code> plugin reports from the instance and which is canonical, and
              setting them, which is the plugin's knob written where that instance's deploy reads it. Below them,
              what your account has attached to the Worker, so a hostname on one side and not the other shows.
            </td>
          </tr>
          <tr>
            <td>Secrets</td>
            <td>The Worker's secrets by name. A value is written and never read back; the managed ones are listed only.</td>
          </tr>
          <tr>
            <td>Members</td>
            <td>
              Who is on the instance, what each of them may do, and which invitations nobody has accepted yet. An
              owner invites by email, changes a role and takes somebody off; everybody else sees the list.
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        Beside those: upgrade the instance to the site's current release in place, its database, files, domains and
        superuser kept; roll that upgrade back, for a week; wire another repository to it, from a template or one you
        have; delete it, which takes the Worker and everything it owns after you type the name back.
      </p>

      <h2>Teams</h2>
      <p>
        An instance belongs to a team, not to whoever clicked first. Whoever creates one is its first owner, and
        from the card's Members panel an owner adds anybody else by email address. Each person has one of three
        roles, and the role is on the card so you can see at a glance what an instance is to you.
      </p>
      <table>
        <thead>
          <tr>
            <th>Role</th>
            <th>What it reaches</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Owner</td>
            <td>
              Everything, including deleting the instance and changing who is on it. An instance always has at
              least one: the last owner cannot be removed or demoted, so there is never one with nobody who may
              hand it on.
            </td>
          </tr>
          <tr>
            <td>Admin</td>
            <td>
              Everything to the instance: upgrade, roll back, domains, secrets, plugins, backups, and wiring a
              repository to it. Not deleting it, and not who is on it.
            </td>
          </tr>
          <tr>
            <td>Viewer</td>
            <td>
              Reads what the instance reports: logs, metrics, plugins, the backups list, the team. Changes nothing,
              and the card offers them no button that would.
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        An invitation is an email with a link. Open it signed in with the address it was sent to and you are on the
        instance; open it as somebody else and it says which address it was for. A link works once: accepting it
        clears it, and an invitation nobody has accepted shows on the panel as pending until they do or the owner
        takes it back. If the site it was sent from has no mail set up, the invitation still exists and the panel
        hands the inviter the link to send however they like.
      </p>
      <div className="alert alert-info">
        <div className="content">
          <p className="m-0">
            What a role does not do is hand over a Cloudflare account. The instance stays where it was made, and
            everybody on it works in that account with their own Cloudflare sign-in: this site holds each person's
            token for them and never lends one to another. So somebody you make an admin needs their own access to
            the account the instance lives in before an upgrade or a secret goes through; Cloudflare answers that
            question, and the roles here answer what we let them ask.
          </p>
        </div>
      </div>

      <h2>Setting a domain</h2>
      <p>
        A deployed instance carries the <code>domains</code> plugin, and the plugin is what attaches a hostname: at
        deploy time it reads <code>VOIDBASE_DOMAINS</code> (comma separated, the first canonical), turns the
        workers.dev address off, attaches each hostname through Cloudflare, waits for the certificate and sends the
        other hostnames to the canonical one with a 301. The panel sets that knob rather than doing the work itself,
        and it reads the plugin's own report back as the truth.
      </p>
      <p>
        On an instance deployed from a repository, setting a domain is one commit to it, the way a plugin install is
        one commit: <code>VOIDBASE_DOMAINS</code> goes into the project's <code>vb_secrets/main.ts</code>, where the
        deploy reads its knobs, and the change lands on the next deploy, which the push starts. On an instance with
        no repository there is no deploy a browser can run, so the panel sets the plugin's two vars on the Worker and
        attaches the hostnames itself; the panel says so in a line, and the instance reports them as it would after a
        deploy. What that case does not get is the redirects, which the plugin sets around a deploy as zone rules, so
        a second hostname there answers on its own name. Under both, the Workers Custom Domains your account has
        attached to that Worker are listed as what the account has attached, so a hostname the plugin does not
        report, or one it reports that the account does not have, is visible rather than hidden.
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
      <p>
        An upgrade is reversible for a week. The row keeps the release the instance was on and when it moved, and the
        card offers "Roll back to" that release for seven days: the same provisioning, on the recorded release
        instead of the current one, its database, files, secrets and domains kept. After seven days the button is
        gone and the card says the release it is on. This one is the page's for now:{" "}
        <code>voidbase cloud instances upgrade</code> takes no release yet.
      </p>
      <div className="alert alert-warning">
        <div className="content">
          <p className="m-0">
            What a rollback does not undo is migrations. The ones the newer release ran have run, and nothing
            reverses them, so a rollback can leave the database ahead of the code reading it. Rolling back also
            clears the recorded release, so a rollback is not itself rollable; the way forward from there is the
            upgrade again, or a backup taken before the upgrade.
          </p>
        </div>
      </div>

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
