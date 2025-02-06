import React, { MouseEvent, ReactNode, useEffect, useState } from "react";
import {
  CartForm,
  CartActionInput,
  CartReturn,
  Storefront,
} from "@shopify/hydrogen";
import { useRedoCoverageClient } from "../providers/redo-coverage-client";
import { CartInfoToEnable, RedoCoverageClient } from "../types";
import { REDO_PUBLIC_API_HOSTNAME_LOCAL } from "../utils/security";

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
      `http://${REDO_PUBLIC_API_HOSTNAME_LOCAL}/v2.2/stores/${storeId}/checkout-buttons-ui`,
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
  const combinedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: cart.cost.totalAmount.currencyCode
  }).format(Number(cart.cost.totalAmount.amount) + redoCoverageClient.price);

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
  storefront: Storefront;
  storeId: string;
  children?: ReactNode;
  onClick?: (enabled: boolean) => void;
}) => {
  // const history = useHistory();
  // const navigate = useNavigate();
  // let cart = getCartProducts();
  const redoCoverageClient = useRedoCoverageClient();
  let cart = props.cart;
  let checkoutUrl = cart.checkoutUrl;
  let [redoProductToAdd, setRedoProductToAdd] =
    useState<CartInfoToEnable | null>(null);
  let [checkoutButtonsUI, setCheckoutButtonsUI] = useState<CheckoutButtonUIResponse | null>(
    null
  );

  useEffect(() => {
    (async () => {
      const buttons = await getButtonsToShow({ redoCoverageClient, cart, storeId: props.storeId });
      setCheckoutButtonsUI(buttons);
    })();
  }, [cart, redoCoverageClient.price]);

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
