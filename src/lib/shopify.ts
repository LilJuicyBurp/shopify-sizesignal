import "@shopify/shopify-api/adapters/node";
import { shopifyApi, ApiVersion, Session } from "@shopify/shopify-api";

const API_VERSION = "2024-04" as const;

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY ?? "",
  apiSecretKey: process.env.SHOPIFY_API_SECRET ?? "",
  scopes: (process.env.SHOPIFY_SCOPES ?? "").split(","),
  hostName: process.env.SHOPIFY_HOST_NAME ?? "",
  apiVersion: API_VERSION as ApiVersion,
  isEmbeddedApp: true,
});

export function getShopifyClient(shop: string, accessToken: string) {
  const session = new Session({
    id: shop,
    shop,
    state: "",
    isOnline: false,
    accessToken,
  });

  return new shopify.clients.Graphql({ session });
}

export { shopify, API_VERSION };
export default shopify;
