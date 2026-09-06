# The site's source

SvelteKit, prerendered (`adapter-static`, every route a directory with an `index.html`). The fork of
[pocketbase/site](https://github.com/pocketbase/site) that voidbase.cloud is built from; the site design is Gani's
(PocketBase), the content is being rebranded.

```sh
bun install
bun run dev        # http://localhost:5173 with hot reload; /api and /_ are proxied to the backend on 8090
bun run build      # prerenders into ../pb_public (and indexes the docs with pagefind), which the backend serves at /
```

`.env.example` holds the public values the pages read (`PB_*`). `PB_VB_URL` stays empty: the backend serving
`pb_public` is the backend the `/cloud` page talks to. The pagefind index is rebuilt by `bun run build` and kept in
`static/pagefind` so the dev server has it too.
