import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getShopFromRequest } from "@/lib/session";
import type { ReturnInput } from "@/types";

const VALID_RETURN_REASONS = new Set([
  "TOO_SMALL",
  "TOO_LARGE",
  "FIT_ISSUE",
  "STYLE_DIFFERENT",
  "QUALITY_ISSUE",
  "OTHER",
]);

type ReturnReason =
  | "TOO_SMALL"
  | "TOO_LARGE"
  | "FIT_ISSUE"
  | "STYLE_DIFFERENT"
  | "QUALITY_ISSUE"
  | "OTHER";

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

    const body: { returns: ReturnInput[] } = await request.json();

    if (!body.returns || !Array.isArray(body.returns)) {
      return NextResponse.json(
        { success: false, error: "Request body must contain a 'returns' array" },
        { status: 400 }
      );
    }

    let processed = 0;
    const errors: string[] = [];

    for (const returnItem of body.returns) {
      if (!returnItem.productShopifyId || !returnItem.reason) {
        errors.push("Skipping return: missing productShopifyId or reason");
        continue;
      }

      if (!VALID_RETURN_REASONS.has(returnItem.reason)) {
        errors.push(
          `Invalid return reason "${returnItem.reason}" for product ${returnItem.productShopifyId}. Valid reasons: ${Array.from(VALID_RETURN_REASONS).join(", ")}`
        );
        continue;
      }

      const product = await prisma.product.findFirst({
        where: {
          shopId: shop.id,
          shopifyId: returnItem.productShopifyId,
        },
      });

      if (!product) {
        errors.push(
          `Product not found for shopifyId: ${returnItem.productShopifyId}`
        );
        continue;
      }

      await prisma.return.create({
        data: {
          shopId: shop.id,
          productId: product.id,
          orderId: returnItem.orderId ?? null,
          reason: returnItem.reason as ReturnReason,
          sizeOrdered: returnItem.sizeOrdered ?? null,
          sizeExchanged: returnItem.sizeExchanged ?? null,
          notes: returnItem.notes ?? null,
        },
      });

      processed++;
    }

    return NextResponse.json({
      success: true,
      data: {
        processed,
        total: body.returns.length,
        errors,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: `Failed to ingest returns: ${message}` },
      { status: 500 }
    );
  }
}
