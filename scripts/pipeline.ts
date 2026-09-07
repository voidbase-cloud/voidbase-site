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
// The Vite build gets a deadline, because Void's prerender step hangs, and it hangs often.
//
// What the build logs say, once the watchdog started printing the process tree: after the client and server bundles
// are written, Vite spawns a child to render the pages, and that child sometimes spins at 100% of a core and never
// finishes. It is not the pages -- rendering all of them takes about a tenth of a second on a laptop, and the same
// commit that failed here renders cold in four seconds. It is not one attempt being unlucky either: the last two
// builds before this comment both hung on their first attempt, and both would have run to Cloudflare's twenty
// minute limit without a deadline. It has never been reproduced off Cloudflare.
//
// So the numbers are chosen from what the logs show rather than from hope. A healthy build there finishes in about
// thirteen seconds, so ninety is generous while still cutting a hung attempt short, and a third attempt costs a
// minute and a half at worst against a failed build's twenty minutes. `timeout` kills the whole process group,
// because the process that spins is a grandchild and killing Vite alone would leave it burning a core next to the
// retry. Before each kill the verb prints what the processes were doing and how far the render had got, so the next
// occurrence leaves evidence rather than silence.
//
//   BUILD_TIMEOUT    seconds to allow one attempt (default 90)
//   BUILD_ATTEMPTS   how many times to try (default 3)
import { environment } from "./environment";

const verb = process.argv[2] ?? "";
const here = environment();
const seconds = Math.max(30, Number(process.env.BUILD_TIMEOUT ?? 90));
const attempts = Math.max(1, Number(process.env.BUILD_ATTEMPTS ?? 3));

const sh = async (cmd: string[], cwd?: string): Promise<number> =>
  Bun.spawn(cmd, { cwd, stdout: "inherit", stderr: "inherit", stdin: "inherit" }).exited;
const say = (what: string) => console.log(`[${verb}] ${what} — ${here.describe()}`);
const done = (code: number): never => process.exit(code);

/** what the build was doing when it stopped making progress, so a hang leaves evidence rather than silence */
function report(): void {
  // how far the render had got: the prerender writes one file per page, so none means it hung before the first
  const pages = Bun.spawnSync(["bash", "-c", "ls -1 dist/client/**/*.html dist/client/*.html 2>/dev/null | wc -l"], { stdout: "pipe", stderr: "ignore" });
  console.log(`  pages rendered so far: ${pages.stdout.toString().trim() || "0"}`);
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
