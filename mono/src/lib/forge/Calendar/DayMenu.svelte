<script lang="ts">
  import { createBubbler, stopPropagation } from 'svelte/legacy';
  import { onMount } from 'svelte';

  const bubble = createBubbler();
  import type { Day } from "./Calendar.helper";
  import { Button, TextArea } from "$lib/ui";

  interface Props {
    day: Day;
    onClose?: any;
    onEnter?: any;
  }

  let { day = $bindable(), onClose = () => {}, onEnter = () => {
    
  } }: Props = $props();

  let menuEl: HTMLElement;
  let bgInput: HTMLInputElement;

  onMount(() => {
    // Fixed positioning escapes every scroll/clip container between the cell
    // and the viewport (.grid-scroll has overflow-x: auto, which forces
    // overflow-y to auto and would clip the menu at the grid edges).
    const anchor = menuEl.parentElement as HTMLElement;
    if (anchor) {
      const rect = anchor.getBoundingClientRect();
      const width = 180;
      const estHeight = 230;
      const left = Math.max(4, Math.min(rect.left, window.innerWidth - width - 4));
      const spaceBelow = window.innerHeight - rect.bottom;
      const top =
        spaceBelow > estHeight ? rect.bottom + 4 : Math.max(4, rect.top - estHeight);
      menuEl.style.left = `${left}px`;
      menuEl.style.top = `${top}px`;
    }

    bgInput?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onPointer = (e: PointerEvent) => {
      if (!menuEl.contains(e.target as Node) && !anchor.contains(e.target as Node)) onClose();
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer, true);
    };
  });
</script>

<div class="menu" role="dialog" aria-label="Edit day" bind:this={menuEl} tabindex="-1" onclick={stopPropagation(bubble('click'))} onkeypress={onEnter}>
  <label for="bg">Background</label>
  <input type="color" name="" id="bg" bind:value={day.bg} class="color-input" bind:this={bgInput} />
  <label for="border">Border</label>
  <input type="color" name="" id="border" bind:value={day.bd} class="color-input" />
  <label for="text">Text</label>
  <TextArea bind:value={day.text} rows={3} />
  <div class="close-row">
    <Button variant="ghost" onclick={stopPropagation(onClose)}>Close</Button>
  </div>
</div>

<style>
  .menu {
    /* Positioned by JS (below the day cell, flipped above near the viewport
       bottom, clamped to the viewport) — fixed so grid scroll containers
       can't clip it. Sits under the sticky header (z-index 200). */
    position: fixed;
    left: 0;
    top: 0;
    z-index: 195;
    background-color: var(--surface-elevated);
    border: 1px solid var(--border-strong);
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: 0.5rem;
    width: fit-content;
    min-width: 160px;
    padding: 0.5rem;
    border-radius: var(--radius);
    box-shadow: var(--shadow-lg);
  }

  label {
    font-size: var(--font-size-base);
    color: var(--text-muted);
    white-space: nowrap;
  }

  .color-input {
    width: 2.5rem;
    height: 1.75rem;
    padding: 0.1rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
    cursor: pointer;
  }

  .close-row {
    grid-column: 1 / -1;
    display: flex;
    justify-content: flex-end;
    margin-top: 0.25rem;
  }
</style>
