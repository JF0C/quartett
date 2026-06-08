import cardsCsv from '../../../cards.csv?raw';

export type Card = {
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

function parseNumber(value: string): number {
  const parsed = Number(value.trim());

  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid numeric value: ${value}`);
  }

  return parsed;
}

function parseCsv(text: string): string[][] {
  return text
    .trim()
    .split(/\r?\n/)
    .map((line) => line.split(',').map((cell) => cell.trim()));
}

const [header, ...rows] = parseCsv(cardsCsv);

if (!header || header.length < 11) {
  throw new Error('cards.csv does not have the expected columns');
}

export const cards: Card[] = rows.map((row) => ({
  language: row[0],
  performance: parseNumber(row[1]),
  usability: parseNumber(row[2]),
  errorTolerance: parseNumber(row[3]),
  aiCompatibility: parseNumber(row[4]),
  tiobe: parseNumber(row[5]),
  ecosystem: parseNumber(row[6]),
  supportedParadigms: parseNumber(row[7]),
  group: row[8],
  yearIntroduced: parseNumber(row[9]),
  image: row[10] ?? ''
}));

export const groupedCards = cards
  .filter((card) => card.group)
  .reduce<Record<string, Card[]>>((groups, card) => {
    const existing = groups[card.group] ?? [];
    groups[card.group] = [...existing, card];
    return groups;
  }, {});

export const groupNames = Object.keys(groupedCards).sort((left, right) => left.localeCompare(right));
