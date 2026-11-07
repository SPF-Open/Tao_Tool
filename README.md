# TAO Automation Platform

SvelteKit web application for the testing team of SPF Finances (P&O).
A suite of tools that automates and streamlines TAO-related workflows — building, formatting, auditing and analyzing exams — served from a single portal: [tao.lv0.eu](https://tao.lv0.eu).

> No changes will be made to comply with use cases other than those of the SPF Finances test team.

## Modules

All modules are reachable from the portal and documented in the in-app [documentation hub](https://tao.lv0.eu/docs).

| Module | Status | Description |
|--------|--------|-------------|
| **Import** | ✅ Available | Load an Excel workbook, map the question columns, preview parsed items and prepare a clean TAO question set |
| **Forge** | ✅ Available | Compose and schedule exams from scratch or from existing templates, with language-aware tooling |
| **Format** | ✅ Available | Upload a TAO QTI export and get the same ZIP back with every question prompt wrapped in bold, ready to re-import |
| **Editor** | ✅ Available | Edit every question of a TAO QTI export — prompt, answers, character limits, metadata — in a simple form or raw XML |
| **Export** | ✅ Available | Load ZIP exam archives, configure settings, preview questions and answers, export formatted result tables |
| **Audit** | ✅ Available | Compare a TAO export against its Excel source and flag critical, major and minor differences by severity |
| **IAT** | ✅ Available | Review item difficulty, discrimination and alternative statistics after an exam session |
| **Library** | ✅ Available | Build a portable SQLite question bank from TAO exports and search it instantly — all in your browser |

## Export — Options

- **General** — Show instructions, force questions to be ordered by title.
- **Paper test** — Show/hide answers, letter labels (A, B, C…), randomize answers and questions.
- **Advanced** — Inzage mode (underline the correct alternative, used during test review), compare test (two languages side by side, e.g. NL/FR), multiple/merged output files, zoom level.
- **Question filtering** — Export all questions or a selected subset.

## Requirements

- Node.js
- npm

## Installation

```sh
git clone git@github.com:SPF-Open/Tao_Tool.git
cd Tao_Tool/mono
npm install
npm run dev
```

Open the URL printed in the console.

## Build

```sh
npm run build
```

The app uses the Cloudflare adapter; output is placed in `.svelte-kit/cloudflare`. Deployment runs through Cloudflare Pages (git integration).

## Tests

```sh
npm run test:unit   # Vitest — unit & component tests
npm run test:e2e    # Playwright — end-to-end flows
npm test            # both
```

## Tech stack

- [SvelteKit](https://svelte.dev/docs/kit) 2 + Svelte 5
- TypeScript
- Tailwind CSS v4
- [zip.js](https://gildas-lormeau.github.io/zip.js/) — ZIP parsing
- [xlsx](https://sheetjs.com/) — Excel parsing & export
- [SQLite WASM](https://sqlite.org/wasm/) — in-browser question bank
- [marked](https://marked.js.org/) + [DOMPurify](https://github.com/cure53/DOMPurify) — Markdown rendering
- [Playwright](https://playwright.dev/) — end-to-end tests
- Cloudflare Pages — hosting & deployment
