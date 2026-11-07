<script lang="ts">
  interface Props {
    title?: import('svelte').Snippet;
    options?: import('svelte').Snippet;
    children?: import('svelte').Snippet;
  }

  let { title, options, children }: Props = $props();
</script>

<div class="element">
  <h2>
    {@render title?.()}
  </h2>
  <div class="options">
    {@render options?.()}
  </div>
  <hr>
  <div class="content">
    {@render children?.()}
  </div>
</div>

<style>
  .element {
    box-shadow: var(--shadow);
    border-radius: var(--radius-xl);
    border: 1px solid var(--border);
    background-color: var(--surface-elevated);
    max-width: 1450px;
    padding: 0.5rem;
    margin: 0.5rem auto;
  }
  h2 {
    text-align: center;
    margin: 0.4rem 0 0.25rem;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-muted);
  }
  hr {
    border: none;
    border-top: 1px solid var(--border);
    margin: 0.5rem 0;
  }
  .options {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1.25rem;
    flex-wrap: wrap;
    padding: 0.25rem 0;
  }
  .options :global(>*) {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.25rem;
  }
  /* The date picker used to stretch across the whole options bar — keep it
     compact and consistent with the other controls. */
  .options :global(input[type="date"]) {
    width: 11rem;
    flex: none;
  }

  /* Phones & small tablets: stack the controls into a tidy column instead of
     a scattered centered wrap. */
  @media (max-width: 720px) {
    .options {
      flex-direction: column;
      align-items: stretch;
      gap: 0.6rem;
    }

    .options :global(>*) {
      justify-content: space-between;
    }

    .options :global(nav) {
      gap: 0.5rem;
    }

    .options :global(nav > *) {
      flex: 1;
      justify-content: center;
    }
  }
  .content {
    position: relative;
    margin: 1rem auto;
    width: fit-content;
    padding: 2rem;
  }

  /* Phones & small tablets: stop the content box from sizing to a wide child
     (e.g. the calendar grid) — fill the viewport instead and let the child
     adapt. Same band as the calendar's fluid-grid breakpoint. */
  @media (max-width: 960px) {
    .content {
      width: auto;
      max-width: 100%;
      padding: 1rem;
    }
  }
</style>
