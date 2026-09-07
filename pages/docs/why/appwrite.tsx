import ProductMark from "@/components/ProductMark";
import Versus from "@/components/Versus";
import "@/scss/why.scss";

export default function VsAppwrite() {
  return (
    <article className="why">
      <span className="why-eyebrow">Compared to</span>
      <div className="why-marks">
        <ProductMark id="voidbase" size={40} />
        <span className="why-vs">vs</span>
        <ProductMark id="appwrite" size={40} />
      </div>
      <h1>voidbase compared to Appwrite</h1>
      <p className="docs-lead">
        Appwrite puts more in the box than voidbase does. voidbase asks less of the machine it runs on, because it
        does not have one.
      </p>

      <Versus
        other="Appwrite"
        logo={<ProductMark id="appwrite" size={18} />}
        rows={[
          { q: "Source", vb: ["yes", "Open, MIT."], them: ["yes", "Open, BSD 3-clause."] },
          { q: "Self-host", vb: ["yes", "One command into your Cloudflare account."], them: ["depends", "Docker, running several containers together."] },
          { q: "What you operate", vb: ["yes", "Nothing."], them: ["no", "The containers, their database, and the host they sit on."] },
          { q: "Server logic", vb: ["no", "JavaScript hooks and endpoints. One language."], them: ["yes", "Functions in many languages, each in its own container."] },
          { q: "Isolation of that code", vb: ["depends", "Hooks run inside the instance. Faster, less isolated."], them: ["yes", "Each function in its own container."] },
          { q: "In the box", vb: ["depends", "Auth, database, files, realtime, jobs, admin panel."], them: ["yes", "The same, plus messaging and more sign-in methods."] },
          { q: "Runs anywhere", vb: ["no", "Cloudflare, or a local process. Not an air-gapped host."], them: ["yes", "Any Linux host with Docker, including one with no internet."] },
          { q: "Where it runs", vb: ["yes", "Every Cloudflare region."], them: ["depends", "Wherever you put the host, or their cloud."] },
          { q: "Cost when idle", vb: ["yes", "Nothing."], them: ["no", "The host runs whether or not anyone visits."] },
        ]}
      />

      <h2>What Appwrite does better</h2>
      <p>
        Breadth. Functions run in a long list of languages, not only JavaScript, so a team with Python or Go can
        bring it. Messaging, more sign-in methods and a larger console come as part of the product rather than
        something you wire up.
      </p>
      <p>
        Isolation. Each function runs in its own container, so one of them looping does not affect the others.
        voidbase runs your hooks inside the instance, which is faster and less isolated.
      </p>
      <p>
        And it does not care where it runs. Any Linux host with Docker will do, including one with no internet, which
        matters when the data is not allowed to leave the building.
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
        Compatibility with something else. voidbase speaks PocketBase's API, so the client libraries, the admin panel
        and the documentation already exist and are not ours. Appwrite's API is Appwrite's.
      </p>

      <div className="why-picks">
        <div className="why-pick is-them">
          <h3>Pick Appwrite if</h3>
          <p>
            You need functions in a language other than JavaScript, or you want the extra services in one place, or
            the deployment has to be a machine you can point at.
          </p>
        </div>
        <div className="why-pick is-us">
          <h3>Pick voidbase if</h3>
          <p>
            You want the same category of product with nothing to operate, and JavaScript hooks are enough server
            logic for what you are building.
          </p>
        </div>
      </div>
    </article>
  );
}
