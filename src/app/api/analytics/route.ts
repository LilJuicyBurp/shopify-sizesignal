import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getShopFromRequest } from "@/lib/session";
import type { AnalyticsSummary, DailyMetric, ProductFitSummary } from "@/types";

interface ProductWithCounts {
  id: string;
  title: string;
  imageUrl: string | null;
  fitScore: number | null;
  fitConfusion: number | null;
  status: string;
  _count: {
    variants: number;
    reviews: number;
    returns: number;
  };
}

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const shopAuth = await getShopFromRequest(request);

    if (!shopAuth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const shop = await prisma.shop.findUnique({
      where: { shopDomain: shopAuth.shop },
    });

    if (!shop) {
      return NextResponse.json(
        { success: false, error: "Shop not found" },
        { status: 404 }
      );
    }

    const url = new URL(request.url);
    const startDateParam = url.searchParams.get("startDate");
    const endDateParam = url.searchParams.get("endDate");

    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    const startDate = startDateParam
      ? new Date(startDateParam)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // default 30 days

    const dateFilter = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    // Get analytics events in date range
    const [
      widgetViews,
      recommendations,
      acceptances,
      returns,
      allReturns,
      topConfusedProducts,
    ] = await Promise.all([
      prisma.analyticsEvent.count({
        where: {
          shopId: shop.id,
          eventType: "widget_view",
          ...dateFilter,
        },
      }),
      prisma.analyticsEvent.count({
        where: {
          shopId: shop.id,
          eventType: "fit_recommendation",
          ...dateFilter,
        },
      }),
      prisma.analyticsEvent.count({
        where: {
          shopId: shop.id,
          eventType: "recommendation_accepted",
          ...dateFilter,
        },
      }),
      prisma.return.count({
        where: {
          shopId: shop.id,
          ...dateFilter,
        },
      }),
      prisma.return.findMany({
        where: {
          shopId: shop.id,
          ...dateFilter,
        },
        select: {
          reason: true,
        },
      }),
      prisma.product.findMany({
        where: {
          shopId: shop.id,
          fitConfusion: { not: null },
        },
        include: {
          _count: {
            select: {
              variants: true,
              reviews: true,
              returns: true,
            },
          },
        },
        orderBy: { fitConfusion: "desc" },
        take: 10,
      }),
    ]);

    // Click-through rate: recommendations / widget views
    const clickThroughRate =
      widgetViews > 0
        ? Math.round((recommendations / widgetViews) * 10000) / 10000
        : 0;

    // Acceptance rate: acceptances / recommendations
    const acceptanceRate =
      recommendations > 0
        ? Math.round((acceptances / recommendations) * 10000) / 10000
        : 0;

    // Return reason breakdown
    const returnReasonBreakdown: Record<string, number> = {};
    for (const returnRecord of allReturns) {
      returnReasonBreakdown[returnRecord.reason] =
        (returnReasonBreakdown[returnRecord.reason] ?? 0) + 1;
    }

    // Calculate return rate impact (size-related returns / total returns)
    const sizeRelatedReturns =
      (returnReasonBreakdown["TOO_SMALL"] ?? 0) +
      (returnReasonBreakdown["TOO_LARGE"] ?? 0) +
      (returnReasonBreakdown["FIT_ISSUE"] ?? 0);
    const returnRateImpact =
      returns > 0
        ? Math.round((sizeRelatedReturns / returns) * 10000) / 10000
        : 0;

    // Estimate revenue saved (average order value * returns prevented)
    // Using a conservative estimate based on acceptance rate vs return rate
    const estimatedPreventedReturns = Math.floor(acceptances * 0.15);
    const averageOrderValue = 65; // conservative estimate
    const revenueSaved = estimatedPreventedReturns * averageOrderValue;

    // Top confused products
    const topConfusedProductSummaries: ProductFitSummary[] =
      (topConfusedProducts as ProductWithCounts[]).map((product) => ({
        productId: product.id,
        title: product.title,
        imageUrl: product.imageUrl,
        variantCount: product._count.variants,
        fitScore: product.fitScore,
        fitConfusion: product.fitConfusion,
        returnCount: product._count.returns,
        reviewCount: product._count.reviews,
        status: product.status,
      }));

    // Daily metrics
    const dailyEvents = await prisma.analyticsEvent.findMany({
      where: {
        shopId: shop.id,
        ...dateFilter,
      },
      select: {
        eventType: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const dailyReturns = await prisma.return.findMany({
      where: {
        shopId: shop.id,
        ...dateFilter,
      },
      select: {
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const dailyMap = new Map<
      string,
      { recommendations: number; acceptances: number; returns: number }
    >();

    for (const event of dailyEvents) {
      const dateKey = event.createdAt.toISOString().split("T")[0];
      const existing = dailyMap.get(dateKey) ?? {
        recommendations: 0,
        acceptances: 0,
        returns: 0,
      };

      if (event.eventType === "fit_recommendation") {
        existing.recommendations++;
      } else if (event.eventType === "recommendation_accepted") {
        existing.acceptances++;
      }

      dailyMap.set(dateKey, existing);
    }

    for (const returnRecord of dailyReturns) {
      const dateKey = returnRecord.createdAt.toISOString().split("T")[0];
      const existing = dailyMap.get(dateKey) ?? {
        recommendations: 0,
        acceptances: 0,
        returns: 0,
      };
      existing.returns++;
      dailyMap.set(dateKey, existing);
    }

    const dailyMetrics: DailyMetric[] = Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, metrics]) => ({
        date,
        recommendations: metrics.recommendations,
        acceptances: metrics.acceptances,
        returns: metrics.returns,
      }));

    const summary: AnalyticsSummary = {
      totalRecommendations: recommendations,
      acceptanceRate,
      returnRateImpact,
      revenueSaved,
      widgetImpressions: widgetViews,
      clickThroughRate,
      topConfusedProducts: topConfusedProductSummaries,
      returnReasonBreakdown,
      dailyMetrics,
    };

    return NextResponse.json({ success: true, data: summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: `Failed to fetch analytics: ${message}` },
      { status: 500 }
    );
  }
}
