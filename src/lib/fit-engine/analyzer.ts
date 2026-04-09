import {
  FIT_KEYWORDS,
  FitPredictionType,
  SizeChartMeasurements,
} from './types';

export interface Review {
  id: string;
  body: string | null;
  fitMention: string | null;
  rating: number;
}

export interface Return {
  reason: string;
  sizeOrdered: string | null;
  sizeExchanged: string | null;
}

const SIZE_RELATED_REASONS = new Set([
  'TOO_SMALL',
  'TOO_LARGE',
  'FIT_ISSUE',
]);

/**
 * Parses review text using FIT_KEYWORDS and counts mentions of each fit signal.
 */
export function analyzeReviews(reviews: Review[]): Map<string, number> {
  const signals = new Map<string, number>();

  for (const category of Object.keys(FIT_KEYWORDS)) {
    signals.set(category, 0);
  }

  for (const review of reviews) {
    const text = review.body?.toLowerCase() ?? '';
    if (text.length === 0) continue;

    for (const [category, keywords] of Object.entries(FIT_KEYWORDS)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          signals.set(category, (signals.get(category) ?? 0) + 1);
          break; // count each category at most once per review
        }
      }
    }
  }

  return signals;
}

/**
 * Categorizes returns by reason, calculates size-related return rate.
 */
export function analyzeReturns(
  returns: Return[],
): { signals: Map<string, number>; sizeReturnRate: number } {
  const signals = new Map<string, number>();

  for (const ret of returns) {
    const reason = ret.reason;
    signals.set(reason, (signals.get(reason) ?? 0) + 1);
  }

  if (returns.length === 0) {
    return { signals, sizeReturnRate: 0 };
  }

  let sizeRelatedCount = 0;
  for (const ret of returns) {
    if (SIZE_RELATED_REASONS.has(ret.reason)) {
      sizeRelatedCount++;
    }
  }

  const sizeReturnRate = sizeRelatedCount / returns.length;

  return { signals, sizeReturnRate };
}

/**
 * Given customer measurements and a size chart, finds the closest matching size
 * by computing Euclidean distance across shared measurement keys.
 */
export function findClosestSize(
  measurements: Record<string, number>,
  sizeChart: SizeChartMeasurements,
): { size: string; delta: number } {
  let bestSize = '';
  let bestDelta = Infinity;

  const measurementKeys = Object.keys(measurements);

  for (const [size, chartMeasurements] of Object.entries(sizeChart)) {
    const sharedKeys = measurementKeys.filter(
      (key) => key in chartMeasurements,
    );

    if (sharedKeys.length === 0) continue;

    let sumSquared = 0;
    for (const key of sharedKeys) {
      const diff = measurements[key] - chartMeasurements[key];
      sumSquared += diff * diff;
    }

    const delta = Math.sqrt(sumSquared);

    if (delta < bestDelta) {
      bestDelta = delta;
      bestSize = size;
    }
  }

  // Fallback: if no shared keys were found, return the first size
  if (bestSize === '') {
    const sizes = Object.keys(sizeChart);
    bestSize = sizes[0] ?? '';
    bestDelta = 0;
  }

  return { size: bestSize, delta: bestDelta };
}

/**
 * Combines all signals to predict fit category.
 */
export function detectFitPrediction(
  reviewSignals: Map<string, number>,
  returnSignals: Map<string, number>,
  delta: number,
): FitPredictionType {
  const runsSmall = (reviewSignals.get('RUNS_SMALL') ?? 0)
    + (reviewSignals.get('TIGHT_FIT') ?? 0)
    + (reviewSignals.get('SIZE_UP') ?? 0);

  const runsLarge = (reviewSignals.get('RUNS_LARGE') ?? 0)
    + (reviewSignals.get('LOOSE_FIT') ?? 0)
    + (reviewSignals.get('SIZE_DOWN') ?? 0);

  const trueToSize = reviewSignals.get('TRUE_TO_SIZE') ?? 0;

  const tooSmallReturns = returnSignals.get('TOO_SMALL') ?? 0;
  const tooLargeReturns = returnSignals.get('TOO_LARGE') ?? 0;

  const smallScore = runsSmall + tooSmallReturns;
  const largeScore = runsLarge + tooLargeReturns;
  const trueScore = trueToSize;

  // Delta threshold: higher delta means less certainty about sizing
  const deltaThreshold = 2.0;
  const isHighDelta = delta > deltaThreshold;

  if (trueScore > smallScore && trueScore > largeScore && !isHighDelta) {
    return 'TRUE_TO_SIZE';
  }

  if (smallScore > largeScore) {
    if (smallScore > trueScore * 2) {
      return 'TIGHT';
    }
    return 'SLIGHTLY_TIGHT';
  }

  if (largeScore > smallScore) {
    if (largeScore > trueScore * 2) {
      return 'LOOSE';
    }
    return 'SLIGHTLY_LOOSE';
  }

  return 'TRUE_TO_SIZE';
}

/**
 * Generates a human-readable fit note summarizing the signals.
 */
export function generateModelFitNotes(
  reviewSignals: Map<string, number>,
  returnSignals: Map<string, number>,
  productTitle: string,
  recommendedSize: string,
): string {
  const runsSmall = (reviewSignals.get('RUNS_SMALL') ?? 0)
    + (reviewSignals.get('TIGHT_FIT') ?? 0);
  const runsLarge = (reviewSignals.get('RUNS_LARGE') ?? 0)
    + (reviewSignals.get('LOOSE_FIT') ?? 0);
  const trueToSize = reviewSignals.get('TRUE_TO_SIZE') ?? 0;

  const tooSmallReturns = returnSignals.get('TOO_SMALL') ?? 0;
  const tooLargeReturns = returnSignals.get('TOO_LARGE') ?? 0;

  const parts: string[] = [];

  if (runsSmall > runsLarge && runsSmall > trueToSize) {
    parts.push(`This ${productTitle} tends to run small based on customer reviews.`);
  } else if (runsLarge > runsSmall && runsLarge > trueToSize) {
    parts.push(`This ${productTitle} tends to run large based on customer reviews.`);
  } else {
    parts.push(`This ${productTitle} is generally true to size based on customer reviews.`);
  }

  if (tooSmallReturns > tooLargeReturns && tooSmallReturns > 0) {
    parts.push('Size-related returns indicate customers often find it too small.');
  } else if (tooLargeReturns > tooSmallReturns && tooLargeReturns > 0) {
    parts.push('Size-related returns indicate customers often find it too large.');
  }

  parts.push(`Based on available data, ${recommendedSize} is your recommended size.`);

  return parts.join(' ');
}
