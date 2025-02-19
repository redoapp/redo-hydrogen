import React, { MouseEvent, ReactNode, useEffect, useState } from "react";
import {
  CartForm,
  CartActionInput,
  CartReturn,
} from "@shopify/hydrogen";
import { useRedoCoverageClient } from "../providers/redo-coverage-client";
import { CartInfoToEnable, RedoCoverageClient } from "../types";
import { REDO_PUBLIC_API_HOSTNAME } from "../utils/security";
import { CurrencyCode } from "@shopify/hydrogen-react/storefront-api-types";

type CheckoutButtonUIResponse = {
  html: string;
  css: string;
};

const getButtonsToShow = ({
  redoCoverageClient,
  cart,
  storeId
}: {
  redoCoverageClient: RedoCoverageClient,
  cart: CartReturn,
  storeId: string;
}): Promise<CheckoutButtonUIResponse | null> => {
  return new Promise<CheckoutButtonUIResponse | null>((resolve, reject) => {
    fetch(
      `https://${REDO_PUBLIC_API_HOSTNAME}/v2.2/stores/${storeId}/checkout-buttons-ui`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    ).then(async (res) => {
      let json = await res.json();

      if (!json.html) {
        return resolve(null);
      }

      const ui = applyButtonVariables({
        redoCoverageClient,
        cart,
        ui: json
      });

      if(!ui) {
        return reject(null);
      }

      return resolve(ui);
    });
  });
};

const applyButtonVariables = ({
  redoCoverageClient,
  cart,
  ui
}: {
  redoCoverageClient: RedoCoverageClient,
  cart: CartReturn,
  ui: CheckoutButtonUIResponse
}): CheckoutButtonUIResponse | null => {
  let currencyCode: CurrencyCode = cart.cost.totalAmount.currencyCode;
  if(currencyCode === 'XXX') {
    currencyCode = 'USD';
  }

  const cartContainsRedo = !!(cart.lines.nodes.some((cartItem) => cartItem.merchandise?.product?.vendor === 're:do'));
  const combinedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode
  }).format(Number(cart.cost.totalAmount.amount) + (cartContainsRedo ? 0 : redoCoverageClient.price));

  if(!combinedPrice || !combinedPrice.length || combinedPrice.includes('NaN')) {
    return null;
  }

  ui.html = ui.html.replaceAll('%combinedPrice%', combinedPrice);

  return ui;
}

const findAncestor = (
  searchEl: HTMLElement | null,
  findFn: (el: HTMLElement) => boolean
) => {
  if (searchEl == null) {
    return null;
  } else if (findFn(searchEl)) {
    return searchEl;
  } else {
    return findAncestor(searchEl.parentElement, findFn);
  }
};

const RedoCheckoutButtons = (props: {
  cart: CartReturn;
  children?: ReactNode;
  onClick?: (enabled: boolean) => void;
}) => {
  const redoCoverageClient = useRedoCoverageClient();
  let cart = redoCoverageClient.cart;
  let checkoutUrl = redoCoverageClient.cart?.checkoutUrl || '/checkout';
  let [redoProductToAdd, setRedoProductToAdd] =
    useState<CartInfoToEnable | null>(null);
  let [checkoutButtonsUI, setCheckoutButtonsUI] = useState<CheckoutButtonUIResponse | null>(
    null
  );

  useEffect(() => {
    (async () => {
      if(!redoCoverageClient.storeId || !cart) {
        return;
      }

      const buttons = await getButtonsToShow({ redoCoverageClient, cart, storeId: redoCoverageClient.storeId });
      if(buttons) {
        setCheckoutButtonsUI(buttons);
      }
    })();
  }, [cart, redoCoverageClient.price, redoCoverageClient.storeId]);

  const wrapperClickHandler = async (e: MouseEvent) => {
    let clickedElement = e.target as HTMLElement;

    if (!clickedElement.dataset) {
      return;
    }

    if (
      findAncestor(
        clickedElement,
        (el) => el.dataset?.target == "coverage-button"
      )
    ) {
      const attachResult = await redoCoverageClient.enable();
      if (props.onClick) {
        await props.onClick(attachResult);
      }
      window.location.href = checkoutUrl;
    } else if (
      findAncestor(
        clickedElement,
        (el) => el.dataset.target == "non-coverage-button"
      )
    ) {
      await redoCoverageClient.disable();
      if (props.onClick) {
        await props.onClick(false);
      }
      window.location.href = checkoutUrl;
    }
  };

  return (
    <div>
      {checkoutButtonsUI ? (
        <div onClick={wrapperClickHandler}>
          {
            checkoutButtonsUI.css ? <style>{checkoutButtonsUI.css}</style> : ''
          }
          <div dangerouslySetInnerHTML={{ __html: checkoutButtonsUI.html }} />
        </div>
      ) : (
        props.children
      )}
    </div>
  );
};

export { RedoCheckoutButtons };
