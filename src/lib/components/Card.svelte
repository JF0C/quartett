<script lang="ts">
  import { groupVisuals } from "../data/groups";
  import { resolveImageSource } from "../data/images";
  import type { Card, CardMetric } from "../data/cards";

  export let card: Card;
  export let metrics: CardMetric[];

  $: visual = groupVisuals[card.group];
  $: imageSrc = resolveImageSource(card.image);
  let imageFailed = false;
  $: if (card.language) {
    imageFailed = false;
  }
  $: initials = card.language
    .split(/[^A-Za-z0-9+#.]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
</script>

<article class="card">
  <header class="card-header">
    <div>
      <p class="group">{card.group}</p>
      <h2>{card.language}</h2>
    </div>
    <p class="year">{card.yearIntroduced}</p>
  </header>

  <div class="visual-frame">
    <div
      class="visual"
      style={`--accent: ${visual.accent}; --panel: ${visual.panel};`}
    >
      {#if imageSrc && !imageFailed}
        <img
          class="language-image"
          src={imageSrc}
          alt={`${card.language} logo`}
          on:error={() => (imageFailed = true)}
        />
      {:else}
        <div class="visual-badge" aria-label={`${card.language} monogram`}>
          {initials}
        </div>
      {/if}
    </div>
  </div>

  <section class="stats">
    {#if metrics.length > 0}
      {#each metrics as metric}
        <div class="stat-row">
          <span>{metric.label}</span>
          <strong>{card[metric.key]}</strong>
        </div>
      {/each}
    {:else}
      <p class="empty-state">No properties selected.</p>
    {/if}
  </section>
</article>

<style>
  .card {
    width: 6cm;
    height: 10cm;
    padding: 0.45cm;
    border-radius: 0.32cm;
    border: 1px solid #c8d7f6;
    background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
    color: #f8fbff;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.35);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    gap: 0.3cm;
    align-items: flex-start;
    margin-bottom: 0.35cm;
  }

  .group,
  .year {
    margin: 0;
    font-size: 0.28cm;
    text-transform: uppercase;
    letter-spacing: 0.04cm;
    color: #a5b9e5;
  }

  h2 {
    margin: 0.08cm 0 0;
    font-size: 0.58cm;
    line-height: 1.05;
  }

  .year {
    flex-shrink: 0;
    font-weight: 700;
  }

  .stats {
    display: grid;
    gap: 0.14cm;
  }

  .visual-frame {
    display: grid;
    place-items: center;
    flex: 1;
    margin-bottom: 0.3cm;
    border-radius: 0.16cm;
    background: rgba(148, 163, 184, 0.12);
    overflow: hidden;
  }

  .visual {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    min-height: 2.2cm;
    border-radius: 0.22cm;
    padding: 0.5cm;
    background: radial-gradient(
      circle at center,
      color-mix(in srgb, var(--panel) 88%, white 12%) 0%,
      var(--panel) 42%,
      rgba(15, 23, 42, 0) 78%
    );
  }

  .language-image {
    max-width: 100%;
    height: 100%;
    max-height: 100%;
    object-fit: contain;
    filter: drop-shadow(0 6px 14px rgba(15, 23, 42, 0.2));
  }

  .visual-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.6cm;
    height: 1.6cm;
    border-radius: 999px;
    color: var(--accent);
    font-size: 0.48cm;
    font-weight: 800;
    letter-spacing: 0.04cm;
    border: 1px solid color-mix(in srgb, var(--accent) 60%, white 40%);
    background: color-mix(in srgb, var(--panel) 75%, #0f172a 25%);
  }

  .stat-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0.2cm;
    align-items: center;
    padding: 0.12cm 0.18cm;
    border-radius: 0.16cm;
    background: rgba(148, 163, 184, 0.12);
    font-size: 0.31cm;
  }

  .stat-row span {
    min-width: 0;
  }

  .stat-row strong {
    font-size: 0.35cm;
  }

  .empty-state {
    margin: 0;
    padding: 0.3cm 0.2cm;
    text-align: center;
    font-size: 0.3cm;
    color: #a5b9e5;
  }

  @media print {
    .card {
      color: #111827;
      background: #ffffff;
      border-color: #334155;
      box-shadow: none;
    }

    .group,
    .year {
      color: #475569;
    }

    .stat-row {
      background: #f8fafc;
    }

    .visual-frame {
      background: #f8fafc;
    }

    .visual {
      background: radial-gradient(
        circle at center,
        color-mix(in srgb, var(--panel) 50%, white 50%) 0%,
        color-mix(in srgb, var(--panel) 45%, white 55%) 42%,
        rgba(255, 255, 255, 0) 78%
      );
    }

    .visual-badge {
      background: #ffffff;
      border-color: color-mix(in srgb, var(--accent) 65%, #cbd5e1 35%);
    }

    .language-image {
      filter: none;
    }

    .empty-state {
      color: #64748b;
    }
  }
</style>
