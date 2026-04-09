import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getShopFromRequest } from "@/lib/session";
import { FIT_KEYWORDS } from "@/lib/fit-engine/types";
import type { ReviewInput } from "@/types";

function detectFitMention(
  text: string
): "RUNS_SMALL" | "TRUE_TO_SIZE" | "RUNS_LARGE" | "TIGHT_FIT" | "LOOSE_FIT" | "SIZE_UP" | "SIZE_DOWN" | null {
  const lowerText = text.toLowerCase();

  for (const [category, keywords] of Object.entries(FIT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        return category as
          | "RUNS_SMALL"
          | "TRUE_TO_SIZE"
          | "RUNS_LARGE"
          | "TIGHT_FIT"
          | "LOOSE_FIT"
          | "SIZE_UP"
          | "SIZE_DOWN";
      }
    }
  }

  return null;
}

function determineSentiment(rating: number): string {
  if (rating >= 4) return "positive";
  if (rating <= 2) return "negative";
  return "neutral";
}

export async function POST(request: Request): Promise<NextResponse> {
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

    const body: { reviews: ReviewInput[] } = await request.json();

    if (!body.reviews || !Array.isArray(body.reviews)) {
      return NextResponse.json(
        { success: false, error: "Request body must contain a 'reviews' array" },
        { status: 400 }
      );
    }

    let processed = 0;
    const errors: string[] = [];

    for (const review of body.reviews) {
      if (!review.productShopifyId || typeof review.rating !== "number") {
        errors.push(
          `Skipping review: missing productShopifyId or rating`
        );
        continue;
      }

      const product = await prisma.product.findFirst({
        where: {
          shopId: shop.id,
          shopifyId: review.productShopifyId,
        },
      });

      if (!product) {
        errors.push(
          `Product not found for shopifyId: ${review.productShopifyId}`
        );
        continue;
      }

      const fitMention = review.body ? detectFitMention(review.body) : null;
      const sentiment = determineSentiment(review.rating);

      await prisma.review.create({
        data: {
          shopId: shop.id,
          productId: product.id,
          externalId: review.externalId ?? null,
          rating: review.rating,
          body: review.body ?? null,
          author: review.author ?? null,
          fitMention,
          sentiment,
          parsedAt: new Date(),
        },
      });

      processed++;
    }

    return NextResponse.json({
      success: true,
      data: {
        processed,
        total: body.reviews.length,
        errors,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: `Failed to ingest reviews: ${message}` },
      { status: 500 }
    );
  }
}
