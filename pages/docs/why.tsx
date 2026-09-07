// The history page. Short, and honest about the claim at the end.
import { Link } from "@void/react";
import { DOCS_NAV } from "@/lib/docsNav";

export default function DocsWhy() {
  const section = DOCS_NAV.find((s) => s.href === "/docs/why");
  const comparisons = (section?.children ?? []).filter((c) => c.href !== "/docs/why");

  return (
    <>
      <h1>Why another BaaS??!?!?</h1>
      <p className="docs-lead">
        Fair question. Four backends in fourteen years, and each one answered the same question better than the last.
        The question was never what a backend should do. Everyone settled that by about 2012. It was who runs it, and
        whether you can leave.
      </p>

      <h2>2011, Firebase</h2>
      <p>
        Firebase came out of a chat widget. The founders had built a chat product, watched people push data through
        it that had nothing to do with chat, and sold the data sync instead.
      </p>
      <p>
        It solved a real thing. Before it, a phone app that needed a database needed a server, and you wrote that
        server. After it, the phone talked to the database, updates arrived as they happened, login worked, and there
        was no server. That is a lot of work to delete.
      </p>
      <p>
        The price was the account. The database was Google's, in Google's project, reached through a query language
        only Google's product spoke. Leaving meant rewriting the data layer and every query in it.
      </p>

      <h2>2020, Supabase</h2>
      <p>
        Supabase put the objection in its own tagline and called itself the open source Firebase alternative.
        Postgres in the middle, an API generated from your schema, and auth, storage and realtime around it.
      </p>
      <p>
        It solved the query language and the licence in one move. You get SQL, joins, indexes, extensions and
        row-level security, on a database that has been around since the nineties, under a licence nobody can revoke.
      </p>
      <p>
        The price was operations. Self-hosting Supabase means running Postgres and a handful of services around it,
        keeping them upgraded and backed up, and being the person paged when one of them stops. It is documented and
        people do it. The easy path is still the hosted one, which is where most projects end up.
      </p>

      <h2>2022, PocketBase</h2>
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
        TLS certificate, the restarts, the backups, the disk filling up at 3am, and the fact that everyone far away
        from that one region waits longer than everyone near it.
      </p>

      <h2>Now, voidbase</h2>
      <p>
        Line those up and the trade is clear. Hosted and easy but not yours. Yours and open but heavy to run. Yours
        and light to run but stuck on one machine.
      </p>
      <p>
        voidbase is PocketBase's API running on Cloudflare, deployed into your own Cloudflare account with one
        command. The development side is PocketBase's and unchanged: the same admin panel, the same client SDK, the
        same hooks, the same collections and API rules. The hosting side is Cloudflare's: the code runs in every
        region Cloudflare has, the database is D1, the files are in R2, and there is no machine anywhere in the
        picture.
      </p>
      <p>
        What that buys is the part we care about. The account is yours, so the bill, the data and the domain are
        yours, and nobody can price you out of your own backend or turn it off. Setup is still one command, because
        provisioning is the deploy: the database, the bucket, the queue and the realtime object are created on the
        first run. You get the ownership without paying for it in operations.
      </p>

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
        The shape of the bill changes too, and in the direction that matters for small projects. An idle instance
        costs nothing, because Workers bill per request and CPU time rather than by the hour. Reading files back out
        costs nothing, because R2 has no egress charge. A project with no users is free, and a project with users
        pays for the users.
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
      </p>

      <h2>Against the others, one at a time</h2>
      <p>Each of these has a table and a straight answer about when to pick the other one.</p>
      <div className="docs-cards">
        {comparisons.map((c) => (
          <Link key={c.href} href={c.href} className="docs-card">
            <strong>{c.title}</strong>
            <span>{c.summary}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
