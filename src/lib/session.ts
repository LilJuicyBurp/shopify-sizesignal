import crypto from "crypto";
import prisma from "./prisma";

interface Shop {
  id: string;
  shopDomain: string;
  accessToken: string;
  scope: string;
  installedAt: Date;
  onboardingDone: boolean;
  plan: "FREE" | "STARTER" | "GROWTH" | "ENTERPRISE";
  billingId: string | null;
  widgetEnabled: boolean;
  widgetConfig: unknown;
  createdAt: Date;
  updatedAt: Date;
}

export type { Shop };

export async function getShopFromRequest(
  request: Request
): Promise<{ shop: string; accessToken: string } | null> {
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const shopRecord = await prisma.shop.findFirst({
      where: { accessToken: token },
    });
    if (shopRecord) {
      return { shop: shopRecord.shopDomain, accessToken: shopRecord.accessToken };
    }
  }

  const url = new URL(request.url);
  const shopDomain = url.searchParams.get("shop");
  if (shopDomain) {
    const shopRecord = await prisma.shop.findUnique({
      where: { shopDomain },
    });
    if (shopRecord) {
      return { shop: shopRecord.shopDomain, accessToken: shopRecord.accessToken };
    }
  }

  return null;
}

export function validateHmac(
  query: Record<string, string>,
  secret: string
): boolean {
  const { hmac, ...rest } = query;
  if (!hmac) return false;

  const sortedKeys = Object.keys(rest).sort();
  const message = sortedKeys.map((key) => `${key}=${rest[key]}`).join("&");
  const computed = crypto
    .createHmac("sha256", secret)
    .update(message)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(computed, "hex"),
    Buffer.from(hmac, "hex")
  );
}

export async function getSessionFromHeaders(
  request: Request
): Promise<Shop | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);
  const shopRecord = await prisma.shop.findFirst({
    where: { accessToken: token },
  });

  if (!shopRecord) {
    return null;
  }

  return shopRecord as Shop;
}
