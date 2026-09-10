// In-memory GitHub (OAuth app + REST) for the marketplace tests: authorize redirects straight back with a code, the
// token endpoint hands out a fixed bearer, /user is a fixed account, template generation and Actions variables are
// recorded. GET /__state dumps everything.
//   bun test/gh-mock.ts [port]
const port = Number(process.argv[2] ?? 5199); const TOKEN = "gh-test-token"; const CLIENT_ID = "gh-test-client", CLIENT_SECRET = "gh-s3cret";
const repos = new Map<string, Record<string, unknown>>(); const variables = new Map<string, Record<string, string>>(); const calls: string[] = []; let grantRevoked = 0;
// the Git Data API, enough for one commit: files per repository (path -> text), blobs, trees, commits, one branch ref
const files = new Map<string, Map<string, string>>(); const blobs = new Map<string, string>(); const trees = new Map<string, { path: string; sha: string | null }[]>();
const commits = new Map<string, { sha: string; message: string; tree: string; parents: string[]; repo: string; files: Record<string, string> }>(); const heads = new Map<string, string>();
const sha = () => crypto.randomUUID().replace(/-/g, "") + "00000000";
const filesOf = (full: string) => files.get(full) ?? files.set(full, new Map()).get(full)!;
const fromB64 = (b: string) => new TextDecoder().decode(Uint8Array.from(atob(b), (ch) => ch.charCodeAt(0)));
const toB64 = (t: string) => btoa(String.fromCharCode(...new TextEncoder().encode(t)));
const authed = (req: Request) => req.headers.get("authorization") === `Bearer ${TOKEN}`;
Bun.serve({ port, hostname: "127.0.0.1", async fetch(req) {
  const url = new URL(req.url); const p = url.pathname; calls.push(`${req.method} ${p}`);
  if (p === "/__seed" && req.method === "POST") { const b = (await req.json()) as { full_name: string; private?: boolean; variables?: Record<string, string> }; repos.set(b.full_name, { full_name: b.full_name, html_url: `https://github.example/${b.full_name}`, default_branch: "master", private: !!b.private, permissions: { push: true } }); variables.set(b.full_name, { ...(b.variables ?? {}) }); return Response.json({ ok: true }); }
  if (p === "/__state") return Response.json({ repos: Object.fromEntries(repos), variables: Object.fromEntries(variables), calls, grantRevoked, files: Object.fromEntries([...files].map(([k, v]) => [k, Object.fromEntries(v)])), commits: [...commits.values()].map((c) => ({ sha: c.sha, repo: c.repo, message: c.message, parents: c.parents, files: c.files })), heads: Object.fromEntries(heads) });
  if (p === "/__files" && req.method === "POST") { const b = (await req.json()) as { full_name: string; files: Record<string, string> }; const f = filesOf(b.full_name); for (const [k, v] of Object.entries(b.files)) f.set(k, v); if (!heads.has(b.full_name)) { const c = { sha: sha(), message: "seed", tree: sha(), parents: [], repo: b.full_name, files: {} }; commits.set(c.sha, c); heads.set(b.full_name, c.sha); } return Response.json({ ok: true }); }
  if (p === "/login/oauth/authorize") { const to = new URL(url.searchParams.get("redirect_uri")!); to.searchParams.set("code", "ghcode-" + crypto.randomUUID()); to.searchParams.set("state", url.searchParams.get("state") ?? ""); return Response.redirect(to.toString(), 302); }
  if (p === "/login/oauth/access_token") { const b = (await req.json()) as Record<string, string>; if (b.client_id !== CLIENT_ID || b.client_secret !== CLIENT_SECRET || !String(b.code).startsWith("ghcode-")) return Response.json({ error: "bad_verification_code" }); return Response.json({ access_token: TOKEN, token_type: "bearer", scope: "repo,read:user,user:email" }); }
  const m = p.match(/^\/applications\/([^/]+)\/grant$/); if (m && req.method === "DELETE") { grantRevoked++; return new Response(null, { status: 204 }); }
  if (!authed(req)) return Response.json({ message: "Bad credentials" }, { status: 401 });
  if (p === "/user") return Response.json({ id: 4242, login: "octo-tester", name: "Octo Tester", avatar_url: "https://avatars.example/4242" });
  const gen = p.match(/^\/repos\/([^/]+)\/([^/]+)\/generate$/);
  if (gen && req.method === "POST") { const b = (await req.json()) as Record<string, unknown>; const full = `${b.owner}/${b.name}`; if (repos.has(full)) return Response.json({ message: "Name already exists on this account" }, { status: 422 }); const repo = { full_name: full, html_url: `https://github.com/${full}`, default_branch: "main", private: !!b.private, description: b.description, template: `${gen[1]}/${gen[2]}` }; repos.set(full, repo); return Response.json(repo, { status: 201 }); }
  const vars = p.match(/^\/repos\/([^/]+)\/([^/]+)\/actions\/variables(?:\/([^/]+))?$/);
  if (vars) { const full = `${vars[1]}/${vars[2]}`; if (!repos.has(full)) return Response.json({ message: "Not Found" }, { status: 404 }); const bag = variables.get(full) ?? variables.set(full, {}).get(full)!;
    if (req.method === "POST") { const b = (await req.json()) as { name: string; value: string }; if (b.name in bag) return Response.json({ message: "already exists" }, { status: 409 }); bag[b.name] = b.value; return Response.json({}, { status: 201 }); }
    if (req.method === "PATCH" && vars[3]) { const b = (await req.json()) as { value: string }; bag[vars[3]] = b.value; return new Response(null, { status: 204 }); }
    if (req.method === "GET" && vars[3]) return vars[3] in bag ? Response.json({ name: vars[3], value: bag[vars[3]] }) : Response.json({ message: "Not Found" }, { status: 404 });
    if (req.method === "GET") return Response.json({ variables: Object.entries(bag).map(([name, value]) => ({ name, value })) }); }
  const git = p.match(/^\/repos\/([^/]+)\/([^/]+)\/(git\/ref\/heads\/([^/]+)|git\/refs\/heads\/([^/]+)|git\/commits(?:\/([^/]+))?|git\/blobs|git\/trees|contents\/(.+))$/);
  if (git) {
    const full = `${git[1]}/${git[2]}`; if (!repos.has(full)) return Response.json({ message: "Not Found" }, { status: 404 });
    const f = filesOf(full);
    if (git[4] && req.method === "GET") { const h = heads.get(full); return h ? Response.json({ ref: `refs/heads/${git[4]}`, object: { type: "commit", sha: h } }) : Response.json({ message: "Not Found" }, { status: 404 }); }
    if (git[5] && req.method === "PATCH") { const b = (await req.json()) as { sha: string; force?: boolean }; const c = commits.get(b.sha); if (!c) return Response.json({ message: "Object does not exist" }, { status: 422 }); if (!b.force && c.parents[0] !== heads.get(full)) return Response.json({ message: "Update is not a fast forward" }, { status: 422 }); heads.set(full, b.sha); for (const [k, v] of Object.entries(c.files)) { if (v === null) f.delete(k); else f.set(k, v); } return Response.json({ ref: `refs/heads/${git[5]}`, object: { sha: b.sha } }); }
    if (git[3]!.startsWith("git/commits") && req.method === "GET") { const c = commits.get(git[6] ?? ""); return c ? Response.json({ sha: c.sha, tree: { sha: c.tree }, message: c.message, parents: c.parents.map((s) => ({ sha: s })) }) : Response.json({ message: "Not Found" }, { status: 404 }); }
    if (git[3] === "git/commits" && req.method === "POST") { const b = (await req.json()) as { message: string; tree: string; parents: string[] }; const entries = trees.get(b.tree); if (!entries) return Response.json({ message: "Tree SHA does not exist" }, { status: 422 }); const changed: Record<string, string> = {}; for (const e of entries) changed[e.path] = e.sha === null ? (null as unknown as string) : blobs.get(e.sha) ?? ""; const c = { sha: sha(), message: b.message, tree: b.tree, parents: b.parents, repo: full, files: changed }; commits.set(c.sha, c); return Response.json({ sha: c.sha, html_url: `https://github.example/${full}/commit/${c.sha}` }, { status: 201 }); }
    if (git[3] === "git/blobs" && req.method === "POST") { const b = (await req.json()) as { content: string; encoding: string }; const id = sha(); blobs.set(id, b.encoding === "base64" ? fromB64(b.content) : b.content); return Response.json({ sha: id }, { status: 201 }); }
    if (git[3] === "git/trees" && req.method === "POST") { const b = (await req.json()) as { base_tree?: string; tree: { path: string; sha: string | null }[] }; const id = sha(); trees.set(id, b.tree.map((e) => ({ path: e.path, sha: e.sha }))); return Response.json({ sha: id }, { status: 201 }); }
    if (git[7] && req.method === "GET") { const path = decodeURIComponent(git[7]); if (f.has(path)) return Response.json({ type: "file", path, encoding: "base64", content: toB64(f.get(path)!) }); const inDir = [...f.keys()].filter((k) => k.startsWith(path + "/")); if (inDir.length) return Response.json(inDir.map((k) => ({ type: "file", path: k, name: k.slice(path.length + 1) }))); return Response.json({ message: "Not Found" }, { status: 404 }); }
  }
  const one = p.match(/^\/repos\/([^/]+)\/([^/]+)$/);
  if (one && req.method === "GET") { const full = `${one[1]}/${one[2]}`; return repos.has(full) ? Response.json(repos.get(full)) : Response.json({ message: "Not Found" }, { status: 404 }); }
  return Response.json({ message: `no route for ${req.method} ${p}` }, { status: 404 });
} });
console.log(`github mock on http://127.0.0.1:${port} (client ${CLIENT_ID}, token ${TOKEN})`);
