import React, { MouseEvent, useEffect, useState } from "react";
import { CartForm, CartActionInput, CartReturn, Storefront } from "@shopify/hydrogen";
import { useRedoCoverageClient } from "../providers/redo-coverage-client";
import { CartInfoToEnable } from "../types";

const getButtonsToShow = () => {
  return {
    buttons: `<div class="_a-0" data-target="checkout-buttons-container"><button class="_7-0 _7-i _7-2 _7-l _a-1 _a-2 w-full" type="button" data-target="coverage-button"><div class="_7-n"><div data-target="headline-text-container"><p class="w-full weight-bold font-family-inherit">Checkout+ | $21.00</p></div><div data-target="subtitle-text-container"><p class="w-full font-family-inherit"></p></div></div></button><a aria-disabled="false" class="_a-3 _a-4" data-target="non-coverage-button"><p class="_a-3 font-family-inherit">Checkout without free returns</p></a></div>`
  }
}

const findAncestor = (searchEl: HTMLElement | null, findFn: (el: HTMLElement) => boolean) => {
  if(searchEl == null) {
    return null;
  } else if(findFn(searchEl)) {
    return searchEl;
  } else {
    return findAncestor(searchEl.parentElement, findFn);
  }
}

const RedoCheckoutButtons = (props: {
  cart: CartReturn;
  storefront: Storefront
  onClick?: (enabled: boolean) => void;
}) => {
  // const history = useHistory();
  // const navigate = useNavigate();
  // let cart = getCartProducts();
  const redoCoverageClient = useRedoCoverageClient();
  let cart = props.cart;
  let checkoutUrl = cart.checkoutUrl;
  let [redoProductToAdd, setRedoProductToAdd] = useState<CartInfoToEnable | null>(null);
  let renderedButtonHTML = getButtonsToShow().buttons;

  console.log('storefront', props.storefront);

  const wrapperClickHandler = async (e: MouseEvent) => {
    let clickedElement = e.target as HTMLElement;

    if(!clickedElement.dataset) {
      return;
    }

    if(findAncestor(clickedElement, (el) => el.dataset?.target == 'coverage-button')) {
      console.log('Coverage enabled');

      const attachResult = await redoCoverageClient.enable();
      if(props.onClick) {
        await props.onClick(attachResult);
      }
      window.location.href = checkoutUrl;
    } else if(findAncestor(clickedElement, (el) => el.dataset.target == 'non-coverage-button')) {
      console.log('Coverage disabled');
      await redoCoverageClient.disable();
      if(props.onClick) {
        await props.onClick(false);
      }
      window.location.href = checkoutUrl;
    }
  }

  return (
    <div>
      <div
        onClick={wrapperClickHandler}
      >
        <div
          dangerouslySetInnerHTML={{ __html: renderedButtonHTML }}
        />
      </div>
    </div>
  );
}

export {
  RedoCheckoutButtons
};