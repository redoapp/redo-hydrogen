import { CartReturn } from "@shopify/hydrogen";
import { ProductVariant } from "@shopify/hydrogen-react/storefront-api-types";

type CartProductVariantFragment = Omit<ProductVariant, 
  "components" | "metafields" | "quantityPriceBreaks" | "quantityRule" | "requiresComponents" | "requiresShipping" | "storeAvailability" | "taxable" | "weightUnit"
>;

type CartAttributeKey = string;

interface RedoCoverageClient {
  enable(): Promise<boolean>;
  disable(): Promise<boolean>;
  get loading(): boolean;
  get enabled(): boolean;
  get price(): number;
  get storeId(): string | undefined;
  get cart(): CartReturn | undefined;
  get cartProduct(): CartProductVariantFragment | undefined;
  get cartAttribute(): CartAttributeKey | undefined;
  get errors(): RedoError[] | undefined;
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
  cartInfoToEnable?: CartInfoToEnable,
  cart?: CartReturn,
  errors?: RedoError[],
};

enum RedoErrorType {
  ApiBadRequest = "API_BAD_REQUEST",
  ApiServerError = "API_SERVER_ERROR",
  ApiUnknownError = "API_UNKNOWN_ERROR"
};

type RedoError = {
  type: RedoErrorType,
  message: string,
  context: any
};

export {
  RedoErrorType,
}

export type {
  CartAttributeKey,
  CartInfoToEnable,
  RedoContextValue,
  RedoCoverageClient,
  CartProductVariantFragment,
  RedoError
}