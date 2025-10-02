// Zentrale CRM Pipeline Definitionen
export const CRM_STAGES = {
  NEW: 'new',
  CONTACTED: 'contacted',
  QUALIFIED: 'qualified',
  PROPOSAL_SENT: 'proposal_sent',
  NEGOTIATION: 'negotiation',
  CLOSING: 'closing',
  WON: 'won',
  LOST: 'lost'
} as const;

export type CRMStage = typeof CRM_STAGES[keyof typeof CRM_STAGES];

export const STAGE_ORDER: CRMStage[] = [
  CRM_STAGES.NEW,
  CRM_STAGES.CONTACTED,
  CRM_STAGES.QUALIFIED,
  CRM_STAGES.PROPOSAL_SENT,
  CRM_STAGES.NEGOTIATION,
  CRM_STAGES.CLOSING,
  CRM_STAGES.WON,
  CRM_STAGES.LOST
];

export const STAGE_LABELS: Record<CRMStage, string> = {
  [CRM_STAGES.NEW]: 'Neu',
  [CRM_STAGES.CONTACTED]: 'Kontaktiert',
  [CRM_STAGES.QUALIFIED]: 'Qualifiziert',
  [CRM_STAGES.PROPOSAL_SENT]: 'Angebot gesendet',
  [CRM_STAGES.NEGOTIATION]: 'Verhandlung',
  [CRM_STAGES.CLOSING]: 'Abschluss',
  [CRM_STAGES.WON]: 'Gewonnen',
  [CRM_STAGES.LOST]: 'Verloren'
};

export const STAGE_COLORS: Record<CRMStage, string> = {
  [CRM_STAGES.NEW]: 'bg-gray-100 text-gray-800',
  [CRM_STAGES.CONTACTED]: 'bg-blue-100 text-blue-800',
  [CRM_STAGES.QUALIFIED]: 'bg-indigo-100 text-indigo-800',
  [CRM_STAGES.PROPOSAL_SENT]: 'bg-yellow-100 text-yellow-800',
  [CRM_STAGES.NEGOTIATION]: 'bg-orange-100 text-orange-800',
  [CRM_STAGES.CLOSING]: 'bg-purple-100 text-purple-800',
  [CRM_STAGES.WON]: 'bg-green-100 text-green-800',
  [CRM_STAGES.LOST]: 'bg-red-100 text-red-800'
};

// Deal Types
export const DEAL_TYPES = {
  NOT_SPECIFIED: 'not_specified',
  SALE: 'sale',
  RENTAL: 'rental',
  VALUATION_SERVICE: 'valuation_service'
} as const;

export type DealType = typeof DEAL_TYPES[keyof typeof DEAL_TYPES];

export const DEAL_TYPE_LABELS: Record<DealType, string> = {
  [DEAL_TYPES.NOT_SPECIFIED]: 'Nicht angegeben',
  [DEAL_TYPES.SALE]: 'Verkauf',
  [DEAL_TYPES.RENTAL]: 'Vermietung',
  [DEAL_TYPES.VALUATION_SERVICE]: 'Bewertungsservice'
};

// Probability Thresholds
export const PROBABILITY_THRESHOLDS = {
  HIGH: 80,
  MEDIUM: 60,
  LOW: 40
} as const;

// Utility Functions
export function getStageProgress(stage: CRMStage): number {
  const index = STAGE_ORDER.indexOf(stage);
  if (index === -1) return 0;
  return Math.round((index / (STAGE_ORDER.length - 1)) * 100);
}

export function getProbabilityClass(probability: number): string {
  if (probability >= PROBABILITY_THRESHOLDS.HIGH) return 'text-green-600 font-semibold';
  if (probability >= PROBABILITY_THRESHOLDS.MEDIUM) return 'text-yellow-600';
  if (probability >= PROBABILITY_THRESHOLDS.LOW) return 'text-orange-600';
  return 'text-red-600';
}

export function validateProbability(value: number): number {
  if (value < 0) return 0;
  if (value > 100) return 100;
  return Math.round(value);
}

// Property and Location Constants
export const PROPERTY_TYPES = {
  HOUSE: 'house',
  APARTMENT: 'apartment',
  COMMERCIAL: 'commercial',
  LAND: 'land'
} as const;

export const PROPERTY_CONDITIONS = {
  NEW: 'new',
  RENOVATED: 'renovated',
  GOOD: 'good',
  NEEDS_RENOVATION: 'needs_renovation'
} as const;

export const BODENSEE_CITIES = [
  'friedrichshafen',
  'konstanz',
  'uberlingen',
  'meersburg',
  'markdorf',
  'tettnang'
] as const;

export const ALL_CITIES = BODENSEE_CITIES;

export function getCityLabel(citySlug: string): string {
  const labels: Record<string, string> = {
    'friedrichshafen': 'Friedrichshafen',
    'konstanz': 'Konstanz',
    'uberlingen': 'Überlingen',
    'meersburg': 'Meersburg',
    'markdorf': 'Markdorf',
    'tettnang': 'Tettnang'
  };
  return labels[citySlug] || citySlug;
}

export function getCitySlug(cityLabel: string): string {
  const slugs: Record<string, string> = {
    'Friedrichshafen': 'friedrichshafen',
    'Konstanz': 'konstanz',
    'Überlingen': 'uberlingen',
    'Meersburg': 'meersburg',
    'Markdorf': 'markdorf',
    'Tettnang': 'tettnang'
  };
  return slugs[cityLabel] || cityLabel.toLowerCase();
}
