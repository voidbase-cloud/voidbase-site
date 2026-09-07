import Versus from "@/components/Versus";

export default function VsConvex() {
  return (
    <>
      <h1>voidbase compared to Convex</h1>
      <p className="docs-lead">
        These two disagree about where your backend code lives. Convex says you write functions and it runs them.
        voidbase says you get an API and only write code where the API is not enough.
      </p>

      <Versus
        other="Convex"
        rows={[
          { question: "How the client reads data", voidbase: "A generated REST API over your collections, with filters and relations.", other: "TypeScript query functions you write, called by name." },
          { question: "Realtime", voidbase: "Subscribe to a collection. Changes arrive over one connection.", other: "Every query is reactive. Its result updates when its inputs do." },
          { question: "Types", voidbase: "The API is typed by the client SDK. Hooks are JavaScript.", other: "End to end TypeScript, from schema to component." },
          { question: "Transactions", voidbase: "None. Writes validate, then run as one atomic batch.", other: "Real, and the mutation model is built on them." },
          { question: "Admin interface", voidbase: "PocketBase's panel, served by your instance.", other: "Their dashboard." },
          { question: "Where it runs", voidbase: "Your Cloudflare account, every region.", other: "Their cloud, or a backend you host yourself." },
          { question: "Cost when idle", voidbase: "Nothing.", other: "Free tier, then usage." },
          { question: "Day one", voidbase: "A working CRUD API and an admin panel before you write anything.", other: "Nothing until you write the functions." },
        ]}
      />

      <h2>What Convex does better</h2>
      <p>
        Reactivity, done properly. A query is a function, Convex tracks what it read, and when any of that changes it
        recomputes and pushes the new result. You never write subscription logic or think about which events invalidate
        which screen. voidbase gives you record-level subscriptions and leaves the rest to you.
      </p>
      <p>
        Types all the way through. Your schema, your functions and your React components share one TypeScript
        definition, and a rename breaks the build. voidbase's collections are data, edited at runtime, so a rename
        breaks at the call instead.
      </p>
      <p>
        And transactions. Convex mutations are transactional by design, which removes a whole class of bug that
        voidbase's batch model can only mostly remove.
      </p>

      <h2>What voidbase does better</h2>
      <p>
        You start with a backend rather than a blank file. Collections, an API, auth, file handling and an admin
        panel are there before you write a line, and non-developers can edit content in the panel without a deploy.
      </p>
      <p>
        The schema changes without shipping code. Add a field in the panel and it is live. In Convex that is a code
        change and a deploy, which is the right answer for some teams and the wrong one for a content-shaped app.
      </p>
      <p>
        And the account is yours from the first command, with the database and files in it, on infrastructure whose
        pricing page you can read.
      </p>

      <h2>Pick Convex if</h2>
      <p>
        You are building a TypeScript app where most screens are live views of changing data, and you would rather
        write functions than model collections.
      </p>

      <h2>Pick voidbase if</h2>
      <p>
        You want a working backend on day one, an admin panel other people can use, and a schema that is data rather
        than code.
      </p>
    </>
  );
}
