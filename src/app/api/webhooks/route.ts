import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  verifyWebhookHmac,
  handleAppUninstalled,
  handleProductUpdate,
  handleProductDelete,
  handleOrderCreate,
  ShopifyProductWebhook,
  ShopifyOrderWebhook,
} from "@/lib/webhooks";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const rawBody = await request.text();
    const hmacHeader = request.headers.get("X-Shopify-Hmac-Sha256");

    if (!hmacHeader) {
      return NextResponse.json(
        { success: false, error: "Missing HMAC header" },
        { status: 401 }
      );
    }

    if (!verifyWebhookHmac(rawBody, hmacHeader)) {
      return NextResponse.json(
        { success: false, error: "Invalid HMAC" },
        { status: 401 }
      );
    }

    const topic = request.headers.get("X-Shopify-Topic");
    const shopDomain = request.headers.get("X-Shopify-Shop-Domain");

    if (!topic || !shopDomain) {
      return NextResponse.json(
        { success: false, error: "Missing topic or shop domain header" },
        { status: 400 }
      );
    }

    const payload: unknown = JSON.parse(rawBody);

    const shop = await prisma.shop.findUnique({
      where: { shopDomain },
    });

    switch (topic) {
      case "app/uninstalled": {
        await handleAppUninstalled(shopDomain);
        break;
      }
      case "products/update":
      case "products/create": {
        if (!shop) {
          return NextResponse.json(
            { success: false, error: "Shop not found" },
            { status: 404 }
          );
        }
        await handleProductUpdate(shop.id, payload as ShopifyProductWebhook);
        break;
      }
      case "products/delete": {
        if (!shop) {
          return NextResponse.json(
            { success: false, error: "Shop not found" },
            { status: 404 }
          );
        }
        const productData = payload as { id: number };
        await handleProductDelete(shop.id, String(productData.id));
        break;
      }
      case "orders/create": {
        if (!shop) {
          return NextResponse.json(
            { success: false, error: "Shop not found" },
            { status: 404 }
          );
        }
        await handleOrderCreate(shop.id, payload as ShopifyOrderWebhook);
        break;
      }
      default: {
        return NextResponse.json(
          { success: true, message: `Unhandled topic: ${topic}` },
          { status: 200 }
        );
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Webhook processing error:", message);
    return NextResponse.json(
      { success: false, error: `Webhook processing failed: ${message}` },
      { status: 500 }
    );
  }
}
