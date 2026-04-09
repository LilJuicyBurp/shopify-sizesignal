import crypto from "crypto";
import prisma from "./prisma";

interface ShopifyVariantWebhook {
  id: number;
  product_id: number;
  title: string;
  price: string;
  sku: string | null;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  inventory_quantity: number;
}

interface ShopifyProductWebhook {
  id: number;
  title: string;
  handle: string;
  product_type: string;
  vendor: string;
  tags: string;
  status: string;
  image: { src: string } | null;
  variants: ShopifyVariantWebhook[];
}

interface ShopifyOrderLineItem {
  id: number;
  product_id: number;
  variant_id: number;
  title: string;
  quantity: number;
  price: string;
  sku: string | null;
  variant_title: string | null;
}

interface ShopifyOrderRefund {
  id: number;
  note: string | null;
  refund_line_items: Array<{
    id: number;
    line_item_id: number;
    quantity: number;
  }>;
}

interface ShopifyOrderWebhook {
  id: number;
  order_number: number;
  email: string | null;
  financial_status: string;
  fulfillment_status: string | null;
  line_items: ShopifyOrderLineItem[];
  refunds: ShopifyOrderRefund[];
  tags: string;
  note: string | null;
  customer: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  } | null;
}

export type {
  ShopifyProductWebhook,
  ShopifyOrderWebhook,
  ShopifyVariantWebhook,
  ShopifyOrderLineItem,
  ShopifyOrderRefund,
};

export function verifyWebhookHmac(body: string, hmacHeader: string): boolean {
  const secret = process.env.SHOPIFY_API_SECRET ?? "";
  const computed = crypto
    .createHmac("sha256", secret)
    .update(body, "utf8")
    .digest("base64");

  return crypto.timingSafeEqual(
    Buffer.from(computed, "utf8"),
    Buffer.from(hmacHeader, "utf8")
  );
}

export async function handleAppUninstalled(shopDomain: string): Promise<void> {
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
  });

  if (!shop) {
    return;
  }

  await prisma.shop.delete({
    where: { id: shop.id },
  });
}

export async function handleProductUpdate(
  shopId: string,
  productData: ShopifyProductWebhook
): Promise<void> {
  const shopifyProductId = String(productData.id);
  const tags = productData.tags
    ? productData.tags.split(",").map((t) => t.trim())
    : [];

  const product = await prisma.product.upsert({
    where: {
      shopId_shopifyId: {
        shopId,
        shopifyId: shopifyProductId,
      },
    },
    create: {
      shopId,
      shopifyId: shopifyProductId,
      title: productData.title,
      handle: productData.handle,
      productType: productData.product_type || null,
      vendor: productData.vendor || null,
      tags,
      imageUrl: productData.image?.src ?? null,
      status: productData.status,
      lastSyncedAt: new Date(),
    },
    update: {
      title: productData.title,
      handle: productData.handle,
      productType: productData.product_type || null,
      vendor: productData.vendor || null,
      tags,
      imageUrl: productData.image?.src ?? null,
      status: productData.status,
      lastSyncedAt: new Date(),
    },
  });

  for (const variant of productData.variants) {
    const shopifyVariantId = String(variant.id);
    await prisma.variant.upsert({
      where: {
        productId_shopifyId: {
          productId: product.id,
          shopifyId: shopifyVariantId,
        },
      },
      create: {
        productId: product.id,
        shopifyId: shopifyVariantId,
        title: variant.title,
        size: variant.option1 ?? null,
        color: variant.option2 ?? null,
        sku: variant.sku ?? null,
        price: variant.price ? parseFloat(variant.price) : null,
        inventoryQty: variant.inventory_quantity,
      },
      update: {
        title: variant.title,
        size: variant.option1 ?? null,
        color: variant.option2 ?? null,
        sku: variant.sku ?? null,
        price: variant.price ? parseFloat(variant.price) : null,
        inventoryQty: variant.inventory_quantity,
      },
    });
  }
}

export async function handleProductDelete(
  shopId: string,
  shopifyProductId: string
): Promise<void> {
  await prisma.product.deleteMany({
    where: {
      shopId,
      shopifyId: shopifyProductId,
    },
  });
}

export async function handleOrderCreate(
  shopId: string,
  orderData: ShopifyOrderWebhook
): Promise<void> {
  const hasRefunds = orderData.refunds && orderData.refunds.length > 0;
  const hasExchangeTag = orderData.tags
    .toLowerCase()
    .includes("exchange");
  const hasReturnNote = orderData.note
    ? orderData.note.toLowerCase().includes("return") ||
      orderData.note.toLowerCase().includes("exchange") ||
      orderData.note.toLowerCase().includes("size")
    : false;

  if (!hasRefunds && !hasExchangeTag && !hasReturnNote) {
    return;
  }

  for (const lineItem of orderData.line_items) {
    const shopifyProductId = String(lineItem.product_id);
    const product = await prisma.product.findFirst({
      where: {
        shopId,
        shopifyId: shopifyProductId,
      },
    });

    if (!product) {
      continue;
    }

    let reason: "TOO_SMALL" | "TOO_LARGE" | "FIT_ISSUE" | "STYLE_DIFFERENT" | "QUALITY_ISSUE" | "OTHER" = "FIT_ISSUE";
    const noteText = (orderData.note ?? "").toLowerCase();
    if (noteText.includes("too small") || noteText.includes("size up")) {
      reason = "TOO_SMALL";
    } else if (noteText.includes("too large") || noteText.includes("size down")) {
      reason = "TOO_LARGE";
    }

    await prisma.return.create({
      data: {
        shopId,
        productId: product.id,
        orderId: String(orderData.id),
        reason,
        sizeOrdered: lineItem.variant_title ?? null,
        notes: orderData.note ?? null,
      },
    });
  }
}
