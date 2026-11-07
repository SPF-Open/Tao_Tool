<script lang="ts">
  import { marked, type RendererObject, type Tokens } from 'marked';
  import DOMPurify from 'dompurify';

  let { source = '' }: { source?: string } = $props();

  // Stable ids on headings so long pages (changelog, docs) can be deep-linked
  // via anchors. Duplicates get a numeric suffix (the changelog has a
  // duplicated "2.9.0" heading in its source).
  const seenIds = new Map<string, number>();
  function headingId(html: string): string {
    const base =
      html
        .replace(/<[^>]+>/g, '')
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[^\p{L}\p{N}]+/gu, '-')
        .replace(/^-+|-+$/g, '') || 'section';
    const count = seenIds.get(base) ?? 0;
    seenIds.set(base, count + 1);
    return count === 0 ? base : `${base}-${count}`;
  }

  const renderer: RendererObject = {
    heading(this: { parser: { parseInline(tokens: Tokens.Generic[]): string } }, { tokens, depth }: Tokens.Heading) {
      const text = this.parser.parseInline(tokens);
      return `<h${depth} id="${headingId(text)}">${text}</h${depth}>\n`;
    }
  };
  marked.use({ renderer });

  // ssr is disabled app-wide, so this always runs in the browser where
  // DOMPurify has a DOM. The source is our own trusted markdown, but we
  // sanitise anyway as a defence-in-depth measure.
  function renderMarkdown(src: string): string {
    seenIds.clear();
    return DOMPurify.sanitize(marked.parse(src, { async: false }) as string);
  }

  const html = $derived(renderMarkdown(source));
</script>

<!-- eslint-disable-next-line svelte/no-at-html-tags -->
<div class="md-prose">
  {@html html}
</div>

<style>
  /* Named `md-prose` (not `prose`) on purpose: the `prose` name collides with
     Tailwind Typography, whose defaults (max-width: 65ch, code::before/after
     backticks, 12.9px body) would otherwise leak in on top of these styles. */
  .md-prose {
    color: var(--text);
    font-size: 1.1rem;
    line-height: 1.65;
    max-width: 70ch;
    margin-inline: auto;
  }

  .md-prose :global(h1),
  .md-prose :global(h2),
  .md-prose :global(h3),
  .md-prose :global(h4) {
    color: var(--text);
    font-weight: 600;
    letter-spacing: -0.01em;
    line-height: 1.25;
    scroll-margin-top: calc(var(--layout-header-height) + 12px);
  }

  .md-prose :global(h1) {
    font-size: 1.5rem;
    margin: 0 0 1rem;
  }

  .md-prose :global(h2) {
    font-size: 1.25rem;
    margin: 1.75rem 0 0.75rem;
    padding-bottom: 0.4rem;
    border-bottom: 1px solid var(--border);
  }

  .md-prose :global(h3) {
    font-size: 1.08rem;
    margin: 1.35rem 0 0.5rem;
  }

  .md-prose :global(h4) {
    font-size: 0.95rem;
    color: var(--text-muted);
    margin: 1.1rem 0 0.4rem;
  }

  .md-prose :global(p) {
    margin: 0 0 0.85rem;
  }

  .md-prose :global(a) {
    color: var(--brand);
    text-decoration: none;
    border-bottom: 1px solid rgba(var(--brand-rgb), 0.35);
  }

  .md-prose :global(a:hover) {
    border-bottom-color: var(--brand);
  }

  .md-prose :global(ul),
  .md-prose :global(ol) {
    margin: 0 0 0.9rem;
    padding-left: 1.35rem;
  }

  .md-prose :global(li) {
    margin-bottom: 0.3rem;
  }

  .md-prose :global(li > ul),
  .md-prose :global(li > ol) {
    margin: 0.3rem 0 0.3rem;
  }

  .md-prose :global(li::marker) {
    color: var(--text-muted);
  }

  .md-prose :global(strong) {
    color: var(--text);
    font-weight: 600;
  }

  .md-prose :global(hr) {
    border: none;
    border-top: 1px solid var(--border);
    margin: 1.5rem 0;
  }

  .md-prose :global(blockquote) {
    margin: 0 0 0.9rem;
    padding: 0.5rem 0.9rem;
    border-left: 3px solid rgba(var(--brand-rgb), 0.5);
    background: rgba(var(--brand-rgb), 0.05);
    border-radius: 0 var(--radius) var(--radius) 0;
    color: var(--text-muted);
  }

  .md-prose :global(blockquote p) {
    margin: 0;
  }

  .md-prose :global(code) {
    color: var(--text);
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.85em;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 0.1em 0.35em;
    overflow-wrap: anywhere;
  }

  .md-prose :global(pre) {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 0.85rem 1rem;
    overflow-x: auto;
    margin: 0 0 0.9rem;
  }

  .md-prose :global(pre code) {
    background: none;
    border: none;
    padding: 0;
    font-size: 0.85rem;
  }

  .md-prose :global(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 0 0 1rem;
    font-size: 0.95rem;
  }

  .md-prose :global(th),
  .md-prose :global(td) {
    border: 1px solid var(--border);
    padding: 0.5rem 0.7rem;
    text-align: left;
    vertical-align: top;
  }

  .md-prose :global(th) {
    background: var(--surface);
    font-weight: 600;
  }

  .md-prose :global(img) {
    max-width: 100%;
    border-radius: var(--radius-lg);
  }
</style>
