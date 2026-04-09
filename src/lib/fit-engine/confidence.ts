import { WEIGHTS } from './types';

/**
 * More reviews = higher confidence, stronger signal = higher confidence.
 * Uses logarithmic scaling capped at 1.0.
 */
export function calculateReviewConfidence(
  totalReviews: number,
  signalStrength: number,
): number {
  if (totalReviews === 0) return 0;

  const reviewScale = Math.min(
    Math.log10(totalReviews + 1) / Math.log10(100),
    1.0,
  );

  // signalStrength is the ratio of signal-bearing reviews to total reviews
  const strengthFactor = Math.min(signalStrength, 1.0);

  return reviewScale * 0.7 + strengthFactor * 0.3;
}

/**
 * More data points = higher confidence.
 * If totalSold is 0, returns 0.3 (low confidence).
 */
export function calculateReturnConfidence(
  totalReturns: number,
  totalSold: number,
): number {
  if (totalSold === 0) return 0.3;

  const returnRate = totalReturns / totalSold;
  const dataScale = Math.min(
    Math.log10(totalSold + 1) / Math.log10(1000),
    1.0,
  );

  // Higher return rates with more data = higher confidence in the signal
  const signalClarity = Math.min(returnRate * 5, 1.0);

  return dataScale * 0.6 + signalClarity * 0.4;
}

/**
 * Lower delta = higher confidence.
 * If no measurements provided, returns 0.5 (neutral).
 */
export function calculateMeasurementConfidence(
  delta: number,
  hasMeasurements: boolean,
): number {
  if (!hasMeasurements) return 0.5;

  // delta of 0 = perfect match (confidence 1.0)
  // delta of 5+ = low confidence (approaches 0.2)
  const confidence = Math.max(1.0 - delta * 0.16, 0.2);

  return Math.min(confidence, 1.0);
}

/**
 * Weighted average of all confidence components, clamped to [0, 1].
 * Rounded to 2 decimal places.
 */
export function calculateOverallConfidence(components: {
  reviewConf: number;
  returnConf: number;
  measurementConf: number;
  preferenceConf: number;
}): number {
  const weighted =
    components.reviewConf * WEIGHTS.reviewSignal +
    components.returnConf * WEIGHTS.returnSignal +
    components.measurementConf * WEIGHTS.measurementMatch +
    components.preferenceConf * WEIGHTS.preferenceAdjust;

  const clamped = Math.max(0, Math.min(1, weighted));

  return Math.round(clamped * 100) / 100;
}
