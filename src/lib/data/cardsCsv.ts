import type { Card } from './cards';

const expectedHeader = [
  'Language',
  'Performance',
  'Usability',
  'Error tolerance',
  'AI compatibility',
  'TIOBE',
  'Ecosystem',
  'Supported Paradigms',
  'Group',
  'Year Introduced',
  'Image'
] as const;

const csvFileName = 'programming-languages-quartet.csv';

function createCardId(language: string, yearIntroduced: number): string {
  const slug = language
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${slug || 'card'}-${yearIntroduced}`;
}

function parseNumber(value: string, rowNumber: number, columnName: string): number {
  const parsed = Number(value.trim());

  if (Number.isNaN(parsed)) {
    throw new Error(`Row ${rowNumber}: ${columnName} must be a valid number.`);
  }

  return parsed;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (inQuotes) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += character;
      }

      continue;
    }

    if (character === '"') {
      inQuotes = true;
      continue;
    }

    if (character === ',') {
      row.push(cell);
      cell = '';
      continue;
    }

    if (character === '\n' || character === '\r') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';

      if (character === '\r' && text[index + 1] === '\n') {
        index += 1;
      }

      continue;
    }

    cell += character;
  }

  if (inQuotes) {
    throw new Error('CSV contains an unterminated quoted field.');
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  while (rows.length > 0 && rows[rows.length - 1].every((value) => value.trim() === '')) {
    rows.pop();
  }

  return rows;
}

function escapeCsvCell(value: string): string {
  if (!/[",\r\n]/.test(value)) {
    return value;
  }

  return `"${value.replace(/"/g, '""')}"`;
}

function createRow(card: Card): string[] {
  return [
    card.language,
    String(card.performance),
    String(card.usability),
    String(card.errorTolerance),
    String(card.aiCompatibility),
    String(card.tiobe),
    String(card.ecosystem),
    String(card.supportedParadigms),
    card.group,
    String(card.yearIntroduced),
    card.image
  ];
}

function normalizeCardValue(value: string): string {
  return value.trim();
}

function validateHeader(header: string[]) {
  if (
    header.length !== expectedHeader.length ||
    header.some((value, index) => value.trim() !== expectedHeader[index])
  ) {
    throw new Error(`CSV must use the expected header: ${expectedHeader.join(', ')}`);
  }
}

export function parseCardsCsv(text: string): Card[] {
  const rows = parseCsv(text);

  if (rows.length === 0) {
    throw new Error('CSV is empty.');
  }

  const [header, ...dataRows] = rows;
  validateHeader(header);

  if (dataRows.length === 0) {
    throw new Error('CSV does not contain any cards.');
  }

  const seenIds = new Set<string>();

  return dataRows.map((row, index) => {
    const rowNumber = index + 2;

    if (row.length !== expectedHeader.length) {
      throw new Error(`Row ${rowNumber}: expected ${expectedHeader.length} columns but found ${row.length}.`);
    }

    const language = normalizeCardValue(row[0]);

    if (!language) {
      throw new Error(`Row ${rowNumber}: Language is required.`);
    }

    const yearIntroduced = parseNumber(row[9], rowNumber, 'Year Introduced');
    const id = createCardId(language, yearIntroduced);

    if (seenIds.has(id)) {
      throw new Error(`Row ${rowNumber}: duplicate card id "${id}" generated from Language and Year Introduced.`);
    }

    seenIds.add(id);

    return {
      id,
      language,
      performance: parseNumber(row[1], rowNumber, 'Performance'),
      usability: parseNumber(row[2], rowNumber, 'Usability'),
      errorTolerance: parseNumber(row[3], rowNumber, 'Error tolerance'),
      aiCompatibility: parseNumber(row[4], rowNumber, 'AI compatibility'),
      tiobe: parseNumber(row[5], rowNumber, 'TIOBE'),
      ecosystem: parseNumber(row[6], rowNumber, 'Ecosystem'),
      supportedParadigms: parseNumber(row[7], rowNumber, 'Supported Paradigms'),
      group: normalizeCardValue(row[8]),
      yearIntroduced,
      image: normalizeCardValue(row[10])
    };
  });
}

export function serializeCardsCsv(cards: Card[]): string {
  return [expectedHeader.join(','), ...cards.map((card) => createRow(card).map(escapeCsvCell).join(','))].join('\n');
}

export function downloadCardsCsv(cards: Card[]) {
  const blob = new Blob([serializeCardsCsv(cards)], { type: 'text/csv;charset=utf-8' });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');

  try {
    link.href = objectUrl;
    link.download = csvFileName;
    link.click();
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
