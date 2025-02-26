import { useFetcher, useFetchers, useSubmit } from "@remix-run/react";
import { CartReturn, OptimisticCart } from "@shopify/hydrogen";
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { CartProductVariantFragment, CartAttributeKey, CartInfoToEnable, RedoContextValue, RedoCoverageClient, RedoError, RedoErrorType } from "../types";
import { REDO_PUBLIC_API_HOSTNAME } from "../utils/security";
import { addProductToCartIfNeeded, removeProductFromCartIfNeeded, setCartRedoEnabledAttribute, useFetcherWithPromise, isCartWithActionsDocs, getCartLines, useWaitCartIdle, isOptimisticCart } from "../utils/cart";
import { CartWithActionsDocs } from "@shopify/hydrogen-react/dist/types/cart-types";

const DEFAULT_REDO_CONTEXT_VALUE: RedoContextValue = {
  enabled: false,
  loading: true,
}

const RedoContext = createContext<RedoContextValue>(DEFAULT_REDO_CONTEXT_VALUE);

const RedoProvider = ({
  cart,
  storeId,
  children
}: {
  cart: CartReturn | CartWithActionsDocs | OptimisticCart,
  storeId: string,
  children: ReactNode,
}): ReactNode => {
  const [cartProduct, setCartProduct] = useState();
  const [cartAttribute, setCartAttribute] = useState<CartAttributeKey>();
  const [cartInfoToEnable, setCartInfoToEnable] = useState<CartInfoToEnable>();
  const [loading, setLoading] = useState<boolean>(true);
  const [errors, setErrors] = useState<RedoError[]>([]);

  const logUniqueError = (newError: RedoError) => {
    if(errors.find((err) => err.type === newError.type)) {
    } else {
      setErrors([...errors, newError]);
    }
    return newError;
  }

  useEffect(() => {
    if(!cart || !storeId || isOptimisticCart(cart)) {
      return;
    }

    let cartLines = getCartLines(cart);

    fetch(`https://${REDO_PUBLIC_API_HOSTNAME}/v2.2/stores/${storeId}/coverage-products`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        cart: {
          lineItems: cartLines.map((cartLine) => ({
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
      if(res.status === 500) {
        logUniqueError({
          type: RedoErrorType.ApiServerError,
          message: "Internal server error occured when getting available coverage products from Redo API.. Check your inputs are correct and storeId have been configured. Reach out to Redo support if the issue persists.",
          context: {
            json: await res.json()
          }
        });
        return;
      } else if(res.status === 400) {
        logUniqueError({
          type: RedoErrorType.ApiBadRequest,
          message: "Bad request when getting available coverage products from Redo API. Check that the passed in cart is of the correct type Cart/CartReturn and includes all of the correct cart information.",
          context: {
            json: await res.json()
          }
        });
        return;
      } else if(res.status !== 200) {
        logUniqueError({
          type: RedoErrorType.ApiUnknownError,
          message: "Unkown error occured while getting available coverage products from Redo API.",
          context: {
            status: res.status,
            json: await res.json()
          }
        });
        return;
      }

      let json = await res.json();

      setLoading(false);
      
      if(!json?.coverageProducts?.[0]?.cartInfoToEnable) {
        return;
      }

      setCartInfoToEnable(json.coverageProducts[0].cartInfoToEnable);
    })
  }, [cart, storeId]);
  
  const contextVal: RedoContextValue = {
    enabled: true,
    loading,
    storeId,
    cartInfoToEnable,
    cart,
    errors: (errors?.length && errors.length > 0) ? errors : undefined
  };

  return (
    <RedoContext.Provider value={contextVal}>
      {children}
    </RedoContext.Provider>
  );
};

const useRedoCoverageClient = (): RedoCoverageClient => {
  const redoContext = useContext(RedoContext);
  const fetcher = useFetcherWithPromise();
  const submit = useSubmit();
  const fetchers = useFetchers();
  const waitCartIdle = useWaitCartIdle(redoContext.cart);

  console.log(`Fetchers: ${JSON.stringify(fetchers, null, 2)}`);

  useEffect(() => {
    if(redoContext.loading || !redoContext.cartInfoToEnable) {
      return;
    }
    removeProductFromCartIfNeeded({
      cart: redoContext.cart,
      fetcher,
      waitCartIdle,
      cartInfoToEnable: redoContext.cartInfoToEnable
    });
  }, [redoContext.loading]);
  
  return {
    enable: async () => {
      if(redoContext.loading || !redoContext.cartInfoToEnable) {
        return false;
      }
      // await Promise.allSettled([
      //   await (async () => {
      //     if(!redoContext.cartInfoToEnable) {
      //       console.log('⚠️ Missing cart info to enable. (product)');
      //     }
          
      //     await addProductToCartIfNeeded({
      //       fetcher,
      //       waitCartIdle,
      //       cart: redoContext.cart,
      //       cartInfoToEnable: redoContext.cartInfoToEnable,
      //     });

      //     console.log('Ensure product complete.');
      //     return;
      //   })(),
      //   await (async () => {
      //     if(!redoContext.cartInfoToEnable) {
      //       console.log('⚠️ Missing cart info to enable. (attributes');
      //     }

      //     await setCartRedoEnabledAttribute({
      //       cart: redoContext.cart,
      //       fetcher,
      //       waitCartIdle,
      //       cartInfoToEnable: redoContext.cartInfoToEnable,
      //       enabled: true
      //     });

      //     console.log('Ensure attributes complete.');
      //     return;
      //   })()
      // ]);
      
      // Doesn't work unless awaited
      // await Promise.allSettled([  
      //   (async () => await addProductToCartIfNeeded({
      //     fetcher,
      //     waitCartIdle,
      //     cart: redoContext.cart,
      //     cartInfoToEnable: redoContext.cartInfoToEnable,
      //   }))(),
      //   (async () => await setCartRedoEnabledAttribute({
      //     cart: redoContext.cart,
      //     fetcher,
      //     waitCartIdle,
      //     cartInfoToEnable: redoContext.cartInfoToEnable,
      //     enabled: true
      //   }))()
      // ]);

      let addProductToCartResult = addProductToCartIfNeeded({
        fetcher,
        submit,
        waitCartIdle,
        cart: redoContext.cart,
        cartInfoToEnable: redoContext.cartInfoToEnable,
      });
      let setAttributeResult = setCartRedoEnabledAttribute({
        cart: redoContext.cart,
        submit,
        fetcher,
        waitCartIdle,
        cartInfoToEnable: redoContext.cartInfoToEnable,
        enabled: true
      });

      console.log(`typeof add product result: ${typeof addProductToCartResult} (${JSON.stringify(addProductToCartResult, null, 2)})`);
      console.log(`typeof add attribute result: ${typeof addProductToCartResult} (${JSON.stringify(addProductToCartResult, null, 2)})`);

      let bothPromiseResults = Promise.allSettled([
        addProductToCartIfNeeded,
        setAttributeResult
      ]);

      console.log(`typeof both promise results ${typeof bothPromiseResults} (${JSON.stringify(bothPromiseResults, null, 2)})`);

      let awaitedResults = await bothPromiseResults;

      console.log(`typeof awaited both promise results ${typeof awaitedResults} (${JSON.stringify(awaitedResults, null, 2)})`);

      return true;
    },
    disable: async () => {
      if(!redoContext.cartInfoToEnable) {
        return false;
      }
      await Promise.allSettled([
        (async () => await removeProductFromCartIfNeeded({
          fetcher,
          waitCartIdle,
          cart: redoContext.cart,
          cartInfoToEnable: redoContext.cartInfoToEnable
        }))(),
        (async () => await setCartRedoEnabledAttribute({
          cart: redoContext.cart,
          fetcher,
          waitCartIdle,
          cartInfoToEnable: redoContext.cartInfoToEnable,
          enabled: false
        }))()
      ]);
      return true;
    },
    get loading() {
      return redoContext.loading;
    },
    get eligible() {
      return !this.loading && !!this.price && !!this.cartProduct && !!this.cart?.cost;
    },
    get enabled() {
      return redoContext.enabled;
    },
    get price() {
      let priceToEnable = redoContext.cartInfoToEnable?.selectedVariant?.price?.amount;
      if(!priceToEnable || Number(priceToEnable).toString() === 'NaN') {
        return undefined;
      }

      return Number(priceToEnable);
    },
    get cart() {
      return redoContext.cart;
    },
    get cartProduct() {
      return redoContext.cartInfoToEnable?.selectedVariant;
    },
    get cartAttribute() {
      return redoContext.cartInfoToEnable?.cartAttribute
    },
    get storeId() {
      return redoContext.storeId;
    },
    get errors() {
      return redoContext.errors;
    }
  }
};

export {
  RedoProvider,
  useRedoCoverageClient
}