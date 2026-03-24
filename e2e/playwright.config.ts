import { defineConfig, devices } from "@playwright/test";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const QUICKSTART_PORT = 2501;

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

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    [process.env.CI ? "html" : "list"],
    ["json", { outputFile: "test-results/results.json" }],
  ],
  preserveOutput: "always",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: `http://localhost:${QUICKSTART_PORT}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: {
      mode: "on",
      size: { width: 640, height: 480 },
    },
  },
  webServer: {
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
});

process.env.QUICKSTART_PRODUCT_HANDLE =
  process.env.SHOPIFY_QUICKSTART_PRODUCT_HANDLE || quickstartEnv.PUBLIC_TEST_PRODUCT_HANDLE || "";
process.env.STORE_PASSWORD =
  process.env.STORE_PASSWORD || quickstartEnv.STORE_PASSWORD || "";
process.env.QUICKSTART_STORE_DOMAIN =
  process.env.SHOPIFY_QUICKSTART_STORE_DOMAIN || quickstartEnv.PUBLIC_STORE_DOMAIN || "";
