import { FetcherWithComponents, useFetcher } from "@remix-run/react";
import { CartInfoToEnable } from "../types";
import { CartForm, CartReturn } from "@shopify/hydrogen";
import type { AppData } from '@remix-run/react/dist/data';
import React, { useCallback, useEffect, useRef } from 'react'
import { CartWithActionsDocs } from "@shopify/hydrogen-react/dist/types/cart-types";
import { CartLine, ComponentizableCartLine } from "@shopify/hydrogen-react/storefront-api-types";

const DEFAULT_REDO_ENABLED_CART_ATTRIBUTE = 'redo_opted_in_from_cart';

const isCartWithActionsDocs = (cart: CartReturn | CartWithActionsDocs): cart is CartWithActionsDocs => {
  return (Array.isArray(cart.lines) && 'linesAdd' in cart && typeof cart.linesAdd === 'function');
}

const getCartLines = (cart: CartReturn | CartWithActionsDocs): Array<CartLine | ComponentizableCartLine> => {
  if(isCartWithActionsDocs(cart)) {
    return cart.lines;
  } else {
    return cart.lines.nodes ?? cart.lines.edges.map((edge) => edge.node);
  }
}

const isRedoInCart = ({
  cart
}: {
  cart: CartReturn | CartWithActionsDocs
}): boolean => {
  if(!cart) {
    return false;
  }

  return getCartLines(cart).some((cartLine) => {
    return cartLine.merchandise.product.vendor === 're:do';
  });
}

const waitForConditionsMetOrTimeout = ({
  conditions,
  timeoutMs
}: {
  conditions: (() => boolean)[];
  timeoutMs: number;
}): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    let start = Date.now();
    let interval = setInterval(() => {
      if((Date.now() - start) > timeoutMs) {
        clearInterval(interval);
        return resolve(false);
      }

      let conditionsMet = conditions.every((conditionCallback) => conditionCallback());

      if(conditionsMet) {
        clearInterval(interval);
        return resolve(true);
      }
    }, 100);
  })
}

const addProductToCartIfNeeded = async ({
  cart,
  fetcher,
  waitCartIdle,
  cartInfoToEnable
}: {
  cart: CartReturn | CartWithActionsDocs | undefined,
  fetcher: FetcherWithComponents<unknown>,
  waitCartIdle: WaitCartIdleCallback;
  cartInfoToEnable: CartInfoToEnable
}) => {
  if(!cart) {
    return await addProductToCart({ cart, fetcher, waitCartIdle, cartInfoToEnable });
  }

  const redoProductsInCart = getCartLines(cart).filter((cartLine) => {
    return cartLine.merchandise.product.vendor === 're:do';
  });
  const correctRedoProductInCart = redoProductsInCart?.filter((cartLine) => {
    return cartLine.merchandise.id === `gid://shopify/ProductVariant/${cartInfoToEnable.variantId}`;
  });
  if(redoProductsInCart.length === 0) {
    return await addProductToCart({ cart, fetcher, waitCartIdle, cartInfoToEnable });
  } else if (redoProductsInCart.length === 1 && correctRedoProductInCart.length === 1 && correctRedoProductInCart[0].quantity === 1) {
    // No action needed
    return;
  } else {
    let isSuccess = true;

    await removeLinesFromCart({ cart, fetcher, waitCartIdle, lineIds: redoProductsInCart.map((cartLine) => cartLine.id) });
    await addProductToCart({ cart, fetcher, waitCartIdle, cartInfoToEnable });

    return;
  }
};

const removeLinesFromCart = async ({
  cart,
  fetcher,
  waitCartIdle,
  lineIds
}: {
  cart: CartReturn | CartWithActionsDocs | undefined;
  fetcher: FetcherWithComponents<unknown>;
  waitCartIdle: WaitCartIdleCallback;
  lineIds: string[];
}) => {
  const formInput = {
    action: CartForm.ACTIONS.LinesRemove,
    inputs: {
      lineIds
    }
  }

  if(cart && isCartWithActionsDocs(cart)) {
    cart.linesRemove(lineIds);
    await waitForConditionsMetOrTimeout({
      conditions: [
        () => cart.status === 'idle',
        () => isRedoInCart({ cart })
      ],
      timeoutMs: 10000
    });
  } else {
    await fetcher.submit(
      {
        [CartForm.INPUT_NAME]: JSON.stringify(formInput),
      },
      {method: 'POST', action: '/cart'},
    );
  }
};

