<script lang="ts">
  import { slide } from "svelte/transition";
  import { ChevronDown } from "lucide-svelte";
  import type { Snippet } from "svelte";

  interface Props {
    title: string;
    open?: boolean;
    icon?: Snippet;
    children?: Snippet;
  }

  let { title, open = $bindable(true), icon, children }: Props = $props();

  const contentId = `section-content-${Math.random().toString(36).slice(2, 8)}`;
</script>

<div class="section">
  <button
    class="section-header"
    type="button"
    onclick={() => (open = !open)}
    aria-expanded={open}
    aria-controls={contentId}
  >
    <span class="section-title">
      {#if icon}{@render icon()}{/if}
      <span>{title}</span>
    </span>
    <span class="section-toggle" class:open>
      <ChevronDown size={14} />
    </span>
  </button>
  {#if open}
    <div class="section-content" id={contentId} transition:slide={{ duration: 200 }}>
      {@render children?.()}
    </div>
  {/if}
</div>

<style>
  .section {
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }

  .section-header {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: background 0.15s;
  }

  .section-header:hover {
    background: var(--surface);
  }

  .section-header:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.25);
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
  }

  .section-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    transition: transform 0.2s;
  }

  .section-toggle.open {
    transform: rotate(180deg);
  }

  .section-content {
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    border-top: 1px solid var(--border);
  }
</style>
