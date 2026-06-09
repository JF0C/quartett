import { jsPDF } from 'jspdf';

import type { Card, CardMetric } from '../data/cards';
import { groupVisuals } from '../data/groups';
import { resolveImageSource } from '../data/images';

type LoadedImage = {
  dataUrl: string;
  width: number;
  height: number;
};

const page = {
  width: 210,
  height: 297,
  marginX: 9,
  marginY: 14,
  gapX: 3,
  gapY: 5,
  columns: 3,
  rows: 2
};

const card = {
  width: 60,
  height: 100,
  radius: 3.2,
  padding: 4.5
};

const pdfFileName = 'programming-languages-quartet.pdf';

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '');
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  return [red, green, blue];
}

function mixWithWhite(hex: string, weight: number): [number, number, number] {
  const [red, green, blue] = hexToRgb(hex);
  const clampedWeight = Math.max(0, Math.min(1, weight));

  return [red, green, blue].map((channel) => Math.round(channel + (255 - channel) * clampedWeight)) as [number, number, number];
}

function toInitials(language: string): string {
  return language
    .split(/[^A-Za-z0-9+#.]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();
}

function fitBox(sourceWidth: number, sourceHeight: number, boxWidth: number, boxHeight: number) {
  const scale = Math.min(boxWidth / sourceWidth, boxHeight / sourceHeight);
  const width = sourceWidth * scale;
  const height = sourceHeight * scale;

  return {
    width,
    height,
    offsetX: (boxWidth - width) / 2,
    offsetY: (boxHeight - height) / 2
  };
}

function splitTitle(doc: jsPDF, text: string, maxWidth: number): string[] {
  const lines = doc.splitTextToSize(text, maxWidth) as string[];

  if (lines.length <= 2) {
    return lines;
  }

  const truncated = lines.slice(0, 2);
  truncated[1] = `${truncated[1].replace(/[.\s]+$/u, '')}...`;
  return truncated;
}

function loadImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    image.src = url;
  });
}

