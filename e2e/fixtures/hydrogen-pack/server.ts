import { createRequestHandler } from "@remix-run/server-runtime";
import {
  createStorefrontClient,
  createCartHandler,
  cartGetIdDefault,
  cartSetIdDefault,
} from "@shopify/hydrogen";

export default {
  async fetch(request: Request, env: Record<string, string>) {
    const { storefront } = createStorefrontClient({
      storeDomain: env.PUBLIC_STORE_DOMAIN,
      publicStorefrontToken: env.PUBLIC_STOREFRONT_API_TOKEN,
      storefrontHeaders: {
        requestGroupId: crypto.randomUUID(),
        buyerIp: "127.0.0.1",
        cookie: request.headers.get("cookie") ?? "",
      },
    });

    const cart = createCartHandler({
      storefront,
      getCartId: cartGetIdDefault(request.headers),
      setCartId: cartSetIdDefault(),
    });

    const handleRequest = createRequestHandler(
      // @ts-expect-error - virtual module from Remix
      await import("virtual:remix/server-build"),
      "development",
    );

    const response = await handleRequest(request, {
      storefront,
      cart,
      env,
      session: {},
      waitUntil: () => {},
    });

    return response;
  },
};
