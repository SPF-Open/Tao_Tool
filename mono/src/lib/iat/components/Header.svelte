<script lang="ts">
  import { file } from "$lib/iat/store";
  import { locale, locales, t } from "$lib/iat/i18n";
  import { Card, Combobox, FileInput } from "$lib/ui";

  let files = $state<File[]>([]);

  $effect(() => {
    file.set(files[0] ?? null);
  });
</script>

<div class="hide-print">
  <Card>
    {#snippet title()}
      {$t("header.title")}
    {/snippet}
    <div class="header-body">
      <!-- XLSX only: the analysis needs the Speed_Pages / Questions /
         Alternatives sheets, which a single-sheet CSV cannot provide
         (it used to be accepted here and then silently ignored). -->
      <FileInput
        bind:file={files}
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        dropLabel={$t("upload.dropLabel")}
        hint={$t("upload.hint")}
        invalidTitle={$t("upload.rejectTitle")}
        label="IAT workbook upload (sidebar)"
      />
      <Combobox
        legend={$t("header.legend")}
        choices={locales.map((l) => ({ label: l.toUpperCase(), value: l }))}
        bind:value={$locale}
      />
    </div>
  </Card>
</div>

<style>
  .header-body {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    flex-wrap: wrap;
  }
</style>
