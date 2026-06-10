<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let title = '';
  export let width = 'min(72rem, calc(100vw - 2rem))';

  const dispatch = createEventDispatcher<{ close: void }>();

  function handleBackdropClick() {
    dispatch('close');
  }

  function handleBackdropKeydown(event: KeyboardEvent) {
    if (event.target !== event.currentTarget) {
      return;
    }

    if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      dispatch('close');
    }
  }

  function handlePanelClick(event: MouseEvent) {
    event.stopPropagation();
  }

  function handlePanelKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      dispatch('close');
    }
  }
</script>

<div class="modal-backdrop" role="button" tabindex="0" aria-label="Close dialog" on:click={handleBackdropClick} on:keydown={handleBackdropKeydown}>
  <div class="modal-panel" role="dialog" aria-modal="true" aria-label={title || 'Dialog'} tabindex="-1" style={`--modal-width: ${width};`} on:click={handlePanelClick} on:keydown={handlePanelKeydown}>
    {#if title}
      <header class="modal-header">
        <h2>{title}</h2>
      </header>
    {/if}

    <div class="modal-content">
      <slot />
    </div>
  </div>
</div>

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: grid;
    place-items: center;
    padding: 1rem;
    background: rgba(15, 23, 42, 0.78);
    backdrop-filter: blur(8px);
  }

  .modal-panel {
    width: var(--modal-width);
    max-height: calc(100vh - 2rem);
    overflow: auto;
    border: 1px solid rgba(143, 179, 255, 0.22);
    border-radius: 1rem;
    background: #0f172a;
    color: #e5eefc;
    box-shadow: 0 24px 64px rgba(15, 23, 42, 0.45);
  }

  .modal-header {
    padding: 1.1rem 1.1rem 0;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.2rem;
  }

  .modal-content {
    padding: 1.1rem;
  }

  @media (max-width: 720px) {
    .modal-backdrop {
      padding: 0.75rem;
    }

    .modal-panel {
      max-height: calc(100vh - 1.5rem);
    }
  }

  @media print {
    .modal-backdrop {
      display: none;
    }
  }
</style>
