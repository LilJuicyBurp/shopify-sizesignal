// Re-export Prisma types
export type {
  Shop,
  Product,
  Variant,
  SizeChart,
  Review,
  Return,
  CustomerFitProfile,
  FitRecommendation,
  AnalyticsEvent,
} from "@prisma/client";

export type { Plan, FitMention, ReturnReason, FitPrediction } from "@prisma/client";

// Widget configuration
export interface WidgetConfig {
  primaryColor: string;
  textColor: string;
  backgroundColor: string;
  position: "inline" | "modal" | "drawer";
  showConfidence: boolean;
  showFitPrediction: boolean;
  showModelNotes: boolean;
  customCss: string;
  headingText: string;
  buttonText: string;
}

export const DEFAULT_WIDGET_CONFIG: WidgetConfig = {
  primaryColor: "#000000",
  textColor: "#333333",
  backgroundColor: "#ffffff",
  position: "inline",
  showConfidence: true,
  showFitPrediction: true,
  showModelNotes: true,
  customCss: "",
  headingText: "Find Your Perfect Size",
  buttonText: "Get My Size",
};

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Dashboard types
export interface DashboardMetrics {
  totalProducts: number;
  totalRecommendations: number;
  returnRateReduction: number;
  widgetImpressions: number;
  clickThroughRate: number;
  acceptanceRate: number;
}

export interface ProductFitSummary {
  productId: string;
  title: string;
  imageUrl: string | null;
  variantCount: number;
  fitScore: number | null;
  fitConfusion: number | null;
  returnCount: number;
  reviewCount: number;
  status: string;
}

export interface AnalyticsSummary {
  totalRecommendations: number;
  acceptanceRate: number;
  returnRateImpact: number;
  revenueSaved: number;
  widgetImpressions: number;
  clickThroughRate: number;
  topConfusedProducts: ProductFitSummary[];
  returnReasonBreakdown: Record<string, number>;
  dailyMetrics: DailyMetric[];
}

export interface DailyMetric {
  date: string;
  recommendations: number;
  acceptances: number;
  returns: number;
}

// Billing types
export interface PlanDetails {
  name: string;
  price: number;
  productLimit: number;
  features: string[];
}

export interface BillingStatus {
  currentPlan: string;
  productsUsed: number;
  productLimit: number;
  billingId: string | null;
  subscriptionStatus: string | null;
}

// Sync types
export interface SyncResult {
  productsCreated: number;
  productsUpdated: number;
  variantsCreated: number;
  variantsUpdated: number;
  errors: string[];
}

// Review ingestion
export interface ReviewInput {
  externalId?: string;
  productShopifyId: string;
  rating: number;
  body?: string;
  author?: string;
}

// Return ingestion
export interface ReturnInput {
  orderId?: string;
  productShopifyId: string;
  reason: string;
  sizeOrdered?: string;
  sizeExchanged?: string;
  notes?: string;
}

// Widget API
export interface WidgetRequest {
  shop: string;
  productId: string;
  sessionId?: string;
  height?: number;
  weight?: number;
  preferredFit?: string;
  measurements?: Record<string, number>;
}

export interface WidgetResponse {
  recommendedSize: string;
  confidence: number;
  fitPrediction: string;
  modelFitNotes: string;
  alternativeSize: string;
  alternativeConfidence: number;
  sizes: string[];
}

// Onboarding
export interface OnboardingStatus {
  productsSynced: boolean;
  sizeChartsCreated: boolean;
  widgetConfigured: boolean;
  widgetActivated: boolean;
  completedSteps: number;
  totalSteps: number;
}

// Size chart validation
export interface SizeChartIssue {
  type: "missing_measurement" | "inconsistent_progression" | "outlier_value" | "incomplete_sizes";
  severity: "error" | "warning" | "info";
  message: string;
  size?: string;
  measurement?: string;
}

export interface SizeChartHealth {
  score: number;
  issues: SizeChartIssue[];
  completeness: number;
  consistency: number;
}
