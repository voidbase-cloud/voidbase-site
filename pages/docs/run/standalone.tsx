// The shortest path to a running instance: one file, no toolchain. Real commands, copy-paste-able.
import CodeBlock from "@/components/CodeBlock";
import { hl } from "@/lib/hl";
import Updating from "@/components/Updating";
import "@/scss/updating.scss";

const LINUX = hl.bash`# pick the build for this machine: linux_amd64, linux_arm64, or linux_amd64_musl on Alpine
VERSION=0.7.0
curl -LO https://github.com/voidbase-cloud/voidbase/releases/download/v\${VERSION}/voidbase_\${VERSION}_linux_amd64.zip

unzip voidbase_\${VERSION}_linux_amd64.zip
chmod +x voidbase`;

const MAC = hl.bash`VERSION=0.7.0
curl -LO https://github.com/voidbase-cloud/voidbase/releases/download/v\${VERSION}/voidbase_\${VERSION}_darwin_arm64.zip
unzip voidbase_\${VERSION}_darwin_arm64.zip
chmod +x voidbase
xattr -d com.apple.quarantine voidbase   # macOS blocks downloaded binaries until you say otherwise`;

const UPDATE = hl.bash`./voidbase update --backup`;

const START = hl.bash`./voidbase superuser upsert you@example.com your-password
./voidbase serve`;

const OUTPUT = hl.bash`Server started at http://127.0.0.1:8090
├─ REST API:  http://127.0.0.1:8090/api/
└─ Dashboard: http://127.0.0.1:8090/_/`;

const PUBLIC = hl.bash`./voidbase serve --http 0.0.0.0:8090`;

const SERVICE = hl.bash`# /etc/systemd/system/voidbase.service
[Unit]
Description=voidbase
After=network.target

[Service]
Type=simple
User=voidbase
WorkingDirectory=/opt/voidbase
ExecStart=/opt/voidbase/voidbase serve --http 127.0.0.1:8090
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target`;

const ENABLE = hl.bash`sudo systemctl daemon-reload
sudo systemctl enable --now voidbase
sudo systemctl status voidbase`;

export default function DocsStandalone() {
  return (
    <>
      <h1>Standalone executable</h1>
      <p className="docs-lead">
        One file that contains the server, the admin panel and everything they need. Nothing is installed, and this
        is the one page here that needs neither npm nor bun.
      </p>

      <h2>Download it</h2>
      <p>
        Builds are published for Linux, macOS and Windows on both amd64 and arm64, with musl builds for Alpine, on
        the{" "}
        <a href="https://github.com/voidbase-cloud/voidbase/releases" target="_blank" rel="noreferrer noopener">
          releases page
        </a>
        . On Linux:
      </p>
      <CodeBlock {...LINUX} />

      <p>On macOS, with the Apple Silicon build and the quarantine flag cleared:</p>
      <CodeBlock {...MAC} />

      <h2>Start it</h2>
      <p>Make the first account, then run the server. The password wants eight characters or more.</p>
      <CodeBlock {...START} />
      <p>It prints where it is:</p>
      <CodeBlock {...OUTPUT} />

      <p>
        Open the dashboard, sign in with the account you just made, and you have an instance. Design a collection
        there and it is immediately available over the API, which is what{" "}
        <a href="/docs/connect/sdk">the SDK page</a> connects to.
      </p>

      <h2>Where the data is</h2>
      <p>
        Everything the instance owns lives in a <code>pb_data/</code> directory beside the executable: the database,
        the uploaded files, and the generated typings that make editing hooks autocomplete. Copy that directory and
        you have copied the instance; delete it and you have a new one. There is more about it under{" "}
        <a href="/docs/run/project/data">pb_data</a>.
      </p>

      <h2>On a server</h2>
      <p>By default it listens on the loopback address only. To take connections from other machines:</p>
      <CodeBlock {...PUBLIC} />
      <div className="alert alert-warning">
        <div className="content">
          <p className="m-0">
            Put something that terminates TLS in front of it before doing that on the open internet. A reverse proxy
            (Caddy, nginx, Cloudflare Tunnel) is the usual answer, and the panel's Settings page has a trusted-proxy
            setting so the instance sees the real client address rather than the proxy's.
          </p>
        </div>
      </div>

      <p>To keep it running, a systemd unit is enough:</p>
      <CodeBlock {...SERVICE} />
      <CodeBlock {...ENABLE} />

      <Updating command={UPDATE}>
        <p>
          This fetches the newest release for your platform, checks it against the published checksum and replaces
          the executable in place. The old one is kept beside it until the new one is written, so a download that
          fails partway leaves you with the binary you had. <code>--backup</code> zips <code>pb_data</code> first,
          which is worth the second it costs.
        </p>
        <p>
          Your data is not touched. Everything the instance owns is in <code>pb_data/</code>, and an update replaces
          only the program that reads it. Restart the server and you are on the new version.
        </p>
      </Updating>

      <h2>Adding your own behaviour</h2>
      <p>
        Put JavaScript in a <code>pb_hooks/</code> directory beside the executable and it is loaded at startup: new
        endpoints, handlers that run around writes, scheduled work. That is the same directory a project has, and{" "}
        <a href="/docs/run/project/hooks">pb_hooks</a> is the guide to it. When you want that code in a repository
        rather than beside a binary, <a href="/docs/run/project">a voidbase project</a> is the next page.
      </p>
    </>
  );
}
