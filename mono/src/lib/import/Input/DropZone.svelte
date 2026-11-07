<script lang="ts">
  import Files from "$lib/ui/Files.svelte";
  import { file, name } from "../helper/store";
  import { writable } from "svelte/store";

  let fileTemp = writable<File[]>([]);

  // The workbook parsing lives in the page's $effect (single source of
  // truth) — this component only records which file was picked.
  fileTemp.subscribe((f) => {
    if (!f || !f.length) return;
    const e = f[0];
    file.update(() => e);
    // Strip the extension for the default export file name.
    name.update(() => e.name.replace(/\.[^.]+$/, ""));
  });
</script>

<div>
<Files bind:file={$fileTemp} accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" />
</div>

<style>
  div {
    width: 100%;
  }
</style>
