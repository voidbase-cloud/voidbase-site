// Asking for money, on a page for a thing that is free.
//
// Sponsorship is not open yet, so the page leads with that rather than burying it: a banner that says what is
// missing and what happens when it arrives. Everything under it is written to be true before and after approval,
// so switching the banner off is the only edit that page will need.
//
// The honest version of this page is short. What the money pays for, what it does not buy, and what to do instead
// while there is nothing to click.
import { Link } from "@void/react";
import { SITE } from "@/lib/env";
import "@/scss/sponsor.scss";

export default function DocsSponsor() {
  return (
    <article className="sponsor">
      <h1>Support voidbase</h1>
      <p className="docs-lead">
        voidbase is free, MIT licensed, and built by people who are not paid to build it. Sponsorship is how that
        stays true: money that arrives because someone wants the project to exist, rather than a bill sent to
        everyone using it.
      </p>

      <div className="sponsor-soon">
        <div className="sponsor-soon-mark">
          <i className="ri-hand-coin-line" />
        </div>
        <div>
          <h2>Not open yet</h2>
          <p>
            Our GitHub Sponsors application is in and waiting on approval. There is nothing to click here until it
            comes through. When it does, the button appears on this page and nothing else here changes.
          </p>
        </div>
      </div>

      <h2>What it pays for</h2>
      <p>
        Time, and nothing more interesting than that. voidbase has no servers to rent, because it runs in your
        Cloudflare account and not ours, and no staff. What it has is a list of things that need a person sitting
        down for a week: the pieces on <Link href="/docs/roadmap">the roadmap</Link>, the plugins that make a
        backend worth installing, and the unglamorous half of a project that only gets done when someone can afford
        to do it.
      </p>

      <h2>What it does not buy</h2>
      <p>
        Nothing about the software changes with money on either side of it. Sponsors do not get a build other people
        cannot have, features do not wait behind a threshold, and nothing that is free today stops being free
        because a sponsor asked. That is the same commitment as{" "}
        <Link href="/docs/pricing">the pricing page</Link>, which is the page to read if you want the whole plan
        rather than this part of it.
      </p>
      <p>
        What a sponsor does get is a say in what gets attention first, and credit on{" "}
        <Link href="/docs/acknowledgments">the acknowledgments page</Link> if they want it.
      </p>

      <h2>Until then</h2>
      <p>The things that help most right now cost nothing.</p>
      <ul className="sponsor-instead">
        <li>
          <i className="ri-git-pull-request-line" />
          <span>
            Fix a page, or write one. Every page here has an <strong>Improve this page</strong> card at the bottom,
            and <Link href="/docs/contribute">How to contribute</Link> lists the things we cannot do ourselves.
          </span>
        </li>
        <li>
          <i className="ri-timer-line" />
          <span>
            Benchmark it properly. The numbers on the comparison pages are arithmetic over beliefs and say so. A
            real measurement would replace them.
          </span>
        </li>
        <li>
          <i className="ri-chat-3-line" />
          <span>
            Tell us what broke. <a href={SITE.discordUrl} target="_blank" rel="noreferrer noopener">Discord</a> for a
            question, <a href={SITE.discussionsUrl} target="_blank" rel="noreferrer noopener">Discussions</a> for an
            idea, and the issue tracker for anything reproducible.
          </span>
        </li>
        <li>
          <i className="ri-npmjs-line" />
          <span>
            Use it, and say so. A backend nobody runs has no bugs worth fixing. The CLI is on{" "}
            <a href={SITE.npmUrl} target="_blank" rel="noreferrer noopener">npm</a> and the source is on{" "}
            <a href={SITE.repoUrl} target="_blank" rel="noreferrer noopener">GitHub</a>.
          </span>
        </li>
      </ul>
    </article>
  );
}
