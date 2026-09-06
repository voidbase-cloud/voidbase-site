<script>
    import { onMount } from "svelte";
    import { vb, cloud, errorMessage, VB_URL } from "@/vb.js";
    import CloudflareSignIn from "@/components/CloudflareSignIn.svelte";

    let ready = false;
    let signedIn = false;
    let me = null;
    let release = null;
    let instances = [];
    let error = "";
    let notice = "";
    let created = null; // credentials of the instance just created, shown once
    let busy = "";
    let name = "";
    let account = "";
    let creds = {};
    let logs = [];
    // template marketplace
    let github = null; // { configured, connected, connection }
    let templates = [];
    let repos = [];
    let repoForm = null; // { template, name, instance, private, domain }
    let linkForm = null; // { fullName, instance }
    $: linkable = instances.filter((i) => i.status === "live" && i.canLink); // instances a repository can be wired to (the site's own backend only for admins)

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
            if (!account && me?.connection?.accounts?.length) account = me.connection.accounts[0].id;
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

    async function signIn() {
        error = "";
        busy = "signin";
        try {
            await vb().collection("users").authWithOAuth2({ provider: "cloudflare" });
            await load();
        } catch (err) {
            error = errorMessage(err);
        } finally {
            busy = "";
        }
    }

    async function connectGithub() {
        error = "";
        busy = "github";
        try {
            const r = await cloud("GET", "/api/vbcloud/github/connect");
            location.href = r.url; // GitHub, then back here through the backend's callback
        } catch (err) {
            error = errorMessage(err);
            busy = "";
        }
    }

    async function disconnectGithub() {
        if (!confirm("Disconnect GitHub? Linked repositories stay in your account; this site only forgets the token.")) return;
        error = "";
        try {
            await cloud("DELETE", "/api/vbcloud/github");
            await load();
        } catch (err) {
            error = errorMessage(err);
        }
    }

    function startRepo(tpl) {
        linkForm = null;
        repoForm = { template: tpl.name, title: tpl.title, kind: tpl.kind, name: "", instance: linkable[0]?.id || "", private: false, domain: "" };
    }

    async function createRepo() {
        error = "";
        notice = "";
        busy = "repo";
        try {
            const r = await cloud("POST", "/api/vbcloud/repos", repoForm);
            notice = `${r.repo.fullName} created from ${repoForm.title} and wired to ${r.repo.instanceName}.`;
            repoForm = null;
            await load();
        } catch (err) {
            error = errorMessage(err);
        } finally {
            busy = "";
        }
    }

    function startLink() {
        repoForm = null;
        linkForm = { fullName: "", instance: linkable[0]?.id || "" };
    }

    async function linkRepo() {
        error = "";
        notice = "";
        busy = "link";
        try {
            const r = await cloud("POST", "/api/vbcloud/repos/link", linkForm);
            notice = `${r.repo.fullName} linked to ${r.repo.instanceName} (PB_VB_URL set to ${r.repo.instanceUrl}).`;
            linkForm = null;
            await load();
        } catch (err) {
            error = errorMessage(err);
        } finally {
            busy = "";
        }
    }

    async function unlinkRepo(repo) {
        if (!confirm(`Unlink ${repo.fullName}?\n\nThe repository stays in your GitHub account; this site just stops listing it.`)) return;
        error = "";
        try {
            await cloud("DELETE", `/api/vbcloud/repos/${repo.id}`);
            await load();
        } catch (err) {
            error = errorMessage(err);
        }
    }

    function signOut() {
        vb().authStore.clear();
        me = null;
        instances = [];
        release = null;
    }

    async function create() {
        error = "";
        notice = "";
        logs = [];
        busy = "create";
        try {
            const r = await cloud("POST", "/api/vbcloud/instances", { name, account });
            logs = r.log || [];
            notice = `${r.instance.name} is live at ${r.instance.url}`;
            created = r.credentials || null; // shown once: the password is not stored anywhere but the new instance
            name = "";
            await load();
        } catch (err) {
            error = errorMessage(err);
            logs = err?.response?.data?.log || [];
            await load().catch(() => {});
        } finally {
            busy = "";
        }
    }

    async function remove(inst) {
        const what = inst.self ? `${inst.name} — THIS SITE'S OWN BACKEND. The cloud page stops working until it is deployed again.` : inst.name;
        if (!confirm(`Delete ${what}\n\nThe Worker, its D1 database, R2 bucket and queue are removed. This cannot be undone.`)) return;
        if (inst.self && prompt(`This is the backend serving this page. Type its name (${inst.name}) to confirm.`) !== inst.name) return;
        error = "";
        notice = "";
        logs = [];
        busy = "delete:" + inst.id;
        try {
            const r = await cloud("DELETE", `/api/vbcloud/instances/${inst.id}`);
            logs = r.log || [];
            notice = `${inst.name} deleted (${r.deleted.length} resources removed${r.skipped.length ? `, ${r.skipped.length} already gone` : ""}).`;
            if (inst.self) {
                instances = instances.filter((i) => i.id !== inst.id);
            } else {
                await load();
            }
        } catch (err) {
            error = errorMessage(err);
            await load().catch(() => {});
        } finally {
            busy = "";
        }
    }

    async function showCredentials(inst) {
        error = "";
        try {
            const c = await cloud("GET", `/api/vbcloud/instances/${inst.id}/credentials`);
            creds = { ...creds, [inst.id]: c };
        } catch (err) {
            error = errorMessage(err);
        }
    }

    function hideCredentials(inst) {
        const next = { ...creds };
        delete next[inst.id];
        creds = next;
    }
