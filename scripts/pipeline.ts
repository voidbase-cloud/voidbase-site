// `bun run build`, `bun run deploy`, `bun run version`: the three verbs Cloudflare Workers Builds calls, and the
// three a person calls by hand. What each one does is read from the environment (scripts/environment.ts), so the
// same word means the right thing in a build, on a branch and on a laptop, and the dashboard holds no logic:
//
//   build     the site into .voidbase/ (Vite with the voidbase adapter), then the typecheck. The same everywhere.
//   deploy    this instance, from the generated app. A person gets a build first, because nothing else has done
//             one; a build already has one. Off the production branch there is nothing to deploy.
//   version   what a branch build leaves behind: the configuration this branch would deploy with, read back from
//             the declaration and the Worker. It changes nothing, so a branch cannot touch what is live.
//
// The Vite build gets a deadline. Void's prerender step hangs now and then, spinning in a grandchild process after
// the client bundle is written, and a build that waits for it burns the twenty minutes Cloudflare allows before
// giving up -- paid minutes spent on nothing. So the build runs under `timeout`, which kills the whole process
// group rather than the one child we can see, and is tried once more; a retry has always finished. Just before the
// deadline it prints what the processes were doing, so a hang leaves evidence in the build log instead of silence.
//
//   BUILD_TIMEOUT    seconds to allow one attempt (default 150)
//   BUILD_ATTEMPTS   how many times to try (default 2)
import { environment } from "./environment";

const verb = process.argv[2] ?? "";
const here = environment();
const seconds = Math.max(30, Number(process.env.BUILD_TIMEOUT ?? 150));
const attempts = Math.max(1, Number(process.env.BUILD_ATTEMPTS ?? 2));

const sh = async (cmd: string[], cwd?: string): Promise<number> =>
  Bun.spawn(cmd, { cwd, stdout: "inherit", stderr: "inherit", stdin: "inherit" }).exited;
const say = (what: string) => console.log(`[${verb}] ${what} — ${here.describe()}`);
const done = (code: number): never => process.exit(code);

/** what the build was doing when it stopped making progress, so a hang leaves evidence rather than silence */
function report(): void {
  const ps = Bun.spawnSync(["ps", "-eo", "pid,ppid,stat,etime,time,args"], { stdout: "pipe", stderr: "ignore" });
  const lines = ps.stdout.toString().split("\n");
  const interesting = lines.filter((l) => /vite|prerender|voidbase|esbuild|rollup|\bbun\b|\bnode\b/.test(l) && !/\bps -eo\b/.test(l));
  console.log([lines[0] ?? "", ...interesting].slice(0, 15).join("\n"));
}

// `timeout` signals the whole process group, so the prerender grandchild dies with the build that started it.
// Without it we would kill Vite and leave the spinning process behind to compete with the retry for the CPU.
const timeout = Bun.which("timeout");

/** runs the command with a deadline; returns its exit code, or null if the deadline passed */
async function withDeadline(cmd: string[]): Promise<number | null> {
  const child = Bun.spawn(timeout ? [timeout, "--kill-after=10s", `${seconds}s`, ...cmd] : cmd, {
    stdout: "inherit",
    stderr: "inherit",
    stdin: "inherit",
  });
  // with `timeout` this only reports, a few seconds before the kill it is about to do; without it, it also kills
  const at = timeout ? Math.max(1, seconds - 5) : seconds;
  const warn = setTimeout(() => {
    console.log(`\n[${verb}] no progress for ${at}s; what the build was doing:`);
    report();
    if (!timeout) child.kill("SIGKILL");
  }, at * 1000);
  const code = await child.exited;
  clearTimeout(warn);
  const deadline = timeout ? code === 124 || code === 137 : child.killed && code !== 0;
  return deadline ? null : code;
}

switch (verb) {
  case "build": {
    say(`the site into .voidbase/, then the typecheck (${seconds}s per attempt, ${attempts} attempt${attempts > 1 ? "s" : ""})`);
    if (!timeout) console.log("[build] no `timeout` here, so a hung build takes only its own process with it");
    let built: number | null = null;
    for (let attempt = 1; attempt <= attempts; attempt++) {
      built = await withDeadline(["bunx", "--bun", "vite", "build"]);
      if (built !== null) break;
      console.log(`[build] attempt ${attempt} passed its deadline${attempt < attempts ? " and was killed; building again" : ""}`);
    }
    if (built === null) { console.error(`[build] the Vite build never finished, in ${attempts} attempt${attempts > 1 ? "s" : ""}`); done(1); }
    if (built !== 0) done(built);
    const app = await sh(["bunx", "tsc", "--noEmit", "-p", "tsconfig.json"]);
    done(app !== 0 ? app : await sh(["bunx", "tsc", "--noEmit", "-p", "tsconfig.server.json"]));
    break;
  }
  case "deploy": {
    if (!here.production) { console.log(`[deploy] nothing to do: ${here.branch} is not ${here.productionBranch} — ${here.describe()}`); done(0); }
    if (!here.automated) {
      say("building first, because nothing else has");
      const built = await sh(["bun", "run", "build"]);
      if (built !== 0) done(built);
    }
    say("this instance, from the generated app");
    done(await sh(["bunx", "voidbase", "deploy"], ".voidbase"));
    break;
  }
  case "version": {
    // read-only on purpose: a branch build proves its configuration without creating or changing anything
    say("the configuration this branch would deploy with");
    done(await sh(["bunx", "voidbase", "secrets"], ".voidbase"));
    break;
  }
  default:
    console.error("usage: bun run build | bun run deploy | bun run version");
    process.exit(2);
}
