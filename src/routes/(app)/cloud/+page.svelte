<script>
    import { onMount } from "svelte";
    import { vb, cloud, errorMessage, VB_URL } from "@/vb.js";

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

    onMount(() => {
        const pb = vb();
        signedIn = pb.authStore.isValid;
        const unsub = pb.authStore.onChange(() => {
            signedIn = pb.authStore.isValid;
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
            [release, instances] = await Promise.all([
                cloud("GET", "/api/vbcloud/release").catch(() => null),
                cloud("GET", "/api/vbcloud/instances").then((r) => r.instances),
            ]);
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
            <button type="button" class="btn btn-lg btn-primary" on:click={signIn} disabled={busy === "signin"}>
                <i class="ri-cloud-line" />
                <span class="txt">{busy === "signin" ? "Waiting for Cloudflare…" : "Sign in with Cloudflare"}</span>
            </button>
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
