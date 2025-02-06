import { useFetcher } from "@remix-run/react";
import { CartReturn } from "@shopify/hydrogen";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { CartProductVariantFragment, CartAttributeKey, CartInfoToEnable, RedoContextValue, RedoCoverageClient } from "../types";
import { REDO_PUBLIC_API_HOSTNAME_LOCAL } from "../utils/security";
import { addProductToCartIfNeeded, removeProductFromCartIfNeeded, setCartRedoEnabledAttribute, useFetcherWithPromise } from "../utils/cart";
import { LoadState, useLoad } from "../utils/react-utils";

const DEFAULT_REDO_CONTEXT_VALUE: RedoContextValue = {
  enabled: false,
  loading: true,
}

const RedoContext = createContext(DEFAULT_REDO_CONTEXT_VALUE);

const RedoProvider = ({
  cart,
  storeId,
  children
}: {
  cart: CartReturn,
  storeId: string,
  children: ReactNode,
}): ReactNode => {
  const [cartProduct, setCartProduct] = useState();
  const [cartAttribute, setCartAttribute] = useState<CartAttributeKey>();
  const [cartInfoToEnable, setCartInfoToEnable] = useState<CartInfoToEnable>();
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch(`http://${REDO_PUBLIC_API_HOSTNAME_LOCAL}/v2.2/stores/${storeId}/coverage-products`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        cart: {
          lineItems: cart.lines.nodes.map((cartLine) => ({
            id: cartLine.id,
            originalPrice: {
              amount: cartLine.merchandise?.price?.amount,
              currency: cartLine.merchandise?.price?.currencyCode
            },
            priceTotal: {
              amount: cartLine.cost?.totalAmount?.amount,
              currency: cartLine.cost?.totalAmount?.currencyCode
            },
            product: {
              id: cartLine.merchandise?.product?.id
            },
            variant: {
              id: cartLine.merchandise?.id
            },
            quantity: cartLine.quantity,
          })),
          priceTotal: {
            amount: cart.cost?.totalAmount?.amount,
            currency: cart.cost?.totalAmount?.currencyCode
          },
        },
        customer: {
          id: cart.buyerIdentity?.customer?.id || '',
          country: cart.buyerIdentity?.countryCode
        }
      })
    })
    .then(async (res) => {
      let json = await res.json();

      setLoading(false);
  
      setCartInfoToEnable(json.cartInfoToEnable);
      // setCartInfoToEnable(json.coverageProducts[0].cartInfoToEnable);
    })
  }, [cart]);
  
  const contextVal: RedoContextValue = {
    enabled: true,
    loading,
    storeId,
    cartInfoToEnable,
    cart,
  };

  return (
    <RedoContext.Provider value={contextVal}>
      {children}
    </RedoContext.Provider>
  );
};

const useRedoCoverageClient = (): LoadState<RedoCoverageClient> => {
  const redoContext = useContext(RedoContext);
  const fetcher = useFetcherWithPromise();

  return useLoad<RedoCoverageClient>(() => {
    useEffect(() => {
      if(redoContext.loading || !redoContext.cartInfoToEnable) {
        return;
      }
      removeProductFromCartIfNeeded({
        fetcher,
        cart: redoContext.cart,
        cartInfoToEnable: redoContext.cartInfoToEnable
      });
    }, [redoContext.loading])
    
    return {
      enable: async () => {
        if(redoContext.loading || !redoContext.cartInfoToEnable) {
          return false;
        }
        let addProductResult = await addProductToCartIfNeeded({
          fetcher,
          cart: redoContext.cart,
          cartInfoToEnable: redoContext.cartInfoToEnable,
        });
        await setCartRedoEnabledAttribute({
          fetcher,
          cartInfoToEnable: redoContext.cartInfoToEnable,
          enabled: true
        });
        return true;
      },
      disable: async () => {
        if(!redoContext.cartInfoToEnable) {
          return false;
        }
        await removeProductFromCartIfNeeded({
          fetcher,
          cart: redoContext.cart,
          cartInfoToEnable: redoContext.cartInfoToEnable
        });
        await setCartRedoEnabledAttribute({
          fetcher,
          cartInfoToEnable: redoContext.cartInfoToEnable,
          enabled: false
        });
        return true;
      },
      get enabled() {
        return redoContext.enabled;
      },
      get price() {
        return Number(redoContext.cartInfoToEnable?.selectedVariant.price.amount);
      },
      get cartProduct() {
        return redoContext.cartInfoToEnable?.selectedVariant;
      },
      get cartAttribute() {
        return redoContext.cartInfoToEnable?.cartAttribute
      }
    }
  }, [])
};

export {
  RedoProvider,
  useRedoCoverageClient
}