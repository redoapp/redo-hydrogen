import { test, expect } from "@playwright/test";
import { RedoPage } from "./helpers/redo-page";
import {
  assertRedoComponentsVisible,
  assertRedoEligibleWithPrice,
  assertRedoProductInCart,
  assertRedoEnabled,
} from "./helpers/cart-assertions";

test.describe("Side Cart - Redo Components", () => {
  test("Checkout+ and non-coverage buttons show up in side cart", async ({ page }) => {
    const redo = new RedoPage(page);
    await redo.gotoProduct();
    await redo.addToCartAndOpenDrawer();
    await redo.waitForRedoEligible();

    await assertRedoComponentsVisible(redo);

    const coverageText = await redo.coverageButton.textContent();
    expect(coverageText).toContain("Checkout+");
    expect(coverageText).toMatch(/\$[\d,.]+/);

    const nonCoverageText = await redo.nonCoverageButton.textContent();
    expect(nonCoverageText).toContain("Checkout without free returns");
  });

  test("RedoInfoCard renders with price", async ({ page }) => {
    const redo = new RedoPage(page);
    await redo.gotoProduct();
    await redo.addToCartAndOpenDrawer();
    await redo.waitForRedoEligible();

    await expect(redo.infoCard).toBeVisible();
    const priceText = await page.locator('[data-target="price"]').textContent();
    expect(priceText).toMatch(/\$[\d.]+/);
  });

  test("info modal opens and closes", async ({ page }) => {
    const redo = new RedoPage(page);
    await redo.gotoProduct();
    await redo.addToCartAndOpenDrawer();
    await redo.waitForRedoEligible();

    await redo.openInfoModal();
    await expect(redo.modalBackground).toBeVisible();

    await redo.closeInfoModal();
    await expect(redo.modalBackground).not.toBeVisible();
  });

  test("provider shows eligible, price, and enabled state", async ({ page }) => {
    const redo = new RedoPage(page);
    await redo.gotoProduct();
    await redo.addToCartAndOpenDrawer();
    await redo.waitForRedoEligible();

    await assertRedoEligibleWithPrice(redo);
    await assertRedoProductInCart(redo);
    await assertRedoEnabled(redo);
  });
});

test.describe("Main Cart Page - Redo Components", () => {
  test("Checkout+ and non-coverage buttons show up on /cart page", async ({ page }) => {
    const redo = new RedoPage(page);
    await redo.gotoProduct();
    await redo.addToCartAndOpenDrawer();

    await redo.gotoCart();
    await redo.waitForRedoEligible();

    await assertRedoComponentsVisible(redo);

    const coverageText = await redo.coverageButton.textContent();
    expect(coverageText).toContain("Checkout+");

    const nonCoverageText = await redo.nonCoverageButton.textContent();
    expect(nonCoverageText).toContain("Checkout without free returns");
  });
});

test.describe("Checkout+ Flow", () => {
  test("navigates to checkout with Redo product when Checkout+ clicked", async ({ page }) => {
    const redo = new RedoPage(page);
    await redo.authPasswordProtectedStore(process.env.QUICKSTART_STORE_DOMAIN!);
    await redo.gotoProduct();
    await redo.addToCartAndOpenDrawer();
    await redo.waitForRedoEligible();

    await redo.clickCoverageAndWaitForCheckout();
    expect(page.url()).toContain("checkout");

    const hasRedo = await redo.checkoutPageHasRedoProduct();
    expect(hasRedo).toBe(true);
  });
});

test.describe("Checkout Without Free Returns Flow", () => {
  test("navigates to checkout without Redo product when non-coverage clicked", async ({ page }) => {
    const redo = new RedoPage(page);
    await redo.authPasswordProtectedStore(process.env.QUICKSTART_STORE_DOMAIN!);
    await redo.gotoProduct();
    await redo.addToCartAndOpenDrawer();
    await redo.waitForRedoEligible();

    await redo.clickNonCoverageAndWaitForCheckout();
    expect(page.url()).toContain("checkout");

    const hasRedo = await redo.checkoutPageHasRedoProduct();
    expect(hasRedo).toBe(false);
  });
});

test.describe("Error Handling", () => {
  test("API 500 error surfaces in client errors", async ({ page }) => {
    const redo = new RedoPage(page);
    await redo.mockCoverageProductsApi(500, { error: "Internal server error" });

    await redo.gotoProduct();
    await redo.addToCartAndOpenDrawer();
    await page.waitForTimeout(3000);

    const errors = await redo.getRedoErrors();
    expect(errors.length).toBeGreaterThan(0);
  });

  test("API 400 error surfaces in client errors", async ({ page }) => {
    const redo = new RedoPage(page);
    await redo.mockCoverageProductsApi(400, { error: "Bad request" });

    await redo.gotoProduct();
    await redo.addToCartAndOpenDrawer();
    await page.waitForTimeout(3000);

    const errors = await redo.getRedoErrors();
    expect(errors.length).toBeGreaterThan(0);
  });
});
