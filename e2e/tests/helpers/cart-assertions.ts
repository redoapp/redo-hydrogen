import { expect } from "@playwright/test";
import type { RedoPage } from "./redo-page";

export async function assertRedoComponentsVisible(redoPage: RedoPage) {
  await expect(redoPage.redoDebug).toBeVisible();
  await expect(redoPage.infoCard).toBeVisible();
  await expect(redoPage.coverageButton).toBeVisible();
  await expect(redoPage.nonCoverageButton).toBeVisible();
}

export async function assertRedoEligibleWithPrice(redoPage: RedoPage) {
  await redoPage.waitForRedoEligible();
  const price = await redoPage.getRedoPrice();
  expect(parseFloat(price)).toBeGreaterThan(0);
}

export async function assertRedoProductInCart(redoPage: RedoPage) {
  const hasProduct = await redoPage.hasRedoProductInCart();
  expect(hasProduct).toBe(true);
}

export async function assertRedoEnabled(redoPage: RedoPage) {
  const enabled = await redoPage.isRedoEnabled();
  expect(enabled).toBe(true);
}
