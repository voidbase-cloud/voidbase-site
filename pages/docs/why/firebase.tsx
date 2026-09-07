import ProductMark from "@/components/ProductMark";
import Versus from "@/components/Versus";
import "@/scss/why.scss";

export default function VsFirebase() {
  return (
    <article className="why">
      <span className="why-eyebrow">Compared to</span>
      <div className="why-marks">
        <ProductMark id="voidbase" size={40} />
        <span className="why-vs">vs</span>
        <ProductMark id="firebase" size={40} />
      </div>
      <h1>voidbase compared to Firebase</h1>
      <p className="docs-lead">
        Firebase invented this category and is still the fastest way to get a mobile app talking to a database. The
        difference that matters is whose account the database is in.
      </p>

      <Versus
        other="Firebase"
        logo={<ProductMark id="firebase" size={18} />}
        rows={[
          { q: "Who owns the account", vb: ["yes", "You. It deploys into your own Cloudflare account."], them: ["no", "Google. Your project lives in theirs."] },
          { q: "Source", vb: ["yes", "Open, MIT."], them: ["no", "Closed. The client SDKs are open, the backend is not."] },
          { q: "Self-host", vb: ["yes", "It is the only mode. There is no hosted product to depend on."], them: ["no", "No. The emulator is for local development, not production."] },
          { q: "Database", vb: ["yes", "SQLite through D1. A schema, relations, and SQL underneath."], them: ["depends", "Documents, no joins, no SQL. Simpler until you need a join."] },
          { q: "Offline on the device", vb: ["planned", "Nothing built in today. A service worker that queues writes is the next piece."], them: ["yes", "Writes queue on the device and reconcile. A decade of work behind it."] },
          { q: "Client platforms", vb: ["depends", "Good JavaScript and Dart clients. Others are community built."], them: ["yes", "iOS, Android, Unity, Flutter and C++, maintained by Google."] },
          { q: "The rest of the box", vb: ["no", "A backend. No crash reporting, push or analytics."], them: ["yes", "Crashlytics, messaging, analytics and remote config, wired together."] },
          { q: "Cost when idle", vb: ["yes", "Nothing. Workers bill per request and CPU time."], them: ["depends", "Free tier, then per read, write and delete."] },
          { q: "Reading data out", vb: ["yes", "Free. R2 has no egress charge."], them: ["no", "Billed as egress."] },
          { q: "Getting out", vb: ["yes", "Export the database as SQLite and the files as files."], them: ["no", "Export works. Every query has to be rewritten."] },
        ]}
      />

      <h2>What Firebase does better</h2>
      <p>
        Offline. The Firebase SDKs cache writes on the device and reconcile them when the network comes back, and
        that has been working for a decade. If your app has to keep functioning on a train, Firebase has already
        solved a problem voidbase has not.
      </p>
      <p>
        The rest of the box, too. Crash reporting, push notifications, analytics and remote config are all there and
        all wired together. voidbase is a backend. It is not going to send you a crash report.
      </p>
      <p>
        And the client libraries reach further, across iOS, Android, Unity, Flutter and C++, maintained by Google.
        voidbase speaks PocketBase's API, which has good JavaScript and Dart clients and community ones elsewhere.
      </p>

      <h2>What voidbase does better</h2>
      <p>
        The account. Your instance is a Worker in your Cloudflare account, with your database and your bucket next
        to it. Nobody can change the terms of a product you are not a customer of.
      </p>
      <p>
        The data model. Collections have a schema, fields have types, relations expand in one request, and the filter
        language compiles to SQL. Firestore makes you shape data around the queries it can answer and denormalise
        the rest.
      </p>
      <p>
        The bill at rest. A Firestore project with no traffic still holds documents. A voidbase instance with no
        traffic runs nothing and costs nothing beyond storage.
      </p>

      <div className="why-picks">
        <div className="why-pick is-them">
          <h3>Pick Firebase if</h3>
          <p>
            Your app is mobile first and needs real offline behaviour, or you want analytics and messaging in the
            same place as the data, or your team already knows the console and would rather spend the time on the
            product.
          </p>
        </div>
        <div className="why-pick is-us">
          <h3>Pick voidbase if</h3>
          <p>
            You want the data in an account you control, or you want SQL and a real schema, or you have been
            surprised by a bill and would like the next one to come from a provider whose pricing page you can read.
          </p>
        </div>
      </div>
    </article>
  );
}
