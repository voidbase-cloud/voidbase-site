import Versus from "@/components/Versus";

export default function VsAppwrite() {
  return (
    <>
      <h1>voidbase compared to Appwrite</h1>
      <p className="docs-lead">
        Appwrite puts more in the box than voidbase does. voidbase asks less of the machine it runs on, because it
        does not have one.
      </p>

      <Versus
        other="Appwrite"
        rows={[
          { question: "Source", voidbase: "Open, MIT.", other: "Open, BSD 3-clause." },
          { question: "Self-host", voidbase: "One command into your Cloudflare account.", other: "Docker, running several containers together." },
          { question: "What you operate", voidbase: "Nothing.", other: "The containers, their database, and the host they sit on." },
          { question: "Database", voidbase: "SQLite, through D1.", other: "MariaDB, behind Appwrite's own document API." },
          { question: "Server logic", voidbase: "Hooks and endpoints in JavaScript, inside the instance.", other: "Functions in many languages, each in its own container." },
          { question: "In the box", voidbase: "Auth, database, files, realtime, jobs, admin panel.", other: "The same, plus messaging, and more auth methods." },
          { question: "Where it runs", voidbase: "Every Cloudflare region.", other: "Wherever you put the host, or their cloud." },
          { question: "Cost when idle", voidbase: "Nothing.", other: "The host runs whether or not anyone visits." },
        ]}
      />

      <h2>What Appwrite does better</h2>
      <p>
        Breadth. Functions run in a long list of languages, not only JavaScript, so a team with Python or Go code can
        bring it. Messaging, more sign-in methods and a larger console come as part of the product rather than
        something you wire up.
      </p>
      <p>
        Isolation. Each function runs in its own container, so one of them looping does not affect the others.
        voidbase runs your hooks inside the instance, which is faster and less isolated.
      </p>
      <p>
        And it does not care where it runs. Any Linux host with Docker will do, including one with no internet, which
        matters if your data is not allowed to leave the building.
      </p>

      <h2>What voidbase does better</h2>
      <p>
        Setup, by a wide margin. A voidbase instance is one command and no host. Appwrite self-hosted is a set of
        containers, a database to back up, and a machine to keep patched.
      </p>
      <p>
        Cost shape. A container host bills by the hour. A Worker bills per request, so a project nobody is using
        costs nothing.
      </p>
      <p>
        Compatibility with something else. voidbase speaks PocketBase's API, so the client libraries, the admin
        panel and the documentation already exist and are not ours. Appwrite's API is Appwrite's.
      </p>

      <h2>Pick Appwrite if</h2>
      <p>
        You need functions in a language other than JavaScript, or you want the extra services in one place, or the
        deployment has to be a machine you can point at.
      </p>

      <h2>Pick voidbase if</h2>
      <p>
        You want the same category of product with nothing to operate, and JavaScript hooks are enough server logic
        for what you are building.
      </p>
    </>
  );
}
