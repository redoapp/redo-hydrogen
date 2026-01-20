import { useEffect } from "react";
import {
  updatePurpleDotButtons,
  cleanupPurpleDotButtons,
} from "../utils/purple-dot";

/**
 * React hook to disable add-to-cart buttons when a Purple Dot preorder element is present.
 * Watches for DOM changes and automatically disables/enables buttons based on the presence
 * of the <purple-dot-learn-more> element.
 *
 * Usage:
 * ```tsx
 * function ProductPage() {
 *   usePurpleDotPreorder();
 *   return <div>...</div>;
 * }
 * ```
 */
export function usePurpleDotPreorder(): void {
  useEffect(() => {
    // Initial check
    updatePurpleDotButtons();

    // Watch for DOM changes (variant selection, page navigation, etc.)
    const observer = new MutationObserver(updatePurpleDotButtons);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      cleanupPurpleDotButtons();
    };
  }, []);
}
