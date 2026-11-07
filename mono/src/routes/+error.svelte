<script lang="ts">
  import { page } from "$app/state";
  import { afterNavigate } from "$app/navigation";
  import { onMount } from "svelte";
  import DotCanvas from "$lib/ui/DotCanvas.svelte";
  import { Compass, BookOpen } from "lucide-svelte";
  import { getDoc } from "$lib/docs";

  // Editorial fallback for every status; the raw technical message (if any)
  // is demoted to a muted detail line instead of becoming the headline.
  const is404 = $derived(page.status === 404);
  const message = $derived(is404 ? "This page does not exist." : "Something went wrong.");
  const detail = $derived(
    !is404 && page.error?.message ? page.error.message : null
  );
  const requested = $derived(page.url?.pathname ?? "");
  // Offer the closest real destination: the doc page when the slug is one,
  // otherwise the docs index ("/docs/fr" would just be another 404).
  const docsHref = $derived.by(() => {
    if (requested.startsWith("/docs/")) {
      const slug = requested.split("/")[2] ?? "";
      if (slug && getDoc(slug)) return `/docs/${slug}`;
    }
    return "/docs";
  });

  // SPA errors arrive without a page load — move focus so screen readers
  // announce the error instead of silence. afterNavigate runs after
  // SvelteKit's own focus reset; the double rAF covers the initial load,
  // where hydration finishes after onMount.
  let heading: HTMLHeadingElement;
  function focusHeading() {
    requestAnimationFrame(() => requestAnimationFrame(() => heading?.focus()));
  }
  onMount(focusHeading);
  afterNavigate(focusHeading);
</script>

<svelte:head>
  <title>{page.status} — TAO</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="error-page">
  <div class="error-bg" aria-hidden="true">
    <DotCanvas />
  </div>
  <div class="error-halo" aria-hidden="true"></div>

  <div class="error-content">
    <p class="sr-only" role="alert">Error {page.status}: {message}</p>
    <div class="error-icon">
      <Compass size={20} strokeWidth={1.75} />
    </div>
    <p class="error-status">{page.status}</p>
    <h1 class="error-title" tabindex="-1" bind:this={heading}>{message}</h1>
    {#if requested && requested !== "/"}
      <p class="error-requested">Requested: <code>{requested}</code></p>
    {/if}
    <p class="error-hint">Check the address, or head back to the tools overview.</p>
    {#if detail}
      <p class="error-detail">{detail}</p>
    {/if}
    <div class="error-links">
      <a class="error-home" href="/">Back to home</a>
      <a class="error-docs" href={docsHref}><BookOpen size={15} strokeWidth={1.75} /> Browse documentation</a>
    </div>
  </div>
</div>

<style>
  .error-page {
    position: relative;
    min-height: calc(100dvh - var(--layout-header-height));
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    text-align: center;
    padding: 48px 16px;
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

  .error-bg {
    position: absolute;
    inset: 0;
  }

  .error-halo {
    position: absolute;
    width: 480px;
    height: 480px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(var(--brand-rgb), 0.10) 0%, transparent 65%);
    pointer-events: none;
  }

  .error-content {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    animation: rise 500ms cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  .error-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: var(--radius-lg);
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--text-muted);
    margin-bottom: 6px;
  }

  .error-status {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.14em;
    color: rgba(var(--brand-rgb), 0.9);
  }

  .error-title {
    margin: 0;
    font-size: clamp(1.4rem, 3.5vw, 2rem);
    font-weight: 700;
    letter-spacing: -0.03em;
    color: var(--text);
    outline: none;
  }

  .error-title:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.22);
    border-radius: var(--radius);
  }

  .error-requested {
    margin: 0;
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  .error-requested code {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.78rem;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 0.1em 0.4em;
    overflow-wrap: anywhere;
  }

  .error-hint {
    margin: 0;
    font-size: 0.95rem;
    color: var(--text-muted);
    max-width: 420px;
  }

  .error-detail {
    margin: 0;
    font-size: 0.78rem;
    color: var(--text-muted);
    max-width: 420px;
    overflow-wrap: anywhere;
  }

  .error-links {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    flex-wrap: wrap;
    justify-content: center;
    margin-top: 14px;
  }

  .error-home {
    padding: 9px 18px;
    border-radius: var(--radius-lg);
    border: 1px solid var(--border);
    background: var(--surface-elevated);
    color: var(--text);
    font-size: 0.9rem;
    font-weight: 600;
    text-decoration: none;
    transition: border-color 150ms ease, color 150ms ease, background-color 150ms ease;
  }

  .error-home:hover {
    border-color: rgba(var(--brand-rgb), 0.5);
    color: var(--brand);
    background: rgba(var(--brand-rgb), 0.08);
  }

  .error-home:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.18);
  }

  .error-docs {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--text-muted);
    text-decoration: none;
    transition: color 150ms ease;
  }

  .error-docs:hover {
    color: var(--brand);
  }

  .error-docs:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.18);
    border-radius: var(--radius);
  }

  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(16px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .error-content {
      animation: none;
    }
  }
</style>
