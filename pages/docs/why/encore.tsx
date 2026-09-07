import Versus from "@/components/Versus";

export default function VsEncore() {
  return (
    <>
      <h1>voidbase compared to Encore</h1>
      <p className="docs-lead">
        These are not really the same kind of thing, which is the most useful thing to say about them. Encore is a
        framework for building a backend. voidbase is a backend. If you already know which sentence describes what
        you want, you already have your answer.
      </p>

      <Versus
        other="Encore"
        rows={[
          { question: "What you get on day one", voidbase: "A running backend: collections, API, auth, files, admin panel.", other: "A framework and an empty project. You write the services." },
          { question: "Who defines the API", voidbase: "Your collections do. The API is generated from them.", other: "You do, as typed functions in Go or TypeScript." },
          { question: "Infrastructure", voidbase: "Created on the first deploy: database, bucket, queue, realtime object.", other: "Declared in your code and provisioned by Encore." },
          { question: "Where it deploys", voidbase: "Your Cloudflare account.", other: "Their cloud, or your own AWS or GCP account." },
          { question: "Admin interface", voidbase: "PocketBase's panel, for editing data.", other: "A development dashboard, with tracing and API docs." },
          { question: "Non-developers", voidbase: "Can edit content in the panel.", other: "Cannot. Everything is code." },
          { question: "Changing the schema", voidbase: "In the panel, live, or as a migration file.", other: "A code change and a deploy." },
          { question: "Best at", voidbase: "Apps whose backend is mostly data with rules around it.", other: "Services with real business logic and several of them." },
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
      <p>
        And Go, if you want Go. voidbase's hooks are JavaScript.
      </p>

      <h2>What voidbase does better</h2>
      <p>
        Not writing the backend. Most applications need users, a few kinds of record, permissions, file uploads and
        a way for someone non-technical to fix a typo. voidbase has all of that before you start, and Encore expects
        you to build it.
      </p>
      <p>
        Time to first working thing, which is minutes rather than days.
      </p>
      <p>
        And the admin panel, which is not a developer tool. It is the thing you give to the person who edits the
        content, and there is no equivalent in a framework.
      </p>

      <h2>Pick Encore if</h2>
      <p>
        The interesting part of your system is the logic, you have more than one service, and you want typed calls
        and tracing between them.
      </p>

      <h2>Pick voidbase if</h2>
      <p>
        The interesting part is the product, the backend is mostly data with rules around it, and you would rather
        not write the same user table again.
      </p>
    </>
  );
}
