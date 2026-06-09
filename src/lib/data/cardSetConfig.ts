import { cards, type Card } from './cards';

export type CardSetConfig = {
  version: 2;
  title: string;
  groups: string[];
  cards: Card[];
};

type LegacyCardSetConfig = {
  version: 1;
  title: string;
  cards: Card[];
};

export const cardSetConfigStorageKey = 'programmiersprachenquartett:card-set-config';

const cardSetTitle = 'Programming Languages Quartet';

function cloneCard(card: Card): Card {
  return { ...card };
}

function cloneCardSetConfig(config: CardSetConfig): CardSetConfig {
  return {
    ...config,
    groups: [...config.groups],
    cards: config.cards.map(cloneCard)
  };
}

function normalizeGroupName(name: string): string {
  return name.trim();
}

function getUniqueGroups(groupNames: string[]): string[] {
  return [...new Set(groupNames.map(normalizeGroupName).filter(Boolean))];
}

function deriveGroupsFromCards(cardList: Card[]): string[] {
  return getUniqueGroups(cardList.map((card) => card.group));
}

function sanitizeCardSetConfig(config: Omit<CardSetConfig, 'version'>): CardSetConfig {
  const groups = getUniqueGroups([...config.groups, ...deriveGroupsFromCards(config.cards)]);

  return {
    version: 2,
    title: config.title.trim() || cardSetTitle,
    groups,
    cards: config.cards.map((card) => ({
      ...card,
      group: normalizeGroupName(card.group)
    }))
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isCard(value: unknown): value is Card {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    typeof value.language === 'string' &&
    isNumber(value.performance) &&
    isNumber(value.usability) &&
    isNumber(value.errorTolerance) &&
    isNumber(value.aiCompatibility) &&
    isNumber(value.tiobe) &&
    isNumber(value.ecosystem) &&
    isNumber(value.supportedParadigms) &&
    typeof value.group === 'string' &&
    isNumber(value.yearIntroduced) &&
    typeof value.image === 'string'
  );
}

function isCardSetConfig(value: unknown): value is CardSetConfig {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.version === 2 &&
    typeof value.title === 'string' &&
    Array.isArray(value.groups) &&
    value.groups.every((group) => typeof group === 'string') &&
    Array.isArray(value.cards) &&
    value.cards.every(isCard)
  );
}

function isLegacyCardSetConfig(value: unknown): value is LegacyCardSetConfig {
  if (!isRecord(value)) {
    return false;
  }

  return value.version === 1 && typeof value.title === 'string' && Array.isArray(value.cards) && value.cards.every(isCard);
}

function migrateLegacyCardSetConfig(config: LegacyCardSetConfig): CardSetConfig {
  return sanitizeCardSetConfig({
    title: config.title,
    groups: deriveGroupsFromCards(config.cards),
    cards: config.cards.map(cloneCard)
  });
}

export function createDefaultCardSetConfig(): CardSetConfig {
  return sanitizeCardSetConfig({
    title: cardSetTitle,
    groups: deriveGroupsFromCards(cards),
    cards: cards.map(cloneCard)
  });
}

export function loadCardSetConfig(storage: Storage): CardSetConfig {
  const fallback = createDefaultCardSetConfig();
  const stored = storage.getItem(cardSetConfigStorageKey);

  if (!stored) {
    saveCardSetConfig(storage, fallback);
    return fallback;
  }

  try {
    const parsed: unknown = JSON.parse(stored);

    if (isCardSetConfig(parsed)) {
      const sanitized = sanitizeCardSetConfig(parsed);
      saveCardSetConfig(storage, sanitized);
      return cloneCardSetConfig(sanitized);
    }

    if (isLegacyCardSetConfig(parsed)) {
      const migrated = migrateLegacyCardSetConfig(parsed);
      saveCardSetConfig(storage, migrated);
      return migrated;
    }
  } catch {
    // Invalid storage contents are replaced with the CSV-backed default config.
  }

  saveCardSetConfig(storage, fallback);
  return fallback;
}

export function saveCardSetConfig(storage: Storage, config: CardSetConfig) {
  storage.setItem(cardSetConfigStorageKey, JSON.stringify(sanitizeCardSetConfig(config)));
}

export function groupCardsByGroup(groupNames: string[], cards: Card[]): Record<string, Card[]> {
  const groups = groupNames.reduce<Record<string, Card[]>>((accumulator, groupName) => {
    accumulator[groupName] = [];
    return accumulator;
  }, {});

  cards.filter((card) => card.group).forEach((card) => {
    groups[card.group] = [...(groups[card.group] ?? []), card];
  });

  return groups;
}

export function getSortedGroupNames(groups: string[]): string[] {
  return [...getUniqueGroups(groups)].sort((left, right) => left.localeCompare(right));
}

export function renameCardGroup(config: CardSetConfig, currentName: string, nextName: string): CardSetConfig {
  const normalizedCurrentName = normalizeGroupName(currentName);
  const normalizedNextName = normalizeGroupName(nextName);

  if (!normalizedCurrentName || !normalizedNextName) {
    return config;
  }

  return sanitizeCardSetConfig({
    title: config.title,
    groups: config.groups.map((groupName) =>
      normalizeGroupName(groupName) === normalizedCurrentName ? normalizedNextName : groupName
    ),
    cards: config.cards.map((card) =>
      card.group === normalizedCurrentName
        ? {
            ...card,
            group: normalizedNextName
          }
        : card
    )
  });
}

export function addCardGroup(config: CardSetConfig, groupName: string): CardSetConfig {
  const normalizedGroupName = normalizeGroupName(groupName);

  if (!normalizedGroupName) {
    return config;
  }

  return sanitizeCardSetConfig({
    title: config.title,
    groups: [...config.groups, normalizedGroupName],
    cards: config.cards
  });
}

export function removeCardGroup(config: CardSetConfig, groupName: string): CardSetConfig {
  const normalizedGroupName = normalizeGroupName(groupName);

  if (!normalizedGroupName) {
    return config;
  }

  return sanitizeCardSetConfig({
    title: config.title,
    groups: config.groups.filter((currentGroupName) => normalizeGroupName(currentGroupName) !== normalizedGroupName),
    cards: config.cards.map((card) =>
      card.group === normalizedGroupName
        ? {
            ...card,
            group: ''
          }
        : card
    )
  });
}

export function assignCardToGroup(config: CardSetConfig, cardId: string, groupName: string): CardSetConfig {
  const normalizedGroupName = normalizeGroupName(groupName);

  if (!cardId || !normalizedGroupName) {
    return config;
  }

  return sanitizeCardSetConfig({
    title: config.title,
    groups: [...config.groups, normalizedGroupName],
    cards: config.cards.map((card) =>
      card.id === cardId
        ? {
            ...card,
            group: normalizedGroupName
          }
        : card
    )
  });
}

export function unassignCardFromGroup(config: CardSetConfig, cardId: string): CardSetConfig {
  if (!cardId) {
    return config;
  }

  return sanitizeCardSetConfig({
    title: config.title,
    groups: config.groups,
    cards: config.cards.map((card) =>
      card.id === cardId
        ? {
            ...card,
            group: ''
          }
        : card
    )
  });
}

export function updateCard(config: CardSetConfig, updatedCard: Card): CardSetConfig {
  if (!updatedCard.id) {
    return config;
  }

  return sanitizeCardSetConfig({
    title: config.title,
    groups: config.groups,
    cards: config.cards.map((card) => (card.id === updatedCard.id ? { ...updatedCard } : card))
  });
}
