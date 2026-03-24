import { type Page, type Locator, expect } from "@playwright/test";

export class RedoPage {
  readonly page: Page;
  readonly addToCartButton: Locator;
  readonly redoSection: Locator;
  readonly redoLoading: Locator;
  readonly redoEligible: Locator;
  readonly redoPrice: Locator;
  readonly redoErrors: Locator;
  readonly infoCard: Locator;
  readonly infoButton: Locator;
  readonly modalBackground: Locator;
  readonly modalCloseButton: Locator;
  readonly cartLines: Locator;
  readonly cartAttributes: Locator;
  readonly coverageButton: Locator;
  readonly nonCoverageButton: Locator;
  readonly productTitle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addToCartButton = page.locator('[data-test="add-to-cart"]');
    this.redoSection = page.locator('[data-testid="redo-section"]');
    this.redoLoading = page.locator('[data-testid="redo-loading"]');
    this.redoEligible = page.locator('[data-testid="redo-eligible"]');
    this.redoPrice = page.locator('[data-testid="redo-price"]');
    this.redoErrors = page.locator('[data-testid="redo-errors"]');
    this.infoCard = page.locator('[data-target="info-card-container"]');
    this.infoButton = page.locator('[data-target="toggle-info-button"]');
    this.modalBackground = page.locator(".redo-info-modal__backgroundContainer");
    this.modalCloseButton = page.locator(".redo-info-modal__closeButton");
    this.cartLines = page.locator('[data-testid="cart-lines"]');
    this.cartAttributes = page.locator('[data-testid="cart-attributes"]');
    this.coverageButton = page.locator('[data-target="coverage-button"]');
    this.nonCoverageButton = page.locator('[data-target="non-coverage-button"]');
    this.productTitle = page.locator('h1');
  }

  async goto(productHandle?: string) {
    const handle =
      productHandle ??
      process.env.QUICKSTART_PRODUCT_HANDLE ??
      process.env.PACK_PRODUCT_HANDLE ??
      "";
    await this.page.goto(`/products/${handle}`);
    await this.productTitle.waitFor({ state: "visible", timeout: 15_000 });
  }

  async addProductToCart() {
    await this.addToCartButton.click();
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(1000);
  }

  async waitForRedoLoaded() {
    await this.redoLoading.waitFor({ state: "visible" });
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

  async getRedoPrice(): Promise<string> {
    await this.redoPrice.waitFor({ state: "visible" });
    return (await this.redoPrice.textContent()) ?? "";
  }

  async openInfoModal() {
    await this.infoButton.click();
    await this.modalBackground.waitFor({ state: "visible" });
  }

  async closeInfoModal() {
    await this.modalCloseButton.click();
    await this.modalBackground.waitFor({ state: "hidden" });
  }

  async getCartLineVendors(): Promise<string[]> {
    const lines = this.page.locator('[data-testid="cart-line"]');
    const count = await lines.count();
    const vendors = await Promise.all(
      Array.from({ length: count }, (_, i) => lines.nth(i).getAttribute("data-vendor")),
    );
    return vendors.filter((v): v is string => v !== null);
  }

  async hasRedoProductInCart(): Promise<boolean> {
    const vendors = await this.getCartLineVendors();
    return vendors.includes("re:do");
  }

  async getCartAttribute(key: string): Promise<string | null> {
    const attr = this.page.locator(`[data-testid="cart-attribute"][data-attribute-key="${key}"]`);
    if ((await attr.count()) === 0) return null;
    return attr.getAttribute("data-attribute-value");
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
