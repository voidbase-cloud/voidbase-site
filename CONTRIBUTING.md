# Contributing to voidbase.cloud

This repository is the [voidbase.cloud](https://voidbase.cloud) site and every documentation page on it. voidbase
itself lives in [voidbase-cloud/voidbase](https://github.com/voidbase-cloud/voidbase) and has
[its own guide](https://github.com/voidbase-cloud/voidbase/blob/master/CONTRIBUTING.md).

Documentation gets fixed by the people who trip over it, so nothing here needs to be a big change. A typo, a command
that does not work, a paragraph that assumes something you did not have: all of it is worth a pull request, and none
of it needs a discussion first.

## Fixing a page without cloning anything

Every documentation page has an **Improve this page** card at the bottom. It opens that page's source in GitHub's
editor, forks this repository for you if you do not already have one, and turns your edit into a pull request from
the browser. That is the whole path, and it is the one most changes should take.

The mapping is mechanical if you would rather find the file yourself: a page's URL is its path under `pages/`. So
`/docs/run/npm` is `pages/docs/run/npm.tsx`, and `/docs` is `pages/docs/index.tsx`.

## Running the site

```bash
git clone https://github.com/voidbase-cloud/voidbase-site.git
cd voidbase-site
bun install
bun run dev          # http://127.0.0.1:5173
```

`bun run build` does what CI does: a production build and a prerender of every page. Run it before opening a pull
request that touches more than prose, because a page that fails to prerender fails the build rather than degrading.

The site is [Void](https://void.cloud) in pages mode. Pages are files under `pages/`, a `<name>.server.ts` beside a
page sets its title and description, and shared pieces live in `src/components/`. The documentation sidebar, the
breadcrumbs and the previous/next pager all come from one list in `src/lib/docsNav.ts`: a new page is a file plus an
entry there, and nothing else.

## How these pages are written

The documentation has a house style, and matching it is most of what makes a change easy to merge.

- **Say what the thing does, not how it feels.** "The parser rejects a bad date and exits with code 2" rather than
  "errors are handled gracefully". If a sentence could appear unchanged in another project's documentation, it is
  not telling the reader anything about this one.
- **Real commands, run at least once.** Every command block on this site is meant to work when pasted. If you change
  one, run it.
- **Say what is missing.** Several pages point at things voidbase does not do yet, or does worse than a competitor.
  That is deliberate and it is why anyone trusts the rest. Do not quietly remove one.
- **Comments explain why.** In the components and the page files, the code says what it does; the comments are for
  the decisions that are not visible from reading it.

## Comparisons and numbers

The pages under `/docs/why` compare voidbase against other backends, and they follow two rules. Every page says what
the other product does better, first, because a comparison that finds no faults is an advertisement. And every price
or performance figure is either sourced from the vendor's own published rates or is labelled as a guess.

If you are correcting a number, include where it came from in the pull request. If a vendor changed their pricing,
that is a genuinely useful contribution and one we will not notice on our own.

## Commits

Commits follow [Conventional Commits](https://www.conventionalcommits.org): `docs: ...` for page content, `fix: ...`
for something broken, `feat: ...` for a new page or component. Keep the header under 100 characters. If your change
is a single typo, one commit saying so is fine.

## Reporting instead

If you would rather point at the problem than fix it, every page's card has a **Report it instead** link that opens
an issue prefilled with which page you were on. [Discussions](https://github.com/voidbase-cloud/voidbase/discussions)
are the place for questions and for anything you are not sure about yet.

## Licence

This repository is a fork of [pocketbase/site](https://github.com/pocketbase/site), which is MIT licensed and
Copyright (c) 2022 - present, Gani Georgiev. Its layout, stylesheets and components are still here, under that
copyright; the framework was changed from Svelte to React and the documentation was written from scratch.
[LICENSE](LICENSE) carries both notices, and contributions are made under the same terms.
