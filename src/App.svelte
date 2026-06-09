<script lang="ts">
  import { onMount } from 'svelte';
  import Card from './lib/components/Card.svelte';
  import { groupedCards, groupNames, metrics, type CardMetricKey } from './lib/data/cards';
  import { exportCardsPdf } from './lib/pdf/exportCardsPdf';

  const totalCards = groupNames.reduce((sum, groupName) => sum + groupedCards[groupName].length, 0);
  const storageKey = 'programmiersprachenquartett:selected-metrics';

  let selectedMetricKeys: CardMetricKey[] = metrics.map((metric) => metric.key);
  let hasLoadedPreferences = false;
  let isExportingPdf = false;

  $: selectedMetrics = metrics.filter((metric) => selectedMetricKeys.includes(metric.key));
  $: exportCards = groupNames.flatMap((groupName) => groupedCards[groupName]);

  onMount(() => {
    const stored = window.localStorage.getItem(storageKey);

    if (stored) {
      try {
        const parsed = JSON.parse(stored);

        if (Array.isArray(parsed)) {
          const validKeys = metrics.map((metric) => metric.key);
          const filtered = parsed.filter((key): key is CardMetricKey => validKeys.includes(key));

          selectedMetricKeys = filtered;
        }
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }

    hasLoadedPreferences = true;
  });

  $: if (hasLoadedPreferences) {
    window.localStorage.setItem(storageKey, JSON.stringify(selectedMetricKeys));
  }

  async function handleExportPdf() {
    isExportingPdf = true;

    try {
      await exportCardsPdf(exportCards, selectedMetrics);
    } finally {
      isExportingPdf = false;
    }
  }
</script>

<svelte:head>
  <title>Programming Languages Quartet</title>
  <meta
    name="description"
    content="Overview of programming language quartet cards sized for later print and PDF output."
  />
</svelte:head>

<main class="page">
  <section class="hero">
    <div>
      <p class="eyebrow">Programming Languages Quartet</p>
      <h1>Card overview</h1>
      <p class="intro">
        Each card already uses the intended print size of 6 cm by 10 cm. The page is only meant as a
        working overview for now, so the focus stays on reusable components and card data.
      </p>
    </div>

    <div class="summary">
      <div>
        <strong>{groupNames.length}</strong>
        <span>groups</span>
      </div>
      <div>
        <strong>{totalCards}</strong>
        <span>cards</span>
      </div>
      <div>
        <strong>6 x 10 cm</strong>
        <span>print size</span>
      </div>
    </div>
  </section>

  <section class="controls">
    <div class="controls-header">
      <div>
        <p class="eyebrow">Visible Properties</p>
        <h2>Choose what appears on the cards</h2>
      </div>
      <div class="controls-actions">
        <p>{selectedMetrics.length} selected</p>
        <button class="export-button" type="button" on:click={handleExportPdf} disabled={isExportingPdf}>
          {#if isExportingPdf}
            Exporting PDF...
          {:else}
            Export all 32 cards as PDF
          {/if}
        </button>
      </div>
    </div>

    <div class="checkbox-grid">
      {#each metrics as metric}
        <label class="metric-toggle">
          <input type="checkbox" bind:group={selectedMetricKeys} value={metric.key} />
          <span>{metric.label}</span>
        </label>
      {/each}
    </div>
  </section>

  {#each groupNames as groupName}
    <section class="group-section">
      <div class="group-header">
        <h2>{groupName}</h2>
        <p>{groupedCards[groupName].length} cards</p>
      </div>

      <div class="card-grid">
        {#each groupedCards[groupName] as card}
          <Card {card} metrics={selectedMetrics} />
        {/each}
      </div>
    </section>
  {/each}
</main>

<style>
  .page {
    padding: 2rem;
    max-width: 120rem;
    margin: 0 auto;
  }

  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 1.5rem;
    align-items: end;
    margin-bottom: 2.5rem;
  }

  .eyebrow {
    margin: 0 0 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: #8fb3ff;
    font-size: 0.85rem;
    font-weight: 700;
  }

  h1 {
    margin: 0;
    font-size: clamp(2rem, 4vw, 3.5rem);
    line-height: 0.95;
  }

  .intro {
    max-width: 60rem;
    margin: 0.85rem 0 0;
    color: #bfd0ef;
  }

  .summary {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .summary div {
    min-width: 8.5rem;
    padding: 0.9rem 1rem;
    border: 1px solid rgba(143, 179, 255, 0.25);
    border-radius: 1rem;
    background: rgba(15, 23, 42, 0.55);
    backdrop-filter: blur(10px);
  }

  .summary strong,
  .summary span {
    display: block;
  }

  .summary strong {
    font-size: 1.3rem;
  }

  .summary span {
    color: #9eb5db;
    font-size: 0.95rem;
  }

  .controls {
    margin-bottom: 2.5rem;
    padding: 1.1rem;
    border: 1px solid rgba(143, 179, 255, 0.22);
    border-radius: 1rem;
    background: rgba(15, 23, 42, 0.55);
  }

  .controls-header {
    display: flex;
    justify-content: space-between;
    align-items: end;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .controls-header h2 {
    margin: 0;
    font-size: 1.15rem;
  }

  .controls-header p:last-child {
    margin: 0;
    color: #9eb5db;
  }

  .controls-actions {
    display: flex;
    flex-direction: column;
    align-items: end;
    gap: 0.7rem;
  }

  .checkbox-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .metric-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    padding: 0.7rem 0.85rem;
    border-radius: 999px;
    border: 1px solid rgba(143, 179, 255, 0.22);
    background: rgba(30, 41, 59, 0.8);
    cursor: pointer;
  }

  .metric-toggle input {
    width: 1rem;
    height: 1rem;
    accent-color: #8fb3ff;
  }

  .metric-toggle span {
    font-size: 0.95rem;
  }

  .export-button {
    border: 0;
    border-radius: 999px;
    padding: 0.75rem 1rem;
    background: linear-gradient(135deg, #8fb3ff 0%, #c4b5fd 100%);
    color: #0f172a;
    font-weight: 700;
    cursor: pointer;
  }

  .export-button:disabled {
    opacity: 0.7;
    cursor: progress;
  }

  .group-section + .group-section {
    margin-top: 2.5rem;
  }

  .group-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .group-header h2 {
    margin: 0;
    font-size: 1.4rem;
  }

  .group-header p {
    margin: 0;
    color: #9eb5db;
  }

  .card-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
  }

  @media (max-width: 720px) {
    .page {
      padding: 1rem;
    }

    .hero {
      grid-template-columns: 1fr;
    }

    .controls-header {
      align-items: start;
      flex-direction: column;
    }

    .controls-actions {
      align-items: start;
    }
  }

  @media print {
    .page {
      padding: 0;
      max-width: none;
    }

    .hero {
      margin-bottom: 1rem;
      color: #111827;
    }

    .eyebrow,
    .intro,
    .group-header p,
    .summary span,
    .controls-header p:last-child {
      color: #475569;
    }

    .summary div,
    .controls {
      background: #ffffff;
      border-color: #cbd5e1;
      backdrop-filter: none;
    }

    .metric-toggle {
      background: #ffffff;
      border-color: #cbd5e1;
      color: #111827;
    }

    .export-button {
      display: none;
    }
  }
</style>
