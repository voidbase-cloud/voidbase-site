import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { voidPlugin } from "void";
import { voidReact } from "@void/react/plugin";
import { voidbaseAdapter } from "@voidbase-cloud/voidbase/adapter/plugin";
import { highlightPlugin } from "./scripts/highlight";

// The site is a Void app in React, prerendered by `output: "static"` in void.json; voidbaseAdapter turns the build
// into an instance. The admin panel answers at /admin behind a superuser session (the entry only: its own assets are
// stock PocketBase bytes the asset layer serves), and stays at /_/ as well, so a bookmark keeps working.
// into a voidbase app: the pages into pb_public, anything under routes/ into .voidbase/void-app.ts for main.ts.
export default defineConfig({
  plugins: [highlightPlugin(), voidPlugin(), voidReact(), voidbaseAdapter({ panel: { path: "/admin", guard: "superuser" } })],
  envPrefix: "PB",
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
