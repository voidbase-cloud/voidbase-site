import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { withVoidTSConfig } from "void/sveltekit";

const config = {
    kit: {
        adapter: adapter(),
        alias: {
            "@": "src/lib",
        },
        typescript: {
            config: withVoidTSConfig(),
        },
    },
    preprocess: [vitePreprocess()],
};

export default config;
