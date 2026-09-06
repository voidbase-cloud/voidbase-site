// In-memory GitHub (OAuth app + REST) for the marketplace tests: authorize redirects straight back with a code, the
// token endpoint hands out a fixed bearer, /user is a fixed account, template generation and Actions variables are
// recorded. GET /__state dumps everything.
//   bun test/gh-mock.ts [port]
const port = Number(process.argv[2] ?? 5199); const TOKEN = "gh-test-token"; const CLIENT_ID = "gh-test-client", CLIENT_SECRET = "gh-s3cret";
const repos = new Map<string, Record<string, unknown>>(); const variables = new Map<string, Record<string, string>>(); const calls: string[] = []; let grantRevoked = 0;
const authed = (req: Request) => req.headers.get("authorization") === `Bearer ${TOKEN}`;
Bun.serve({ port, hostname: "127.0.0.1", async fetch(req) {
  const url = new URL(req.url); const p = url.pathname; calls.push(`${req.method} ${p}`);
  if (p === "/__seed" && req.method === "POST") { const b = (await req.json()) as { full_name: string; private?: boolean; variables?: Record<string, string> }; repos.set(b.full_name, { full_name: b.full_name, html_url: `https://github.example/${b.full_name}`, default_branch: "master", private: !!b.private, permissions: { push: true } }); variables.set(b.full_name, { ...(b.variables ?? {}) }); return Response.json({ ok: true }); }
  if (p === "/__state") return Response.json({ repos: Object.fromEntries(repos), variables: Object.fromEntries(variables), calls, grantRevoked });
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
  const one = p.match(/^\/repos\/([^/]+)\/([^/]+)$/);
  if (one && req.method === "GET") { const full = `${one[1]}/${one[2]}`; return repos.has(full) ? Response.json(repos.get(full)) : Response.json({ message: "Not Found" }, { status: 404 }); }
  return Response.json({ message: `no route for ${req.method} ${p}` }, { status: 404 });
} });
console.log(`github mock on http://127.0.0.1:${port} (client ${CLIENT_ID}, token ${TOKEN})`);
