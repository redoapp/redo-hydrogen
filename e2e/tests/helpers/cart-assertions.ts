import { expect } from "@playwright/test";
import type { RedoPage } from "./redo-page";

export async function assertRedoProductInCart(redoPage: RedoPage) {
  const hasRedo = await redoPage.hasRedoProductInCart();
  expect(hasRedo).toBe(true);
}

export async function assertRedoProductNotInCart(redoPage: RedoPage) {
  const hasRedo = await redoPage.hasRedoProductInCart();
  expect(hasRedo).toBe(false);
}

export async function assertRedoOptedIn(redoPage: RedoPage, attributeKey = "redo_opted_in_from_cart") {
  const value = await redoPage.getCartAttribute(attributeKey);
  expect(value).toBe("true");
}

export async function assertRedoOptedOut(redoPage: RedoPage, attributeKey = "redo_opted_in_from_cart") {
  const value = await redoPage.getCartAttribute(attributeKey);
  expect(value).toBe("false");
}

export async function assertRedoEligible(redoPage: RedoPage) {
  await expect(redoPage.redoEligible).toHaveAttribute("data-eligible", "true");
}

export async function assertRedoPriceDisplayed(redoPage: RedoPage) {
  await expect(redoPage.redoPrice).toBeVisible();
  const price = await redoPage.getRedoPrice();
  const priceNum = parseFloat(price);
  expect(priceNum).toBeGreaterThan(0);
}
