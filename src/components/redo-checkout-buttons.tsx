import React, { MouseEvent, ReactNode, useEffect, useState } from "react";
import { CartForm, CartActionInput, CartReturn } from "@shopify/hydrogen";
import { useRedoCoverageClient } from "../providers/redo-coverage-client";
import { CartInfoToEnable, RedoCoverageClient } from "../types";
import { REDO_PUBLIC_API_HOSTNAME } from "../utils/security";
import { CurrencyCode } from "@shopify/hydrogen-react/storefront-api-types";
import { CartWithActionsDocs } from "@shopify/hydrogen-react/dist/types/cart-types";
import { getCartLines, isCartWithActionsDocs } from "../utils/cart";

import CircleSpinner from "../utils/circle-spinner.svg";
import { executeWithTimeout } from "../utils/timeout";

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
  cart: CartReturn | CartWithActionsDocs,
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
  cart: CartReturn | CartWithActionsDocs,
  ui: CheckoutButtonUIResponse
}): CheckoutButtonUIResponse | null => {
  if(!redoCoverageClient.eligible || !redoCoverageClient.price || !cart?.cost) {
    return null;
  }

  let currencyCode: CurrencyCode = cart.cost.totalAmount.currencyCode;
  if(currencyCode === 'XXX') {
    currencyCode = 'USD';
  }

  const cartContainsRedo = !!(getCartLines(cart).some((cartItem) => cartItem.merchandise?.product?.vendor === 're:do'));
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
  cart: CartReturn | CartWithActionsDocs;
  children?: ReactNode;
  onClick?: (enabled: boolean) => void;
}) => {
  const redoCoverageClient = useRedoCoverageClient();
  let cart = redoCoverageClient.cart;
  let checkoutUrl = redoCoverageClient.cart?.checkoutUrl || '/checkout';
  let [redoProductToAdd, setRedoProductToAdd] =
    useState<CartInfoToEnable | null>(null);
  let [checkoutButtonsUI, setCheckoutButtonsUI] =
    useState<CheckoutButtonUIResponse | null>(null);
    
  const [coveragePending, setCoveragePending] = useState(false);
  const [nonCoveragePending, setNonCoveragePending] = useState(false);

  useEffect(() => {
    (async () => {
      if(!redoCoverageClient.eligible || !cart || !redoCoverageClient.storeId) {
        return;
      }

      const buttons = await getButtonsToShow({ redoCoverageClient, cart, storeId: redoCoverageClient.storeId });
      if(buttons) {
        setCheckoutButtonsUI(buttons);
      }
    })();
  }, [cart, redoCoverageClient.eligible, redoCoverageClient.price, redoCoverageClient.storeId]);

  /** To avoid the inevitable spammers trying to checkout faster by clicking over and over, between the time the promise resolves and the new tab opens (or errors) */
  const DELAY_TO_ALLOW_CLICKING_AGAIN = 2000;
  const TIMEOUT_FOR_CHECKOUTS = 8000;

  const handleCoverageCheckoutClick = async () => {
    setCoveragePending(true);
    await executeWithTimeout(
      redoCoverageClient.enable().then(async (result) => {
        if (props.onClick) {
          await props.onClick(result);
        }
      }),
      TIMEOUT_FOR_CHECKOUTS,
    )
      .catch((e: any) => {
        console.error(e);
      })
      .finally(() => {
        setTimeout(() => {
          setCoveragePending(false);
        }, DELAY_TO_ALLOW_CLICKING_AGAIN);
      });
  };

  const handleNonCoverageClick = async () => {
    /** The link doesn't have automatic rejection with a `disabled` attribute, so we need to check manually */
    if (coveragePending || nonCoveragePending) {
      return;
    }

    setNonCoveragePending(true);

    await executeWithTimeout(
      redoCoverageClient.disable().then(async (result) => {
        if (props.onClick) {
          await props.onClick(result);
        }
        window.location.href = checkoutUrl;
      }),
      TIMEOUT_FOR_CHECKOUTS,
    )
      .catch((e: any) => {
        console.error(e);
      })
      .finally(() => {
        setTimeout(() => {
          setNonCoveragePending(false);
        }, DELAY_TO_ALLOW_CLICKING_AGAIN);
      });
  };

  const wrapperClickHandler = async (e: MouseEvent) => {
    let clickedElement = e.target as HTMLElement;

    if(!clickedElement.dataset) {
      return;
    }

    const isCoverageButton = findAncestor(
      clickedElement,
      (el) => el.dataset?.target == "coverage-button"
    );

    const isNonCoverageButton = findAncestor(
      clickedElement,
      (el) => el.dataset?.target == "non-coverage-button",
    );

    if (isCoverageButton) {
      await handleCoverageCheckoutClick();
      window.location.href = checkoutUrl;
    } else if (isNonCoverageButton) {
      await handleNonCoverageClick();
      window.location.href = checkoutUrl;
    }
  };

  return (
    <div>
      {checkoutButtonsUI ? (
        <div onClick={wrapperClickHandler} style={{ position: "relative" }}>
           {checkoutButtonsUI.css ? <style>{checkoutButtonsUI.css}</style> : ''}
           <div
            dangerouslySetInnerHTML={{ __html: checkoutButtonsUI.html }}
            style={{ 
              opacity: (coveragePending || nonCoveragePending) ? 0.25 : 1,
              transition: 'opacity 0.2s ease-in-out'
            }}
          />
          {(coveragePending || nonCoveragePending) && ( 
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 1,
              }}
            >
              <CircleSpinner />
            </div>
          )} 
        </div>
      ) : (
        props.children
      )}
    </div>
  );
};

export { RedoCheckoutButtons };
