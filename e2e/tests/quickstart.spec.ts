import { test, expect } from "@playwright/test";
import { RedoPage } from "./helpers/redo-page";
import {
  assertRedoProductInCart,
  assertRedoProductNotInCart,
  assertRedoOptedIn,
  assertRedoOptedOut,
  assertRedoEligible,
  assertRedoPriceDisplayed,
} from "./helpers/cart-assertions";

test.describe("Standard Hydrogen - Provider Initialization", () => {
  test("loads product page and shows product info", async ({ page }) => {
    const redoPage = new RedoPage(page);
    await redoPage.goto();
    await expect(redoPage.productTitle).toBeVisible();
  });

  test("RedoProvider fetches coverage products after adding to cart", async ({ page }) => {
    const redoPage = new RedoPage(page);
    await redoPage.goto();
    await redoPage.addProductToCart();
    await redoPage.goto();
    await redoPage.waitForRedoLoaded();
  });

  test("shows eligible status and price when coverage is available", async ({ page }) => {
    const redoPage = new RedoPage(page);
    await redoPage.goto();
    await redoPage.addProductToCart();
    await redoPage.goto();
    await redoPage.waitForRedoEligible();
    await assertRedoEligible(redoPage);
    await assertRedoPriceDisplayed(redoPage);
  });

  test("RedoInfoCard renders with correct price", async ({ page }) => {
    const redoPage = new RedoPage(page);
    await redoPage.goto();
    await redoPage.addProductToCart();
    await redoPage.goto();
    await redoPage.waitForRedoEligible();

    await expect(redoPage.infoCard).toBeVisible();
    const priceText = await page.locator('[data-target="price"]').textContent();
    expect(priceText).toMatch(/\$[\d.]+/);
  });

  test("info modal opens and closes", async ({ page }) => {
    const redoPage = new RedoPage(page);
    await redoPage.goto();
    await redoPage.addProductToCart();
    await redoPage.goto();
    await redoPage.waitForRedoEligible();

    await redoPage.openInfoModal();
    await expect(redoPage.modalBackground).toBeVisible();
    await expect(page.locator(".redo-info-modal__title")).toHaveText("Checkout with confidence");

    await redoPage.closeInfoModal();
    await expect(redoPage.modalBackground).not.toBeVisible();
  });
});

test.describe("Standard Hydrogen - Cart Operations", () => {
  test.beforeEach(async ({ page }) => {
    const redoPage = new RedoPage(page);
    await redoPage.goto();
    await redoPage.addProductToCart();
    await redoPage.goto();
    await redoPage.waitForRedoEligible();
  });

  test("coverage checkout button adds Redo product to cart", async ({ page }) => {
    const redoPage = new RedoPage(page);

    await page.route("**/checkout**", (route) =>
      route.fulfill({ status: 200, body: "<html><body>Checkout</body></html>" }),
    );

    await redoPage.coverageButton.click();
    await page.waitForTimeout(3000);

    await redoPage.goto();
    await redoPage.waitForRedoLoaded();
    await assertRedoProductInCart(redoPage);
  });

  test("non-coverage checkout button removes Redo product from cart", async ({ page }) => {
    const redoPage = new RedoPage(page);

    await page.route("**/checkout**", (route) =>
      route.fulfill({ status: 200, body: "<html><body>Checkout</body></html>" }),
    );

    await redoPage.coverageButton.click();
    await page.waitForTimeout(3000);

    await redoPage.goto();
    await redoPage.waitForRedoEligible();

    await redoPage.nonCoverageButton.click();
    await page.waitForTimeout(3000);

    await redoPage.goto();
    await redoPage.waitForRedoLoaded();
    await assertRedoProductNotInCart(redoPage);
  });

  test("cart attributes are set correctly on enable", async ({ page }) => {
    const redoPage = new RedoPage(page);

    await page.route("**/checkout**", (route) =>
      route.fulfill({ status: 200, body: "<html><body>Checkout</body></html>" }),
    );

    await redoPage.coverageButton.click();
    await page.waitForTimeout(3000);

    await redoPage.goto();
    await page.waitForLoadState("networkidle");
    await assertRedoOptedIn(redoPage);
  });

  test("cart attributes are set correctly on disable", async ({ page }) => {
    const redoPage = new RedoPage(page);

    await page.route("**/checkout**", (route) =>
      route.fulfill({ status: 200, body: "<html><body>Checkout</body></html>" }),
    );

    await redoPage.coverageButton.click();
    await page.waitForTimeout(3000);

    await redoPage.goto();
    await redoPage.waitForRedoEligible();

    await redoPage.nonCoverageButton.click();
    await page.waitForTimeout(3000);

    await redoPage.goto();
    await page.waitForLoadState("networkidle");
    await assertRedoOptedOut(redoPage);
  });
});

