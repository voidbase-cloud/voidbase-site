// "Coming from", on each of the three pages that put a running instance into a repository.
//
// The three destinations share one operation and differ only at the end, so what changes between them is not worth
// three copies of this. What does change is where the instance you already have is, because that decides how the
// export reaches it: a directory on disk, an instance the CLI knows by name, or an address and a password.
import CodeBlock from "@/components/CodeBlock";
import { hl } from "@/lib/hl";

const LOCAL = hl.bash`voidbase local ls                    # the name and port of each one
voidbase local start blog            # if it is not already running`;

export default function TrackFrom() {
  return (
    <div className="track-from">
      <h2>Where the instance you have is</h2>
      <p>
        Every step below reaches it the same way, over the API with a superuser. What differs is the address.
      </p>

      <h3>Downloaded the executable</h3>
      <p>
        It is serving a directory on this machine, so the address is the one it printed:{" "}
        <code>http://127.0.0.1:8090</code> unless you changed it. Leave it running while you work.
      </p>

      <h3>Made it with the CLI</h3>
      <p>The CLI knows it by name and can tell you its port.</p>
      <CodeBlock {...LOCAL} />

      <h3>On Cloudflare, or on voidbase cloud</h3>
      <p>
        The address is the Worker's, and the superuser is the one you were given when it was created. Nothing has to
        be running locally for this: export reads it over the network like any other client.
      </p>
    </div>
  );
}
