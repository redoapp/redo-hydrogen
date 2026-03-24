import { type Page, type Locator, expect } from "@playwright/test";

export class RedoPage {
  readonly page: Page;
  readonly addToCartButton: Locator;
  readonly productTitle: Locator;

  readonly redoDebug: Locator;
  readonly redoLoading: Locator;
  readonly redoEligible: Locator;
  readonly redoPrice: Locator;
  readonly redoErrors: Locator;

  readonly infoCard: Locator;
  readonly infoButton: Locator;
  readonly modalBackground: Locator;
  readonly modalCloseButton: Locator;

  readonly coverageButton: Locator;
  readonly nonCoverageButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addToCartButton = page.locator('[data-test="add-to-cart"]');
    this.productTitle = page.locator("h1");

    this.redoDebug = page.locator('[data-testid="redo-debug"]');
    this.redoLoading = page.locator('[data-testid="redo-loading"]');
    this.redoEligible = page.locator('[data-testid="redo-eligible"]');
    this.redoPrice = page.locator('[data-testid="redo-price"]');
    this.redoErrors = page.locator('[data-testid="redo-errors"]');

    this.infoCard = page.locator('[data-target="info-card-container"]');
    this.infoButton = page.locator('[data-target="toggle-info-button"]');
    this.modalBackground = page.locator(".redo-info-modal__backgroundContainer");
    this.modalCloseButton = page.locator(".redo-info-modal__closeButton");

    this.coverageButton = page.locator('[data-target="coverage-button"]');
    this.nonCoverageButton = page.locator('[data-target="non-coverage-button"]');
  }

  async gotoProduct(productHandle?: string) {
    const handle =
      productHandle ??
      process.env.QUICKSTART_PRODUCT_HANDLE ??
      process.env.PACK_PRODUCT_HANDLE ??
      "";
    await this.page.goto(`/products/${handle}`);
    await this.productTitle.waitFor({ state: "visible", timeout: 15_000 });
  }

  async gotoCart() {
    await this.page.goto("/cart");
    await this.page.waitForLoadState("networkidle");
  }

  async addToCartAndOpenDrawer() {
    await this.addToCartButton.click();
    await this.page.waitForLoadState("networkidle");
    await this.redoDebug.waitFor({ state: "visible", timeout: 10_000 });
  }

  async openCartDrawer() {
    const bagButton = this.page.locator("button").filter({ hasText: "Bag" }).first();
    await bagButton.click();
    await this.redoDebug.waitFor({ state: "visible", timeout: 10_000 });
  }

  async waitForRedoLoaded() {
    await this.redoLoading.waitFor({ state: "visible", timeout: 10_000 });
    await expect(this.redoLoading).toHaveAttribute("data-loading", "false", {
      timeout: 15_000,
    });
  }

  async waitForRedoEligible() {
    await this.waitForRedoLoaded();
    await expect(this.redoEligible).toHaveAttribute("data-eligible", "true", {
      timeout: 10_000,
    });
  }

  async getDebugText(): Promise<string> {
    return (await this.redoDebug.textContent()) ?? "";
  }

  async isRedoEnabled(): Promise<boolean> {
    const text = await this.getDebugText();
    return text.includes("enabled: true");
  }

  async hasRedoProductInCart(): Promise<boolean> {
    const text = await this.getDebugText();
    return text.includes("cartProduct: gid://");
  }

  async hasRedoCartAttribute(): Promise<boolean> {
    const text = await this.getDebugText();
    return text.includes("cartAttribute: redo_opted_in_from_cart");
  }

  async getRedoPrice(): Promise<string> {
    const text = await this.redoPrice.textContent();
    return text?.replace("price: ", "") ?? "";
  }

  async getRedoErrors(): Promise<{ type: string; message: string }[]> {
    const errorElements = this.page.locator('[data-testid="redo-error"]');
    const count = await errorElements.count();
    return Promise.all(
      Array.from({ length: count }, async (_, i) => {
        const el = errorElements.nth(i);
        return {
          type: (await el.getAttribute("data-error-type")) ?? "",
          message: (await el.textContent()) ?? "",
        };
      }),
    );
  }

  async openInfoModal() {
    await this.infoButton.click();
    await this.modalBackground.waitFor({ state: "visible" });
  }

  async closeInfoModal() {
    await this.modalCloseButton.click();
    await this.modalBackground.waitFor({ state: "hidden" });
  }

  async clickCoverageAndWaitForCheckout() {
    await this.coverageButton.click();
    await this.page.waitForURL(/checkout/, { timeout: 20_000 });
  }

  async clickNonCoverageAndWaitForCheckout() {
    await this.nonCoverageButton.click();
    await this.page.waitForURL(/checkout/, { timeout: 20_000 });
  }

  async authPasswordProtectedStore(storeDomain: string) {
    const password = process.env.STORE_PASSWORD;
    if (!password) return;

    await this.page.goto(`https://${storeDomain}/password`);
    await this.page.locator('input[type="password"]').fill(password);
    await this.page.locator('button[type="submit"]').click();
    await this.page.waitForLoadState("networkidle");
  }

  async checkoutPageHasRedoProduct(): Promise<boolean> {
    await this.page.waitForLoadState("networkidle");
    const content = await this.page.content();
    const lower = content.toLowerCase();
    return (
      lower.includes("free unlimited return") ||
      lower.includes("re:do") ||
      lower.includes("package protection")
    );
  }

  async mockCoverageProductsApi(statusCode: number, body: Record<string, unknown>) {
    await this.page.route("**/coverage-products", (route) => {
      route.fulfill({
        status: statusCode,
        contentType: "application/json",
        body: JSON.stringify(body),
      });
    });
  }
}
