import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

// The prerendered site lands in ../pb_public, the directory voidbase serves at / next to /api and /_/ (PocketBase's
// convention). Every route is a directory with an index.html (trailingSlash "always" in src/routes/+layout.js).
const config = {
    kit: {
        adapter: adapter({ pages: "../pb_public", assets: "../pb_public", fallback: undefined, precompress: false, strict: true }),
        alias: {
            "@": "src/lib",
        },
    },
    preprocess: [vitePreprocess()],
};

export default config;
