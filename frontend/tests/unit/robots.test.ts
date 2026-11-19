import { describe, expect, it } from "vitest";

import robots, { AI_BOT_USER_AGENTS } from "@/app/robots";

describe("robots.txt configuration", () => {
  it("trả về cấu hình robots với sitemap đầy đủ", () => {
    const config = robots();
    expect(config.sitemap).toBeDefined();
    expect(config.sitemap).toContain("/sitemap.xml");
  });

  it("cho phép crawler thông thường nhưng chặn admin, auth và api", () => {
    const config = robots();
    const rules = Array.isArray(config.rules) ? config.rules : [config.rules];
    const generalRule = rules.find((r) => r.userAgent === "*");

    expect(generalRule).toBeDefined();
    expect(generalRule?.allow).toBe("/");
    expect(generalRule?.disallow).toContain("/api/");
    expect(generalRule?.disallow).toContain("/vi/quan-tri");
    expect(generalRule?.disallow).toContain("/en/admin");
    expect(generalRule?.disallow).toContain("/vi/dang-nhap");
    expect(generalRule?.disallow).toContain("/en/login");
  });

  it("cấu hình cho AI bots chỉ đọc trang chủ và chặn toàn bộ các trang khác", () => {
    const config = robots();
    const rules = Array.isArray(config.rules) ? config.rules : [config.rules];
    const aiRule = rules.find((r) => Array.isArray(r.userAgent) && r.userAgent.includes("GPTBot"));

    expect(aiRule).toBeDefined();
    expect(aiRule?.userAgent).toEqual(
      expect.arrayContaining(["GPTBot", "ClaudeBot", "Google-Extended"]),
    );

    // Chỉ cho phép trang chủ
    expect(aiRule?.allow).toEqual(["/$", "/vi$", "/vi/$", "/en$", "/en/$"]);

    // Chặn toàn bộ các trang khác
    expect(aiRule?.disallow).toEqual(["/"]);
  });

  it("danh sách AI bots bao quát các crawler AI phổ biến", () => {
    expect(AI_BOT_USER_AGENTS).toContain("GPTBot");
    expect(AI_BOT_USER_AGENTS).toContain("ChatGPT-User");
    expect(AI_BOT_USER_AGENTS).toContain("Google-Extended");
    expect(AI_BOT_USER_AGENTS).toContain("ClaudeBot");
    expect(AI_BOT_USER_AGENTS).toContain("Claude-Web");
    expect(AI_BOT_USER_AGENTS).toContain("AnthropicAI");
    expect(AI_BOT_USER_AGENTS).toContain("Applebot-Extended");
    expect(AI_BOT_USER_AGENTS).toContain("Bytespider");
    expect(AI_BOT_USER_AGENTS).toContain("CCBot");
    expect(AI_BOT_USER_AGENTS).toContain("PerplexityBot");
    expect(AI_BOT_USER_AGENTS).toContain("FacebookBot");
    expect(AI_BOT_USER_AGENTS).toContain("Meta-ExternalAgent");
  });
});
