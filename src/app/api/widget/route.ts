import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateRecommendation } from "@/lib/fit-engine";
import type { WidgetResponse } from "@/types";
import type { PreferredFit } from "@/lib/fit-engine/types";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const shopDomain = url.searchParams.get("shop");
    const productId = url.searchParams.get("productId");
    const sessionId = url.searchParams.get("sessionId") ?? undefined;
    const heightParam = url.searchParams.get("height");
    const weightParam = url.searchParams.get("weight");
    const preferredFit = url.searchParams.get("preferredFit") as PreferredFit | null;

    if (!shopDomain || !productId) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters: shop, productId" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const shop = await prisma.shop.findUnique({
      where: { shopDomain },
    });

    if (!shop) {
      return NextResponse.json(
        { success: false, error: "Shop not found" },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    if (!shop.widgetEnabled) {
      return NextResponse.json(
        { success: false, error: "Widget is disabled for this shop" },
        { status: 403, headers: CORS_HEADERS }
      );
    }

    const height = heightParam ? parseFloat(heightParam) : undefined;
    const weight = weightParam ? parseFloat(weightParam) : undefined;

    // Look up or create customer fit profile
    let profile = sessionId
      ? await prisma.customerFitProfile.findFirst({
          where: {
            shopId: shop.id,
            sessionId,
          },
        })
      : null;

    if (!profile) {
      profile = await prisma.customerFitProfile.create({
        data: {
          shopId: shop.id,
          sessionId: sessionId ?? null,
          height: height ?? null,
          weight: weight ?? null,
          preferredFit: preferredFit ?? null,
        },
      });
    } else if (height || weight || preferredFit) {
      profile = await prisma.customerFitProfile.update({
        where: { id: profile.id },
        data: {
          height: height ?? profile.height,
          weight: weight ?? profile.weight,
          preferredFit: preferredFit ?? profile.preferredFit,
        },
      });
    }

    const result = await generateRecommendation({
      productId,
      shopId: shop.id,
      customerProfile: {
        height: profile.height ?? undefined,
        weight: profile.weight ?? undefined,
        preferredFit: (profile.preferredFit as PreferredFit) ?? undefined,
        measurements: (profile.measurements as Record<string, number>) ?? undefined,
      },
    });

    // Get available sizes for the response
    const variants = await prisma.variant.findMany({
      where: {
        product: {
          id: productId,
          shopId: shop.id,
        },
      },
      select: { size: true },
    });

    const sizeValues: (string | null)[] = (
      variants as Array<{ size: string | null }>
    ).map((v) => v.size);
    const sizes: string[] = Array.from(
      new Set<string>(sizeValues.filter((s): s is string => s !== null))
    );

    // Track widget_view analytics event
    await prisma.analyticsEvent.create({
      data: {
        shopId: shop.id,
        eventType: "widget_view",
        productId,
        metadata: {
          sessionId: sessionId ?? null,
          recommendedSize: result.recommendedSize,
          confidence: result.confidence,
          hasProfile: !!(height || weight || preferredFit),
        },
      },
    });

    const widgetResponse: WidgetResponse = {
      recommendedSize: result.recommendedSize,
      confidence: result.confidence,
      fitPrediction: result.fitPrediction,
      modelFitNotes: result.modelFitNotes,
      alternativeSize: result.alternativeSize,
      alternativeConfidence: result.alternativeConfidence,
      sizes,
    };

    return NextResponse.json(
      { success: true, data: widgetResponse },
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: `Widget request failed: ${message}` },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
