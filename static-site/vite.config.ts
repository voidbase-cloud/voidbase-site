import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig, loadEnv } from "vite";

// `vite dev` on 5173 proxies the backend paths to the voidbase process on 8090, so the site can talk to it with
// relative URLs (PB_VB_URL empty), exactly as it does once it is served from pb_public by that same process.
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "PB");
    const backend = env.PB_VB_URL || "http://127.0.0.1:8090";
    return {
        plugins: [sveltekit()],
        envPrefix: "PB",
        server: {
            proxy: { "/api": { target: backend, changeOrigin: false }, "/_": { target: backend, changeOrigin: false } },
        },
    };
});
