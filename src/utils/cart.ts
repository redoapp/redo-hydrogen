import { FetcherWithComponents, useFetcher } from "@remix-run/react";
import { CartInfoToEnable } from "../types";
import { CartForm, CartReturn } from "@shopify/hydrogen";
import type { AppData } from '@remix-run/react/dist/data';
import React from 'react'

const DEFAULT_REDO_ENABLED_CART_ATTRIBUTE = 'redo_opted_in_from_cart';

const addProductToCartIfNeeded = async ({
  cart,
  fetcher,
  cartInfoToEnable
}: {
  cart: CartReturn | undefined,
  fetcher: FetcherWithComponents<unknown>,
  cartInfoToEnable: CartInfoToEnable
}) => {
  if(!cart) {
    return await addProductToCart({ fetcher, cartInfoToEnable });
  }

  const redoProductsInCart = cart.lines.nodes.filter((cartLine) => {
    return cartLine.merchandise.product.vendor === 're:do';
  });
  const correctRedoProductInCart = redoProductsInCart?.filter((cartLine) => {
    return cartLine.merchandise.id === `gid://shopify/ProductVariant/${cartInfoToEnable.variantId}`;
  });
  if(redoProductsInCart.length === 0) {
    return await addProductToCart({ fetcher, cartInfoToEnable });
  } else if (redoProductsInCart.length === 1 && correctRedoProductInCart.length === 1 && correctRedoProductInCart[0].quantity === 1) {
    // No action needed
    return;
  } else {
    let isSuccess = true;

    await removeLinesFromCart({ fetcher, lineIds: redoProductsInCart.map((cartLine) => cartLine.id) });
    await addProductToCart({ fetcher, cartInfoToEnable });

    return;
  }
};

const removeLinesFromCart = async ({
  fetcher,
  lineIds
}: {
  fetcher: FetcherWithComponents<unknown>,
  lineIds: string[]
}) => {
  const formInput = {
    action: CartForm.ACTIONS.LinesRemove,
    inputs: {
      lineIds
    }
  }

  await fetcher.submit(
    {
      [CartForm.INPUT_NAME]: JSON.stringify(formInput),
    },
    {method: 'POST', action: '/cart'},
  );
};

const removeProductFromCartIfNeeded = async ({
  cart,
  fetcher,
  cartInfoToEnable
}: {
  cart: CartReturn | undefined,
  fetcher: FetcherWithComponents<unknown>,
  cartInfoToEnable: CartInfoToEnable
}) => {
  if(!cart) {
    console.error('No cart');
    return;
  }

  const redoProductsInCart = cart.lines.nodes.filter((cartLine) => {
    return cartLine.merchandise.product.vendor === 're:do';
  });

  if(redoProductsInCart.length !== 0) {
    await removeLinesFromCart({ fetcher, lineIds: redoProductsInCart.map((cartLine) => cartLine.id) });
  } else {
  }
};

const addProductToCart = async ({
  fetcher,
  cartInfoToEnable
}: {
  fetcher: FetcherWithComponents<unknown>,
  cartInfoToEnable: CartInfoToEnable
}) => {
  const redoProductLine = {
    "merchandiseId": `gid://shopify/ProductVariant/${cartInfoToEnable.variantId}`,
    "quantity": 1,
    "selectedVariant": cartInfoToEnable.selectedVariant
  };

  const formInput = {
    action: CartForm.ACTIONS.LinesAdd,
    inputs: {
      lines: [
        redoProductLine
      ]
    }
  }

  await fetcher.submit(
    {
      [CartForm.INPUT_NAME]: JSON.stringify(formInput),
    },
    {method: 'POST', action: '/cart'},
  );
};

const setCartRedoEnabledAttribute = async ({
  fetcher,
  cartInfoToEnable,
  enabled
}: {
  fetcher: FetcherWithComponents<unknown>,
  cartInfoToEnable: CartInfoToEnable | null,
  enabled: boolean
}) => {
  const formInput = {
    action: CartForm.ACTIONS.AttributesUpdateInput,
    inputs: {
      attributes: [
        {
          key: cartInfoToEnable?.cartAttribute || DEFAULT_REDO_ENABLED_CART_ATTRIBUTE,
          value: enabled.toString()
        }
      ]
    }
  }

  await fetcher.submit(
    {
      [CartForm.INPUT_NAME]: JSON.stringify(formInput),
    },
    {method: 'POST', action: '/cart'},
  );
};

type FetcherData<T> = NonNullable<T | unknown> // FIXME: used to use SerializeFrom which is deprecated. Can this be better typed?
type ResolveFunction<T> = (value: FetcherData<T>) => void

function useFetcherWithPromise<TData = AppData>(opts?: Parameters<typeof useFetcher>[0]) {
  const fetcher = useFetcher<TData>(opts)
  const resolveRef = React.useRef<ResolveFunction<TData>>(null)
  const promiseRef = React.useRef<Promise<FetcherData<TData>>>(null)

  if (!promiseRef.current) {
    promiseRef.current = new Promise<FetcherData<TData>>((resolve) => {
      resolveRef.current = resolve
    })
  }

  const resetResolver = React.useCallback(() => {
    promiseRef.current = new Promise((resolve) => {
      resolveRef.current = resolve
    })
  }, [promiseRef, resolveRef])

  const submit = React.useCallback(
    async (...args: Parameters<typeof fetcher.submit>) => {
      fetcher.submit(...args);
      return promiseRef.current
    },
    [fetcher, promiseRef]
  )

  React.useEffect(() => {
    if (fetcher.state === 'idle') {
      if (fetcher.data) {
        resolveRef.current?.(fetcher.data)
      }
      resetResolver()
    }
  }, [fetcher, resetResolver])

  return { ...fetcher, submit }
}

export {
  DEFAULT_REDO_ENABLED_CART_ATTRIBUTE,
  addProductToCartIfNeeded,
  removeProductFromCartIfNeeded,
  setCartRedoEnabledAttribute,
  useFetcherWithPromise
};