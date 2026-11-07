<script lang="ts">
  import { Markdown, PageHeader } from "$lib/ui";
  import { ArrowUp, History } from "lucide-svelte";
  import { fade } from "svelte/transition";

  const SITE_URL = "https://tao.lv0.eu";
  const PAGE_TITLE = "Changelog — TAO";
  const PAGE_DESC = "Release notes and version history for the TAO toolkit.";

  let source = $state("");
  let loading = $state(true);
  let failed = $state(false);
  let scrollY = $state(0);

  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ssr is disabled app-wide, so this always runs in the browser.
  async function load() {
    loading = true;
    failed = false;
    try {
      const res = await fetch("/export/CHANGELOG.md");
      if (!res.ok) throw new Error("Not found");
      source = await res.text();
    } catch {
      failed = true;
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    load();
  });

  // The rendered h3 ids are produced by Markdown.svelte's slugger
  // (dots become dashes, duplicates get a numeric suffix).
  const versions = $derived(
    failed
      ? []
      : [...source.matchAll(/^### ([\d.]+)\s*$/gm)].map((m, i, all) => {
          const version = m[1];
          const duplicatesBefore = all
            .slice(0, i)
            .filter((prev) => prev[1] === version).length;
          return {
            version,
            id: duplicatesBefore === 0
              ? version.replace(/\./g, "-")
              : `${version.replace(/\./g, "-")}-${duplicatesBefore}`,
          };
        })
  );

  // The PageHeader already provides the page title — drop the markdown's own
  // "## Changelog" heading to avoid a visible duplicate.
  const body = $derived(source.replace(/^## Changelog\s*\n+/, ""));

  function backToTop() {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }
</script>

<svelte:head>
  <title>{PAGE_TITLE}</title>
  <meta name="description" content={PAGE_DESC} />
  <link rel="canonical" href={`${SITE_URL}/changelog`} />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="TAO" />
  <meta property="og:title" content={PAGE_TITLE} />
  <meta property="og:description" content={PAGE_DESC} />
  <meta property="og:url" content={`${SITE_URL}/changelog`} />
  <meta property="og:image" content={`${SITE_URL}/og-image.png`} />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={PAGE_TITLE} />
  <meta name="twitter:description" content={PAGE_DESC} />
</svelte:head>

<svelte:window bind:scrollY />

<main>
  <PageHeader
    icon={History}
    eyebrow="Releases"
    title="Changelog"
    subtitle="What changed in each version of the TAO toolkit."
  />

  {#if loading}
    <div class="skeleton" aria-hidden="true" aria-busy="true">
      <div class="sk-line w-40"></div>
      <div class="sk-line w-full"></div>
      <div class="sk-line w-full"></div>
      <div class="sk-line w-2-3"></div>
    </div>
  {:else if failed}
    <div class="status" role="alert">
      <p>The changelog could not be loaded.</p>
      <button type="button" class="retry-btn" onclick={load}>Retry</button>
    </div>
  {:else}
    <div class="layout">
      <!-- The markdown's own "## Changelog" heading is stripped, so this
         visually hidden h2 restores a clean h1 → h2 → h3 outline. -->
      <h2 class="sr-only">Versions</h2>
      <article class="changelog-body">
        <Markdown source={body} />
      </article>
      {#if versions.length > 0}
        <nav class="toc" aria-label="Versions">
          <p class="toc-title">Versions</p>
          <ul>
            {#each versions as v (v.id)}
              <li>
                <a href={`#${v.id}`}>{v.version}</a>
              </li>
            {/each}
          </ul>
        </nav>
      {/if}
    </div>
  {/if}
</main>

{#if scrollY > 600 && !loading && !failed}
  <button
    type="button"
    class="back-top hide-print"
    aria-label="Back to top"
    onclick={backToTop}
    transition:fade={{ duration: reduceMotion ? 0 : 150 }}
  >
    <ArrowUp size={16} />
  </button>
{/if}

<style>
  main {
    padding: 1.5rem 1.5rem 3rem;
    max-width: 1120px;
    margin: 0 auto;
  }

  .layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    margin-top: 0.5rem;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
    border: 0;
  }

  .changelog-body {
    min-width: 0;
  }

  /* Version titles: mono digits, clearly distinct from list items. */
  .changelog-body :global(.md-prose h3) {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 1.15rem;
    letter-spacing: 0.01em;
    margin-top: 2.2rem;
    border-bottom: none;
  }

  /* Badge the first (most recent) release. */
  .changelog-body :global(.md-prose > h3:first-of-type)::after {
    content: "latest";
    display: inline-block;
    vertical-align: middle;
    margin-left: 0.6rem;
    padding: 0.1rem 0.55rem;
    border-radius: 999px;
    background: rgba(var(--brand-rgb), 0.12);
    border: 1px solid rgba(var(--brand-rgb), 0.35);
    color: var(--brand);
    font-family: var(--font-family);
    font-size: 0.62rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    transform: translateY(-0.1rem);
  }

  .toc {
    display: none;
  }

  .back-top {
    position: fixed;
    right: 1.25rem;
    bottom: 1.25rem;
    z-index: 90;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: 1px solid var(--border);
    border-radius: 999px;
    background: var(--surface-elevated);
    color: var(--text-muted);
    box-shadow: var(--shadow-lg);
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s;
  }

  .back-top:hover {
    color: var(--brand);
    border-color: rgba(var(--brand-rgb), 0.45);
  }

  .status {
    color: var(--text-muted);
    padding: 2rem 0;
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .status p {
    margin: 0;
  }

  .retry-btn {
    padding: 0.45rem 1rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface-elevated);
    color: var(--text);
    font-family: var(--font-family);
    font-size: 0.9rem;
    cursor: pointer;
  }

  .retry-btn:hover {
    border-color: rgba(var(--brand-rgb), 0.45);
    color: var(--brand);
  }

  .skeleton {
    padding: 1rem 0;
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
    animation: sk-pulse 1.4s ease-in-out infinite;
  }

  .sk-line {
    height: 0.9rem;
    border-radius: var(--radius);
    background: var(--surface);
  }

  .w-40 {
    width: 40%;
  }

  .w-full {
    width: 100%;
  }

  .w-2-3 {
    width: 66%;
  }

  @keyframes sk-pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.55;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .skeleton {
      animation: none;
      opacity: 0.7;
    }
  }

  /* Desktop: sticky version index in the right column. */
  @media (min-width: 961px) {
    .layout {
      grid-template-columns: minmax(0, 1fr) 200px;
      gap: 2.5rem;
    }

    .toc {
      display: block;
      position: sticky;
      top: calc(var(--layout-header-height) + 1.5rem);
      align-self: start;
      max-height: calc(100vh - var(--layout-header-height) - 3rem);
      overflow-y: auto;
      font-size: 0.82rem;
    }

    .toc-title {
      margin: 0 0 0.5rem;
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-muted);
    }

    .toc ul {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .toc a {
      display: block;
      padding: 0.2rem 0.55rem;
      border-radius: var(--radius);
      color: var(--text-muted);
      text-decoration: none;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    }

    .toc a:hover {
      color: var(--brand);
      background: var(--surface);
    }
  }
</style>
