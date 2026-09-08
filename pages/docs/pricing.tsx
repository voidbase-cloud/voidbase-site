// The pricing page for a product with one price.
//
// A table with one column would be a joke, so this page is an argument in three beats instead: the claim, the one
// bill that is not ours, and how a free thing pays for itself. The mechanics of the last part live on the roadmap,
// because someone asking what voidbase costs does not want to read about revenue share.
import { Link } from "@void/react";
import "@/scss/pricing.scss";

function Fact({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="pricing-fact">
      <h3>{title}</h3>
      <p>{children}</p>
    </section>
  );
}

export default function DocsPricing() {
  return (
    <article className="pricing">
      <div className="pricing-hero">
        <span className="pricing-eyebrow">Pricing</span>
        <p className="pricing-word">Free</p>
        <p className="pricing-claim">
          The server, the admin panel, the CLI and every official plugin we ship. There is no paid edition, no licence
          key, and no plan above this one.
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
        users pays for the users. We have priced that against every other backend we could get real rates for, with a
        calculator on each page, because "it depends" is not an answer. Start with{" "}
        <Link href="/docs/why/supabase">Supabase</Link> or <Link href="/docs/why/firebase">Firebase</Link> if you are
        coming from one of those.
      </Fact>

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
          <strong>Official plugins and themes, free.</strong> As many as we can write. An ecosystem does not start
          behind a paywall, and a backend with nothing to install is a backend you have to finish yourself.
        </li>
        <li>
          <strong>A subscription, later, for the specialised ones.</strong> A growing basket of official plugins and
          themes that most projects will never need. Specialised, not essential, and never something that was free
          yesterday.
        </li>
        <li>
          <strong>A marketplace where other people earn.</strong> If you write a plugin or a theme worth paying for,
          you should be able to charge for it. That is the point of building the marketplace rather than a plugin
          directory.
        </li>
      </ol>

      <p>
        All of that is a plan and none of it is built. It is written down properly on{" "}
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
