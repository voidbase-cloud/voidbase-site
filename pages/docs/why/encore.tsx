import ProductMark from "@/components/ProductMark";
import CostSection from "@/components/CostSection";
import SpeedSection from "@/components/SpeedSection";
import Versus from "@/components/Versus";
import "@/scss/why.scss";

export default function VsEncore() {
  return (
    <article className="why">
      <span className="why-eyebrow">Compared to</span>
      <div className="why-marks">
        <ProductMark id="voidbase" size={40} />
        <span className="why-vs">vs</span>
        <ProductMark id="encore" size={40} />
      </div>
      <h1>voidbase compared to Encore</h1>
      <p className="docs-lead">
        These are not the same kind of thing, which is the most useful thing to say about them. Encore is a framework
        for building a backend. voidbase is a backend. If you know which of those sentences describes what you want,
        you have your answer.
      </p>

      <Versus
        other="Encore"
        logo={<ProductMark id="encore" size={18} />}
        rows={[
          { q: "Day one", vb: ["yes", "A running backend: collections, API, auth, files, admin panel."], them: ["no", "A framework and an empty project. You write the services."] },
          { q: "Infrastructure", vb: ["yes", "Created on the first deploy: database, bucket, queue, realtime object."], them: ["yes", "Declared in your code and provisioned for you."] },
          { q: "Where it deploys", vb: ["no", "Cloudflare, and only Cloudflare."], them: ["yes", "Their cloud, or your own AWS or GCP account."] },
          { q: "Languages", vb: ["no", "JavaScript hooks."], them: ["yes", "Go and TypeScript."] },
          { q: "Several services together", vb: ["no", "One instance. No typed calls between services, no tracing across them."], them: ["yes", "Typed calls, tracing, and generated API documentation."] },
          { q: "Realtime to a browser", vb: ["yes", "Built in: subscribe to a collection over one connection."], them: ["no", "Not a feature. Pub/sub is between your services; pushing to a browser is yours to build."] },
          { q: "Admin panel for content", vb: ["yes", "PocketBase's panel, for editing data."], them: ["no", "A development dashboard. Not for content."] },
          { q: "Non-developers", vb: ["yes", "Can edit content in the panel."], them: ["no", "Everything is code."] },
          { q: "Changing the schema", vb: ["yes", "In the panel, live, or as a migration file."], them: ["no", "A code change and a deploy."] },
          { q: "Best at", vb: ["depends", "Apps whose backend is mostly data with rules around it."], them: ["depends", "Systems with real business logic, and several services of it."] },
        ]}
      />

      <h2>What Encore does better</h2>
      <p>
        Everything about writing a lot of server code. Typed calls between services, tracing across them, generated
        API documentation, a local development dashboard, and infrastructure declared next to the code that uses it.
        If you are building a system rather than an app, that is the right set of tools and voidbase does not have
        them.
      </p>
      <p>
        It also meets you where your cloud already is. If the company is on AWS with an existing account structure,
        Encore provisions into it. voidbase requires Cloudflare.
      </p>
      <p>And Go, if you want Go. voidbase's hooks are JavaScript.</p>

      <h2>What voidbase does better</h2>
      <p>
        Not writing the backend. Most applications need users, a few kinds of record, permissions, file uploads and a
        way for someone non-technical to fix a typo. voidbase has all of that before you start, and Encore expects
        you to build it.
      </p>
      <p>Time to a first working thing, which is minutes rather than days.</p>
      <p>
        And the admin panel, which is not a developer tool. It is the thing you hand to the person who edits the
        content, and a framework has no equivalent.
      </p>

      <div className="why-picks">
        <div className="why-pick is-them">
          <h3>Pick Encore if</h3>
          <p>
            The interesting part of your system is the logic, you have more than one service, and you want typed
            calls and tracing between them.
          </p>
        </div>
        <div className="why-pick is-us">
          <h3>Pick voidbase if</h3>
          <p>
            The interesting part is the product, the backend is mostly data with rules around it, and you would
            rather not write the same user table again.
          </p>
        </div>
      </div>

      <CostSection product="encore" />
      <SpeedSection product="encore" />
    </article>
  );
}
