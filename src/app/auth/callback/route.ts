import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateHmac } from "@/lib/session";

interface ShopifyTokenResponse {
  access_token: string;
  scope: string;
}

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const shop = url.searchParams.get("shop");
    const hmac = url.searchParams.get("hmac");
    const state = url.searchParams.get("state");
    const timestamp = url.searchParams.get("timestamp");

    if (!code || !shop || !hmac || !state || !timestamp) {
      return NextResponse.json(
        { success: false, error: "Missing required query parameters" },
        { status: 400 }
      );
    }

    const secret = process.env.SHOPIFY_API_SECRET ?? "";
    const queryParams: Record<string, string> = {
      code,
      shop,
      hmac,
      state,
      timestamp,
    };

    if (!validateHmac(queryParams, secret)) {
      return NextResponse.json(
        { success: false, error: "HMAC validation failed" },
        { status: 401 }
      );
    }

    const apiKey = process.env.SHOPIFY_API_KEY ?? "";
    const tokenResponse = await fetch(
      `https://${shop}/admin/oauth/access_token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: apiKey,
          client_secret: secret,
          code,
        }),
      }
    );

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      return NextResponse.json(
        { success: false, error: `Token exchange failed: ${errorText}` },
        { status: 502 }
      );
    }

    const tokenData: ShopifyTokenResponse = await tokenResponse.json();

    await prisma.shop.upsert({
      where: { shopDomain: shop },
      create: {
        shopDomain: shop,
        accessToken: tokenData.access_token,
        scope: tokenData.scope,
        installedAt: new Date(),
      },
      update: {
        accessToken: tokenData.access_token,
        scope: tokenData.scope,
      },
    });

    const appUrl = process.env.SHOPIFY_APP_URL ?? "";
    return NextResponse.redirect(`${appUrl}/dashboard`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: `Auth callback failed: ${message}` },
      { status: 500 }
    );
  }
}
