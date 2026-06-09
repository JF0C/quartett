<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Modal from './Modal.svelte';

  export let title = '';
  export let label = '';
  export let confirmLabel = 'Save';
  export let placeholder = '';
  export let value = '';

  const dispatch = createEventDispatcher<{
    close: void;
    confirm: { value: string };
  }>();

  let draftValue = value;

  $: draftValue = value;

  function handleSubmit() {
    dispatch('confirm', { value: draftValue.trim() });
  }
</script>

<Modal {title} width="min(28rem, calc(100vw - 2rem))" on:close={() => dispatch('close')}>
  <div class="text-prompt-modal">
    <label>
      <span>{label}</span>
      <input bind:value={draftValue} type="text" {placeholder} />
    </label>

    <div class="actions">
      <button class="secondary" type="button" on:click={() => dispatch('close')}>Cancel</button>
      <button class="primary" type="button" on:click={handleSubmit} disabled={!draftValue.trim()}>
        {confirmLabel}
      </button>
    </div>
  </div>
</Modal>

<style>
  .text-prompt-modal {
    display: grid;
    gap: 1rem;
  }

  label {
    display: grid;
    gap: 0.45rem;
  }

  span {
    color: #cbd5e1;
    font-size: 0.95rem;
  }

  input {
    width: 100%;
    border: 1px solid rgba(143, 179, 255, 0.22);
    border-radius: 0.85rem;
    padding: 0.85rem 0.95rem;
    background: rgba(30, 41, 59, 0.8);
    color: #e5eefc;
    font: inherit;
  }

  .actions {
    display: flex;
    justify-content: end;
    gap: 0.75rem;
  }

  button {
    border-radius: 999px;
    padding: 0.7rem 1rem;
    font: inherit;
    font-weight: 700;
    cursor: pointer;
  }

  .secondary {
    border: 1px solid rgba(143, 179, 255, 0.22);
    background: rgba(30, 41, 59, 0.8);
    color: #e5eefc;
  }

  .primary {
    border: 0;
    background: linear-gradient(135deg, #8fb3ff 0%, #c4b5fd 100%);
    color: #0f172a;
  }

  button:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  @media print {
    .text-prompt-modal {
      display: none;
    }
  }
</style>