</script>

<svelte:head>
    <title>Cloud - voidbase</title>
</svelte:head>

<div class="page-content">
    <nav class="breadcrumbs">
        <div class="breadcrumb-item">Cloud</div>
    </nav>

    <h1>voidbase cloud</h1>
    <p class="txt-hint">
        Sign in with your Cloudflare account and create a voidbase instance on it with one click: a Worker with the
        admin panel, a D1 database, an R2 bucket and a queue, all in your own account. Deleting removes them again.
        The backend of this page is itself such an instance.
    </p>

    {#if !ready}
        <div class="loader" />
    {:else if !signedIn}
        <div class="cloud-panel">
            <CloudflareSignIn class="btn btn-lg btn-primary" />
            <p class="txt-hint m-t-10 m-b-0">
                Cloudflare shows which account(s) and permissions this site asks for. Nothing is created until you click
                create. Backend: <code>{VB_URL}</code>
            </p>
        </div>
    {:else}
        <div class="cloud-toolbar">
            <div>
                {#if me}
                    Signed in as <strong>{me.user.email || me.user.name}</strong>
                    {#if me.admin}<span class="label">admin</span>{/if}
                    {#if me.connected}
                        · Cloudflare: {me.connection.email}
                        ({(me.connection.accounts || []).map((a) => a.name || a.id).join(", ") || "no account granted"})
                    {/if}
                {/if}
            </div>
            <div class="flex-fill" />
            <button type="button" class="btn btn-sm btn-secondary" on:click={load}>Refresh</button>
            <button type="button" class="btn btn-sm btn-secondary" on:click={signOut}>Sign out</button>
        </div>

        {#if me && !me.providerConfigured}
            <div class="alert alert-warning"><div class="content">The backend has no Cloudflare OAuth client configured (CF_OAUTH_CLIENT_ID). See vb/.env.example.</div></div>
        {/if}
        {#if error}
            <div class="alert alert-danger"><div class="content">{error}</div></div>
        {/if}
        {#if notice}
            <div class="alert alert-success"><div class="content">{notice}</div></div>
        {/if}
        {#if created}
            <div class="alert alert-warning">
                <div class="content">
                    <p><strong>Save these now.</strong> The superuser password is shown only once; it is not stored by this site (reset it from the instance's own dashboard if you lose it).</p>
                    <p>
                        Dashboard <a href={created.panel} target="_blank" rel="noopener noreferrer">{created.panel}</a>
                        · email <code>{created.superuserEmail}</code>
                        · password <code>{created.superuserPassword}</code>
                    </p>
                    <button type="button" class="btn btn-sm btn-secondary" on:click={() => (created = null)}>I saved them</button>
                </div>
            </div>
        {/if}

        <h2>Your instances</h2>
        {#if !instances.length}
            <p class="txt-hint">No instances yet.</p>
        {:else}
            <div class="table-wrapper">
                <table class="table">
                    <thead>
                        <tr><th>Name</th><th>Status</th><th>Account</th><th>Release</th><th>Links</th><th /></tr>
                    </thead>
                    <tbody>
                        {#each instances as inst (inst.id)}
                            <tr>
                                <td>
                                    <strong>{inst.name}</strong>
                                    {#if inst.self}<span class="label label-warning" title="This is the backend serving this very page">this site's backend</span>{/if}
                                    {#if inst.error}<div class="txt-hint txt-danger">{inst.error}</div>{/if}
                                </td>
                                <td><span class="label label-{inst.status}">{inst.status}</span></td>
                                <td>{inst.account.name || inst.account.id}</td>
                                <td><code>{inst.release || "—"}</code></td>
                                <td>
                                    {#if inst.url}
                                        <a href="{inst.url}/api/health" target="_blank" rel="noopener noreferrer">API</a>
                                        · <a href="{inst.url}/_/" target="_blank" rel="noopener noreferrer">Dashboard</a>
                                    {/if}
                                </td>
                                <td class="actions">
                                    {#if inst.superuserEmail}
                                        {#if creds[inst.id]}
                                            <button type="button" class="btn btn-sm btn-secondary" on:click={() => hideCredentials(inst)}>Hide</button>
                                        {:else}
                                            <button type="button" class="btn btn-sm btn-secondary" on:click={() => showCredentials(inst)}>Credentials</button>
                                        {/if}
                                    {/if}
                                    {#if inst.canDelete}
                                        <button
                                            type="button"
                                            class="btn btn-sm btn-danger"
                                            disabled={busy === "delete:" + inst.id || inst.status === "deleting"}
                                            on:click={() => remove(inst)}
                                        >
                                            {busy === "delete:" + inst.id ? "Deleting…" : "Delete"}
                                        </button>
                                    {/if}
                                </td>
                            </tr>
                            {#if creds[inst.id]}
                                <tr class="creds">
                                    <td colspan="6">
                                        Dashboard <a href={creds[inst.id].panel} target="_blank" rel="noopener noreferrer">{creds[inst.id].panel}</a>
                                        · email <code>{creds[inst.id].superuserEmail}</code>
                                        · password: shown once at creation (reset it from the instance's dashboard)
                                    </td>
                                </tr>
                            {/if}
                        {/each}
                    </tbody>
                </table>
            </div>
        {/if}

        {#if me && !me.user.superuser}
            <h2>Templates</h2>
            <p class="txt-hint">
                Start from a template: a repository is created from it in your GitHub account and wired to one of your
                instances (the instance URL becomes a repository variable its workflow reads). This site is the first
                template.
            </p>
            {#if github && !github.configured}
                <div class="alert alert-warning"><div class="content">The backend has no GitHub OAuth app configured (GH_OAUTH_CLIENT_ID). See vb/.env.example.</div></div>
            {:else if github && !github.connected}
                <div class="cloud-panel">
                    <button type="button" class="btn btn-secondary" on:click={connectGithub} disabled={busy === "github"}>
                        <i class="ri-github-fill" />
                        <span class="txt">{busy === "github" ? "Going to GitHub…" : "Connect GitHub"}</span>
                    </button>
                    <p class="txt-hint m-t-10 m-b-0">GitHub asks for repository access ({github.scopes}) so this site can create repositories from templates in your account and set their variables.</p>
                </div>
            {:else if github}
                <div class="cloud-toolbar">
                    <div><i class="ri-github-fill" /> GitHub: <strong>@{github.connection.login}</strong></div>
                    <div class="flex-fill" />
                    <button type="button" class="btn btn-sm btn-secondary" disabled={!linkable.length} title={!linkable.length ? "Create an instance first" : "Wire a repository you already have to one of your instances"} on:click={startLink}>Link a repository</button>
                    <button type="button" class="btn btn-sm btn-secondary" on:click={disconnectGithub}>Disconnect</button>
                </div>
            {/if}

            <div class="templates">
                {#each templates as tpl (tpl.id)}
                    <div class="template">
                        <div class="template-body">
                            <strong>{tpl.title}</strong>
                            <span class="label">{tpl.kind}</span>
                            <p class="txt-hint m-t-5 m-b-5">{tpl.description}</p>
                            <a href={tpl.url} target="_blank" rel="noopener noreferrer" class="txt-hint">{tpl.repo}</a>
                        </div>
                        <div class="template-actions">
                            <button type="button" class="btn btn-sm btn-primary" disabled={!github?.connected || !linkable.length} on:click={() => startRepo(tpl)} title={!github?.connected ? "Connect GitHub first" : !linkable.length ? "Create an instance first" : ""}>Use this template</button>
                        </div>
                    </div>
                {/each}
            </div>

            {#if repoForm}
                <form class="cloud-form repo-form" on:submit|preventDefault={createRepo}>
                    <h3 class="form-title">New repository from {repoForm.title}</h3>
                    <label>Repository name <input type="text" bind:value={repoForm.name} placeholder="my-site" required /></label>
                    <label>Instance
                        <select bind:value={repoForm.instance} required>
                            {#each linkable as inst}<option value={inst.id}>{inst.name} ({inst.url})</option>{/each}
                        </select>
                    </label>
                    {#if repoForm.kind === "site"}
                        <label>Custom domain for GitHub Pages (optional) <input type="text" bind:value={repoForm.domain} placeholder="www.example.com" /></label>
                    {/if}
                    <label class="inline"><input type="checkbox" bind:checked={repoForm.private} /> Private repository</label>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary" disabled={busy === "repo"}>{busy === "repo" ? "Creating…" : "Create repository"}</button>
                        <button type="button" class="btn btn-secondary" on:click={() => (repoForm = null)}>Cancel</button>
                    </div>
                </form>
            {/if}

            {#if linkForm}
                <form class="cloud-form repo-form" on:submit|preventDefault={linkRepo}>
                    <h3 class="form-title">Link a repository you already have</h3>
                    <label>Repository (owner/name or URL) <input type="text" bind:value={linkForm.fullName} placeholder="you/my-site" required /></label>
                    <label>Instance
                        <select bind:value={linkForm.instance} required>
                            {#each linkable as inst}<option value={inst.id}>{inst.name} ({inst.url})</option>{/each}
                        </select>
                    </label>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary" disabled={busy === "link"}>{busy === "link" ? "Linking…" : "Link repository"}</button>
                        <button type="button" class="btn btn-secondary" on:click={() => (linkForm = null)}>Cancel</button>
                    </div>
                    <p class="txt-hint form-hint">Its <code>PB_VB_URL</code> Actions variable is set to the instance URL; nothing else in the repository changes.</p>
                </form>
            {/if}

            <h2>Your repositories</h2>
            {#if !repos.length}
                <p class="txt-hint">No repository is linked to an instance yet.</p>
            {:else}
                <div class="table-wrapper">
                    <table class="table">
                        <thead><tr><th>Repository</th><th>Template</th><th>Instance</th><th>Connected</th><th></th></tr></thead>
                        <tbody>
                            {#each repos as repo (repo.id)}
                                <tr>
                                    <td><a href={repo.live?.htmlUrl || repo.htmlUrl} target="_blank" rel="noopener noreferrer">{repo.fullName}</a>{#if repo.system} <span class="label label-warning" title="The repository this very page is built from, wired to this site's backend">this site</span>{/if}{#if repo.private || repo.live?.private} <span class="label">private</span>{/if}{#if repo.status !== "ready"} <span class="label label-{repo.status}">{repo.status}</span>{/if}</td>
                                    <td>{repo.templateTitle || repo.templateName || "—"}</td>
                                    <td>{#if repo.instanceUrl}<a href={repo.instanceUrl} target="_blank" rel="noopener noreferrer">{repo.instanceName}</a>{:else}{repo.instanceName || "—"}{/if}</td>
                                    <td>
                                        {#if !repo.live?.checked}<span class="txt-hint">not checked</span>
                                        {:else if !repo.live.exists}<span class="label label-error">repository gone</span>
                                        {:else if repo.live.connected}<span class="label label-live">yes</span>
                                        {:else}<span class="label label-warning" title="PB_VB_URL is {repo.live.backendUrl || 'unset'}">no</span>{/if}
                                    </td>
                                    <td class="actions">
                                        <a href="{repo.live?.htmlUrl || repo.htmlUrl}/actions" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-secondary">Actions</a>
                                        {#if repo.canUnlink}<button type="button" class="btn btn-sm btn-secondary" on:click={() => unlinkRepo(repo)}>Unlink</button>{/if}
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            {/if}

            <h2>Create an instance</h2>
            {#if !release || !release.current}
                <div class="alert alert-warning"><div class="content">No voidbase release has been uploaded to this backend yet (<code>voidbase bundle --push</code>).</div></div>
            {:else}
                <p class="txt-hint">Release <code>{release.current}</code> (voidbase {release.voidbase}, built {release.builtAt.slice(0, 16).replace("T", " ")}).</p>
            {/if}
            <form class="cloud-form" on:submit|preventDefault={create}>
                <div class="form-field">
                    <label for="name">Name</label>
                    <div class="inline-flex">
                        <span class="txt-hint">{me.prefix}</span>
                        <input id="name" type="text" bind:value={name} placeholder="my-app" required pattern="[a-zA-Z0-9\- ]+" />
                    </div>
                </div>
                <div class="form-field">
                    <label for="account">Cloudflare account</label>
                    <select id="account" bind:value={account} required>
                        {#each me.connection?.accounts || [] as a}
                            <option value={a.id}>{a.name || a.id}</option>
                        {/each}
                    </select>
                </div>
                <button type="submit" class="btn btn-primary" disabled={busy === "create" || !me.connected || !release?.current}>
                    {busy === "create" ? "Creating… (about a minute)" : "Create instance"}
                </button>
            </form>
            <p class="txt-hint">Up to {me.maxInstances} instances per account here; the Workers Free plan allows 10 D1 databases.</p>
        {/if}

        {#if logs.length}
            <details class="cloud-log" open>
                <summary>Log</summary>
                <pre>{logs.join("\n")}</pre>
            </details>
        {/if}
    {/if}
</div>

<style lang="scss">
    .templates { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 15px; margin: 15px 0 25px; }
    .template { display: flex; flex-direction: column; gap: 10px; padding: 15px; border: 1px solid var(--baseAlt2Color); border-radius: var(--lgRadius); background: var(--baseColor); }
    .template-body .label { margin-left: 6px; }
    .template-actions { margin-top: auto; }
    .cloud-form label.inline { display: flex; align-items: center; gap: 8px; }
    .repo-form { padding: 15px; border: 1px solid var(--baseAlt2Color); border-radius: var(--lgRadius); margin-bottom: 25px; }
    .repo-form .form-title { flex-basis: 100%; margin: 0 0 5px; }
    .repo-form .form-actions { margin-top: 0; }
    .repo-form .form-hint { flex-basis: 100%; margin: 0; }
    .form-actions { display: flex; gap: 10px; margin-top: 10px; }
    .cloud-panel { padding: var(--baseSpacing, 30px) 0; }
    .cloud-toolbar { display: flex; align-items: center; gap: 10px; margin: 20px 0; flex-wrap: wrap; }
    .flex-fill { flex: 1; }
    .table-wrapper { overflow-x: auto; }
    .table td.actions { white-space: nowrap; text-align: right; }
    .table td.actions .btn { margin-left: 5px; }
    .table tr.creds td { font-size: 0.9em; background: var(--baseAlt1Color, rgba(0, 0, 0, 0.03)); }
    .label { display: inline-block; padding: 1px 8px; border-radius: 12px; font-size: 0.8em; background: var(--baseAlt2Color, #eee); margin-left: 5px; vertical-align: middle; }
    .label-live { background: var(--successAltColor); color: var(--successColor); }
    .label-creating, .label-deleting { background: var(--warningAltColor); color: var(--warningColor); }
    .label-error { background: var(--dangerAltColor); color: var(--dangerColor); }
    .label-warning { background: var(--warningAltColor); color: var(--warningColor); }
    .txt-danger { color: var(--dangerColor); }
    .btn-danger { background: var(--dangerColor); color: #fff; border-color: var(--dangerColor); }
    .cloud-form { display: flex; gap: 15px; align-items: flex-end; flex-wrap: wrap; margin-bottom: 10px; }
    .cloud-form .form-field { margin: 0; min-width: 220px; }
    .cloud-form .inline-flex { align-items: center; gap: 4px; }
    .cloud-form input, .cloud-form select { padding: 8px 10px; border: 1px solid var(--baseAlt2Color, #ddd); border-radius: 6px; width: 100%; }
    .cloud-log pre { max-height: 300px; overflow: auto; font-size: 0.85em; }
</style>
