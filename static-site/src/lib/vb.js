// The site's voidbase backend: the PocketBase JS SDK against the origin this site is served from (the backend serves
// pb_public itself, so "/" is right in production and behind the vite dev proxy); PB_VB_URL points elsewhere when set.
import PocketBase from "pocketbase";

export const VB_URL = (import.meta.env.PB_VB_URL || "").replace(/\/$/, "");

let client = null;
export function vb() {
    if (!client) {
        client = new PocketBase(VB_URL || "/");
        client.autoCancellation(false);
    }
    return client;
}

// JSON call to /api/vbcloud/* with the current auth token (pb.send adds it and serialises the body)
export function cloud(method, path, body) {
    return vb().send(path, { method, body });
}

export function errorMessage(err) {
    const data = err?.response || err?.data || {};
    return data.message || err?.message || String(err);
}