test.describe("Standard Hydrogen - Checkout Buttons", () => {
  test.beforeEach(async ({ page }) => {
    const redoPage = new RedoPage(page);
    await redoPage.goto();
    await redoPage.addProductToCart();
    await redoPage.goto();
    await redoPage.waitForRedoEligible();
  });

  test("checkout buttons are rendered from API", async ({ page }) => {
    const redoPage = new RedoPage(page);
    await expect(redoPage.coverageButton).toBeVisible({ timeout: 10_000 });
    await expect(redoPage.nonCoverageButton).toBeVisible();
  });

  test("coverage button shows spinner during pending state", async ({ page }) => {
    const redoPage = new RedoPage(page);

    await page.route("**/checkout**", (route) =>
      route.fulfill({ status: 200, body: "<html><body>Checkout</body></html>" }),
    );

    await redoPage.coverageButton.click();

    const spinner = page.locator("svg").filter({ has: page.locator("circle") });
    await expect(spinner.first()).toBeVisible({ timeout: 5_000 });
  });

  test("coverage button navigates to checkout", async ({ page }) => {
    const redoPage = new RedoPage(page);

    const [response] = await Promise.all([
      page.waitForEvent("response", (resp) => resp.url().includes("checkout")),
      redoPage.coverageButton.click(),
    ]);

    expect(response.url()).toContain("checkout");
  });
});

test.describe("Standard Hydrogen - Checkout Verification", () => {
  test("Redo product visible on checkout page after enabling coverage", async ({ page }) => {
    const redoPage = new RedoPage(page);
    await redoPage.goto();
    await redoPage.addProductToCart();
    await redoPage.goto();
    await redoPage.waitForRedoEligible();

    await redoPage.coverageButton.click();
    await page.waitForURL(/checkout/, { timeout: 20_000 });
    expect(page.url()).toContain("checkout");

    const checkoutContent = await page.content();
    expect(
      checkoutContent.toLowerCase().includes("redo") ||
        checkoutContent.toLowerCase().includes("re:do") ||
        checkoutContent.includes("Package Protection") ||
        checkoutContent.includes("Checkout+"),
    ).toBeTruthy();
  });
});

test.describe("Standard Hydrogen - Error Handling", () => {
  test("API 500 error surfaces in client errors", async ({ page }) => {
    const redoPage = new RedoPage(page);

    await redoPage.mockCoverageProductsApi(500, {
      error: "Internal server error",
    });

    await redoPage.goto();
    await redoPage.addProductToCart();
    await redoPage.goto();

    await page.waitForTimeout(3000);

    const errors = await redoPage.getRedoErrors();
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].type).toBe("API_SERVER_ERROR");
  });

  test("API 400 error surfaces as bad request", async ({ page }) => {
    const redoPage = new RedoPage(page);

    await redoPage.mockCoverageProductsApi(400, {
      error: "Bad request",
    });

    await redoPage.goto();
    await redoPage.addProductToCart();
    await redoPage.goto();

    await page.waitForTimeout(3000);

    const errors = await redoPage.getRedoErrors();
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].type).toBe("API_BAD_REQUEST");
  });
});
