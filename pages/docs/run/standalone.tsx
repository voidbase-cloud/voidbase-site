// The shortest path to a running instance: one file, no toolchain.
import CodeBlock from "@/components/CodeBlock";

const RUN = `./voidbase superuser upsert you@example.com your-password
./voidbase serve`;

const OUTPUT = `Server started at http://127.0.0.1:8090
├─ REST API:  http://127.0.0.1:8090/api/
└─ Dashboard: http://127.0.0.1:8090/_/`;

export default function DocsStandalone() {
  return (
    <>
      <h1>Standalone executable</h1>
      <p className="docs-lead">
        One file that contains the server, the admin panel and everything it needs. Nothing is installed, and this is
        the one page here that needs neither npm nor bun.
      </p>

      <ol className="docs-steps">
        <li>
          <p>
            <strong>Download the archive for your platform</strong> from the{" "}
            <a href="https://github.com/voidbase-cloud/voidbase/releases" target="_blank" rel="noreferrer noopener">
              releases page
            </a>
            : <code>voidbase_&lt;version&gt;_&lt;os&gt;_&lt;arch&gt;.zip</code>, built for Linux, macOS and Windows on
            both amd64 and arm64, with musl builds for Alpine.
          </p>
        </li>
        <li>
          <p>
            <strong>Unzip it.</strong> Inside is a single executable with the admin panel, the system migrations and
            the hook typings already in it.
          </p>
        </li>
        <li>
          <p>
            <strong>Make the first account and start it.</strong> The password wants eight characters or more, which
            is what the panel will ask for later.
          </p>
          <CodeBlock language="bash" content={RUN} />
        </li>
      </ol>

      <p>It prints where it is:</p>
      <CodeBlock language="bash" content={OUTPUT} />

      <p>
        Open the dashboard, sign in with the account you just made, and you have an instance. Design a collection in
        the panel and it is immediately available over the API, which is what{" "}
        <a href="/docs/connect/sdk">the SDK page</a> connects to.
      </p>

      <h2>Where the data is</h2>
      <p>
        Everything the instance owns lives in a <code>pb_data/</code> directory beside the executable: the database,
        the uploaded files, and the generated typings that make editing hooks autocomplete. Copy that directory and
        you have copied the instance; delete it and you have a new one.
      </p>

      <h2>On a server</h2>
      <p>
        <code>--http 0.0.0.0:8090</code> makes it reachable from other machines. Put something that terminates TLS in
        front of it before doing that on the open internet, and run it under whatever keeps services alive on your
        system.
      </p>
      <p>
        <code>./voidbase update</code> fetches the newest release for your platform, checks it against the published
        checksum and replaces the executable in place. <code>--backup</code> zips <code>pb_data</code> first.
      </p>

      <div className="alert alert-info">
        <div className="content">
          <p className="m-0">
            To add server-side behaviour, put JavaScript in a <code>pb_hooks/</code> directory beside the executable.{" "}
            <a href="/docs/run/project">What is in a project</a> explains that directory and the others.
          </p>
        </div>
      </div>
    </>
  );
}
