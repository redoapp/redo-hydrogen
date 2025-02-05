import React, { MouseEvent, ReactNode, useEffect, useState } from "react";
import {
  CartForm,
  CartActionInput,
  CartReturn,
  Storefront,
} from "@shopify/hydrogen";
import { useRedoCoverageClient } from "../providers/redo-coverage-client";
import { CartInfoToEnable } from "../types";
import { REDO_PUBLIC_API_HOSTNAME_LOCAL } from "../utils/security";

type CheckoutButtonUIResponse = {
  html: string;
  css: string;
};

const getButtonsToShow = ({
  storeId,
}: {
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

      console.log(
        `Retrieved checkout buttons info: ${JSON.stringify(json.html)}`
      );

      return resolve(json);
    });
  });
};

// const applyButtonVariables = ({
//   redoCoverageClient
// }: {
//   redoCoverageClient
// })

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

  console.log("storefront", props.storefront);

  useEffect(() => {
    (async () => {
      console.log("a");
      const buttons = await getButtonsToShow({ storeId: props.storeId });
      console.log("b");
      setCheckoutButtonsUI(buttons);
      console.log("c");
    })();
  }, [cart, redoCoverageClient]);

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
      console.log("Coverage enabled");

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
      console.log("Coverage disabled");
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
