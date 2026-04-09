import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getShopFromRequest } from "@/lib/session";
import { generateRecommendation } from "@/lib/fit-engine";
import type { FitEngineInput, CustomerProfile } from "@/lib/fit-engine/types";

interface FitEngineRequestBody {
  productId: string;
  shopId?: string;
  customerProfile?: CustomerProfile;
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

    const body: FitEngineRequestBody = await request.json();

    if (!body.productId) {
      return NextResponse.json(
        { success: false, error: "Missing required field: productId" },
        { status: 400 }
      );
    }

    const input: FitEngineInput = {
      productId: body.productId,
      shopId: shop.id,
      customerProfile: body.customerProfile,
    };

    const result = await generateRecommendation(input);

    // Track analytics event
    await prisma.analyticsEvent.create({
      data: {
        shopId: shop.id,
        eventType: "fit_recommendation",
        productId: body.productId,
        metadata: {
          recommendedSize: result.recommendedSize,
          confidence: result.confidence,
          fitPrediction: result.fitPrediction,
          hasCustomerProfile: !!body.customerProfile,
        },
      },
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: `Fit engine failed: ${message}` },
      { status: 500 }
    );
  }
}
