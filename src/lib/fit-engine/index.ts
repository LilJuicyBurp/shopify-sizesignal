import prisma from '@/lib/prisma';
import {
  WEIGHTS,
  FitEngineInput,
  FitRecommendationResult,
  FitReasoning,
  ProductFitData,
  SizeChartMeasurements,
  CustomerProfile,
  FitPredictionType,
} from './types';
import {
  analyzeReviews,
  analyzeReturns,
  findClosestSize,
  detectFitPrediction,
  generateModelFitNotes,
} from './analyzer';
import {
  calculateReviewConfidence,
  calculateReturnConfidence,
  calculateMeasurementConfidence,
  calculateOverallConfidence,
} from './confidence';

export type { FitRecommendationResult, ProductFitData, FitEngineInput };

/** Standard size ordering used for finding adjacent sizes. */
const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL', '5XL'];

/**
 * Returns the index of a size in the standard ordering.
 * Falls back to numeric parsing for numbered sizes (e.g., "28", "32").
 */
function sizeIndex(size: string, availableSizes: string[]): number {
  const upper = size.toUpperCase();
  const idx = SIZE_ORDER.indexOf(upper);
  if (idx !== -1) return idx;

  // For numeric sizes, use their position in the available sizes list
  const posInAvailable = availableSizes.indexOf(size);
  if (posInAvailable !== -1) return posInAvailable + SIZE_ORDER.length;

  return SIZE_ORDER.length + 999;
}

/**
 * Finds the next alternative size (one size up or down from recommended).
 */
function findAlternativeSize(
  recommendedSize: string,
  availableSizes: string[],
  biasDirection: 'up' | 'down' | 'none',
): string {
  if (availableSizes.length <= 1) return recommendedSize;

  const recIdx = availableSizes.indexOf(recommendedSize);
  if (recIdx === -1) return availableSizes[0];

  if (biasDirection === 'up' && recIdx < availableSizes.length - 1) {
    return availableSizes[recIdx + 1];
  }

  if (biasDirection === 'down' && recIdx > 0) {
    return availableSizes[recIdx - 1];
  }

  // Default: prefer the next size up if available, otherwise size down
  if (recIdx < availableSizes.length - 1) {
    return availableSizes[recIdx + 1];
  }

  if (recIdx > 0) {
    return availableSizes[recIdx - 1];
  }

  return recommendedSize;
}

/**
 * Applies preference adjustment to shift the recommended size.
 */
function applyPreferenceAdjustment(
  closestSize: string,
  availableSizes: string[],
  preferredFit: CustomerProfile['preferredFit'],
): { adjustedSize: string; adjustment: string } {
  if (!preferredFit || preferredFit === 'regular') {
    return { adjustedSize: closestSize, adjustment: 'none' };
  }

  const currentIdx = availableSizes.indexOf(closestSize);
  if (currentIdx === -1) {
    return { adjustedSize: closestSize, adjustment: 'none' };
  }

  if (preferredFit === 'slim' && currentIdx > 0) {
    return {
      adjustedSize: availableSizes[currentIdx - 1],
      adjustment: 'size_down_for_slim',
    };
  }

  if (preferredFit === 'relaxed' && currentIdx < availableSizes.length - 1) {
    return {
      adjustedSize: availableSizes[currentIdx + 1],
      adjustment: 'size_up_for_relaxed',
    };
  }

  return { adjustedSize: closestSize, adjustment: 'none' };
}

/**
 * Sorts sizes using standard size ordering.
 */
function sortSizes(sizes: string[]): string[] {
  return [...sizes].sort((a, b) => sizeIndex(a, sizes) - sizeIndex(b, sizes));
}

/**
 * Determines the dominant review signal name and count.
 */
function getDominantSignal(signals: Map<string, number>): { signal: string; count: number } {
  let maxSignal = 'TRUE_TO_SIZE';
  let maxCount = 0;

  for (const [signal, count] of signals) {
    if (count > maxCount) {
      maxCount = count;
      maxSignal = signal;
    }
  }

  return { signal: maxSignal, count: maxCount };
}

/**
 * Determines the dominant return signal name and rate.
 */
function getDominantReturnSignal(
  signals: Map<string, number>,
  sizeReturnRate: number,
): { signal: string; rate: number } {
  let maxSignal = 'NONE';
  let maxCount = 0;

  for (const [signal, count] of signals) {
    if (count > maxCount) {
      maxCount = count;
      maxSignal = signal;
    }
  }

  return { signal: maxSignal, rate: sizeReturnRate };
}

/**
 * The main fit recommendation function.
 *
 * 1. Fetches product with variants, size chart, reviews, returns from prisma
 * 2. Gets available sizes from variants
 * 3. Analyzes reviews and returns
 * 4. If customer measurements + size chart exist, finds closest size
 * 5. Applies preference adjustment
 * 6. Calculates weighted confidence
 * 7. Detects fit prediction
 * 8. Generates model fit notes
 * 9. Finds alternative size
 * 10. Returns complete FitRecommendationResult
 */
