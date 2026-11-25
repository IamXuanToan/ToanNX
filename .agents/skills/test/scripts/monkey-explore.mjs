#!/usr/bin/env node
/**
 * Script Monkey Test có kiểm soát bằng Playwright cho repo ToanNX.
 * Chỉ chạy trên localhost / 127.0.0.1; tạo dữ liệu hành động lặp lại được theo `--seed`,
 * ghi nhận console error, pageerror, API >= 500, tràn ngang viewport, ảnh lỗi và tự chụp screenshot.
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);

function loadPlaywright() {
  const candidates = [
    resolve(process.cwd(), "frontend/node_modules/playwright"),
    resolve(process.cwd(), "frontend/node_modules/@playwright/test"),
    resolve(process.cwd(), "node_modules/playwright"),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return require(candidate);
    }
  }
  throw new Error(
    "Không tìm thấy playwright trong frontend/node_modules. Hãy chạy `pnpm install` trong frontend/ trước.",
  );
}

function parseArgs(argv) {
  const args = {
    baseUrl: "http://localhost:3001",
    routes: ["/vi", "/vi/quan-tri", "/vi/ca-nhan"],
    steps: 45,
    seed: Date.now() % 1_000_000,
    email: "",
    password: "",
    outDir: resolve(process.cwd(), ".tmp/monkey-audit"),
    allowDestructive: false,
    headless: true,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    const next = argv[i + 1];
    if (key === "--base-url" && next) {
      args.baseUrl = next;
      i += 1;
    } else if (key === "--routes" && next) {
      args.routes = next
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      i += 1;
    } else if (key === "--steps" && next) {
      args.steps = Math.max(5, Number.parseInt(next, 10) || 45);
      i += 1;
    } else if (key === "--seed" && next) {
      args.seed = Number.parseInt(next, 10) || args.seed;
      i += 1;
    } else if (key === "--email" && next) {
      args.email = next;
      i += 1;
    } else if (key === "--password" && next) {
      args.password = next;
      i += 1;
    } else if (key === "--out-dir" && next) {
      args.outDir = resolve(process.cwd(), next);
      i += 1;
    } else if (key === "--allow-destructive") {
      args.allowDestructive = true;
    } else if (key === "--headed") {
      args.headless = false;
    }
  }
  return args;
}

function assertLocalTarget(rawUrl) {
  const parsed = new URL(rawUrl);
  if (!["localhost", "127.0.0.1", "::1"].includes(parsed.hostname)) {
    throw new Error(`Chặn an toàn: monkey test chỉ được chạy trên local, nhận được ${parsed.hostname}`);
  }
}

function createRng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FUZZ_STRINGS = [
  "Nguyễn Xuân Toàn kiểm thử 🚀",
  "   khoảng trắng đầu cuối   ",
  "<img src=x onerror=alert(1)>",
  "abc/?#%&=test",
  "a".repeat(320),
  "-12345",
  "0",
];

const VIEWPORTS = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 800 },
];

async function safeLogin(page, args) {
  if (!args.email || !args.password) return;
  await page.goto(new URL("/vi/dang-nhap", args.baseUrl).toString(), { waitUntil: "networkidle" });
  const emailInput = page.locator("input[name='identifier'], input[autocomplete='username'], input[type='email']").first();
  if ((await emailInput.count()) === 0) return;
  const passwordInput = page.locator("input[name='password'], input[type='password']").first();
  await emailInput.fill(args.email);
  await passwordInput.fill(args.password);
  await page.locator("button[type='submit']").first().click();
  await page.waitForTimeout(2000);
}

async function runMonkey() {
  const args = parseArgs(process.argv.slice(2));
  assertLocalTarget(args.baseUrl);
  const targetOrigin = new URL(args.baseUrl).origin;
  mkdirSync(args.outDir, { recursive: true });

  const { chromium } = loadPlaywright();
  const rng = createRng(args.seed);
  const browser = await chromium.launch({ headless: args.headless });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const findings = [];
  const actions = [];
  let currentStep = 0;

  const recordFinding = async (kind, detail) => {
    const shotName = `step-${String(currentStep).padStart(3, "0")}-${kind.replace(/[^a-z0-9-]/gi, "_")}.png`;
    const shotPath = resolve(args.outDir, shotName);
    await page.screenshot({ path: shotPath, fullPage: false }).catch(() => {});
    findings.push({
      step: currentStep,
      kind,
      url: page.url(),
      detail,
      screenshot: shotPath,
    });
  };

  page.on("pageerror", (error) => {
    void recordFinding("pageerror", error.message);
  });
  page.on("console", (message) => {
    if (message.type() === "error") {
      void recordFinding("console-error", message.text());
    }
  });
  page.on("response", (response) => {
    if (response.status() >= 500) {
      void recordFinding("http-5xx", `${response.status()} ${response.request().method()} ${response.url()}`);
    }
  });

  await safeLogin(page, args);

  for (currentStep = 1; currentStep <= args.steps; currentStep += 1) {
    if (!page.url().startsWith(targetOrigin)) {
      const recoveryRoute = args.routes[0] || "/vi";
      await page.goto(new URL(recoveryRoute, args.baseUrl).toString(), { waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => {});
    }
    const roll = rng();
    try {
      if (roll < 0.22 || currentStep === 1) {
        const route = args.routes[Math.floor(rng() * args.routes.length)];
        actions.push({ step: currentStep, action: "goto", route });
        await page.goto(new URL(route, args.baseUrl).toString(), { waitUntil: "domcontentloaded", timeout: 15000 });
      } else if (roll < 0.34) {
        const vp = VIEWPORTS[Math.floor(rng() * VIEWPORTS.length)];
        actions.push({ step: currentStep, action: "resize", viewport: vp.name });
        await page.setViewportSize({ width: vp.width, height: vp.height });
      } else if (roll < 0.44) {
        actions.push({ step: currentStep, action: "reload" });
        await page.reload({ waitUntil: "domcontentloaded", timeout: 15000 });
      } else if (roll < 0.72) {
        const target = await page.evaluate((allowDestructive) => {
          const selectors = [
            "button:not([disabled])",
            "[role='tab']:not([disabled])",
            "[role='checkbox']:not([disabled])",
            "[role='switch']:not([disabled])",
            "a[href^='/']:not([href*='logout'])",
          ];
          const nodes = [...document.querySelectorAll(selectors.join(","))].filter((el) => {
            const rect = el.getBoundingClientRect();
            if (rect.width < 4 || rect.height < 4) return false;
            const testId = el.getAttribute("data-testid") || "";
            if (testId.includes("login-google") || testId.includes("login-github")) return false;
            const text = (el.textContent || "").toLowerCase();
            if (!allowDestructive && (testId.includes("logout") || text.includes("đăng xuất") || text.includes("xóa") || text.includes("delete"))) {
              return false;
            }
            return true;
          });
          if (!nodes.length) return null;
          const idx = Math.floor(Math.random() * nodes.length);
          const picked = nodes[idx];
          picked.setAttribute("data-monkey-hit", String(Date.now()));
          return {
            hit: picked.getAttribute("data-monkey-hit"),
            label: (picked.textContent || picked.getAttribute("aria-label") || picked.tagName).trim().slice(0, 60),
          };
        }, args.allowDestructive);

        if (target?.hit) {
          const loc = page.locator(`[data-monkey-hit="${target.hit}"]`).first();
          actions.push({ step: currentStep, action: "click", label: target.label });
          await loc.click({ timeout: 2500 }).catch(() => {});
          if (rng() < 0.25) {
            await loc.click({ timeout: 1000 }).catch(() => {});
          }
        }
      } else if (roll < 0.9) {
        const inputs = page.locator("input:not([disabled]):not([type='hidden']):not([type='file']), textarea:not([disabled])");
        const count = await inputs.count();
        if (count > 0) {
          const idx = Math.floor(rng() * count);
          const value = FUZZ_STRINGS[Math.floor(rng() * FUZZ_STRINGS.length)];
          actions.push({ step: currentStep, action: "fuzz-input", index: idx, sample: value.slice(0, 30) });
          await inputs.nth(idx).fill(value, { timeout: 2500 }).catch(() => {});
          if (rng() < 0.4) await inputs.nth(idx).press("Enter").catch(() => {});
        }
      } else {
        actions.push({ step: currentStep, action: "escape-or-back" });
        await page.keyboard.press("Escape").catch(() => {});
        if (rng() < 0.35) await page.goBack({ timeout: 8000 }).catch(() => {});
      }

      await page.waitForTimeout(250);
      const layoutCheck = await page.evaluate(() => {
        const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
        const brokenImages = [...document.querySelectorAll("img")]
          .filter((img) => img.complete && img.naturalWidth === 0)
          .map((img) => img.getAttribute("src") || "(no-src)");
        return { overflow, brokenImages };
      });
      if (layoutCheck.overflow > 2) {
        await recordFinding("horizontal-overflow", `scrollWidth vượt clientWidth ${layoutCheck.overflow}px`);
      }
      if (layoutCheck.brokenImages.length > 0) {
        await recordFinding("broken-images", layoutCheck.brokenImages.join(", "));
      }
      if (currentStep % 15 === 0) {
        await page.screenshot({ path: resolve(args.outDir, `checkpoint-step-${currentStep}.png`), fullPage: false });
      }
    } catch (error) {
      actions.push({ step: currentStep, action: "step-exception", message: String(error) });
    }
  }

  const report = {
    seed: args.seed,
    baseUrl: args.baseUrl,
    stepsExecuted: args.steps,
    findingsCount: findings.length,
    findings,
    recentActions: actions.slice(-25),
  };
  const reportPath = resolve(args.outDir, "monkey-report.json");
  writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
  await browser.close();

  console.log(JSON.stringify({ seed: args.seed, findingsCount: findings.length, reportPath }, null, 2));
  if (findings.length > 0) {
    process.exitCode = 1;
  }
}

runMonkey().catch((err) => {
  console.error(err);
  process.exit(1);
});
