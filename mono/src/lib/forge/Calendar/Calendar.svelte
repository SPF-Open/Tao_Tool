<script lang="ts">
  import { writable } from "svelte/store";
  import type { Writable } from "svelte/store";

  import { Day, Size, formatedDate, monthOfTheYear, weekOfTheDay } from "./Calendar.helper";
  import DayMenu from "./DayMenu.svelte";
  import { lang } from "../store";
  import Element from "../Element.svelte";
  import { Button, Combobox, Numeric, Switch, TextInput } from "$lib/ui";

  
  interface Props {
    // Stores
    date?: Writable<Date>;
    dateString?: Writable<string>;
  }

  let { date = writable(new Date()), dateString = writable("") }: Props = $props();

  // Construction
  let days: Day[] = $state([]);
  let rows = $derived(Math.floor(days.length / 7));

  // Options
  let size = $state<string>(Size.md);
  let yearOffset = $state(0);
  let showNonCurrentMonth = $state(false);

  // Local YYYY-MM-DD helpers: `toISOString` is UTC-based, so a date chosen in
  // the picker could land on the neighbouring day/month in non-UTC timezones.
  const toLocalISO = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const fromLocalISO = (s: string) => {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  };

  // When we update the date with datepicker
  $effect(() => {
    return dateString.subscribe((d: string) => {
      const dateStringTemp = toLocalISO($date);
      if (d && dateStringTemp !== $dateString) {
        date.update(() => fromLocalISO(d));
      }
    });
  });

  $effect(() => {
    return date.subscribe((d: Date) => {
      const dateStringTemp = toLocalISO($date);
      if (dateStringTemp !== $dateString) {
        dateString.update(() => dateStringTemp);
      }
      days = Day.from(d);
    });
  });

  const changeMonth = (offset: number) => {
    date.update((d: Date) => new Date(d.getFullYear(), d.getMonth() + offset, 15));
  };

  const onDayClick = (target: Day, force = true) => {
    // Rebuild with fresh Day objects: mutating `menu` on the existing items
    // does not retrigger the each-block render (pre-existing bug — the edit
    // menu never appeared). New item references always re-render.
    days = days.map((d) => {
      const next = new Day(d.day, d.isCurrentMonth, d.text, d.bg, d.bd, d.menu);
      if (force) {
        next.menu = d === target ? !d.menu : false;
      } else if (d === target) {
        next.menu = !d.menu;
      }
      return next;
    });
  };

  const monthName = $derived(monthOfTheYear[$lang][$date.getMonth()]);
  const offsetLabel = $derived(
    yearOffset === 0 ? "" : ` ${yearOffset > 0 ? "+" : "−"} ${Math.abs(yearOffset)}`
  );
</script>