async function loadImageData(url: string): Promise<LoadedImage | null> {
  if (!url) {
    return null;
  }

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Image request failed with status ${response.status}`);
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    try {
      const image = await loadImageElement(objectUrl);
      const canvas = document.createElement('canvas');
      const width = Math.max(1, image.naturalWidth || image.width);
      const height = Math.max(1, image.naturalHeight || image.height);

      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Failed to create canvas context');
      }

      context.drawImage(image, 0, 0, width, height);

      return {
        dataUrl: canvas.toDataURL('image/png'),
        width,
        height
      };
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } catch {
    return null;
  }
}

function drawCard(
  doc: jsPDF,
  currentCard: Card,
  visibleMetrics: CardMetric[],
  x: number,
  y: number,
  image: LoadedImage | null
) {
  const accent = groupVisuals[currentCard.group]?.accent ?? '#64748b';
  const accentRgb = hexToRgb(accent);
  const accentLight = mixWithWhite(accent, 0.84);
  const accentLighter = mixWithWhite(accent, 0.92);
  const rowFill = [248, 250, 252] as const;
  const border = [203, 213, 225] as const;
  const mutedText = [71, 85, 105] as const;
  const bodyText = [15, 23, 42] as const;
  const padding = card.padding;

  doc.setDrawColor(...border);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x, y, card.width, card.height, card.radius, card.radius, 'FD');

  const groupTop = y + padding + 0.6;
  doc.setTextColor(...accentRgb);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text(currentCard.group.toUpperCase(), x + padding, groupTop);

  doc.setTextColor(...mutedText);
  doc.text(String(currentCard.yearIntroduced), x + card.width - padding, groupTop, { align: 'right' });

  const titleLines = splitTitle(doc, currentCard.language, card.width - padding * 2);
  const titleTop = groupTop + 4.8;
  doc.setTextColor(...bodyText);
  doc.setFontSize(15);
  doc.text(titleLines, x + padding, titleTop, { baseline: 'top' });

  const titleHeight = titleLines.length * 5.8;
  const statsCount = visibleMetrics.length > 0 ? visibleMetrics.length : 1;
  const rowHeight = 5.3;
  const rowGap = 1.2;
  const statsHeight = statsCount * rowHeight + (statsCount - 1) * rowGap;
  const statsTop = y + card.height - padding - statsHeight;
  const visualTop = titleTop + titleHeight + 2.6;
  const visualHeight = Math.max(18, statsTop - visualTop - 3);

  doc.setFillColor(...accentLighter);
  doc.roundedRect(x + padding, visualTop, card.width - padding * 2, visualHeight, 2, 2, 'F');

  doc.setFillColor(...accentLight);
  doc.roundedRect(x + padding + 1.2, visualTop + 1.2, card.width - padding * 2 - 2.4, visualHeight - 2.4, 2.2, 2.2, 'F');

  if (image) {
    const imagePadding = 2.4;
    const boxWidth = card.width - padding * 2 - imagePadding * 2;
    const boxHeight = visualHeight - imagePadding * 2;
    const fitted = fitBox(image.width, image.height, boxWidth, boxHeight);

    doc.addImage(
      image.dataUrl,
      'PNG',
      x + padding + imagePadding + fitted.offsetX,
      visualTop + imagePadding + fitted.offsetY,
      fitted.width,
      fitted.height,
      undefined,
      'FAST'
    );
  } else {
    const initials = toInitials(currentCard.language);
    const circleRadius = Math.min(visualHeight * 0.24, 10);
    const centerX = x + card.width / 2;
    const centerY = visualTop + visualHeight / 2;

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...accentRgb);
    doc.circle(centerX, centerY, circleRadius, 'FD');
    doc.setTextColor(...accentRgb);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(initials, centerX, centerY + 1.8, { align: 'center' });
  }

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...bodyText);

  if (visibleMetrics.length > 0) {
    visibleMetrics.forEach((metric, index) => {
      const rowY = statsTop + index * (rowHeight + rowGap);

      doc.setFillColor(...rowFill);
      doc.roundedRect(x + padding, rowY, card.width - padding * 2, rowHeight, 1.6, 1.6, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...mutedText);
      doc.text(metric.label, x + padding + 1.6, rowY + 3.4);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...bodyText);
      doc.text(String(currentCard[metric.key]), x + card.width - padding - 1.6, rowY + 3.5, { align: 'right' });
    });
  } else {
    doc.setFillColor(...rowFill);
    doc.roundedRect(x + padding, statsTop, card.width - padding * 2, rowHeight, 1.6, 1.6, 'F');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(...mutedText);
    doc.text('No properties selected', x + card.width / 2, statsTop + 3.5, { align: 'center' });
  }
}

export async function exportCardsPdf(cards: Card[], visibleMetrics: CardMetric[]) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const uniqueUrls = [...new Set(cards.map((currentCard) => resolveImageSource(currentCard.image)).filter(Boolean))];
  const loadedImages = new Map<string, LoadedImage | null>();

  await Promise.all(
    uniqueUrls.map(async (url) => {
      loadedImages.set(url, await loadImageData(url));
    })
  );

  const cardsPerPage = page.columns * page.rows;

  cards.forEach((currentCard, index) => {
    if (index > 0 && index % cardsPerPage === 0) {
      doc.addPage();
    }

    const pageIndex = index % cardsPerPage;
    const column = pageIndex % page.columns;
    const row = Math.floor(pageIndex / page.columns);
    const x = page.marginX + column * (card.width + page.gapX);
    const y = page.marginY + row * (card.height + page.gapY);

    const imageUrl = resolveImageSource(currentCard.image);
    drawCard(doc, currentCard, visibleMetrics, x, y, loadedImages.get(imageUrl) ?? null);
  });

  doc.save(pdfFileName);
}
