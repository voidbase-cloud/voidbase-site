import Versus from "@/components/Versus";

export default function VsPocketBase() {
  return (
    <>
      <h1>voidbase compared to PocketBase</h1>
      <p className="docs-lead">
        This is the odd one out, because voidbase is PocketBase's API. The admin panel is PocketBase's, unmodified.
        The SDK is PocketBase's, unmodified. The question is not which API you want. It is whether you want a
        machine.
      </p>

      <Versus
        other="PocketBase"
        rows={[
          { question: "API, panel, SDK", voidbase: "PocketBase's.", other: "PocketBase's." },
          { question: "Runs on", voidbase: "Cloudflare Workers, in every region.", other: "One process on one machine." },
          { question: "Database", voidbase: "D1, with the limits below.", other: "A SQLite file on local disk." },
          { question: "Transactions", voidbase: "None. Writes validate, then run as one atomic batch.", other: "Real, interactive." },
          { question: "You operate", voidbase: "Nothing.", other: "The machine: TLS, restarts, backups, disk, upgrades." },
          { question: "Scaling", voidbase: "Per request, automatically.", other: "A bigger machine." },
          { question: "Hooks", voidbase: "The same JavaScript, compiled into the Worker on deploy.", other: "The same JavaScript, or Go, reloaded on restart." },
          { question: "Trying it", voidbase: "A local process, or one command to deploy.", other: "Download one file and run it." },
        ]}
      />

      <h2>What PocketBase does better</h2>
      <p>
        It has no platform limits, because there is no platform. Interactive transactions work. A statement can bind
        as many parameters as SQLite allows rather than 100. A table can have 2000 columns rather than 100. A request
        can take as long as it takes, so resizing a very large image is not a question of CPU budget. All of that is
        written down on the{" "}
        <a href="https://github.com/voidbase-cloud/voidbase/blob/master/docs/differences.md" target="_blank" rel="noreferrer noopener">
          differences page
        </a>
        , and if one of those lines is a problem for your data, PocketBase is the better answer.
      </p>
      <p>
        It is also one binary written by people who have been maintaining it for years, and voidbase is a
        reimplementation of its wire protocol. A reimplementation is a place bugs live. We test against the real
        thing to keep that honest, and the original still has fewer moving parts.
      </p>
      <p>
        And if you already have a server, PocketBase costs nothing extra to run on it.
      </p>

      <h2>What voidbase does better</h2>
      <p>
        There is no machine. No certificate to renew, no restart after a kernel update, no backup script you wrote
        once and never tested, and no pager at 3am because a disk filled up.
      </p>
      <p>
        Distance. PocketBase is in one region by construction, and everyone else pays the round trip. voidbase runs
        wherever the request lands.
      </p>
      <p>
        Load. One PocketBase handles a lot, until it does not, and then the answer is a bigger box and a restart.
        Workers add capacity per request without being asked.
      </p>

      <h2>Moving between them</h2>
      <p>
        Both directions work, because both speak the same API. Export the collections as JSON and import them on the
        other side, and your hooks and migrations come across as files. What does not transfer is a backup archive,
        since the two store them differently. Migrate with export and import, not by copying a backup.
      </p>

      <h2>Pick PocketBase if</h2>
      <p>
        You need transactions, or you have a server you are happy operating, or you would rather run the original
        than a reimplementation of it.
      </p>

      <h2>Pick voidbase if</h2>
      <p>
        You like PocketBase and do not want the machine that comes with it.
      </p>
    </>
  );
}
