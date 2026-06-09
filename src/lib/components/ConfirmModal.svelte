<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Modal from './Modal.svelte';

  export let title = '';
  export let message = '';
  export let confirmLabel = 'Confirm';
  export let cancelLabel = 'Cancel';
  export let danger = false;

  const dispatch = createEventDispatcher<{
    close: void;
    confirm: void;
  }>();
</script>

<Modal {title} width="min(28rem, calc(100vw - 2rem))" on:close={() => dispatch('close')}>
  <div class="confirm-modal">
    <p>{message}</p>

    <div class="actions">
      <button class="secondary" type="button" on:click={() => dispatch('close')}>{cancelLabel}</button>
      <button class:danger class="primary" type="button" on:click={() => dispatch('confirm')}>
        {confirmLabel}
      </button>
    </div>
  </div>
</Modal>

<style>
  .confirm-modal {
    display: grid;
    gap: 1rem;
  }

  p {
    margin: 0;
    color: #cbd5e1;
    line-height: 1.5;
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

  .primary.danger {
    background: linear-gradient(135deg, #fb7185 0%, #f43f5e 100%);
    color: #fff1f2;
  }

  @media print {
    .confirm-modal {
      display: none;
    }
  }
</style>
