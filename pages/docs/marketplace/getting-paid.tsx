// Charging for what you publish: what the marketplace does not do, what an instance can do, and what is promised.
//
// The commitments here are the same ones on the pricing page, said from the creator's side rather than the user's.
// Repeating them is deliberate: a promise about money that only appears where buyers read it is not a promise.
import { Link } from "@void/react";
import { SITE } from "@/lib/env";

export default function DocsMarketplaceGettingPaid() {
  return (
    <>
      <h1>Getting paid</h1>
      <p className="docs-lead">
        Nothing is sold through the marketplace. It has no accounts, no billing and no payouts, and it takes no cut
        of anything. What it lists is installed by name from your repository, under your licence, and money between
        you and whoever uses it is yours to arrange. This page exists so the intent is written down before any
        mechanism is, rather than announced afterwards.
      </p>

      <h2>What your instance can do today</h2>
      <p>
        Taking money is a plugin, not a marketplace feature. <code>stripe</code>, <code>polar</code> and{" "}
        <code>lemonsqueezy</code> ship with voidbase, each providing <code>payments@1</code> and writing customers,
        subscriptions and payments into collections your app queries like any other; setting the provider's key is
        what turns one on, and <code>@voidbase-cloud/sdk/payments</code> is the client side. That is an instance
        charging its own users for its own product. <Link href="/docs/plugins">The plugins page</Link> has the three.
      </p>

      <h2>What is promised</h2>
      <ul>
        <li>
          <strong>You keep what you earn.</strong> If you publish something worth paying for, you should be able to
          charge for it. Building a marketplace rather than a plugin directory is what that sentence costs.
        </li>
        <li>
          <strong>We would rather take sponsorship than a percentage.</strong> The plan is for the marketplace to be
          paid for by people who want the ecosystem to exist, not by a cut of everyone inside it.
        </li>
        <li>
          <strong>Official plugins and themes stay free.</strong> As many as we can write. An ecosystem does not start
          behind a paywall, and free official ones are what makes a paid third-party one worth writing.
        </li>
        <li>
          <strong>Nothing that is free becomes paid.</strong> If a subscription ever appears it covers a basket of
          specialised official plugins and themes, and specialised is doing the work in that sentence.
        </li>
      </ul>
      <p>
        The same commitments from the other side, along with what voidbase itself costs, are on{" "}
        <Link href="/docs/pricing">the pricing page</Link>. If creators are ever able to charge through the
        marketplace, it will be written down there before it is built.
      </p>

      <h2>What is not decided</h2>
      <p>
        Quite a lot, and it is better to say so than to imply a design exists.
      </p>
      <ul>
        <li>How money would move: which payment provider, who the merchant of record is, and therefore who carries the tax obligation.</li>
        <li>What could be charged for. A one-off price, a subscription, per-instance, or something else entirely.</li>
        <li>Whether a paid listing needs a licence check, and what happens to an instance when a subscription lapses.</li>
        <li>Refunds, disputes, and what happens when a paid plugin stops being maintained.</li>
      </ul>

      <h2>If this matters to you</h2>
      <p>
        Say so now rather than later. Someone who intends to earn from this has opinions about the list above that we
        do not, and the order those questions get answered in should be set by the people affected.{" "}
        <a href={SITE.discordUrl} target="_blank" rel="noreferrer noopener">Discord</a> is the fastest way, and{" "}
        <Link href="/docs/roadmap">the roadmap</Link> is where the answers land once there are any.
      </p>
    </>
  );
}
