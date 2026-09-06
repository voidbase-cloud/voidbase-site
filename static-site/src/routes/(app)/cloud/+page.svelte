<script>
    import { onMount } from "svelte";
    import { vb, cloud, errorMessage, VB_URL } from "@/vb.js";
    import CloudflareSignIn from "@/components/CloudflareSignIn.svelte";

    let ready = false;
    let signedIn = false;
    let me = null;
    let release = null;
    let instances = [];
    let github = null; // { configured, connected, connection, scopes }
    let templates = [];
    let repos = [];
    let error = "";
    let notice = "";
    let created = null; // credentials of the instance just created, shown once
    let busy = "";
    let logs = [];
    let creds = {}; // instance id -> credentials shown inline
    // one inline panel at a time: { kind: "instance" } | { kind: "template" | "link", instance }
    let panel = null;
    let form = {};

    // repositories hang off the instance they are wired to; ones whose instance is gone are listed last
    $: byInstance = repos.reduce((m, r) => ((m[r.instance] ||= []).push(r), m), {});
    $: orphans = repos.filter((r) => !instances.some((i) => i.id === r.instance));
    $: canWire = (inst) => !!github?.connected && inst.status === "live" && !!inst.canLink && !me?.user?.superuser;

    onMount(() => {
        const pb = vb();
        signedIn = pb.authStore.isValid;
        // back from GitHub's consent screen (the backend's callback sends the browser here)
        const q = new URLSearchParams(location.search);
        if (q.get("github") === "connected") notice = "GitHub connected.";
        else if (q.get("github") === "error") error = "GitHub: " + (q.get("message") || "sign-in failed");
        if (q.has("github")) history.replaceState(null, "", location.pathname);
        const unsub = pb.authStore.onChange(() => {
            signedIn = pb.authStore.isValid;
            if (signedIn && !me) load();
        });
        if (signedIn) load();
        ready = true;
        return unsub;
    });

    async function load() {
        error = "";
        try {
            me = await cloud("GET", "/api/vbcloud/me");
            if (!form.account && me?.connection?.accounts?.length) form = { ...form, account: me.connection.accounts[0].id };
            [release, instances, github, templates] = await Promise.all([
                cloud("GET", "/api/vbcloud/release").catch(() => null),
                cloud("GET", "/api/vbcloud/instances").then((r) => r.instances),
                cloud("GET", "/api/vbcloud/github").catch(() => null),
                cloud("GET", "/api/vbcloud/templates").then((r) => r.templates).catch(() => []),
            ]);
            repos = me?.user?.superuser ? [] : await cloud("GET", "/api/vbcloud/repos").then((r) => r.repos).catch(() => []);
        } catch (err) {
            if (err?.status === 401 || err?.status === 403) {
                vb().authStore.clear();
                signedIn = false;
            }
            error = errorMessage(err);
        }
    }

    function open(kind, inst = null) {
        error = "";
        if (panel && panel.kind === kind && panel.instance === inst?.id) return (panel = null);
        panel = { kind, instance: inst?.id || null, name: inst?.name || "" };
        if (kind === "instance") form = { name: "", account: form.account || me?.connection?.accounts?.[0]?.id || "" };
        if (kind === "template") form = { template: templates[0]?.name || "", name: "", domain: "", private: false };
        if (kind === "link") form = { fullName: "" };
    }
    const close = () => (panel = null);
    $: pickedTemplate = templates.find((t) => t.name === form.template) || null;

    async function run(step, fn) {
        error = "";
        notice = "";
        busy = step;
        try {
            await fn();
        } catch (err) {
            error = errorMessage(err);
            logs = err?.response?.data?.log || logs;
        } finally {
            busy = "";
        }
    }

    const connectGithub = () =>
        run("github", async () => {
            const r = await cloud("GET", "/api/vbcloud/github/connect");
            location.href = r.url; // GitHub, then back here through the backend's callback
        });

    async function disconnectGithub() {
        if (!confirm("Disconnect GitHub? Wired repositories stay in your account; this site only forgets the token.")) return;
        await run("github", async () => {
            await cloud("DELETE", "/api/vbcloud/github");
            await load();
        });
    }

    const createInstance = () =>
        run("create", async () => {
            logs = [];
            const r = await cloud("POST", "/api/vbcloud/instances", { name: form.name, account: form.account });
            logs = r.log || [];
            notice = `${r.instance.name} is live at ${r.instance.url}`;
            created = r.credentials || null; // shown once: the password is not stored anywhere but the new instance
            panel = null;
            await load();
        });

    const createRepo = () =>
        run("repo", async () => {
            const r = await cloud("POST", "/api/vbcloud/repos", { ...form, instance: panel.instance });
            notice = `${r.repo.fullName} created from ${pickedTemplate?.title || form.template} and wired to ${r.repo.instanceName}.`;
            panel = null;
            await load();
        });

    const linkRepo = () =>
        run("link", async () => {
            const r = await cloud("POST", "/api/vbcloud/repos/link", { fullName: form.fullName, instance: panel.instance });
            notice = `${r.repo.fullName} wired to ${r.repo.instanceName}: its PB_VB_URL is now ${r.repo.instanceUrl}.`;
            panel = null;
            await load();
        });

    async function unlinkRepo(repo) {
        if (!confirm(`Unlink ${repo.fullName}?\n\nThe repository stays in your GitHub account; this site just stops listing it.`)) return;
        await run("unlink:" + repo.id, async () => {
            await cloud("DELETE", `/api/vbcloud/repos/${repo.id}`);
            await load();
        });
    }

    async function remove(inst) {
        const what = inst.self ? `${inst.name} — THIS SITE'S OWN BACKEND. The cloud page stops working until it is deployed again.` : inst.name;
        if (!confirm(`Delete ${what}\n\nThe Worker, its D1 database, R2 bucket and queue are removed. This cannot be undone.`)) return;
        if (inst.self && prompt(`This is the backend serving this page. Type its name (${inst.name}) to confirm.`) !== inst.name) return;
        await run("delete:" + inst.id, async () => {
            logs = [];
            const r = await cloud("DELETE", `/api/vbcloud/instances/${inst.id}`);
            logs = r.log || [];
            notice = `${inst.name} deleted (${r.deleted.length} resources removed${r.skipped.length ? `, ${r.skipped.length} already gone` : ""}).`;
            if (inst.self) instances = instances.filter((i) => i.id !== inst.id);
            else await load();
        });
    }

    async function toggleCredentials(inst) {
        if (creds[inst.id]) {
            const next = { ...creds };
            delete next[inst.id];
            creds = next;
            return;
        }
        await run("creds:" + inst.id, async () => {
            creds = { ...creds, [inst.id]: await cloud("GET", `/api/vbcloud/instances/${inst.id}/credentials`) };
        });
    }

    function signOut() {
        vb().authStore.clear();
        me = null;
        instances = [];
        repos = [];
        release = null;
        panel = null;
    }

    const host = (url) => (url || "").replace(/^https?:\/\//, "");
    const wired = (repo) => (!repo.live?.checked ? "unknown" : !repo.live.exists ? "gone" : repo.live.connected ? "yes" : "no");
    const wiredText = { unknown: "not checked", gone: "repository gone", yes: "wired", no: "points elsewhere" };
</script>

<svelte:head>
    <title>Cloud - voidbase</title>
</svelte:head>

<div class="page-content cloud">
    {#if !ready}
        <div class="loader" />
    {:else if !signedIn}
        <header class="cloud-head">
            <div>
                <p class="eyebrow">Cloud</p>
                <h1>Your instances, in your Cloudflare account</h1>
                <p class="lede">
                    One click creates a voidbase instance: a Worker with the admin panel, a D1 database, an R2 bucket and a
                    queue. Repositories you build from a template or link afterwards read the instance URL from a variable.
                    The backend of this page is itself such an instance.
                </p>
            </div>
        </header>
        <div class="signin">
            <CloudflareSignIn class="btn btn-lg btn-primary" />
            <p class="txt-hint">
                Cloudflare shows which accounts and permissions this site asks for. Nothing is created until you click
                create. Backend: <code>{VB_URL ? host(VB_URL) : "this site"}</code>
            </p>
        </div>
    {:else}
        <header class="cloud-head">
            <div>
                <p class="eyebrow">Cloud</p>
                <h1>Instances <span class="count">{instances.length}</span></h1>
                <p class="lede">
                    Each instance is a Worker in your Cloudflare account with its own database, bucket and queue. The
                    repositories wired to it read its URL from their <code>PB_VB_URL</code> variable.
                </p>
            </div>
            {#if me && !me.user.superuser}
                <button type="button" class="btn btn-primary" aria-expanded={panel?.kind === "instance"} disabled={!me.connected || !release?.current} on:click={() => open("instance")}>
                    <i class="ri-add-line" /><span class="txt">New instance</span>
                </button>
            {/if}
        </header>

        {#if me}
            <div class="accounts" aria-label="Connected accounts">
                <div class="account">
                    <span class="dot on" />
                    <span class="who"><strong>{me.user.email || me.user.name}</strong>{#if me.admin} <span class="label label-sm">admin</span>{/if}</span>
                    <span class="via">
                        {#if me.connected}Cloudflare · {(me.connection.accounts || []).map((a) => a.name || a.id).join(", ") || "no account granted"}{:else}Cloudflare not connected{/if}
                    </span>
                    <button type="button" class="btn btn-xs btn-secondary" on:click={load}>Refresh</button>
                    <button type="button" class="btn btn-xs btn-secondary" on:click={signOut}>Sign out</button>
                </div>
                {#if !me.user.superuser && github}
                    <div class="account">
                        <span class="dot" class:on={github.connected} />
                        {#if !github.configured}
                            <span class="who">GitHub</span>
                            <span class="via">no OAuth app configured on this backend (GH_OAUTH_CLIENT_ID)</span>
                        {:else if github.connected}
                            <span class="who"><i class="ri-github-fill" /> <strong>@{github.connection.login}</strong></span>
                            <span class="via">GitHub · {github.scopes}</span>
                            <button type="button" class="btn btn-xs btn-secondary" disabled={busy === "github"} on:click={disconnectGithub}>Disconnect</button>
                        {:else}
                            <span class="who">GitHub</span>
                            <span class="via">connect it to create repositories from templates and wire them to an instance</span>
                            <button type="button" class="btn btn-xs btn-secondary" disabled={busy === "github"} on:click={connectGithub}>
                                <i class="ri-github-fill" /><span class="txt">{busy === "github" ? "Going to GitHub…" : "Connect GitHub"}</span>
                            </button>
                        {/if}
                    </div>
                {/if}
            </div>
        {/if}

        {#if me && !me.providerConfigured}
            <div class="alert alert-warning"><div class="content">The backend has no Cloudflare OAuth client configured (CF_OAUTH_CLIENT_ID). See vb/.env.example.</div></div>
        {/if}
        {#if error}<div class="alert alert-danger"><div class="content">{error}</div></div>{/if}
        {#if notice}<div class="alert alert-success"><div class="content">{notice}</div></div>{/if}
        {#if created}
            <div class="alert alert-warning">
                <div class="content">
                    <p><strong>Save these now.</strong> The superuser password is shown only once; this site does not keep it (reset it from the instance's own dashboard if you lose it).</p>
                    <p>
                        Dashboard <a href={created.panel} target="_blank" rel="noopener noreferrer">{created.panel}</a>
                        · email <code>{created.superuserEmail}</code>
                        · password <code>{created.superuserPassword}</code>
                    </p>
                    <button type="button" class="btn btn-sm btn-secondary" on:click={() => (created = null)}>I saved them</button>
                </div>
            </div>
        {/if}

        {#if panel?.kind === "instance"}
            <form class="sheet" on:submit|preventDefault={createInstance}>
                <div class="sheet-head">
                    <h3>New instance</h3>
                    {#if release?.current}
                        <span class="txt-hint">release <code>{release.current}</code> · voidbase {release.voidbase}</span>
                    {/if}
                </div>
                <div class="flds">
                    <label class="fld">
                        <span>Name</span>
                        <span class="prefixed"><span class="pre">{me.prefix}</span><input type="text" bind:value={form.name} placeholder="my-app" required pattern="[a-zA-Z0-9\- ]+" /></span>
                    </label>
                    <label class="fld">
                        <span>Cloudflare account</span>
                        <select bind:value={form.account} required>
                            {#each me.connection?.accounts || [] as a}<option value={a.id}>{a.name || a.id}</option>{/each}
                        </select>
                    </label>
                </div>
                <div class="sheet-foot">
                    <button type="submit" class="btn btn-primary" disabled={busy === "create"}>{busy === "create" ? "Creating… about a minute" : "Create instance"}</button>
                    <button type="button" class="btn btn-secondary" on:click={close}>Cancel</button>
                    <span class="txt-hint">Up to {me.maxInstances} instances per account here; the Workers Free plan allows 10 D1 databases.</span>
                </div>
            </form>
        {/if}

        {#if !instances.length}
            <div class="empty">
                <p><strong>No instances yet.</strong></p>
                {#if !release?.current}
                    <p class="txt-hint">No voidbase release has been uploaded to this backend yet (<code>voidbase bundle --push</code>), so nothing can be created.</p>
                {:else if me?.user?.superuser}
                    <p class="txt-hint">Superusers manage releases here; sign in with Cloudflare as a user to create instances.</p>
                {:else}
                    <p class="txt-hint">Create one and it is live in about a minute.</p>
                {/if}
            </div>
        {/if}

        <ul class="nodes">
            {#each instances as inst (inst.id)}
                {@const list = byInstance[inst.id] || []}
                <li class="node status-{inst.status}" class:self={inst.self}>
                    <div class="node-head">
                        <span class="dot" title={inst.status} />
                        <div class="node-title">
                            <span class="name">{inst.name}</span>
                            {#if inst.self}<span class="label label-sm" title="The backend serving this very page">this site's backend</span>{/if}
                            <span class="label label-sm status">{inst.status}</span>
                        </div>
                        <div class="node-meta">
                            <span>{inst.account.name || inst.account.id}</span>
                            {#if inst.release}<span>release <code>{inst.release}</code></span>{/if}
                            {#if inst.url}<a class="url" href={inst.url} target="_blank" rel="noopener noreferrer">{host(inst.url)}</a>{/if}
                        </div>
                        <div class="node-actions">
                            {#if inst.url}
                                <a href="{inst.url}/_/" target="_blank" rel="noopener noreferrer" class="btn btn-xs btn-outline">Dashboard</a>
                                <a href="{inst.url}/api/health" target="_blank" rel="noopener noreferrer" class="btn btn-xs btn-secondary">API</a>
                            {/if}
                            {#if inst.superuserEmail}
                                <button type="button" class="btn btn-xs btn-secondary" aria-expanded={!!creds[inst.id]} on:click={() => toggleCredentials(inst)}>{creds[inst.id] ? "Hide credentials" : "Credentials"}</button>
                            {/if}
                            {#if inst.canDelete}
                                <button type="button" class="btn btn-xs btn-secondary btn-danger" disabled={busy === "delete:" + inst.id || inst.status === "deleting"} on:click={() => remove(inst)}>{busy === "delete:" + inst.id ? "Deleting…" : "Delete"}</button>
                            {/if}
                        </div>
                    </div>
                    {#if inst.error}<p class="node-error">{inst.error}</p>{/if}
                    {#if creds[inst.id]}
                        <p class="node-creds">
                            Superuser <code>{creds[inst.id].superuserEmail}</code> at <a href={creds[inst.id].panel} target="_blank" rel="noopener noreferrer">{creds[inst.id].panel}</a>; the password was shown once at creation (reset it from that dashboard).
                        </p>
                    {/if}

                    {#if !me?.user?.superuser}
                        <ul class="branches">
                            {#each list as repo (repo.id)}
                                {@const w = wired(repo)}
                                <li class="branch wired-{w}">
                                    <span class="joint" title="PB_VB_URL: {repo.live?.backendUrl || 'not read'}" />
                                    <div class="branch-title">
                                        <a class="name" href={repo.live?.htmlUrl || repo.htmlUrl} target="_blank" rel="noopener noreferrer">{repo.fullName}</a>
                                        {#if repo.system}<span class="label label-sm" title="The repository this page is built from">this site</span>{/if}
                                        {#if repo.private || repo.live?.private}<span class="label label-sm">private</span>{/if}
                                        {#if repo.status !== "ready"}<span class="label label-sm status-{repo.status}">{repo.status}</span>{/if}
                                    </div>
                                    <div class="branch-meta">
                                        {#if repo.templateTitle || repo.templateName}<span>from {repo.templateTitle || repo.templateName}</span>{/if}
                                        <span class="wired">{wiredText[w]}</span>
                                    </div>
                                    <div class="branch-actions">
                                        <a href="{repo.live?.htmlUrl || repo.htmlUrl}/actions" target="_blank" rel="noopener noreferrer" class="btn btn-xs btn-secondary">Actions</a>
                                        {#if repo.canUnlink}<button type="button" class="btn btn-xs btn-secondary" disabled={busy === "unlink:" + repo.id} on:click={() => unlinkRepo(repo)}>Unlink</button>{/if}
                                    </div>
                                </li>
                            {/each}
                            <li class="branch add">
                                <span class="joint" />
                                <div class="branch-title">
                                {#if canWire(inst)}
                                    {#if templates.length}
                                        <button type="button" class="btn btn-xs btn-secondary" aria-expanded={panel?.kind === "template" && panel.instance === inst.id} on:click={() => open("template", inst)}><i class="ri-add-line" /><span class="txt">New repository from a template</span></button>
                                    {/if}
                                    <button type="button" class="btn btn-xs btn-secondary" aria-expanded={panel?.kind === "link" && panel.instance === inst.id} on:click={() => open("link", inst)}><i class="ri-git-repository-line" /><span class="txt">Link a repository</span></button>
                                {:else if !github?.connected}
                                    <span class="txt-hint">{list.length ? "Connect GitHub to wire more repositories." : "Connect GitHub to wire a repository to this instance."}</span>
                                {:else if inst.status !== "live"}
                                    <span class="txt-hint">Repositories can be wired once the instance is live.</span>
                                {:else}
                                    <span class="txt-hint">Only the owner can wire repositories to this instance.</span>
                                {/if}
                                </div>
                            </li>
                        </ul>

                        {#if panel && panel.instance === inst.id && panel.kind === "template"}
                            <form class="sheet nested" on:submit|preventDefault={createRepo}>
                                <div class="sheet-head">
                                    <h3>New repository for {inst.name}</h3>
                                    <span class="txt-hint">created in your GitHub account, its variables set to this instance</span>
                                </div>
                                <div class="templates" role="radiogroup" aria-label="Template">
                                    {#each templates as tpl (tpl.id)}
                                        <label class="template" class:picked={form.template === tpl.name}>
                                            <input type="radio" name="template" value={tpl.name} bind:group={form.template} />
                                            <span class="template-title">{tpl.title} <span class="label label-sm">{tpl.kind}</span></span>
                                            <span class="template-desc">{tpl.description}</span>
                                            <a class="template-repo" href={tpl.url} target="_blank" rel="noopener noreferrer">{tpl.repo}</a>
                                        </label>
                                    {/each}
                                </div>
                                <div class="flds">
                                    <label class="fld">
                                        <span>Repository name</span>
                                        <span class="prefixed"><span class="pre">{github.connection.login}/</span><input type="text" bind:value={form.name} placeholder="my-site" required /></span>
                                    </label>
                                    {#if pickedTemplate?.kind === "site"}
                                        <label class="fld">
                                            <span>Custom domain for GitHub Pages <em>optional</em></span>
                                            <input type="text" bind:value={form.domain} placeholder="www.example.com" />
                                        </label>
                                    {/if}
                                    <label class="fld check">
                                        <input type="checkbox" bind:checked={form.private} />
                                        <span>Private repository</span>
                                    </label>
                                </div>
                                <div class="sheet-foot">
                                    <button type="submit" class="btn btn-primary btn-sm" disabled={busy === "repo" || !form.template}>{busy === "repo" ? "Creating…" : "Create repository"}</button>
                                    <button type="button" class="btn btn-sm btn-secondary" on:click={close}>Cancel</button>
                                </div>
                            </form>
                        {:else if panel && panel.instance === inst.id && panel.kind === "link"}
                            <form class="sheet nested" on:submit|preventDefault={linkRepo}>
                                <div class="sheet-head">
                                    <h3>Link a repository to {inst.name}</h3>
                                    <span class="txt-hint">its <code>PB_VB_URL</code> Actions variable is set to <code>{host(inst.url)}</code>; nothing else changes</span>
                                </div>
                                <div class="flds">
                                    <label class="fld wide">
                                        <span>Repository</span>
                                        <input type="text" bind:value={form.fullName} placeholder="owner/name or https://github.com/owner/name" required />
                                    </label>
                                </div>
                                <div class="sheet-foot">
                                    <button type="submit" class="btn btn-primary btn-sm" disabled={busy === "link"}>{busy === "link" ? "Linking…" : "Link repository"}</button>
                                    <button type="button" class="btn btn-sm btn-secondary" on:click={close}>Cancel</button>
                                </div>
                            </form>
                        {/if}
                    {/if}
                </li>
            {/each}

            {#if orphans.length}
                <li class="node orphan">
                    <div class="node-head">
                        <span class="dot" />
                        <div class="node-title"><span class="name">Instance no longer here</span></div>
                        <div class="node-meta"><span>these repositories point at an instance that was deleted</span></div>
                    </div>
                    <ul class="branches">
                        {#each orphans as repo (repo.id)}
                            <li class="branch wired-gone">
                                <span class="joint" />
                                <div class="branch-title"><a class="name" href={repo.htmlUrl} target="_blank" rel="noopener noreferrer">{repo.fullName}</a></div>
                                <div class="branch-meta"><span class="wired">PB_VB_URL still {repo.live?.backendUrl || "unknown"}</span></div>
                                <div class="branch-actions">
                                    {#if repo.canUnlink}<button type="button" class="btn btn-xs btn-secondary" on:click={() => unlinkRepo(repo)}>Unlink</button>{/if}
                                </div>
                            </li>
                        {/each}
                    </ul>
                </li>
            {/if}
        </ul>

        {#if logs.length}
            <details class="cloud-log" open>
                <summary>Log</summary>
                <pre>{logs.join("\n")}</pre>
            </details>
        {/if}
    {/if}
</div>

<style lang="scss">
    // the page's own tokens: the site palette, plus the three states a dot can be in
    .cloud {
        --rail: var(--baseAlt3Color);
        --live: var(--successColor);
        --pending: var(--warningColor);
        --broken: var(--dangerColor);
        --mono: "SFMono-Regular", Menlo, Consolas, "Liberation Mono", monospace;
    }

    // ---- header -------------------------------------------------------------------------------------------------
    .cloud-head {
        display: flex;
        justify-content: space-between;
        gap: 20px;
        flex-wrap: wrap;
        margin: 10px 0 25px;
        align-items: flex-start;
        h1 { margin: 0 0 8px; padding: 0; border: 0; letter-spacing: -0.01em; text-wrap: balance; }
        > .btn { margin-top: 26px; }
        .count { font-weight: 400; color: var(--txtDisabledColor); font-variant-numeric: tabular-nums; margin-left: 4px; }
    }
    .eyebrow { margin: 0 0 6px; font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--txtDisabledColor); }
    .lede { margin: 0; max-width: 68ch; color: var(--txtHintColor); }
    .signin { padding: 10px 0 40px; .txt-hint { margin: 14px 0 0; } }

    // ---- connected accounts: two rows, one dot each ---------------------------------------------------------------
    .accounts { display: grid; gap: 1px; margin-bottom: 20px; border: 1px solid var(--baseAlt2Color); border-radius: var(--baseRadius); background: var(--baseAlt2Color); overflow: hidden; }
    .account {
        display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
        padding: 9px 14px; background: var(--baseColor); font-size: var(--smFontSize);
        .who { display: inline-flex; align-items: center; gap: 6px; }
        .via { color: var(--txtHintColor); flex: 1; min-width: 0; }
        .btn + .btn { margin-left: -6px; }
    }
    .dot {
        flex: none; width: 8px; height: 8px; border-radius: 50%;
        background: var(--baseAlt4Color); box-shadow: 0 0 0 3px color-mix(in srgb, var(--baseAlt4Color) 25%, transparent);
        &.on { background: var(--live); box-shadow: 0 0 0 3px color-mix(in srgb, var(--live) 25%, transparent); }
    }

    // ---- instances: one node each, repositories as branches on a rail --------------------------------------------
    .nodes { list-style: none; margin: 0; padding: 0; display: grid; gap: 14px; }
    .node {
        border: 1px solid var(--baseAlt2Color); border-radius: var(--lgRadius); background: var(--baseColor);
        &.self { border-color: var(--baseAlt3Color); }
        &.orphan .dot { background: var(--broken); box-shadow: 0 0 0 3px color-mix(in srgb, var(--broken) 25%, transparent); }
        &.status-live .node-head .dot { background: var(--live); box-shadow: 0 0 0 3px color-mix(in srgb, var(--live) 25%, transparent); }
        &.status-creating .node-head .dot, &.status-deleting .node-head .dot { background: var(--pending); box-shadow: 0 0 0 3px color-mix(in srgb, var(--pending) 25%, transparent); animation: pulse 1.6s ease-in-out infinite; }
        &.status-error .node-head .dot { background: var(--broken); box-shadow: 0 0 0 3px color-mix(in srgb, var(--broken) 25%, transparent); }
    }
    .node-head {
        display: grid; grid-template-columns: 8px minmax(0, 1fr) auto; grid-template-areas: "dot title actions" ". meta actions";
        column-gap: 14px; row-gap: 4px; align-items: center; padding: 16px 18px 14px;
        .dot { grid-area: dot; align-self: center; }
    }
    .node-title { grid-area: title; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; min-width: 0; }
    .name { font-family: var(--mono); font-size: 15px; font-weight: 600; color: var(--txtPrimaryColor); letter-spacing: -0.01em; overflow-wrap: anywhere; }
    .node-meta {
        grid-area: meta; display: flex; gap: 14px; flex-wrap: wrap; font-size: var(--smFontSize); color: var(--txtHintColor);
        code { font-size: 0.92em; }
        .url { font-family: var(--mono); color: var(--txtHintColor); text-decoration: none; border-bottom: 1px solid var(--baseAlt3Color); &:hover { color: var(--txtPrimaryColor); border-color: var(--txtPrimaryColor); } }
    }
    .node-actions { grid-area: actions; display: flex; gap: 4px; align-items: center; flex-wrap: wrap; justify-content: flex-end; }
    .label.status { text-transform: none; }
    .status-live .label.status { color: var(--live); background: color-mix(in srgb, var(--live) 14%, transparent); }
    .status-creating .label.status, .status-deleting .label.status { color: var(--pending); background: color-mix(in srgb, var(--pending) 14%, transparent); }
    .status-error .label.status { color: var(--broken); background: color-mix(in srgb, var(--broken) 14%, transparent); }
    .node-error, .node-creds { margin: 0; padding: 0 18px 12px 40px; font-size: var(--smFontSize); }
    .node-error { color: var(--broken); }
    .node-creds { color: var(--txtHintColor); }

    // the rail: a vertical line from under the dot, each branch attached with a short stub and a joint whose colour is
    // the live check of that repository's PB_VB_URL
    .branches {
        list-style: none; margin: 0; padding: 4px 18px 14px 21px; position: relative;
        &::before { content: ""; position: absolute; left: 21px; top: 0; bottom: 30px; width: 1px; background: var(--rail); }
    }
    .branch {
        position: relative; display: grid; grid-template-columns: minmax(0, 1fr) auto; grid-template-areas: "title actions" "meta actions";
        column-gap: 12px; row-gap: 2px; align-items: center; padding: 8px 0 8px 26px; border-top: 1px solid var(--baseAlt1Color);
        &:first-child { border-top: 0; }
        &::before { content: ""; position: absolute; left: 0; top: 50%; width: 14px; height: 1px; background: var(--rail); }
        .joint {
            position: absolute; left: 11px; top: 50%; width: 7px; height: 7px; margin-top: -3.5px; border-radius: 50%;
            background: var(--baseColor); border: 1.5px solid var(--rail);
        }
        &.wired-yes .joint { background: var(--live); border-color: var(--live); }
        &.wired-no .joint { background: var(--pending); border-color: var(--pending); }
        &.wired-gone .joint { background: var(--broken); border-color: var(--broken); }
        &.wired-yes .wired { color: var(--live); }
        &.wired-no .wired { color: var(--pending); }
        &.wired-gone .wired { color: var(--broken); }
        &.add { padding-top: 6px; padding-bottom: 0; grid-template-columns: 1fr; grid-template-areas: "title"; .btn { margin-left: -8px; } .btn + .btn { margin-left: 2px; } .txt-hint { font-size: var(--smFontSize); } }
    }
    .branch-title { grid-area: title; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; min-width: 0; .name { font-size: 14px; font-weight: 500; text-decoration: none; &:hover { text-decoration: underline; } } }
    .branch-meta { grid-area: meta; display: flex; gap: 12px; flex-wrap: wrap; font-size: var(--smFontSize); color: var(--txtHintColor); .wired { font-weight: 500; } }
    .branch-actions { grid-area: actions; display: flex; gap: 2px; justify-content: flex-end; }
    .label-sm.status-creating { color: var(--pending); }
    .label-sm.status-error { color: var(--broken); }

    // ---- inline panels: new instance, new repository, link ---------------------------------------------------------
    .sheet {
        display: grid; gap: 14px; padding: 16px 18px; margin: 0 0 14px;
        border: 1px solid var(--baseAlt3Color); border-radius: var(--lgRadius); background: var(--baseAlt1Color);
        &.nested { margin: 0 18px 16px 40px; border-radius: var(--baseRadius); }
    }
    .sheet-head { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; h3 { margin: 0; font-size: 15px; } .txt-hint { font-size: var(--smFontSize); } }
    .sheet-foot { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; .txt-hint { font-size: var(--smFontSize); margin-left: 6px; } }
    .flds { display: flex; gap: 14px; flex-wrap: wrap; align-items: flex-end; }
    .fld {
        display: grid; gap: 5px; min-width: 220px; margin: 0;
        > span:first-child { font-size: var(--smFontSize); color: var(--txtHintColor); em { font-style: normal; color: var(--txtDisabledColor); } }
        input[type="text"], select { width: 100%; height: var(--smBtnHeight); padding: 0 10px; border: 1px solid var(--baseAlt3Color); border-radius: var(--baseRadius); background: var(--baseColor); color: var(--txtPrimaryColor); font: inherit; font-size: var(--smFontSize); }
        input[type="text"]:focus-visible, select:focus-visible { outline: 2px solid var(--txtPrimaryColor); outline-offset: 1px; }
        &.wide { flex: 1; min-width: 300px; }
        &.check { display: flex; align-items: center; gap: 8px; min-width: 0; height: var(--smBtnHeight); > span { font-size: var(--smFontSize); color: var(--txtPrimaryColor); } }
    }
    .prefixed {
        display: flex; align-items: stretch;
        .pre { display: inline-flex; align-items: center; padding: 0 8px; white-space: nowrap; border: 1px solid var(--baseAlt3Color); border-right: 0; border-radius: var(--baseRadius) 0 0 var(--baseRadius); background: var(--baseAlt2Color); color: var(--txtHintColor); font-family: var(--mono); font-size: 12.5px; }
        input { border-radius: 0 var(--baseRadius) var(--baseRadius) 0 !important; font-family: var(--mono); }
    }
    .templates { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 10px; }
    .template {
        display: grid; gap: 4px; padding: 12px 14px; margin: 0; cursor: pointer;
        border: 1px solid var(--baseAlt3Color); border-radius: var(--baseRadius); background: var(--baseColor);
        input { position: absolute; opacity: 0; pointer-events: none; }
        &.picked { border-color: var(--txtPrimaryColor); }
        &:has(input:focus-visible) { outline: 2px solid var(--txtPrimaryColor); outline-offset: 1px; }
        .template-title { font-weight: 600; display: flex; align-items: center; gap: 6px; }
        .template-desc { font-size: var(--smFontSize); color: var(--txtHintColor); }
        .template-repo { font-family: var(--mono); font-size: 12px; color: var(--txtDisabledColor); text-decoration: none; &:hover { color: var(--txtPrimaryColor); } }
    }

    .empty { padding: 26px 18px; border: 1px dashed var(--baseAlt3Color); border-radius: var(--lgRadius); margin-bottom: 14px; p { margin: 0; } p + p { margin-top: 4px; } }
    
    .cloud-log { margin-top: 20px; pre { max-height: 300px; overflow: auto; font-size: 0.85em; } }

    @keyframes pulse { 50% { opacity: 0.35; } }
    @media (prefers-reduced-motion: reduce) { .node .dot { animation: none !important; } }
    @media (max-width: 640px) {
        .node-head { grid-template-columns: 8px minmax(0, 1fr); grid-template-areas: "dot title" ". meta" ". actions"; .node-actions { justify-content: flex-start; margin-top: 4px; } }
        .branch { grid-template-columns: 1fr; grid-template-areas: "title" "meta" "actions"; .branch-actions { justify-content: flex-start; margin-left: -8px; } }
        .sheet.nested { margin-left: 18px; }
    }
</style>
