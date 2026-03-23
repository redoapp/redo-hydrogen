import { useEffect } from "react";
import { updatePurpleDotButtons, cleanupPurpleDotButtons } from "../utils/purple-dot";

/**
 * React hook to disable add-to-cart buttons when a Purple Dot preorder element is present.
 * Watches for DOM changes and automatically disables/enables buttons based on the presence
 * of the <purple-dot-learn-more> element.
 *
 * @param disablePreorderButtons - When true, enables the preorder button disabling logic.
 *                                  When false, the hook does nothing.
 *
 * Usage:
 * ```tsx
 * function ProductPage() {
 *   const isShopOnSiteActive = true; // your condition here
 *   useDisablePurpleDotPreorder(isShopOnSiteActive);
 *   return <div>...</div>;
 * }
 * ```
 */
export function useDisablePurpleDotPreorder(disablePreorderButtons: boolean): void {
  useEffect(() => {
    if (!disablePreorderButtons) {
      return;
    }

    // Initial check
    updatePurpleDotButtons();

    // Watch for DOM changes (variant selection, page navigation, etc.)
    const observer = new MutationObserver(updatePurpleDotButtons);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      cleanupPurpleDotButtons();
    };
  }, [disablePreorderButtons]);
}
