<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Card } from '../data/cards';
  import Modal from './Modal.svelte';

  export let card: Card;

  const dispatch = createEventDispatcher<{
    close: void;
    save: { card: Card };
  }>();

  let draftCard: Card = { ...card };

  $: draftCard = { ...card };

  function updateNumberField(key: keyof Card, value: string) {
    draftCard = {
      ...draftCard,
      [key]: Number(value)
    };
  }

  function isValidNumber(value: number) {
    return Number.isFinite(value);
  }

  $: isValid =
    isValidNumber(draftCard.performance) &&
    isValidNumber(draftCard.usability) &&
    isValidNumber(draftCard.errorTolerance) &&
    isValidNumber(draftCard.aiCompatibility) &&
    isValidNumber(draftCard.tiobe) &&
    isValidNumber(draftCard.ecosystem) &&
    isValidNumber(draftCard.supportedParadigms) &&
    isValidNumber(draftCard.yearIntroduced);

  function handleSave() {
    if (!isValid) {
      return;
    }

    dispatch('save', {
      card: { ...draftCard }
    });
  }
</script>

<Modal title={`Edit ${card.language}`} width="min(40rem, calc(100vw - 2rem))" on:close={() => dispatch('close')}>
  <div class="card-edit-modal">
    <div class="field-grid">
      <label>
        <span>Performance</span>
        <input value={draftCard.performance} type="number" on:input={(event) => updateNumberField('performance', (event.currentTarget as HTMLInputElement).value)} />
      </label>

      <label>
        <span>Usability</span>
        <input value={draftCard.usability} type="number" on:input={(event) => updateNumberField('usability', (event.currentTarget as HTMLInputElement).value)} />
      </label>

      <label>
        <span>Error tolerance</span>
        <input value={draftCard.errorTolerance} type="number" on:input={(event) => updateNumberField('errorTolerance', (event.currentTarget as HTMLInputElement).value)} />
      </label>

      <label>
        <span>AI compatibility</span>
        <input value={draftCard.aiCompatibility} type="number" on:input={(event) => updateNumberField('aiCompatibility', (event.currentTarget as HTMLInputElement).value)} />
      </label>

      <label>
        <span>TIOBE</span>
        <input value={draftCard.tiobe} type="number" on:input={(event) => updateNumberField('tiobe', (event.currentTarget as HTMLInputElement).value)} />
      </label>

      <label>
        <span>Ecosystem</span>
        <input value={draftCard.ecosystem} type="number" on:input={(event) => updateNumberField('ecosystem', (event.currentTarget as HTMLInputElement).value)} />
      </label>

      <label>
        <span>Supported paradigms</span>
        <input value={draftCard.supportedParadigms} type="number" on:input={(event) => updateNumberField('supportedParadigms', (event.currentTarget as HTMLInputElement).value)} />
      </label>

      <label>
        <span>Year introduced</span>
        <input value={draftCard.yearIntroduced} type="number" on:input={(event) => updateNumberField('yearIntroduced', (event.currentTarget as HTMLInputElement).value)} />
      </label>
    </div>

    <div class="actions">
      <button class="secondary" type="button" on:click={() => dispatch('close')}>Cancel</button>
      <button class="primary" type="button" on:click={handleSave} disabled={!isValid}>Save</button>
    </div>
  </div>
</Modal>

<style>
  .card-edit-modal {
    display: grid;
    gap: 1rem;
  }

  .field-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.85rem;
  }

  label {
    display: grid;
    gap: 0.4rem;
  }

  span {
    color: #cbd5e1;
    font-size: 0.95rem;
  }

  input {
    width: 100%;
    border: 1px solid rgba(143, 179, 255, 0.22);
    border-radius: 0.85rem;
    padding: 0.8rem 0.9rem;
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

  @media (max-width: 720px) {
    .field-grid {
      grid-template-columns: 1fr;
    }
  }

  @media print {
    .card-edit-modal {
      display: none;
    }
  }
</style>