<Element>
  {#snippet title()}
    <span >Calendar</span>
  {/snippet}
  {#snippet options()}
  
      <nav>
        <Button variant="secondary" onclick={() => changeMonth(-1)}>Previous</Button>
        <Button variant="secondary" onclick={() => changeMonth(+1)}>Next</Button>
      </nav>
      <TextInput type="date" bind:value={$dateString} />
      <Combobox
        legend="Size"
        choices={[
          { label: "Small", value: Size.sm },
          { label: "Medium", value: Size.md },
          { label: "Large", value: Size.lg },
        ]}
        bind:value={size}
      />
      <div class="option-row">
        <label for="offset">Offset</label>
        <Numeric name="offset" id="offset" bind:value={yearOffset} size="sm" />
      </div>
      <div class="option-row">
        <span>Non-current month</span>
        <Switch bind:checked={showNonCurrentMonth} label="Show non-current month days" />
      </div>
    
  {/snippet}
  {#snippet children()}
  
      <h2 class="date">
        {formatedDate($date, $lang)}{offsetLabel}
      </h2>
      <p class="grid-help">
        Click a day to pick its colors and add a note. 202X is a template year wildcard — Offset only shifts this label.
      </p>
      <div class="grid-scroll">
        <div class="grid" style="--nbRow:{rows}">
          {#each weekOfTheDay[$lang] as day}
            <div class="weekday cell {size}">{day}</div>
          {/each}
          {#each days as day}
            <div
              class="day cell {size}"
              class:currentMonth={day.isCurrentMonth || showNonCurrentMonth}
              class:menuOpen={day.menu}
              role="button"
              tabindex={day.isCurrentMonth || showNonCurrentMonth ? 0 : -1}
              aria-label="{day.day} {monthName}{day.text ? `, note: ${day.text}` : ''}"
              aria-expanded={day.menu}
              onclick={() => onDayClick(day)}
              onkeydown={(event) => {
                if (event.key === "Enter" || event.key === " ") onDayClick(day);
              }}
              style="background:{day.bg};"
            >
              <div class="innerCell" style="border-color:{day.bd}">
                <span> {day.day}</span>
                <span>{day.text}</span>
              </div>
              {#if day.menu && (day.isCurrentMonth || showNonCurrentMonth)}
                <DayMenu {day} onClose={() => onDayClick(day, false)} />
              {/if}
            </div>
          {/each}
        </div>
      </div>
    
  {/snippet}
</Element>


<style>
  .date {
    margin: 0.2rem;
    font-size: 1.35rem;
    text-align: center;
    color: var(--text);
  }

  .grid-help {
    margin: 0 auto 0.6rem;
    max-width: 60ch;
    text-align: center;
    font-size: 0.8rem;
    line-height: 1.45;
    color: var(--text-muted);
  }

  .option-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: var(--font-size-base);
    color: var(--text-muted);
  }

  .grid-scroll {
    max-width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .grid {
    --bd: var(--border);
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    grid-template-rows: repeat(var(--nbRow), 1fr);
    border-radius: var(--radius-lg);
    position: relative;
    box-shadow: var(--shadow);
    border: 1px solid var(--bd);
    width: fit-content;
    margin: 0 auto;
    background: var(--surface-elevated);
  }

  /* The open day's edit menu overflows the grid — keep the whole cell above
     its siblings so the menu is never painted over. */
  .day.menuOpen {
    z-index: 5;
  }

  .weekday {
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--text-muted);
    background: var(--surface);
    padding: 0.5rem 0;
    min-height: 0;
  }

  .cell.sm {
    width: 6rem;
  }

  .cell.md {
    width: 8rem;
  }

  .cell.lg {
    width: 10rem;
  }

  .cell:last-child,
  .cell:last-child > * {
    border-radius: 0 0 var(--radius-lg) var(--radius-lg);
  }

  .cell:nth-last-child(7),
  .cell:nth-last-child(7) > * {
    border-radius: 0 0 0 var(--radius-lg);
  }

  .cell:nth-child(7n) {
    border-right: 1px solid transparent;
  }

  .cell:nth-last-child(-n + 7) {
    border-bottom: 1px solid transparent;
  }

  .cell {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    border-right: 1px solid var(--bd);
    border-bottom: 1px solid var(--bd);
    font-weight: bold;
    color: var(--text-muted);
    transition: box-shadow 150ms ease, color 150ms ease;
  }

  .day.currentMonth {
    cursor: pointer;
  }

  .day.currentMonth:hover {
    box-shadow: inset 0 0 0 2px rgba(var(--brand-rgb), 0.5);
    color: var(--text);
    z-index: 1;
  }

  .day:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 3px rgba(var(--brand-rgb), 0.55);
    color: var(--text);
    z-index: 1;
  }

  .innerCell {
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    border: 10px solid transparent;
    box-sizing: border-box;
    -moz-box-sizing: border-box;
    -webkit-box-sizing: border-box;
  }

  .day {
    text-align: center;
    color: var(--text-muted);
  }

  .currentMonth {
    display: flex;
    justify-content: center;
    align-items: center;
    color: var(--text);
  }

  /* Phones: the fixed-size cells overflowed the viewport with no scroll hint
     — the grid becomes fluid and fills the screen instead. */
  @media (max-width: 640px) {
    .grid {
      width: 100%;
    }

    .cell.sm,
    .cell.md,
    .cell.lg {
      width: auto;
      min-width: 0;
    }

    .weekday {
      font-size: 0.55rem;
      letter-spacing: 0;
      white-space: nowrap;
      overflow: hidden;
      padding: 0.3rem 0;
    }

    .day {
      min-height: 44px;
    }

    .innerCell {
      border-width: 3px;
      padding: 0.25rem;
    }

    .innerCell span {
      font-size: 0.78rem;
    }
  }

</style>

