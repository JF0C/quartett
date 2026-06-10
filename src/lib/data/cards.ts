import cardsCsv from '../../../cards.csv?raw';
import { parseCardsCsv } from './cardsCsv';

export type Card = {
  id: string;
  language: string;
  performance: number;
  usability: number;
  errorTolerance: number;
  aiCompatibility: number;
  tiobe: number;
  ecosystem: number;
  supportedParadigms: number;
  group: string;
  yearIntroduced: number;
  image: string;
};

export type CardMetric = {
  key: keyof Pick<
    Card,
    'performance' | 'usability' | 'errorTolerance' | 'aiCompatibility' | 'tiobe' | 'ecosystem' | 'supportedParadigms'
  >;
  label: string;
};

export type CardMetricKey = CardMetric['key'];

export const metrics: CardMetric[] = [
  { key: 'performance', label: 'Performance' },
  { key: 'usability', label: 'Usability' },
  { key: 'errorTolerance', label: 'Error tolerance' },
  { key: 'aiCompatibility', label: 'AI compatibility' },
  { key: 'tiobe', label: 'TIOBE' },
  { key: 'ecosystem', label: 'Ecosystem' },
  { key: 'supportedParadigms', label: 'Paradigms' }
];

export const cards: Card[] = parseCardsCsv(cardsCsv);

export const groupedCards = cards
  .filter((card) => card.group)
  .reduce<Record<string, Card[]>>((groups, card) => {
    const existing = groups[card.group] ?? [];
    groups[card.group] = [...existing, card];
    return groups;
  }, {});

export const groupNames = Object.keys(groupedCards).sort((left, right) => left.localeCompare(right));
