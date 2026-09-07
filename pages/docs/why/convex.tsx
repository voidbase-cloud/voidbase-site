import ProductMark from "@/components/ProductMark";
import Versus from "@/components/Versus";
import "@/scss/why.scss";

export default function VsConvex() {
  return (
    <article className="why">
      <span className="why-eyebrow">Compared to</span>
      <div className="why-marks">
        <ProductMark id="voidbase" size={40} />
        <span className="why-vs">vs</span>
        <ProductMark id="convex" size={40} />
      </div>
      <h1>voidbase compared to Convex</h1>
      <p className="docs-lead">
        These two disagree about where your backend code lives. Convex says you write functions and it runs them.
        voidbase says you get an API, and you write code only where the API is not enough.
      </p>

      <Versus
        other="Convex"
        logo={<ProductMark id="convex" size={18} />}
        rows={[
          { q: "Day one", vb: ["yes", "A working CRUD API, auth, files and an admin panel before you write anything."], them: ["no", "Nothing until you write the functions."] },
          { q: "How the client reads data", vb: ["depends", "A generated REST API over your collections, with filters and relations."], them: ["depends", "TypeScript query functions you write, called by name."] },
          { q: "Realtime", vb: ["depends", "Subscribe to a collection. You decide what to do with a change."], them: ["yes", "Every query is reactive and recomputes when its inputs change."] },
          { q: "Types", vb: ["no", "The SDK is typed. Collections are runtime data, so a rename breaks at the call."], them: ["yes", "End to end TypeScript. A rename breaks the build."] },
          { q: "Transactions", vb: ["no", "None. Writes validate, then run as one atomic batch."], them: ["yes", "Real, and the mutation model is built on them."] },
          { q: "Changing the schema", vb: ["yes", "In the panel, live, with no deploy."], them: ["no", "A code change and a deploy."] },
          { q: "Non-developers", vb: ["yes", "Can edit content in the admin panel."], them: ["no", "Everything is code."] },
          { q: "Where it runs", vb: ["yes", "Your Cloudflare account, every region."], them: ["depends", "Their cloud, or a backend you host yourself."] },
          { q: "Cost when idle", vb: ["yes", "Nothing."], them: ["depends", "Free tier, then usage."] },
        ]}
      />

      <h2>What Convex does better</h2>
      <p>
        Reactivity, done properly. A query is a function, Convex tracks what it read, and when any of that changes it
        recomputes and pushes the new result. You never write subscription logic or work out which events invalidate
        which screen. voidbase gives you record-level subscriptions and leaves the rest to you.
      </p>
      <p>
        Types all the way through. Your schema, your functions and your components share one TypeScript definition,
        and a rename breaks the build. voidbase's collections are data, edited at runtime, so a rename breaks at the
        call instead.
      </p>
      <p>
        And transactions. Convex mutations are transactional by design, which removes a class of bug that voidbase's
        batch model can only mostly remove.
      </p>

      <h2>What voidbase does better</h2>
      <p>
        You start with a backend rather than a blank file. Collections, an API, auth, file handling and an admin
        panel are there before you write a line.
      </p>
      <p>
        The schema changes without shipping code. Add a field in the panel and it is live. In Convex that is a code
        change and a deploy, which is right for some teams and wrong for a content-shaped app.
      </p>
      <p>
        And the account is yours from the first command, with the database and the files in it, on infrastructure
        whose pricing page you can read.
      </p>

      <div className="why-picks">
        <div className="why-pick is-them">
          <h3>Pick Convex if</h3>
          <p>
            You are building a TypeScript app where most screens are live views of changing data, and you would
            rather write functions than model collections.
          </p>
        </div>
        <div className="why-pick is-us">
          <h3>Pick voidbase if</h3>
          <p>
            You want a working backend on day one, an admin panel other people can use, and a schema that is data
            rather than code.
          </p>
        </div>
      </div>
    </article>
  );
}
