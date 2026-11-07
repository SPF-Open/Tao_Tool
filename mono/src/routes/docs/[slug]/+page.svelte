<script lang="ts">
  import { page } from "$app/state";
  import { Markdown, PageHeader } from "$lib/ui";
  import { getDoc } from "$lib/docs";
  import { docLang, LANG_LABELS, type DocLang } from "$lib/docLang";
  import { ArrowLeft, ArrowRight, BookOpen } from "lucide-svelte";

  const SITE_URL = "https://tao.lv0.eu";

  const slug = $derived(page.params.slug ?? "");
  const meta = $derived(getDoc(slug));

  let source = $state("");
  let loading = $state(true);
  let failed = $state(false);
  let retryToken = $state(0);

  async function fetchDoc(lang: DocLang, s: string) {
    const res = await fetch(`/docs/${lang}/${s}.md`);
    if (!res.ok) {
      if (lang !== "en") return fetchDoc("en", s);
      throw new Error("Not found");
    }
    return res.text();
  }

  // Every doc file starts with its own `# Title` + intro paragraph, but the
  // PageHeader hero already shows the title and summary — strip the lead so
  // the page has a single h1 and no duplicated intro.
  function stripLead(src: string): string {
    const lines = src.split("\n");
    if (!/^#\s/.test(lines[0] ?? "")) return src;
    let i = 1;
    while (i < lines.length && lines[i].trim() === "") i += 1;
    while (i < lines.length && lines[i].trim() !== "" && !/^#/.test(lines[i])) i += 1;
    return lines.slice(i).join("\n").replace(/^\s*\n+/, "");
  }

  const body = $derived(stripLead(source));

  $effect(() => {
    const current = slug;
    const currentLang = $docLang;
    retryToken;
    if (!getDoc(current)) {
      loading = false;
      return;
    }
    loading = true;
    failed = false;
    source = "";
    fetchDoc(currentLang, current)
      .then((text) => {
        if (slug === current && $docLang === currentLang) {
          source = text;
          loading = false;
        }
      })
      .catch(() => {
        if (slug === current && $docLang === currentLang) {
          failed = true;
          loading = false;
        }
      });
  });

  // Keep the document language attribute in sync so screen readers switch
  // pronunciation with the FR/NL content.
  $effect(() => {
    document.documentElement.lang = $docLang;
  });
</script>

<svelte:head>
  <title>{meta ? `${meta.title} — TAO docs` : "Documentation — TAO"}</title>
  <meta
    name="description"
    content={meta ? meta.description : "Documentation for the TAO toolkit."}
  />
  <link rel="canonical" href={`${SITE_URL}/docs/${slug}`} />
</svelte:head>

<main>
  <div class="top-bar">
    <a class="back-link" href="/docs">
      <ArrowLeft size={15} strokeWidth={1.75} />
      <span>All documentation</span>
    </a>

    <div class="lang-switcher" role="group" aria-label="Language">
      {#each Object.entries(LANG_LABELS) as [lang, label]}
        <button type="button"
          class="lang-btn"
          class:active={$docLang === lang}
          onclick={() => docLang.set(lang as DocLang)}
          aria-pressed={$docLang === lang}
        >
          {label}
        </button>
      {/each}
    </div>
  </div>

  {#if meta}
    <PageHeader
      icon={meta.icon}
      eyebrow={meta.eyebrow}
      title={meta.title}
      subtitle={meta.description}
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
        <p>This documentation could not be loaded.</p>
        <button type="button" class="retry-btn" onclick={() => (retryToken += 1)}>Retry</button>
      </div>
    {:else}
      <article class="doc-body">
        <Markdown source={body} />
      </article>
    {/if}
  {:else}
    <PageHeader
      icon={BookOpen}
      eyebrow="Help"
      title="Page not found"
      subtitle="There is no documentation for this page."
    />
    <a class="cta" href="/docs">
      <span>Browse all documentation</span>
      <ArrowRight size={15} strokeWidth={1.75} />
    </a>
  {/if}
</main>

<style>
  main {
    padding: 1.5rem 1.5rem 3rem;
    max-width: 820px;
    margin: 0 auto;
  }

  .top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.25rem;
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--text-muted);
    text-decoration: none;
    transition: color 0.15s;
  }

  .back-link:hover {
    color: var(--text);
  }

  .lang-switcher {
    display: flex;
    gap: 2px;
    padding: 3px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
  }

  .lang-btn {
    padding: 3px 10px;
    border: none;
    border-radius: var(--radius);
    background: transparent;
    color: var(--text-muted);
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }

  .lang-btn:hover {
    color: var(--text);
  }

  .lang-btn.active {
    background: var(--surface-elevated);
    color: var(--text);
    box-shadow: var(--shadow-sm);
  }

  .doc-body {
    margin-top: 0.5rem;
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

  .cta {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 0.5rem;
    font-weight: 500;
    color: var(--brand);
    text-decoration: none;
  }
</style>
