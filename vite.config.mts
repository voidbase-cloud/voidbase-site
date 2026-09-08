import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { voidPlugin } from "void";
import { voidReact } from "@void/react/plugin";
import { voidbaseAdapter } from "@voidbase-cloud/voidbase/adapter/plugin";

// The site is a Void app in React, prerendered by `output: "static"` in void.json; voidbaseAdapter turns the build
// into a voidbase app: the pages into pb_public, anything under routes/ into .voidbase/void-app.ts for main.ts.
export default defineConfig({
  plugins: [voidPlugin(), voidReact(), voidbaseAdapter()],
  envPrefix: "PB",
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  build: {
    rollupOptions: {
      treeshake: {
        // `marked` renders markdown on the server only (src/components/CodeBlock.tsx), but it ships no
        // "sideEffects": false, so the bundler has to assume importing it does something and keeps it in the client
        // build behind a branch that can never run. It does not; saying so is what lets the client drop it.
        // Everything else keeps Rollup's default, which is to assume a module may have side effects.
        moduleSideEffects: (id) => !id.includes("node_modules/marked/"),
      },
    },
  },
});
