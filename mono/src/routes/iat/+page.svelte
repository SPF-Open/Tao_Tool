<script lang="ts">
  import { ClipboardCheck, FileSpreadsheet } from "lucide-svelte";
  import { file, pagesData } from "$lib/iat/store";
  import { t } from "$lib/iat/i18n";
  import DynamicTable from "$lib/iat/components/DynamicTable.svelte";
  import Header from "$lib/iat/components/Header.svelte";
  import Summary from "$lib/iat/components/Summary.svelte";
  import { EmptyState, FileInput, PageHeader, SidebarLayout } from "$lib/ui";

  // Second FileInput in the empty state: on mobile the sidebar is a closed
  // drawer, so the upload must be reachable from the main content too.
  let emptyStateFiles = $state<File[]>([]);
  $effect(() => {
    file.set(emptyStateFiles[0] ?? null);
  });
</script>

<svelte:head>
  <title>IAT — TAO</title>
  <meta name="description" content="Interactive Assessment Tool — analyse exam item statistics in the TAO toolkit." />
</svelte:head>

<SidebarLayout sidebarLabel="IAT settings">
  {#snippet sidebar()}
    <Header />
  {/snippet}

  <div class="hide-print">
    <PageHeader
      icon={ClipboardCheck}
      eyebrow={$t("page.eyebrow")}
      title="IAT"
      subtitle={$t("page.subtitle")}
    />
  </div>

  {#if $pagesData}
    <Summary />
    <DynamicTable pagesData={$pagesData} />
  {:else}
    <div class="fill">
      <EmptyState
        icon={FileSpreadsheet}
        title={$t("page.empty.title")}
        description={$t("page.empty.desc")}
        centered
      >
        <FileInput
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          dropLabel={$t("upload.dropLabel")}
          hint={$t("upload.hint")}
          invalidTitle={$t("upload.rejectTitle")}
          label="IAT workbook upload"
          bind:file={emptyStateFiles}
        />
      </EmptyState>
    </div>
  {/if}
</SidebarLayout>

<style>
  /* Give the empty state the remaining viewport height so its `centered`
     mode actually centers (the PageHeader above stays at the top). */
  .fill {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: calc(100vh - var(--layout-header-height) - 11rem);
  }
</style>
