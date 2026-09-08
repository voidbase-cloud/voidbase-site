// The history page. An argument, so it reads as one: a hero, four dated eras on a rail, and the claim at the end
// with the thing that would disprove it.
import { Link } from "@void/react";
import ProductMark from "@/components/ProductMark";
import { DOCS_NAV } from "@/lib/docsNav";
import "@/scss/why.scss";

function Era({ year, now, title, children }: { year: string; now?: boolean; title: string; children: React.ReactNode }) {
  return (
    <section className={`why-era${now ? " is-now" : ""}`}>
      <span className="why-year">{year}</span>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export default function DocsWhy() {
  const section = DOCS_NAV.find((s) => s.href === "/docs/why");
  const comparisons = (section?.children ?? []).filter((c) => c.href !== "/docs/why");

  return (
    <article className="why">
      <span className="why-eyebrow">The argument</span>
      <h1>Why another BaaS??!?!?</h1>
      <p className="docs-lead">
        Fair question. Four backends in fourteen years, and each one answered the same question better than the last.
        The question was never what a backend should do. Everyone settled that by about 2012. It was who runs it, and
        whether you can leave.
      </p>

      <picture>
        <source srcSet="/images/docs/why-hero.webp" type="image/webp" />
        <img className="why-hero" src="/images/docs/why-hero.jpg" alt="" width="1400" height="788" />
      </picture>
      <p className="why-caption">Each generation kept the box and moved who holds it. The last one removes the box.</p>

      <Era year="2011" title="Firebase">
        <p>
          Firebase came out of a chat widget. The founders had built a chat product, watched people push data through
          it that had nothing to do with chat, and sold the data sync instead.
        </p>
        <p>
          It solved a real thing. Before it, a phone app that needed a database needed a server, and you wrote that
          server. After it, the phone talked to the database, updates arrived as they happened, login worked, and
          there was no server. That is a lot of work to delete.
        </p>
        <p>
          The price was the account. The database was Google's, in Google's project, reached through a query language
          only Google's product spoke. Leaving meant rewriting the data layer and every query in it.
        </p>
      </Era>

      <Era year="2020" title="Supabase">
        <p>
          Supabase put the objection in its own tagline and called itself the open source Firebase alternative.
          Postgres in the middle, an API generated from your schema, and auth, storage and realtime around it.
        </p>
        <p>
          It solved the query language and the licence in one move. You get SQL, joins, indexes, extensions and
          row-level security, on a database that has been around since the nineties, under a licence nobody can
          revoke.
        </p>
        <p>
          The price was operations. Self-hosting Supabase means running Postgres and a handful of services around it,
          keeping them upgraded and backed up, and being the person paged when one of them stops. It is documented
          and people do it. The easy path is still the hosted one, which is where most projects end up.
        </p>
      </Era>

      <Era year="2022" title="PocketBase">
        <p>
          PocketBase went the other way and made the whole backend one file. A Go binary with SQLite inside it, an
          admin panel, auth, file storage, realtime, and hooks in JavaScript or Go. Download it, run it, and you have
          a backend.
        </p>
        <p>
          It solved operations by having almost none. There is nothing to provision, no cluster, no compose file, and
          the thing you copy to the server is the thing you ran on your laptop.
        </p>
        <p>
          The price was the machine. One process on one box, scaled by buying a bigger box, and the box is yours: the
          TLS certificate, the restarts, the backups, the disk filling up at 3am, and the fact that everyone far from
          that one region waits longer than everyone near it.
        </p>
      </Era>

      <Era year="Now" now title="voidbase">
        <p>
          Line those up and the trade is clear. Hosted and easy but not yours. Yours and open but heavy to run. Yours
          and light to run but stuck on one machine.
        </p>
        <p>
          voidbase is PocketBase's API running on Cloudflare, deployed into your own Cloudflare account with one
          command. The development side is PocketBase's and unchanged: the same admin panel, the same client SDK, the
          same hooks, the same collections and API rules. The hosting side is Cloudflare's: the code runs in every
          region Cloudflare has, the database is D1, the files are in R2, and there is no machine in the picture.
        </p>
        <p>
          What that buys is the part we care about. The account is yours, so the bill, the data and the domain are
          yours, and nobody can price you out of your own backend or turn it off. Setup is still one command, because
          provisioning is the deploy: the database, the bucket, the queue and the realtime object are created on the
          first run. You get the ownership without paying for it in operations.
        </p>
      </Era>

      <h2>Why we think this is the last one</h2>
      <p>
        Every step above moved along one axis: who runs the thing, and how much running it costs you in attention.
        Google runs it and it is trivial. You can run it, and it is hard. You run it, it is easy, and it is one box.
      </p>
      <p>
        That axis has an end, and this is what the end looks like. The account is yours and there is no server to
        operate, because there is no server. There is no next move that takes back more ownership, since you already
        have all of it, and no next move that removes more operations, since there are none left to remove.
      </p>
      <p>
        The shape of the bill changes too, in the direction that matters for small projects. An idle instance costs
        nothing, because Workers bill per request and CPU time rather than by the hour. Reading files back out costs
        nothing, because R2 has no egress charge. A project with no users is free, and a project with users pays for
        the users.
      </p>

      <h2>What would prove us wrong</h2>
      <p>
        Worth saying, because a claim nothing could disprove is not worth much. This argument fails if the platform
        turns out to be the new lock-in, and the honest answer is that it partly is: D1 and R2 are Cloudflare's, and
        moving off them is work. What is different is that the account is yours from the first deploy, the data
        exports as SQLite and files, and the API is PocketBase's, so the thing you would move to already exists and
        already runs your code.
      </p>
      <p>
        It also fails if the limits bite. They are real and we write them down rather than hide them: no interactive
        transactions, 100 bound parameters per statement, a CPU ceiling per request. Those are on{" "}
        <a href="https://github.com/voidbase-cloud/voidbase/blob/master/docs/differences.md" target="_blank" rel="noreferrer noopener">
          the differences page
        </a>
        , and if one of them is disqualifying for you, PocketBase on a server is a good answer and we will say so.
        The first two have a plan on <Link href="/docs/roadmap">the roadmap</Link>. The CPU ceiling is the
        platform's, and it is staying.
      </p>

      <h2>Against the others, one at a time</h2>
      <p>
        Each of these asks the same questions in a table and gives a straight answer about when to pick the other
        one. Every page says what the other product does better first, because a comparison that finds no faults is
        an advertisement.
      </p>
      <div className="docs-cards">
        {comparisons.map((c) => (
          <Link key={c.href} href={c.href} className="docs-card">
            <strong>
              <ProductMark id={c.href.split("/").pop()!} size={18} /> {c.title.replace("Compared to ", "")}
            </strong>
            <span>{c.summary}</span>
          </Link>
        ))}
      </div>
    </article>
  );
}
