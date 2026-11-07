<script lang="ts">
  import { writable } from "svelte/store";
  import { Hammer } from "lucide-svelte";
  import Calendar from "$lib/forge/Calendar/Calendar.svelte";
  import { Language, lang } from "$lib/forge/store";
  import { Button, Combobox, PageHeader, SidebarLayout } from "$lib/ui";

  // Owned here so the header action can drive the calendar.
  let date = writable(new Date());
  let dateString = writable("");
</script>

<svelte:head>
  <title>Forge — TAO</title>
  <meta name="description" content="Forge — compose and schedule exams in the TAO toolkit." />
</svelte:head>

<SidebarLayout sidebarLabel="Forge settings">
  {#snippet sidebar()}
    <Combobox
      legend="Calendar language"
      choices={[
        { label: "FR", value: Language.FR },
        { label: "NL", value: Language.NL },
        { label: "DE", value: Language.DE },
      ]}
      bind:value={$lang}
    />
  {/snippet}

  <PageHeader
    icon={Hammer}
    eyebrow="Compose"
    title="Forge"
    subtitle="Create and schedule exams from scratch or from existing templates."
  >
    {#snippet actions()}
      <Button variant="secondary" onclick={() => date.set(new Date())}>Jump to today</Button>
    {/snippet}
  </PageHeader>

  <Calendar {date} {dateString} />
</SidebarLayout>
