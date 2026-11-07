<script lang="ts">
  import { exportToCSV } from "../helper/questions";
  import {
    currentSheet,
    selectedFormat,
    workbook,
    name,
    titleColumn,
    promptColumn,
    correctColumn,
    langOutput,
    rowOffset,
    competencyColumn,
    indicatorColumn,
    competencyDescrColumn,
    masteryDescrColumn,
    alternative,
    skipRow,
  } from "../helper/store";
  import { Question } from "../helper/question";
  import Button from "$lib/ui/Button.svelte";
  import { FilesIcon } from "lucide-svelte";

  let linkFile: HTMLAnchorElement | undefined = $state();

  const onClick = () => {
    if (!$workbook) return;

    const fileName = $name;
    const sheet = Question.parseSheet(
      $workbook.Sheets[$currentSheet],
      {
        title: $titleColumn,
        prompt: $promptColumn,
        correct: $correctColumn,
        competency: $competencyColumn,
        indicator: $indicatorColumn,
        competencyDescr: $competencyDescrColumn,
        masteryDescr: $masteryDescrColumn,
      },
      { offset: $rowOffset, alternative: $alternative, skipRow: $skipRow },
    );
    switch ($selectedFormat.toLocaleLowerCase()) {
      case "csv": {
        const CSVString = exportToCSV(sheet, { lang: $langOutput });

        const blob = new Blob([CSVString], { type: "text/csv;charset=utf-8," });
        const objUrl = URL.createObjectURL(blob);

        if (linkFile) {
          linkFile.href = objUrl;
          linkFile.download = fileName + " - " + $langOutput;
          linkFile.click();
        }
        break;
      }
      case "pdf": {
        window.print();
        break;
      }
      default: {
        // Unsupported format: nothing to download.
      }
    }
  };
</script>

<a bind:this={linkFile} href="about:blank" download aria-label="Download export" tabindex="-1"></a>
<Button
  onclick={onClick}
  disabled={!$workbook || !$currentSheet}
  title={$workbook ? "Download the export" : "Import a file first"}
>
  <div class="button">
  <FilesIcon size={18} />
    <span> Download Export</span>
  </div>
</Button>

<style>
  a {
    display: none;
  }
  .button {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.6rem;
    font-size: 1rem;
  }
</style>
