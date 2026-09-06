// The site's voidbase backend (vb/): the PocketBase JS SDK against PB_VB_URL, plus the cloud control plane routes.
import PocketBase from "pocketbase";

export const VB_URL = (import.meta.env.PB_VB_URL || "http://127.0.0.1:8090").replace(/\/$/, "");

let client = null;
export function vb() {
    if (!client) {
        client = new PocketBase(VB_URL);
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
