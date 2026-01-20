const DISABLED_ATTR = "data-redo-preorder-disabled";
const ORIGINAL_DISABLED_ATTR = "data-redo-original-disabled";

/**
 * Finds add-to-cart buttons on the page
 */
function findAddToCartButtons(): HTMLButtonElement[] {
  const buttons = document.querySelectorAll<HTMLButtonElement>(
    'button[name="add"], button[type="submit"], .product-form__submit'
  );

  return Array.from(buttons).filter((button) => {
    const text = button.textContent?.toLowerCase().trim() ?? "";
    return text.includes("add to cart") || text.includes("add to bag");
  });
}

/**
 * Checks for Purple Dot preorder element and updates button states accordingly.
 * Disables add-to-cart buttons when purple-dot-learn-more element is present.
 * Re-enables them when the element is removed.
 */
export function updatePurpleDotButtons(): void {
  const hasPurpleDot = document.querySelector("purple-dot-learn-more") !== null;
  const addToCartButtons = findAddToCartButtons();

  for (const button of addToCartButtons) {
    if (hasPurpleDot) {
      // Disable the button
      if (!button.hasAttribute(DISABLED_ATTR)) {
        // Preserve original disabled state
        if (!button.hasAttribute(ORIGINAL_DISABLED_ATTR)) {
          button.setAttribute(ORIGINAL_DISABLED_ATTR, String(button.disabled));
        }

        button.setAttribute(DISABLED_ATTR, "true");
        button.disabled = true;
        button.style.opacity = "0.5";
        button.style.cursor = "not-allowed";
        button.style.pointerEvents = "none";

        // Add message if not already present
        if (!button.parentElement?.querySelector(".redo-preorder-msg")) {
          const msg = document.createElement("div");
          msg.className = "redo-preorder-msg";
          msg.textContent = "Preorder items cannot be added during exchanges";
          msg.style.cssText =
            "color: #d63031; font-size: 12px; margin-top: 8px; font-weight: 500;";
          button.parentElement?.insertBefore(msg, button.nextSibling);
        }
      }
    } else {
      // Re-enable the button if we disabled it
      if (button.hasAttribute(DISABLED_ATTR)) {
        const wasDisabled =
          button.getAttribute(ORIGINAL_DISABLED_ATTR) === "true";
        button.removeAttribute(DISABLED_ATTR);
        button.removeAttribute(ORIGINAL_DISABLED_ATTR);
        button.disabled = wasDisabled;
        button.style.opacity = "";
        button.style.cursor = "";
        button.style.pointerEvents = "";
        button.parentElement?.querySelector(".redo-preorder-msg")?.remove();
      }
    }
  }
}

/**
 * Cleans up all disabled buttons (used on unmount).
 * Restores original disabled state.
 */
export function cleanupPurpleDotButtons(): void {
  const disabledButtons = Array.from(
    document.querySelectorAll<HTMLButtonElement>(`button[${DISABLED_ATTR}]`)
  );

  for (const button of disabledButtons) {
    const wasDisabled = button.getAttribute(ORIGINAL_DISABLED_ATTR) === "true";
    button.removeAttribute(DISABLED_ATTR);
    button.removeAttribute(ORIGINAL_DISABLED_ATTR);
    button.disabled = wasDisabled;
    button.style.opacity = "";
    button.style.cursor = "";
    button.style.pointerEvents = "";
  }

  // Remove all messages
  document
    .querySelectorAll(".redo-preorder-msg")
    .forEach((msg) => msg.remove());
}
