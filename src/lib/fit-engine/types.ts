export type PreferredFit = 'slim' | 'regular' | 'relaxed';

export interface CustomerProfile {
  height?: number;
  weight?: number;
  preferredFit?: PreferredFit;
  bodyType?: string;
  measurements?: Record<string, number>;
}

export interface FitEngineInput {
  productId: string;
  shopId: string;
  customerProfile?: CustomerProfile;
}

export interface ReviewSignal {
  weight: number;
  signal: string;
  count: number;
}

export interface ReturnSignal {
  weight: number;
  signal: string;
  rate: number;
}

export interface MeasurementMatch {
  weight: number;
  closestSize: string;
  delta: number;
}

export interface PreferenceAdjustment {
  weight: number;
  preference: string;
  adjustment: string;
}

export interface FitReasoning {
  reviewSignal: ReviewSignal;
  returnSignal: ReturnSignal;
  measurementMatch: MeasurementMatch;
  preferenceAdjust: PreferenceAdjustment;
}

export type FitPredictionType = 'TIGHT' | 'SLIGHTLY_TIGHT' | 'TRUE_TO_SIZE' | 'SLIGHTLY_LOOSE' | 'LOOSE';

export interface FitRecommendationResult {
  recommendedSize: string;
  confidence: number;
  fitPrediction: FitPredictionType;
  modelFitNotes: string;
  reasoning: FitReasoning;
  alternativeSize: string;
  alternativeConfidence: number;
}

export interface SizeChartMeasurements {
  [size: string]: Record<string, number>;
}

export interface ProductFitData {
  productId: string;
  sizes: string[];
  sizeChart: SizeChartMeasurements | null;
  reviewSignals: Map<string, number>;
  returnSignals: Map<string, number>;
  totalReviews: number;
  totalReturns: number;
  totalSold: number;
}

export const WEIGHTS = {
  reviewSignal: 0.30,
  returnSignal: 0.25,
  measurementMatch: 0.30,
  preferenceAdjust: 0.15,
} as const;

export const FIT_KEYWORDS: Record<string, string[]> = {
  RUNS_SMALL: ['runs small', 'too small', 'tight', 'snug', 'sizing up', 'smaller than expected', 'runs tight'],
  TRUE_TO_SIZE: ['true to size', 'fits perfectly', 'as expected', 'fits great', 'perfect fit', 'tts', 'spot on'],
  RUNS_LARGE: ['runs large', 'too big', 'oversized', 'baggy', 'sizing down', 'larger than expected', 'runs big'],
  TIGHT_FIT: ['tight fit', 'form fitting', 'body hugging', 'slim fit', 'fitted', 'restrictive'],
  LOOSE_FIT: ['loose fit', 'relaxed', 'roomy', 'generous', 'boxy', 'oversized fit'],
  SIZE_UP: ['size up', 'go up a size', 'order larger', 'get a bigger', 'next size up'],
  SIZE_DOWN: ['size down', 'go down a size', 'order smaller', 'get a smaller', 'next size down'],
};
