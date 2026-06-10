<script lang="ts">
  import { onMount } from 'svelte';
  import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
  import { faChevronLeft, faChevronRight, faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
  import Card from './lib/components/Card.svelte';
  import CardEditModal from './lib/components/CardEditModal.svelte';
  import ConfirmModal from './lib/components/ConfirmModal.svelte';
  import Modal from './lib/components/Modal.svelte';
  import TextPromptModal from './lib/components/TextPromptModal.svelte';
  import { metrics, type Card as QuartetCard, type CardMetricKey } from './lib/data/cards';
  import { downloadCardsCsv, parseCardsCsv } from './lib/data/cardsCsv';
  import {
    addCardGroup,
    assignCardToGroup,
    createCardSetConfigFromCards,
    createDefaultCardSetConfig,
    getSortedGroupNames,
    groupCardsByGroup,
    loadCardSetConfig,
    removeCardGroup,
    renameCardGroup,
    saveCardSetConfig,
    unassignCardFromGroup,
    updateCard,
    type CardSetConfig
  } from './lib/data/cardSetConfig';
  import { exportCardsPdf } from './lib/pdf/exportCardsPdf';

  const storageKey = 'programmiersprachenquartett:selected-metrics';
  let cardSetConfig: CardSetConfig = createDefaultCardSetConfig();
  let selectedMetricKeys: CardMetricKey[] = metrics.map((metric) => metric.key);
  let hasLoadedPreferences = false;
  let csvFileInput: HTMLInputElement | null = null;
  let isExportingCsv = false;
  let isExportingPdf = false;
  let isImportingCsv = false;
  let addCardTargetGroup = '';
  let addCardSearch = '';
  let addCardPage = 0;
  let activeCardAction: QuartetCard | null = null;
  let editingCard: QuartetCard | null = null;
  let groupModalMode: 'add' | 'rename' | null = null;
  let groupModalValue = '';
  let targetGroupName = '';
  let deleteGroupName = '';
  let restoreDefaultsPending = false;
  let pendingImportedCards: QuartetCard[] | null = null;
  let pendingImportFileName = '';
  let importErrorMessage = '';
  let isMobile = false;
  let actionsExpanded = false;
  let propertiesExpanded = false;
  let statusExpanded = false;

  $: groupNames = getSortedGroupNames(cardSetConfig.groups);
  $: groupedCards = groupCardsByGroup(groupNames, cardSetConfig.cards);
  $: totalCards = groupNames.reduce((sum, groupName) => sum + groupedCards[groupName].length, 0);
  $: selectedMetrics = metrics.filter((metric) => selectedMetricKeys.includes(metric.key));
  $: exportCards = groupNames.flatMap((groupName) => groupedCards[groupName]);
  $: ungroupedCards = cardSetConfig.cards.filter((card) => !card.group);
  $: normalizedAddCardSearch = addCardSearch.trim().toLocaleLowerCase();
  $: addableCards = normalizedAddCardSearch
    ? ungroupedCards.filter((card) => card.language.toLocaleLowerCase().includes(normalizedAddCardSearch))
    : ungroupedCards;
  $: cardsPerModalPage = isMobile ? 4 : 8;
  $: addCardPageCount = Math.max(1, Math.ceil(addableCards.length / cardsPerModalPage));
  $: addCardPage = Math.min(addCardPage, addCardPageCount - 1);
  $: pagedAddableCards = addableCards.slice(addCardPage * cardsPerModalPage, (addCardPage + 1) * cardsPerModalPage);

  onMount(() => {
    const mediaQuery = window.matchMedia('(max-width: 720px)');
    const syncIsMobile = () => {
      isMobile = mediaQuery.matches;
    };

    syncIsMobile();
    mediaQuery.addEventListener('change', syncIsMobile);

    cardSetConfig = loadCardSetConfig(window.localStorage);

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

    return () => {
      mediaQuery.removeEventListener('change', syncIsMobile);
    };
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

  function handleExportCsv() {
    isExportingCsv = true;

    try {
      downloadCardsCsv(cardSetConfig.cards);
    } finally {
      isExportingCsv = false;
    }
  }

  function openImportCsvPicker() {
    csvFileInput?.click();
  }

  function resetCsvFileInput() {
    if (csvFileInput) {
      csvFileInput.value = '';
    }
  }

  function closeImportConfirmModal() {
    pendingImportedCards = null;
    pendingImportFileName = '';
    resetCsvFileInput();
  }

  function closeImportErrorModal() {
    importErrorMessage = '';
    resetCsvFileInput();
  }

  function handleConfirmImportCsv() {
    if (!pendingImportedCards) {
      return;
    }

    updateCardSetConfig(createCardSetConfigFromCards(cardSetConfig.title, pendingImportedCards));
    closeImportConfirmModal();
  }

  async function handleCsvFileChange(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const [file] = Array.from(input.files ?? []);

    if (!file) {
      return;
    }

    isImportingCsv = true;

    try {
      const importedCards = parseCardsCsv(await file.text());

      pendingImportedCards = importedCards;
      pendingImportFileName = file.name;
      importErrorMessage = '';
    } catch (error) {
      pendingImportedCards = null;
      pendingImportFileName = '';
      importErrorMessage = error instanceof Error ? error.message : 'Failed to import CSV.';
    } finally {
      isImportingCsv = false;
    }
  }

  function updateCardSetConfig(nextConfig: CardSetConfig) {
    cardSetConfig = nextConfig;
    saveCardSetConfig(window.localStorage, nextConfig);
  }

  function openRenameGroupModal(groupName: string) {
    targetGroupName = groupName;
    groupModalValue = groupName;
    groupModalMode = 'rename';
  }

  function openAddGroupModal() {
    targetGroupName = '';
    groupModalValue = '';
    groupModalMode = 'add';
  }

  function closeGroupModal() {
    groupModalMode = null;
    groupModalValue = '';
    targetGroupName = '';
  }

  function handleGroupModalConfirm(event: CustomEvent<{ value: string }>) {
    if (groupModalMode === 'rename') {
      updateCardSetConfig(renameCardGroup(cardSetConfig, targetGroupName, event.detail.value));
    } else if (groupModalMode === 'add') {
      updateCardSetConfig(addCardGroup(cardSetConfig, event.detail.value));
    }

    closeGroupModal();
  }

  function openDeleteGroupModal(groupName: string) {
    deleteGroupName = groupName;
  }

  function closeDeleteGroupModal() {
    deleteGroupName = '';
  }

  function handleRemoveGroup() {
    if (!deleteGroupName) {
      return;
    }

    updateCardSetConfig(removeCardGroup(cardSetConfig, deleteGroupName));
    closeDeleteGroupModal();
  }

  function openRestoreDefaultsModal() {
    restoreDefaultsPending = true;
  }

  function closeRestoreDefaultsModal() {
    restoreDefaultsPending = false;
  }

  function handleRestoreDefaults() {
    updateCardSetConfig(createDefaultCardSetConfig());
    closeRestoreDefaultsModal();
  }

  function openAddCardModal(groupName: string) {
    addCardTargetGroup = groupName;
    addCardSearch = '';
    addCardPage = 0;
  }

  function closeAddCardModal() {
    addCardTargetGroup = '';
    addCardSearch = '';
    addCardPage = 0;
  }

  function handleAddCardSearchInput(event: Event) {
    addCardSearch = (event.currentTarget as HTMLInputElement).value;
    addCardPage = 0;
  }

  function handleAddCardToGroup(cardId: string) {
    if (!addCardTargetGroup) {
      return;
    }

    updateCardSetConfig(assignCardToGroup(cardSetConfig, cardId, addCardTargetGroup));
    closeAddCardModal();
  }

  function openCardActionModal(card: QuartetCard) {
    activeCardAction = card;
  }

  function closeCardActionModal() {
    activeCardAction = null;
  }

  function openCardEditModal() {
    if (!activeCardAction) {
      return;
    }

    editingCard = { ...activeCardAction };
    closeCardActionModal();
  }

  function closeCardEditModal() {
    editingCard = null;
  }

  function handleSaveEditedCard(event: CustomEvent<{ card: QuartetCard }>) {
    updateCardSetConfig(updateCard(cardSetConfig, event.detail.card));
    closeCardEditModal();
  }

  function handleRemoveCardFromGroup() {
    if (!activeCardAction) {
      return;
    }

    updateCardSetConfig(unassignCardFromGroup(cardSetConfig, activeCardAction.id));
    closeCardActionModal();
  }

  function isPanelOpen(expanded: boolean) {
    return !isMobile || expanded;
  }

  function togglePanel(panel: 'actions' | 'properties' | 'status') {
    if (!isMobile) {
      return;
    }

    if (panel === 'actions') {
      actionsExpanded = !actionsExpanded;
      return;
    }

    if (panel === 'properties') {
      propertiesExpanded = !propertiesExpanded;
      return;
    }

    statusExpanded = !statusExpanded;
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
  </section>

  <section class="controls-grid">
    <section class="controls status-panel">
      <button class="panel-toggle" type="button" aria-expanded={isPanelOpen(statusExpanded)} on:click={() => togglePanel('status')}>
        <div>
          <p class="eyebrow">Status</p>
          <h2>Current card set usage</h2>
        </div>
        <div class="panel-toggle-end">
          <span class="panel-indicator">
            <FontAwesomeIcon icon={isPanelOpen(statusExpanded) ? faMinus : faPlus} />
          </span>
        </div>
      </button>

      {#if isPanelOpen(statusExpanded)}
        <div class="panel-body">
          <div class="summary">
            <div>
              <strong>{groupNames.length}</strong>
              <span>groups</span>
            </div>
            <div>
              <strong>{totalCards}/{cardSetConfig.cards.length}</strong>
              <span>cards</span>
            </div>
          </div>
        </div>
      {/if}
    </section>

    <section class="controls actions-panel">
      <button class="panel-toggle" type="button" aria-expanded={isPanelOpen(actionsExpanded)} on:click={() => togglePanel('actions')}>
        <div>
          <p class="eyebrow">Actions</p>
          <h2>Manage card groups and exports</h2>
        </div>
        <div class="panel-toggle-end">
          <span class="panel-indicator">
            <FontAwesomeIcon icon={isPanelOpen(actionsExpanded) ? faMinus : faPlus} />
          </span>
        </div>
      </button>

      {#if isPanelOpen(actionsExpanded)}
        <div class="panel-body">
          <div class="controls-actions actions-panel-buttons">
            <button class="group-action-button" type="button" on:click={openAddGroupModal}>
              Add group
            </button>
            <button class="group-action-button" type="button" on:click={openRestoreDefaultsModal}>
              Restore Default Set
            </button>
            <button class="group-action-button" type="button" on:click={openImportCsvPicker} disabled={isImportingCsv}>
              {#if isImportingCsv}
                Importing CSV...
              {:else}
                Import CSV
              {/if}
            </button>
            <button class="group-action-button" type="button" on:click={handleExportCsv} disabled={isExportingCsv}>
              {#if isExportingCsv}
                Exporting CSV...
              {:else}
                Export all {cardSetConfig.cards.length} cards as CSV
              {/if}
            </button>
            <button class="export-button" type="button" on:click={handleExportPdf} disabled={isExportingPdf}>
              {#if isExportingPdf}
                Exporting PDF...
              {:else}
                Export all {totalCards} cards as PDF
              {/if}
            </button>
          </div>
        </div>
      {/if}
    </section>

    <section class="controls">
      <button class="panel-toggle" type="button" aria-expanded={isPanelOpen(propertiesExpanded)} on:click={() => togglePanel('properties')}>
        <div>
          <p class="eyebrow">Visible Properties</p>
          <h2>Choose what appears on the cards</h2>
        </div>
        <div class="panel-toggle-end">
          <p>{selectedMetrics.length} selected</p>
          <span class="panel-indicator">
            <FontAwesomeIcon icon={isPanelOpen(propertiesExpanded) ? faMinus : faPlus} />
          </span>
        </div>
      </button>

      {#if isPanelOpen(propertiesExpanded)}
        <div class="panel-body">
          <div class="checkbox-grid">
            {#each metrics as metric}
              <label class="metric-toggle">
                <input type="checkbox" bind:group={selectedMetricKeys} value={metric.key} />
                <span>{metric.label}</span>
              </label>
            {/each}
          </div>
        </div>
      {/if}
    </section>

  </section>

  <div class="group-sections">
    {#each groupNames as groupName}
      <section class="group-section">
        <div class="group-header">
          <div>
            <h2>{groupName}</h2>
            <p>{groupedCards[groupName].length} cards</p>
          </div>

          <div class="group-actions">
            <button class="group-action-button" type="button" on:click={() => openRenameGroupModal(groupName)}>
              Rename
            </button>
            <button
              class="group-action-button group-action-button-danger"
              type="button"
              on:click={() => openDeleteGroupModal(groupName)}
            >
              Remove
            </button>
          </div>
        </div>

        <div class="card-grid">
          {#each groupedCards[groupName] as card}
            <button class="card-button" type="button" on:click={() => openCardActionModal(card)}>
              <Card {card} metrics={selectedMetrics} />
            </button>
          {/each}

          {#if groupedCards[groupName].length < 4}
            <button class="add-card-button" type="button" on:click={() => openAddCardModal(groupName)}>
              <span class="add-card-symbol"><FontAwesomeIcon icon={faPlus} /></span>
              <span class="add-card-label">Add card</span>
            </button>
          {/if}
        </div>
      </section>
    {/each}
  </div>
</main>

<input
  bind:this={csvFileInput}
  class="visually-hidden"
  type="file"
  accept="text/csv,.csv"
  on:change={handleCsvFileChange}
/>

{#if addCardTargetGroup}
  <Modal title={`Add a card to ${addCardTargetGroup}`} on:close={closeAddCardModal}>
    {#if ungroupedCards.length > 0}
      <div class="modal-search">
        <input
          id="add-card-search"
          class="modal-search-input"
          type="search"
          aria-label="Filter languages by name"
          placeholder="Search languages"
          value={addCardSearch}
          on:input={handleAddCardSearchInput}
        />
      </div>

      {#if addableCards.length > 0}
      <div class="modal-grid">
        {#each pagedAddableCards as card}
          <button class="card-button modal-card-button" type="button" on:click={() => handleAddCardToGroup(card.id)}>
            <Card {card} metrics={selectedMetrics} />
          </button>
        {/each}
      </div>

      {#if addCardPageCount > 1}
        <div class="modal-pagination">
          <button
            class="group-action-button modal-pagination-button"
            type="button"
            aria-label="Previous page"
            on:click={() => (addCardPage = Math.max(0, addCardPage - 1))}
            disabled={addCardPage === 0}
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <p>Page {addCardPage + 1} of {addCardPageCount}</p>
          <button
            class="group-action-button modal-pagination-button"
            type="button"
            aria-label="Next page"
            on:click={() => (addCardPage = Math.min(addCardPageCount - 1, addCardPage + 1))}
            disabled={addCardPage === addCardPageCount - 1}
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      {/if}
      {:else}
        <p class="modal-empty-state">No languages match this search.</p>
      {/if}
    {:else}
      <p class="modal-empty-state">There are no ungrouped cards available to add right now.</p>
    {/if}
  </Modal>
{/if}

{#if groupModalMode}
  <TextPromptModal
    title={groupModalMode === 'rename' ? 'Rename group' : 'Add group'}
    label={groupModalMode === 'rename' ? 'Group name' : 'New group name'}
    confirmLabel={groupModalMode === 'rename' ? 'Rename' : 'Add group'}
    placeholder="Enter a group name"
    value={groupModalValue}
    on:close={closeGroupModal}
    on:confirm={handleGroupModalConfirm}
  />
{/if}

{#if deleteGroupName}
  <ConfirmModal
    title="Remove group"
    message={
      (groupedCards[deleteGroupName]?.length ?? 0) > 0
        ? `Remove group "${deleteGroupName}"? The ${(groupedCards[deleteGroupName]?.length ?? 0)} card${(groupedCards[deleteGroupName]?.length ?? 0) === 1 ? '' : 's'} in it will become ungrouped and disappear from the overview.`
        : `Remove empty group "${deleteGroupName}"?`
    }
    confirmLabel="Remove"
    danger={true}
    on:close={closeDeleteGroupModal}
    on:confirm={handleRemoveGroup}
  />
{/if}

{#if restoreDefaultsPending}
  <ConfirmModal
    title="Restore Default Set"
    message="Restore the card groups and assignments from the original CSV data? This will discard your current set changes in local storage."
    confirmLabel="Restore"
    danger={true}
    on:close={closeRestoreDefaultsModal}
    on:confirm={handleRestoreDefaults}
  />
{/if}

{#if pendingImportedCards}
  <ConfirmModal
    title="Import CSV"
    message={`Replace the current card set with ${pendingImportedCards.length} card${pendingImportedCards.length === 1 ? '' : 's'} from "${pendingImportFileName}"? This will overwrite your current groups, assignments, and card edits in local storage.`}
    confirmLabel="Import"
    danger={true}
    on:close={closeImportConfirmModal}
    on:confirm={handleConfirmImportCsv}
  />
{/if}

{#if importErrorMessage}
  <Modal title="CSV import failed" width="min(32rem, calc(100vw - 2rem))" on:close={closeImportErrorModal}>
    <div class="import-error-modal">
      <p>{importErrorMessage}</p>
      <div class="actions">
        <button class="group-action-button" type="button" on:click={closeImportErrorModal}>Close</button>
      </div>
    </div>
  </Modal>
{/if}

{#if activeCardAction}
  <Modal title={activeCardAction.language} width="min(24rem, calc(100vw - 2rem))" on:close={closeCardActionModal}>
    <div class="modal-action-list">
      <button class="modal-action-button" type="button" on:click={openCardEditModal}>
        Edit
      </button>
      <button class="modal-action-button modal-action-button-danger" type="button" on:click={handleRemoveCardFromGroup}>
        Remove
      </button>
    </div>
  </Modal>
{/if}

{#if editingCard}
  <CardEditModal card={editingCard} on:close={closeCardEditModal} on:save={handleSaveEditedCard} />
{/if}

<style>
  .page {
    padding: 2rem;
    max-width: 120rem;
    margin: 0 auto;
  }

  .hero {
    display: block;
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
    padding: 0.2rem 0;
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
    padding: 1.1rem;
    border: 1px solid rgba(143, 179, 255, 0.22);
    border-radius: 1rem;
    background: rgba(15, 23, 42, 0.55);
  }

  .controls-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
    gap: 1rem;
    margin-bottom: 2.5rem;
  }

  @media (min-width: 1200px) {
    .controls-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .actions-panel {
      grid-column: span 1;
    }

    .controls-grid > .controls:not(.actions-panel) {
      grid-column: span 1;
    }
  }

  .panel-toggle {
    width: 100%;
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
    display: flex;
    justify-content: space-between;
    align-items: end;
    gap: 1rem;
    text-align: left;
    cursor: default;
  }

  .panel-toggle-end {
    display: flex;
    align-items: center;
    justify-content: end;
    gap: 0.7rem;
    color: #9eb5db;
  }

  .panel-indicator {
    display: none;
    width: 1.8rem;
    height: 1.8rem;
    border: 1px solid rgba(143, 179, 255, 0.22);
    border-radius: 999px;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
    line-height: 1;
    color: #e5eefc;
  }

  .panel-indicator :global(svg),
  .add-card-symbol :global(svg) {
    width: 0.9em;
    height: 0.9em;
  }

  .panel-body {
    margin-top: 1rem;
  }

  .panel-toggle h2 {
    margin: 0;
    font-size: 1.15rem;
  }

  .panel-toggle-end p {
    margin: 0;
    color: #9eb5db;
  }

  .controls-actions {
    display: flex;
    flex-direction: column;
    align-items: end;
    gap: 0.7rem;
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
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

  .group-sections {
    max-width: 78rem;
    margin: 0 auto;
    display: grid;
    justify-items: center;
  }

  .group-section {
    width: fit-content;
    max-width: 100%;
  }

  .actions-panel-buttons {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .group-header {
    display: flex;
    justify-content: space-between;
    align-items: end;
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

  .group-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: end;
    gap: 0.6rem;
  }

  .group-action-button {
    border: 1px solid rgba(143, 179, 255, 0.22);
    border-radius: 999px;
    padding: 0.55rem 0.85rem;
    background: rgba(30, 41, 59, 0.8);
    color: #e5eefc;
    cursor: pointer;
  }

  .group-action-button-danger {
    border-color: rgba(251, 113, 133, 0.35);
    color: #fecdd3;
  }

  .group-action-button:disabled,
  .modal-action-button:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .card-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    width: fit-content;
    max-width: 100%;
  }

  .card-button {
    padding: 0;
    border: 0;
    background: transparent;
    cursor: pointer;
    text-align: inherit;
  }

  .card-button :global(.card) {
    transition: transform 0.16s ease, box-shadow 0.16s ease;
  }

  .card-button:hover :global(.card) {
    transform: translateY(-2px);
    box-shadow: 0 14px 28px rgba(15, 23, 42, 0.4);
  }

  .add-card-button {
    width: 6cm;
    height: 10cm;
    padding: 0.45cm;
    border-radius: 0.32cm;
    border: 2px dashed rgba(143, 179, 255, 0.32);
    background: rgba(15, 23, 42, 0.35);
    color: #dbeafe;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    cursor: pointer;
  }

  .add-card-symbol {
    width: 3rem;
    height: 3rem;
    border-radius: 999px;
    border: 1px solid rgba(143, 179, 255, 0.25);
    display: grid;
    place-items: center;
    font-size: 2rem;
    line-height: 1;
  }

  .add-card-label {
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 0.85rem;
    font-weight: 700;
  }

  .modal-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 1rem;
    justify-items: center;
  }

  .modal-search {
    display: grid;
    margin-bottom: 1rem;
  }

  .modal-search-input {
    width: 100%;
    border: 1px solid rgba(143, 179, 255, 0.22);
    border-radius: 0.85rem;
    padding: 0.8rem 0.95rem;
    background: rgba(30, 41, 59, 0.8);
    color: #e5eefc;
  }

  .modal-search-input::placeholder {
    color: #8fa6cc;
  }

  .modal-search-input:focus {
    outline: 2px solid rgba(143, 179, 255, 0.4);
    outline-offset: 2px;
    border-color: rgba(143, 179, 255, 0.45);
  }

  .modal-card-button {
    width: 100%;
    display: flex;
    justify-content: center;
  }

  .modal-card-button :global(.card) {
    width: 4.45cm;
    height: 7.4cm;
    padding: 0.3cm;
  }

  .modal-card-button :global(.card-header) {
    gap: 0.18cm;
    margin-bottom: 0.22cm;
  }

  .modal-card-button :global(.group),
  .modal-card-button :global(.year) {
    font-size: 0.21cm;
    letter-spacing: 0.025cm;
  }

  .modal-card-button :global(h2) {
    margin-top: 0.05cm;
    font-size: 0.42cm;
  }

  .modal-card-button :global(.visual-frame) {
    margin-bottom: 0.22cm;
  }

  .modal-card-button :global(.visual) {
    min-height: 1.55cm;
    padding: 0.3cm;
  }

  .modal-card-button :global(.visual-badge) {
    width: 1.1cm;
    height: 1.1cm;
    font-size: 0.34cm;
  }

  .modal-card-button :global(.stats) {
    gap: 0.08cm;
  }

  .modal-card-button :global(.stat-row) {
    gap: 0.14cm;
    padding: 0.08cm 0.12cm;
    font-size: 0.24cm;
  }

  .modal-card-button :global(.stat-row strong) {
    font-size: 0.26cm;
  }

  .modal-card-button :global(.empty-state) {
    padding: 0.18cm 0.12cm;
    font-size: 0.24cm;
  }

  .modal-pagination {
    margin-top: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    flex-wrap: nowrap;
  }

  .modal-pagination-button {
    min-width: 2.75rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .modal-pagination p,
  .modal-empty-state {
    margin: 0;
    color: #9eb5db;
  }

  .modal-pagination p {
    white-space: nowrap;
  }

  .modal-empty-state {
    padding: 0.25rem 0;
  }

  .modal-action-list {
    display: grid;
    gap: 0.75rem;
  }

  .import-error-modal {
    display: grid;
    gap: 1rem;
  }

  .import-error-modal p {
    margin: 0;
    color: #cbd5e1;
    line-height: 1.5;
  }

  .import-error-modal .actions {
    display: flex;
    justify-content: end;
  }

  .modal-action-button {
    border: 1px solid rgba(143, 179, 255, 0.22);
    border-radius: 0.85rem;
    padding: 0.9rem 1rem;
    background: rgba(30, 41, 59, 0.8);
    color: #e5eefc;
    font-weight: 700;
    cursor: pointer;
    text-align: left;
  }

  .modal-action-button-danger {
    border-color: rgba(251, 113, 133, 0.35);
    color: #fecdd3;
  }

  @media (max-width: 720px) {
    .page {
      padding: 1rem;
      font-size: 0.92rem;
    }

    .hero {
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .eyebrow {
      font-size: 0.72rem;
    }

    h1 {
      font-size: 1.8rem;
    }

    .intro,
    .summary span,
    .panel-toggle-end p,
    .group-header p,
    .modal-pagination p,
    .modal-empty-state,
    .modal-search-input,
    .metric-toggle span,
    .group-action-button,
    .modal-action-button,
    .add-card-label {
      font-size: 0.85rem;
    }

    .panel-toggle {
      align-items: center;
      cursor: pointer;
    }

    .panel-toggle[aria-expanded='false'] h2,
    .panel-toggle[aria-expanded='false'] .panel-toggle-end p {
      display: none;
    }

    .panel-toggle[aria-expanded='false'] {
      align-items: center;
      min-height: 1.8rem;
    }

    .panel-toggle-end {
      flex-shrink: 0;
    }

    .panel-indicator {
      display: inline-flex;
    }

    .controls-grid {
      grid-template-columns: 1fr;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .controls-actions {
      align-items: start;
    }

    .modal-pagination {
      justify-content: center;
      align-items: center;
      gap: 0.75rem;
      flex-direction: row;
      flex-wrap: nowrap;
    }

    .controls {
      padding: 0.9rem;
    }

    .panel-toggle h2,
    .group-header h2 {
      font-size: 1rem;
    }

    .summary div,
    .metric-toggle,
    .group-action-button,
    .modal-action-button {
      padding-left: 0.8rem;
      padding-right: 0.8rem;
    }

    .group-header {
      align-items: center;
      flex-direction: row;
      justify-content: space-between;
      width: 100%;
    }

    .actions-panel-buttons,
    .group-actions {
      justify-content: start;
    }

    .card-button,
    .add-card-button {
      max-width: 100%;
    }

    .group-section,
    .card-grid {
      width: 100%;
    }

    .card-grid,
    .modal-grid {
      gap: 0.75rem;
      justify-content: center;
    }

    .modal-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .modal-card-button :global(.card) {
      width: min(calc(50vw - 2rem), 4.35cm);
      height: calc(min(calc(50vw - 2rem), 4.35cm) * 1.66);
      padding: 0.24cm;
    }

    .add-card-button {
      width: min(calc(50vw - 1.5rem), 5.1cm);
      height: calc(min(calc(50vw - 1.5rem), 5.1cm) * 1.66);
      padding: 0.28cm;
      gap: 0.35rem;
    }

    .add-card-symbol {
      width: 2.25rem;
      height: 2.25rem;
      font-size: 1.5rem;
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
    .modal-empty-state,
    .modal-pagination p,
    .summary span,
    .panel-toggle-end p {
      color: #475569;
    }

    .summary div,
    .controls {
      background: #ffffff;
      border-color: #cbd5e1;
      backdrop-filter: none;
    }

    .panel-indicator {
      border-color: #cbd5e1;
      color: #111827;
    }

    .metric-toggle {
      background: #ffffff;
      border-color: #cbd5e1;
      color: #111827;
    }

    .group-action-button,
    .modal-action-button,
    .add-card-button {
      background: #ffffff;
      border-color: #cbd5e1;
      color: #111827;
    }

    .export-button {
      display: none;
    }
  }
</style>