export async function generateRecommendation(
  input: FitEngineInput,
): Promise<FitRecommendationResult> {
  const { productId, shopId, customerProfile } = input;

  // 1. Fetch product with relations
  const product = await prisma.product.findFirstOrThrow({
    where: { id: productId, shopId },
    include: {
      variants: true,
      sizeChart: true,
      reviews: true,
      returns: true,
    },
  });

  // 2. Get available sizes from variants
  const rawSizes = product.variants
    .map((v) => v.size)
    .filter((s): s is string => s !== null && s !== undefined);
  const uniqueSizes = [...new Set(rawSizes)];
  const availableSizes = sortSizes(uniqueSizes);

  if (availableSizes.length === 0) {
    throw new Error(`No sizes found for product ${productId}`);
  }

  // 3. Analyze reviews and returns
  const reviewData = product.reviews.map((r) => ({
    id: r.id,
    body: r.body,
    fitMention: r.fitMention,
    rating: r.rating,
  }));
  const reviewSignals = analyzeReviews(reviewData);

  const returnData = product.returns.map((r) => ({
    reason: r.reason,
    sizeOrdered: r.sizeOrdered,
    sizeExchanged: r.sizeExchanged,
  }));
  const { signals: returnSignals, sizeReturnRate } = analyzeReturns(returnData);

  // 4. Find closest size if measurements and size chart exist
  let closestSize = availableSizes[Math.floor(availableSizes.length / 2)]; // default to middle size
  let measurementDelta = 0;
  let hasMeasurements = false;

  const sizeChartData = product.sizeChart?.measurements as SizeChartMeasurements | null | undefined;

  if (customerProfile?.measurements && sizeChartData) {
    const result = findClosestSize(customerProfile.measurements, sizeChartData);
    closestSize = result.size;
    measurementDelta = result.delta;
    hasMeasurements = true;
  }

  // 5. Apply preference adjustment
  const { adjustedSize, adjustment } = applyPreferenceAdjustment(
    closestSize,
    availableSizes,
    customerProfile?.preferredFit,
  );
  const recommendedSize = adjustedSize;

  // 6. Calculate confidence
  const totalReviews = product.reviews.length;
  const totalReturns = product.returns.length;
  const totalSignals = Array.from(reviewSignals.values()).reduce((sum, v) => sum + v, 0);
  const signalStrength = totalReviews > 0 ? totalSignals / totalReviews : 0;

  // Estimate totalSold from variant inventory (rough proxy)
  const totalSold = product.variants.reduce((sum, v) => sum + v.inventoryQty, 0);

  const reviewConf = calculateReviewConfidence(totalReviews, signalStrength);
  const returnConf = calculateReturnConfidence(totalReturns, totalSold);
  const measurementConf = calculateMeasurementConfidence(measurementDelta, hasMeasurements);
  const preferenceConf = customerProfile?.preferredFit ? 0.8 : 0.5;

  const confidence = calculateOverallConfidence({
    reviewConf,
    returnConf,
    measurementConf,
    preferenceConf,
  });

  // 7. Detect fit prediction
  const fitPrediction: FitPredictionType = detectFitPrediction(
    reviewSignals,
    returnSignals,
    measurementDelta,
  );

  // 8. Generate model fit notes
  const modelFitNotes = generateModelFitNotes(
    reviewSignals,
    returnSignals,
    product.title,
    recommendedSize,
  );

  // 9. Find alternative size
  const biasDirection: 'up' | 'down' | 'none' =
    fitPrediction === 'TIGHT' || fitPrediction === 'SLIGHTLY_TIGHT'
      ? 'up'
      : fitPrediction === 'LOOSE' || fitPrediction === 'SLIGHTLY_LOOSE'
        ? 'down'
        : 'none';

  const alternativeSize = findAlternativeSize(recommendedSize, availableSizes, biasDirection);
  const alternativeConfidence = Math.round(Math.max(0, confidence - 0.15) * 100) / 100;

  // 10. Build reasoning
  const dominantReview = getDominantSignal(reviewSignals);
  const dominantReturn = getDominantReturnSignal(returnSignals, sizeReturnRate);

  const reasoning: FitReasoning = {
    reviewSignal: {
      weight: WEIGHTS.reviewSignal,
      signal: dominantReview.signal,
      count: dominantReview.count,
    },
    returnSignal: {
      weight: WEIGHTS.returnSignal,
      signal: dominantReturn.signal,
      rate: dominantReturn.rate,
    },
    measurementMatch: {
      weight: WEIGHTS.measurementMatch,
      closestSize: closestSize,
      delta: measurementDelta,
    },
    preferenceAdjust: {
      weight: WEIGHTS.preferenceAdjust,
      preference: customerProfile?.preferredFit ?? 'regular',
      adjustment,
    },
  };

  return {
    recommendedSize,
    confidence,
    fitPrediction,
    modelFitNotes,
    reasoning,
    alternativeSize,
    alternativeConfidence,
  };
}

/**
 * Returns aggregated fit data for a product.
 */
export async function getProductFitSummary(
  productId: string,
  shopId: string,
): Promise<ProductFitData> {
  const product = await prisma.product.findFirstOrThrow({
    where: { id: productId, shopId },
    include: {
      variants: true,
      sizeChart: true,
      reviews: true,
      returns: true,
    },
  });

  const rawSizes = product.variants
    .map((v) => v.size)
    .filter((s): s is string => s !== null && s !== undefined);
  const uniqueSizes = [...new Set(rawSizes)];
  const sizes = sortSizes(uniqueSizes);

  const sizeChartData = product.sizeChart?.measurements as SizeChartMeasurements | null | undefined;

  const reviewData = product.reviews.map((r) => ({
    id: r.id,
    body: r.body,
    fitMention: r.fitMention,
    rating: r.rating,
  }));
  const reviewSignals = analyzeReviews(reviewData);

  const returnData = product.returns.map((r) => ({
    reason: r.reason,
    sizeOrdered: r.sizeOrdered,
    sizeExchanged: r.sizeExchanged,
  }));
  const { signals: returnSignals } = analyzeReturns(returnData);

  const totalSold = product.variants.reduce((sum, v) => sum + v.inventoryQty, 0);

  return {
    productId,
    sizes,
    sizeChart: sizeChartData ?? null,
    reviewSignals,
    returnSignals,
    totalReviews: product.reviews.length,
    totalReturns: product.returns.length,
    totalSold,
  };
}
