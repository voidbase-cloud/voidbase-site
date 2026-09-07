import Versus from "@/components/Versus";

export default function VsFirebase() {
  return (
    <>
      <h1>voidbase compared to Firebase</h1>
      <p className="docs-lead">
        Firebase invented this category and is still the fastest way to get a mobile app talking to a database. The
        difference that matters is whose account the database is in.
      </p>

      <Versus
        other="Firebase"
        rows={[
          { question: "Who owns the account", voidbase: "You. It deploys into your own Cloudflare account.", other: "Google. Your project lives in theirs." },
          { question: "Database", voidbase: "SQLite, through D1. Collections with a schema, and SQL underneath.", other: "Firestore or the Realtime Database. Documents, no joins, no SQL." },
          { question: "Source", voidbase: "Open, MIT.", other: "Closed. The client SDKs are open, the backend is not." },
          { question: "Self-host", voidbase: "It is the only mode. There is no hosted product to depend on.", other: "No. The emulator is for local development, not production." },
          { question: "Cost when idle", voidbase: "Nothing. Workers bill per request and CPU time.", other: "Nothing on the free tier, then per read, write and delete." },
          { question: "Reading data out", voidbase: "Free. R2 has no egress charge.", other: "Billed as egress." },
          { question: "Getting out", voidbase: "Export the database as SQLite and the files as files.", other: "Export is possible. Every query has to be rewritten." },
          { question: "Admin interface", voidbase: "PocketBase's panel, served by your instance at /_/.", other: "The Firebase console." },
        ]}
      />

      <h2>What Firebase does better</h2>
      <p>
        Offline. The Firebase SDKs cache writes on the device and reconcile them when the network comes back, and
        that has been working for a decade. If your app has to keep functioning on a train, Firebase has already
        solved a problem voidbase has not.
      </p>
      <p>
        The rest of the box, too. Crash reporting, push notifications, analytics, A/B testing and remote config are
        all there and all wired together. voidbase is a backend. It is not going to send you a crash report.
      </p>
      <p>
        And the client libraries reach further: iOS, Android, Unity, Flutter and C++, maintained by Google. voidbase
        speaks PocketBase's API, which has good JavaScript and Dart clients and community ones elsewhere.
      </p>

      <h2>What voidbase does better</h2>
      <p>
        The account. Your instance is a Worker in your Cloudflare account, with your database and your bucket next
        to it. Nobody can change the terms of a product you are not a customer of.
      </p>
      <p>
        The data model. Collections have a schema, fields have types, relations expand in one request, and the
        filter language compiles to SQL. Firestore makes you shape data around the queries it can answer and
        denormalise the rest.
      </p>
      <p>
        The bill at rest. A Firestore project with no traffic still has documents; a voidbase instance with no
        traffic runs nothing and costs nothing beyond storage.
      </p>

      <h2>Pick Firebase if</h2>
      <p>
        Your app is mobile first and needs real offline behaviour, or you want the analytics and messaging pieces in
        the same place as the data, or your team already knows the console and you would rather spend the time on
        the product.
      </p>

      <h2>Pick voidbase if</h2>
      <p>
        You want the data in an account you control, you want SQL and a real schema, or you have been surprised by a
        bill and would like the next one to come from an infrastructure provider you can read the pricing page of.
      </p>
    </>
  );
}
