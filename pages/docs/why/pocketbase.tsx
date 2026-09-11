import ProductMark from "@/components/ProductMark";
import CostSection from "@/components/CostSection";
import SpeedSection from "@/components/SpeedSection";
import Versus from "@/components/Versus";
import "@/scss/why.scss";

export default function VsPocketBase() {
  return (
    <article className="why">
      <span className="why-eyebrow">Compared to</span>
      <div className="why-marks">
        <ProductMark id="voidbase" size={40} />
        <span className="why-vs">vs</span>
        <ProductMark id="pocketbase" size={40} />
      </div>
      <h1>voidbase compared to PocketBase</h1>
      <p className="docs-lead">
        This is the odd one out, because voidbase is PocketBase's API. The admin panel is PocketBase's, unmodified.
        The SDK is PocketBase's, unmodified. The question is not which API you want. It is whether you want a
        machine.
      </p>

      <Versus
        other="PocketBase"
        logo={<ProductMark id="pocketbase" size={18} />}
        rows={[
          { q: "API, panel, SDK", vb: ["yes", "PocketBase's."], them: ["yes", "PocketBase's."] },
          { q: "You operate", vb: ["yes", "Nothing."], them: ["no", "The machine: TLS, restarts, backups, disk, upgrades."] },
          { q: "Where it runs", vb: ["yes", "Every Cloudflare region, wherever the request lands."], them: ["depends", "One machine in one place. Everyone else pays the round trip."] },
          { q: "Scaling", vb: ["yes", "Per request, automatically."], them: ["no", "A bigger machine, and a restart."] },
          { q: "Realtime", vb: ["depends", "A durable object holds the sockets and pushes changes. One hop more, and it is not bounded by one machine."], them: ["yes", "Pushed straight from memory in the same process. Nothing is faster than that."] },
          { q: "Transactions", vb: ["depends", "A batch is one transaction, rolled back on the first error, with VOIDBASE_DATABASE=durable. On D1 it is validation then an atomic batch. A hook cannot open an interactive one either way."], them: ["yes", "Real and interactive."] },
          { q: "Database limits", vb: ["no", "100 bound parameters per statement, 100 columns per table. Measured on D1 and on the Durable Object alike; they are SQLite's on Cloudflare."], them: ["yes", "SQLite's own, which you will not reach."] },
          { q: "Maturity", vb: ["no", "A reimplementation of the wire protocol. A reimplementation is where bugs live."], them: ["yes", "The original, maintained for years."] },
          { q: "Trying it", vb: ["depends", "A local process, or one command to deploy."], them: ["yes", "Download one file and run it."] },
          { q: "Cost when idle", vb: ["yes", "Nothing."], them: ["depends", "The machine bills whether or not anyone visits."] },
        ]}
      />

      <h2>What PocketBase does better</h2>
      <p>
        It has no platform limits, because there is no platform. Interactive transactions work; in voidbase a batch is
        a real transaction only with the Durable Object database, and a hook still cannot open one of its own. A
        statement binds as many parameters as SQLite allows rather than 100. A table has 2000 columns rather than
        100. A request takes as long as it takes, so resizing a very large image is not a question of CPU budget. All
        of it is written down on{" "}
        <a href="https://github.com/voidbase-cloud/voidbase/blob/master/docs/differences.md" target="_blank" rel="noreferrer noopener">
          the differences page
        </a>
        , and if one of those lines is a problem for your data, PocketBase is the better answer.
      </p>
      <p>
        It is also one binary written by people who have maintained it for years, and voidbase is a reimplementation
        of its wire protocol. We test against the real thing to keep that honest, and the original still has fewer
        moving parts.
      </p>
      <p>And if you already have a server, PocketBase costs nothing extra to run on it.</p>

      <h2>What voidbase does better</h2>
      <p>
        There is no machine. No certificate to renew, no restart after a kernel update, no backup script you wrote
        once and never tested, and no pager at 3am because a disk filled up.
      </p>
      <p>
        Distance. PocketBase is in one region by construction and everyone else pays the round trip. voidbase runs
        wherever the request lands.
      </p>
      <p>
        Load. One PocketBase handles a lot, until it does not, and then the answer is a bigger box. Workers add
        capacity per request without being asked.
      </p>

      <h2>Moving between them</h2>
      <p>
        Both directions work, because both speak the same API. Export the collections as JSON and import them on the
        other side, and your hooks and migrations come across as files. What does not transfer is a backup archive,
        since the two store them differently. Migrate with export and import, not by copying a backup.
      </p>

      <div className="why-picks">
        <div className="why-pick is-them">
          <h3>Pick PocketBase if</h3>
          <p>
            You need interactive transactions, or you have a server you are happy operating, or you would rather run
            the original than a reimplementation of it.
          </p>
        </div>
        <div className="why-pick is-us">
          <h3>Pick voidbase if</h3>
          <p>You like PocketBase and do not want the machine that comes with it.</p>
        </div>
      </div>

      <CostSection product="pocketbase" />
      <SpeedSection product="pocketbase" />
    </article>
  );
}
