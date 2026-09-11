// The pricing page for a product with one price.
//
// A table with one column would be a joke, so this page is an argument in three beats instead: the claim, the one
// bill that is not ours, and how a free thing pays for itself. The mechanics of the last part live on the roadmap,
// because someone asking what voidbase costs does not want to read about revenue share.
import { Link } from "@void/react";
import CloudflareCost from "@/components/CloudflareCost";
import "@/scss/pricing.scss";

function Fact({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="pricing-fact">
      <h3>{title}</h3>
      <p>{children}</p>
    </section>
  );
}

const CF = {
  workers: "https://developers.cloudflare.com/workers/platform/pricing/",
  d1: "https://developers.cloudflare.com/d1/platform/pricing/",
  durable: "https://developers.cloudflare.com/durable-objects/platform/pricing/",
  ai: "https://developers.cloudflare.com/workers-ai/platform/pricing/",
  email: "https://developers.cloudflare.com/email-service/",
  analytics: "https://developers.cloudflare.com/analytics/analytics-engine/pricing/",
  builds: "https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/",
};

export default function DocsPricing() {
  return (
    <article className="pricing">
      <div className="pricing-hero">
        <span className="pricing-eyebrow">Pricing</span>
        <p className="pricing-word">Free</p>
        <p className="pricing-claim">
          The server, the admin panel, the CLI, the SDK and every official plugin we ship. There is no paid edition,
          no licence key, and no plan above this one.
        </p>
      </div>

      <h2>What that means</h2>

      <Fact title="We do not sell hosting">
        voidbase runs in your own Cloudflare account from the first deploy. We do not host it and we do not resell
        anyone's infrastructure, so there is nothing sitting between you and the machines for us to mark up. That
        includes <Link href="/docs/run/cloud">voidbase cloud</Link>: it signs in to your Cloudflare account and
        creates the instance there. The thing it makes is yours, and we could not put it on a bill if we wanted to.
      </Fact>

      <Fact title="We do not sell the software">
        It is MIT licensed and published on npm, and the version we run is the version you run. Nothing is held back
        for a tier, because there is no tier. If that ever changes it will be because we added something new, never
        because we took something away.
      </Fact>

      <Fact title="You might still get a bill, and it will not be ours">
        Cloudflare's, if you outgrow their free tier. A project with no users costs nothing there; a project with
        users pays for the users. Rather than leave that as "it depends", the calculator below works out what they
        would charge and what would tip you over. To compare it against what you are paying now, every{" "}
        <Link href="/docs/why">comparison page</Link> ends with the same calculator priced against that backend.
      </Fact>

      <CloudflareCost />

      <h2 id="knobs">What a knob turns on</h2>
      <p className="pricing-lead">
        The calculator prices the instance as it deploys by default: a Worker, a D1 database, an R2 bucket and the
        realtime hub. A few deploy knobs add a Cloudflare product that has a line of its own, off unless you set
        them. The rates below are the ones written in voidbase's own documentation when each knob shipped; they change,
        and the linked pages are the ones that count.
      </p>
      <table>
        <thead>
          <tr>
            <th>Knob</th>
            <th>What it adds</th>
            <th>What Cloudflare meters</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>VOIDBASE_DATABASE=durable</code></td>
            <td>The instance's data in a SQLite-backed Durable Object instead of D1, so a batch is one transaction.</td>
            <td>
              Object requests past the first million, duration while the object is active, and its storage at the
              same per-row rates as D1 plus a per-GB-month charge. Every query is a request to the object, so a chatty
              request costs more here than on D1 and an idle instance costs its storage.{" "}
              <a href={CF.durable} target="_blank" rel="noreferrer noopener">Durable Objects pricing</a>
            </td>
          </tr>
          <tr>
            <td><code>VOIDBASE_AI=1</code></td>
            <td>The Workers AI binding and the <code>ai</code> plugin's chat over the instance.</td>
            <td>
              Neurons, with a daily free allowance. Nothing is created on the account; the bill follows the calls.{" "}
              <a href={CF.ai} target="_blank" rel="noreferrer noopener">Workers AI pricing</a>
            </td>
          </tr>
          <tr>
            <td><code>VOIDBASE_MAIL_DOMAIN</code></td>
            <td>Outbound mail through Cloudflare Email Sending, from the instance's own domain.</td>
            <td>
              In beta on the Workers Paid plan when this was written, so the plan's minimum applies before any mail
              does. <a href={CF.email} target="_blank" rel="noreferrer noopener">Email Service</a>
            </td>
          </tr>
          <tr>
            <td><code>--analytics</code></td>
            <td>One Analytics Engine data point per request, queryable in the dashboard and the SQL API.</td>
            <td>
              Per million data points. The account has to enable Analytics Engine once.{" "}
              <a href={CF.analytics} target="_blank" rel="noreferrer noopener">Analytics Engine pricing</a>
            </td>
          </tr>
          <tr>
            <td><code>voidbase sync</code></td>
            <td>A build on Cloudflare Workers Builds on every push.</td>
            <td>
              Build minutes: 3,000 a month on the free plan, 6,000 on the paid one and then per minute, with one
              concurrent build on the free plan.{" "}
              <a href={CF.builds} target="_blank" rel="noreferrer noopener">Workers Builds limits and pricing</a>
            </td>
          </tr>
        </tbody>
      </table>
      <p className="txt-hint txt-sm">
        Preview instances count as instances: each has its own database, bucket and queue on the same account, and the
        free plan allows 10 D1 databases. The rates the calculator uses are on{" "}
        <a href={CF.workers} target="_blank" rel="noreferrer noopener">Workers pricing</a> and{" "}
        <a href={CF.d1} target="_blank" rel="noreferrer noopener">D1 pricing</a>.
      </p>

      <h2>Then how does this pay for itself?</h2>
      <p className="pricing-lead">
        Honestly, this is the part most open projects are vague about, so here is the plan in the order we expect it
        to matter.
      </p>

      <ol className="pricing-plan">
        <li>
          <strong>Sponsors.</strong> This is the main one. We would rather be paid by people who want the ecosystem
          to exist than take a cut of everyone inside it. <Link href="/docs/sponsor">Support voidbase</Link> is what
          that looks like, including the part where it is not open yet.
        </li>
        <li>
          <strong>Official plugins, free.</strong> As many as we can write, and the ones that exist ship with
          voidbase: backups, domains, previews, mail, the API description and the MCP server, SEO, translations,
          three payment providers and the AI chat. An ecosystem does not start behind a paywall, and a backend with
          nothing to install is a backend you have to finish yourself.
        </li>
        <li>
          <strong>A subscription, later, for the specialised ones.</strong> A growing basket of official plugins and
          themes that most projects will never need. Specialised, not essential, and never something that was free
          yesterday.
        </li>
        <li>
          <strong>A marketplace where other people earn.</strong> The marketplace lists templates and plugins today
          and nobody is paid through it yet. If you write a plugin or a theme worth paying for, you should be able to
          charge for it and keep what you earn. That is the point of building a marketplace rather than a plugin
          directory.
        </li>
      </ol>

      <p>
        The first two are how it works now; the last two are plans. They are written down properly on{" "}
        <Link href="/docs/roadmap">the roadmap</Link>, with what each piece actually involves.
      </p>

      <h2>What we will not do</h2>
      <ul className="pricing-never">
        <li><i className="ri-close-line" />Charge per seat, per project or per instance.</li>
        <li><i className="ri-close-line" />Keep a feature out of the open version so a paid one has something to sell.</li>
        <li>
          <i className="ri-close-line" />
          Make leaving expensive. Your data exports as SQLite and files and the API is PocketBase's, so the thing you
          would move to already exists and already runs your code.
        </li>
        <li><i className="ri-close-line" />Put anything behind a subscription that was free before it.</li>
      </ul>

      <div className="pricing-next">
        <Link href="/docs/start" className="btn btn-lg btn-primary">
          <i className="ri-play-circle-line" />
          <span className="txt">Get one running</span>
        </Link>
        <Link href="/docs/roadmap" className="btn btn-lg btn-secondary">
          <i className="ri-road-map-line" />
          <span className="txt">Read the roadmap</span>
        </Link>
        <Link href="/docs/contribute" className="btn btn-lg btn-secondary">
          <i className="ri-git-pull-request-line" />
          <span className="txt">Help build it</span>
        </Link>
      </div>
    </article>
  );
}