const removeProductFromCartIfNeeded = async ({
  cart,
  fetcher,
  waitCartIdle,
  cartInfoToEnable
}: {
  cart: CartReturn | CartWithActionsDocs | undefined,
  fetcher: FetcherWithComponents<unknown>,
  waitCartIdle: WaitCartIdleCallback
  cartInfoToEnable: CartInfoToEnable
}) => {
  if(!cart) {
    console.error('No cart');
    return;
  }

  const redoProductsInCart = getCartLines(cart).filter((cartLine) => {
    return cartLine.merchandise.product.vendor === 're:do';
  });

  if(redoProductsInCart.length !== 0) {
    await removeLinesFromCart({ cart, fetcher, waitCartIdle, lineIds: redoProductsInCart.map((cartLine) => cartLine.id) });
  } else {
  }
};

const addProductToCart = async ({
  waitCartIdle,
  cart,
  fetcher,
  cartInfoToEnable,
}: {
  waitCartIdle: WaitCartIdleCallback;
  cart: CartReturn | CartWithActionsDocs | undefined,
  fetcher: FetcherWithComponents<unknown>,
  cartInfoToEnable: CartInfoToEnable
}) => {
  const redoProductLine = {
    "merchandiseId": `gid://shopify/ProductVariant/${cartInfoToEnable.variantId}`,
    "quantity": 1,
  };

  const formInput = {
    action: CartForm.ACTIONS.LinesAdd,
    inputs: {
      lines: [
        redoProductLine
      ]
    }
  }

  if(cart && isCartWithActionsDocs(cart)) {
    cart.linesAdd([redoProductLine]);
    await waitCartIdle();
  } else {
    await fetcher.submit(
      {
        [CartForm.INPUT_NAME]: JSON.stringify(formInput),
      },
      {method: 'POST', action: '/cart'},
    );
  }
};

const setCartRedoEnabledAttribute = async ({
  cart,
  fetcher,
  waitCartIdle,
  cartInfoToEnable,
  enabled
}: {
  cart: CartReturn | CartWithActionsDocs | undefined;
  fetcher: FetcherWithComponents<unknown>;
  waitCartIdle: WaitCartIdleCallback;
  cartInfoToEnable: CartInfoToEnable | null;
  enabled: boolean;
}) => {
  const redoCartAttribute = {
    key: cartInfoToEnable?.cartAttribute || DEFAULT_REDO_ENABLED_CART_ATTRIBUTE,
    value: enabled.toString()
  };

  const formInput = {
    action: CartForm.ACTIONS.AttributesUpdateInput,
    inputs: {
      attributes: [
        redoCartAttribute
      ]
    }
  }

  if(cart && isCartWithActionsDocs(cart)) {
    cart.cartAttributesUpdate([redoCartAttribute]);
    await waitCartIdle();
  } else {
    await fetcher.submit(
      {
        [CartForm.INPUT_NAME]: JSON.stringify(formInput),
      },
      {method: 'POST', action: '/cart'},
    );
  }
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

type WaitCartIdleCallback = () => Promise<CartReturn | CartWithActionsDocs>;

// Not intended for use with CartReturn, but will accept that value if passed in to avoid breaking rules of hooks
const useWaitCartIdle = (cart: CartReturn | CartWithActionsDocs | undefined) => {
  const resolveRef = useRef<any>(null)
  const promiseRef = useRef<any>(null)

  if (!promiseRef.current) {
    promiseRef.current = new Promise<CartReturn | CartWithActionsDocs>((resolve) => {
      resolveRef.current = resolve
    })
  }

  const resetResolver = useCallback(() => {
    promiseRef.current = new Promise((resolve) => {
      resolveRef.current = resolve
    })
  }, [promiseRef, resolveRef]);

  const waitCartIdle = useCallback(
    async () => {
      return promiseRef.current
    },
    [cart, promiseRef]
  )

  useEffect(() => {
    if(!cart) {
      return;
    }
    if(!isCartWithActionsDocs(cart)) {
      // Wrong type of cart. Just resolve.
      resolveRef.current?.(cart);
      resetResolver();
    } else if(cart.status === 'idle') {
      resolveRef.current?.(cart)
      resetResolver();
    }
  }, [cart, resetResolver]);

  return waitCartIdle;
}

export type {
  WaitCartIdleCallback
}

export {
  DEFAULT_REDO_ENABLED_CART_ATTRIBUTE,
  addProductToCartIfNeeded,
  removeProductFromCartIfNeeded,
  setCartRedoEnabledAttribute,
  useFetcherWithPromise,
  useWaitCartIdle,
  isCartWithActionsDocs,
  getCartLines
};