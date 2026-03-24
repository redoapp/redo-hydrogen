/// <reference types="vite/client" />
/// <reference types="@shopify/remix-oxygen" />

import type { HydrogenCart } from "@shopify/hydrogen";
import type { Storefront } from "@shopify/hydrogen/storefront-api-types";

declare module "@shopify/remix-oxygen" {
  export interface AppLoadContext {
    storefront: Storefront;
    cart: HydrogenCart;
    env: Env;
  }
}

interface Env {
  SESSION_SECRET: string;
  PUBLIC_STOREFRONT_API_TOKEN: string;
  PUBLIC_STORE_DOMAIN: string;
  PUBLIC_REDO_STORE_ID: string;
  PUBLIC_TEST_PRODUCT_HANDLE: string;
}
