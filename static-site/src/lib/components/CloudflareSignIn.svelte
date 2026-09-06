<script>
    // "Sign in with Cloudflare" for the header and the cloud page: PocketBase's OAuth2 popup flow against the site's
    // backend (`cloudflare` provider). Signed in, it becomes the link to the visitor's instances.
    // The mark is Cloudflare's unmodified logo (devicons.io copy of the official artwork). Cloudflare's trademark page
    // allows the name in word form for referential use and asks for written permission to use the logo itself, so
    // `logo={false}` gives the word-only button should that permission not be in hand.
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { vb, errorMessage } from "@/vb.js";

    let classes = "btn";
    export { classes as class }; // "btn" (default), "btn btn-lg", "dropdown-item"
    export let logo = true;
    export let label = "Sign in with Cloudflare";

    let signedIn = false;
    let email = "";
    let busy = false;
    let error = "";

    onMount(() => {
        const pb = vb();
        const sync = () => {
            signedIn = pb.authStore.isValid;
            const user = pb.authStore.record || pb.authStore.model;
            email = user?.email || user?.name || "";
        };
        sync();
        return pb.authStore.onChange(sync);
    });

    async function signIn() {
        error = "";
        busy = true;
        try {
            await vb().collection("users").authWithOAuth2({ provider: "cloudflare" });
            await goto("/cloud");
        } catch (err) {
            error = errorMessage(err);
            console.error("Sign in with Cloudflare failed:", err);
        } finally {
            busy = false;
        }
    }
</script>

{#if signedIn}
    <a href="/cloud" class="{classes} cf-signin" title={email ? `Signed in as ${email}` : "Signed in"} data-sveltekit-preload-data>
        {#if logo}<svg class="cf-mark" viewBox="0 0 128 128" aria-hidden="true"><path fill="#FFF" d="m115.679 69.288-15.591-8.94-2.689-1.163-63.781.436v32.381h82.061z"/><path fill="#F38020" d="M87.295 89.022c.763-2.617.472-5.015-.8-6.796-1.163-1.635-3.125-2.58-5.488-2.689l-44.737-.581c-.291 0-.545-.145-.691-.363s-.182-.509-.109-.8c.145-.436.581-.763 1.054-.8l45.137-.581c5.342-.254 11.157-4.579 13.192-9.885l2.58-6.723c.109-.291.145-.581.073-.872-2.906-13.158-14.644-22.97-28.672-22.97-12.938 0-23.913 8.359-27.838 19.952a13.35 13.35 0 0 0-9.267-2.58c-6.215.618-11.193 5.597-11.811 11.811-.145 1.599-.036 3.162.327 4.615C10.104 70.051 2 78.337 2 88.549c0 .909.073 1.817.182 2.726a.895.895 0 0 0 .872.763h82.57c.472 0 .909-.327 1.054-.8l.617-2.216z"/><path fill="#FAAE40" d="M101.542 60.275c-.4 0-.836 0-1.236.036-.291 0-.545.218-.654.509l-1.744 6.069c-.763 2.617-.472 5.015.8 6.796 1.163 1.635 3.125 2.58 5.488 2.689l9.522.581c.291 0 .545.145.691.363.145.218.182.545.109.8-.145.436-.581.763-1.054.8l-9.924.582c-5.379.254-11.157 4.579-13.192 9.885l-.727 1.853c-.145.363.109.727.509.727h34.089c.4 0 .763-.254.872-.654.581-2.108.909-4.325.909-6.614 0-13.447-10.975-24.422-24.458-24.422"/></svg>{/if}
        <span class="txt">Your instances</span>
    </a>
{:else}
    <button type="button" class="{classes} cf-signin" on:click={signIn} disabled={busy} title={error || "Sign in with your Cloudflare account"}>
        {#if logo}<svg class="cf-mark" viewBox="0 0 128 128" aria-hidden="true"><path fill="#FFF" d="m115.679 69.288-15.591-8.94-2.689-1.163-63.781.436v32.381h82.061z"/><path fill="#F38020" d="M87.295 89.022c.763-2.617.472-5.015-.8-6.796-1.163-1.635-3.125-2.58-5.488-2.689l-44.737-.581c-.291 0-.545-.145-.691-.363s-.182-.509-.109-.8c.145-.436.581-.763 1.054-.8l45.137-.581c5.342-.254 11.157-4.579 13.192-9.885l2.58-6.723c.109-.291.145-.581.073-.872-2.906-13.158-14.644-22.97-28.672-22.97-12.938 0-23.913 8.359-27.838 19.952a13.35 13.35 0 0 0-9.267-2.58c-6.215.618-11.193 5.597-11.811 11.811-.145 1.599-.036 3.162.327 4.615C10.104 70.051 2 78.337 2 88.549c0 .909.073 1.817.182 2.726a.895.895 0 0 0 .872.763h82.57c.472 0 .909-.327 1.054-.8l.617-2.216z"/><path fill="#FAAE40" d="M101.542 60.275c-.4 0-.836 0-1.236.036-.291 0-.545.218-.654.509l-1.744 6.069c-.763 2.617-.472 5.015.8 6.796 1.163 1.635 3.125 2.58 5.488 2.689l9.522.581c.291 0 .545.145.691.363.145.218.182.545.109.8-.145.436-.581.763-1.054.8l-9.924.582c-5.379.254-11.157 4.579-13.192 9.885l-.727 1.853c-.145.363.109.727.509.727h34.089c.4 0 .763-.254.872-.654.581-2.108.909-4.325.909-6.614 0-13.447-10.975-24.422-24.458-24.422"/></svg>{/if}
        <span class="txt">{busy ? "Waiting for Cloudflare…" : error ? "Sign-in failed, try again" : label}</span>
    </button>
{/if}

<style>
    .cf-mark {
        width: 1.45em;
        height: 1.45em;
        flex-shrink: 0;
        vertical-align: middle;
    }
    /* the mark keeps clear space around it: the button's own padding, and a gap to the label */
    .cf-signin {
        column-gap: 8px;
    }
</style>
