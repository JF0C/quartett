export type GroupVisual = {
  accent: string;
  panel: string;
};

export const groupVisuals: Record<string, GroupVisual> = {
  Systems: {
    accent: '#60a5fa',
    panel: 'rgba(96, 165, 250, 0.18)'
  },
  JVM: {
    accent: '#f59e0b',
    panel: 'rgba(245, 158, 11, 0.18)'
  },
  'Microsoft/.NET': {
    accent: '#a78bfa',
    panel: 'rgba(167, 139, 250, 0.18)'
  },
  Web: {
    accent: '#34d399',
    panel: 'rgba(52, 211, 153, 0.18)'
  },
  Functional: {
    accent: '#f472b6',
    panel: 'rgba(244, 114, 182, 0.18)'
  },
  Scientific: {
    accent: '#22d3ee',
    panel: 'rgba(34, 211, 238, 0.18)'
  },
  Scripting: {
    accent: '#fb7185',
    panel: 'rgba(251, 113, 133, 0.18)'
  },
  Specialty: {
    accent: '#facc15',
    panel: 'rgba(250, 204, 21, 0.18)'
  }
};
