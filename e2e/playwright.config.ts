import { defineConfig, devices } from "@playwright/test";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const QUICKSTART_PORT = 2501;
const PACK_PORT = 2502;

function loadEnvFromFixture(fixturePath: string): Record<string, string> {
  const envPath = resolve(__dirname, fixturePath, ".env");
  if (!existsSync(envPath)) return {};
  const content = readFileSync(envPath, "utf-8");
  const env: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    env[trimmed.slice(0, eqIndex)] = trimmed.slice(eqIndex + 1);
  }
  return env;
}

const quickstartEnv = loadEnvFromFixture("./fixtures/hydrogen-quickstart");
const packEnv = loadEnvFromFixture("./fixtures/hydrogen-pack");

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "html" : "list",
  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "quickstart",
      testMatch: /quickstart\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: `http://localhost:${QUICKSTART_PORT}`,
      },
    },
    {
      name: "pack",
      testMatch: /pack\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: `http://localhost:${PACK_PORT}`,
      },
    },
  ],
  webServer: [
    {
      command: "npm run dev",
      cwd: "./fixtures/hydrogen-quickstart",
      port: QUICKSTART_PORT,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      env: {
        ...process.env,
        ...quickstartEnv,
      },
    },
    {
      command: "npm run dev",
      cwd: "./fixtures/hydrogen-pack",
      port: PACK_PORT,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      env: {
        ...process.env,
        ...packEnv,
      },
    },
  ],
});

// Make fixture env vars available to test files
process.env.QUICKSTART_PRODUCT_HANDLE =
  process.env.SHOPIFY_QUICKSTART_PRODUCT_HANDLE || quickstartEnv.PUBLIC_TEST_PRODUCT_HANDLE || "";
process.env.PACK_PRODUCT_HANDLE =
  process.env.SHOPIFY_PACK_PRODUCT_HANDLE || packEnv.PUBLIC_TEST_PRODUCT_HANDLE || "";
