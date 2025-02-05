import { CartReturn } from "@shopify/hydrogen";
import { ProductVariant } from "@shopify/hydrogen-react/storefront-api-types";

type CartProductVariantFragment = Omit<ProductVariant, 
  "components" | "metafields" | "quantityPriceBreaks" | "quantityRule" | "requiresComponents" | "requiresShipping" | "storeAvailability" | "taxable" | "weightUnit"
>;

type CartAttributeKey = string;

interface RedoCoverageClient {
  enable(): Promise<boolean>;
  disable(): Promise<boolean>;
  get enabled(): boolean;
  get price(): number;
  get cartProduct(): CartProductVariantFragment | undefined
  get cartAttribute(): CartAttributeKey | undefined
}

type CartInfoToEnable = {
  productId: string,
  variantId: string,
  cartAttribute: CartAttributeKey,
  selectedVariant: CartProductVariantFragment
}

type RedoContextValue = {
  enabled: boolean,
  loading: boolean,
  storeId?: string,
  // cartProduct?: CartProductVariantFragment,
  // cartAttribute?: CartAttributeArgs
  cartInfoToEnable?: CartInfoToEnable,
  cart?: CartReturn
};

interface LoadState<T> {
  data: T;
  pending: boolean;
  error: any;
}

export type {
  CartAttributeKey,
  CartInfoToEnable,
  RedoContextValue,
  RedoCoverageClient,
  CartProductVariantFragment
}