// The CLI path: instances as things you name, make and throw away, locally or on Cloudflare. "Local" is kept
// deliberately loose, because the same commands are what a laptop, a container and a bundled desktop app all use.
import CodeBlock from "@/components/CodeBlock";
import { hl } from "@/lib/hl";
import Updating from "@/components/Updating";
import "@/scss/updating.scss";

const INSTALL = hl.bash`bun i -g @voidbase-cloud/voidbase      # or: npm i -g @voidbase-cloud/voidbase
voidbase version`;

const LOCAL_NEW = hl.bash`voidbase local new blog`;

const LOCAL_NEW_OUT = hl.bash`created "blog" in ~/.voidbase/instances/blog (pb_hooks/main.pb.js, .gitignore, pb_secrets/main.ts)
superuser admin@example.com / k3f8s2m1qzA1

next: voidbase local start blog   (the API on 8090, the panel at http://127.0.0.1:8090/_/)`;

const LOCAL_LS = hl.bash`voidbase local ls`;

const LOCAL_LS_OUT = hl.bash`3 local instance(s), from ~/.voidbase/instances.json:
  blog                 :8090   running      2 MB  ~/.voidbase/instances/blog
  shop                 :8091   stopped    941 kB  ~/.voidbase/instances/shop
  workshop             :8092   stopped     14 MB  ~/.voidbase/instances/workshop`;

const LOCAL_RM = hl.bash`voidbase local rm workshop            # forget it, keep the data
voidbase local rm workshop --purge    # and delete the directory, after typing the name back`;

const TOKEN = hl.bash`voidbase token                        # prints the link that creates the token
export VOIDBASE_DEPLOY_CF_API_KEY=...   # paste it here`;

const CLOUD = hl.bash`voidbase deploy --name blog-api
voidbase deploy --name blog-api --domain api.example.com`;

const CLOUD_LS = hl.bash`voidbase instances`;

const CLOUD_LS_OUT = hl.bash`3 instance(s) on Example Ltd:
  blog-api                         release 0.7.0  updated 2026-09-08
  staging-api                      release 0.7.0  updated 2026-09-04
  workshop-demo                    release 0.6.2  updated 2026-08-30`;

const DESTROY = hl.bash`voidbase destroy workshop-demo`;

const UPDATE = hl.bash`voidbase update`;

export default function DocsNpm() {
  return (
    <>
      <h1>Instances from the CLI</h1>
      <p className="docs-lead">
        One command line, no repository, no code. Instances are things you make when you need one and delete when you
        do not, locally or in your own Cloudflare account, with the same commands for each.
      </p>

      <CodeBlock {...INSTALL} />

      <h2>Local instances</h2>
      <p>
        This is the same job the <a href="/docs/run/standalone">standalone executable</a> does, for people who would
        rather install from npm than download a binary. The difference is that it remembers what you have made, so a
        second instance does not mean finding where you put the first.
      </p>
      <p>
        Local means wherever the CLI is running. That is usually a laptop, but it is just as often a container in a
        compose file, a CI job that needs a real backend for its tests, or a desktop app that ships voidbase inside
        it. Nothing here talks to Cloudflare and none of it needs an account.
      </p>
      <CodeBlock {...LOCAL_NEW} />
      <CodeBlock {...LOCAL_NEW_OUT} />
      <p>
        The instance is a directory holding its own database, hooks and configuration, and a row in{" "}
        <code>~/.voidbase/instances.json</code> recording its name and port. Nothing is sent anywhere. Set{" "}
        <code>VOIDBASE_HOME</code> and both the registry and the default directory move with it, which is what an
        image or an app bundle wants. Pass{" "}
        <code>--dir</code> to put it where you want it, <code>--port</code> to pick the port, and{" "}
        <code>--email</code> with <code>--password</code> to choose the superuser rather than have one generated.
      </p>

      <CodeBlock {...LOCAL_LS} />
      <CodeBlock {...LOCAL_LS_OUT} />
      <p>
        Each instance keeps the port it was given, so they never collide and the address stays the same between runs.{" "}
        <code>voidbase local start blog</code> runs one, and with no name it starts the first.
      </p>

      <CodeBlock {...LOCAL_RM} />
      <p>
        Removing an instance forgets it. The directory stays where it is until <code>--purge</code> says otherwise,
        and that asks you to type the name back before deleting a database.
      </p>

      <div className="alert alert-info">
        <div className="content">
          <p className="m-0">
            A local instance is the same shape as <a href="/docs/run/project">a project</a>: the same{" "}
            <code>pb_hooks</code>, <code>pb_migrations</code> and <code>pb_secrets</code>. Moving from one to the
            other is moving a directory into a repository, so nothing you write here is throwaway.
          </p>
        </div>
      </div>

      <h2>On your Cloudflare account</h2>
      <p>
        The same idea, one command further. Everything below needs one API token, and one command prints the link
        that creates it with the right permissions already selected.
      </p>
      <CodeBlock {...TOKEN} />

      <h3>Create one</h3>
      <p>Run this in an empty directory. It is not a project and it does not become one.</p>
      <CodeBlock {...CLOUD} />
      <p>
        That creates the Worker, its database, its file storage, its job queue and its realtime object, deploys the
        server into it, and prints the address. With a hostname you own on the same account, name it and the instance
        answers there as well.
      </p>
      <div className="alert alert-info">
        <div className="content">
          <p className="m-0">
            The first superuser is created with a generated password, saved to{" "}
            <code>pb_data/.superuser-credentials</code> in the directory you ran the command from. That file is the
            one thing the command leaves behind, so keep it or sign in and change the password.
          </p>
        </div>
      </div>

      <h3>See what you have</h3>
      <CodeBlock {...CLOUD_LS} />
      <CodeBlock {...CLOUD_LS_OUT} />

      <h3>Delete one</h3>
      <p>
        This takes the Worker and everything it owns: the database and its contents, the bucket and its files, the
        queue, and any custom domain pointing at it. It prints that list and waits for the name to be typed back, and
        in a script it refuses unless <code>--yes</code> says you already decided.
      </p>
      <CodeBlock {...DESTROY} />
      <div className="alert alert-warning">
        <div className="content">
          <p className="m-0">
            There is no undo and no backup is taken. Take one from the admin panel's Backups screen first if the data
            matters.
          </p>
        </div>
      </div>

      <Updating command={UPDATE}>
        <p>
          A global install reinstalls itself at the newest published version. Your local instances are directories of
          data and configuration, not copies of the program, so they are all on the new version the next time you
          start one. Nothing is migrated and nothing is lost.
        </p>
        <p>
          Instances in your Cloudflare account are the other case. Those run a copy of voidbase that was uploaded
          when you created them, so updating the CLI changes what the next deploy would carry, not what is answering
          requests. <code>voidbase deploy</code> from the same directory puts the new version live.
        </p>
      </Updating>

      <h2>When this stops being enough</h2>
      <p>
        The moment you want an endpoint of your own, a handler that runs when a record changes, or a schema you keep
        in version control rather than clicking into the panel, you want{" "}
        <a href="/docs/run/project">a voidbase project</a>. It is the same instance with a repository around it.
      </p>
    </>
  );
}
