/**
 * Cấu hình chỉ mục tìm kiếm và thu thập dữ liệu (robots.txt).
 *
 * Cho phép các công cụ tìm kiếm phổ thông thu thập dữ liệu công khai (chặn admin/auth/api).
 * Đối với các bot/crawler AI (OpenAI, Anthropic, Google, Meta, ByteDance...):
 * Chỉ cho phép thu thập duy nhất trang chủ (`/`, `/vi`, `/en`), chặn toàn bộ các trang còn lại.
 */

import type { MetadataRoute } from "next";

import { env } from "@/shares/config/env";

/** Danh sách các crawler / bot thu thập dữ liệu trí tuệ nhân tạo (AI/LLM). */
export const AI_BOT_USER_AGENTS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "Google-Extended",
  "ClaudeBot",
  "Claude-Web",
  "AnthropicAI",
  "Applebot-Extended",
  "Bytespider",
  "CCBot",
  "cohere-ai",
  "PerplexityBot",
  "FacebookBot",
  "Meta-ExternalAgent",
  "Meta-ExternalFetcher",
  "Diffbot",
  "Amazonbot",
] as const;

/**
 * Tạo nội dung file `robots.txt` cho toàn bộ hệ thống.
 *
 * @returns Cấu hình MetadataRoute.Robots cho Next.js.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/vi/quan-tri",
          "/en/admin",
          "/vi/dang-nhap",
          "/en/login",
          "/vi/quen-mat-khau",
          "/en/forgot-password",
          "/vi/dat-lai-mat-khau",
          "/en/reset-password",
        ],
      },
      {
        userAgent: [...AI_BOT_USER_AGENTS],
        allow: ["/$", "/vi$", "/vi/$", "/en$", "/en/$"],
        disallow: ["/"],
      },
    ],
    sitemap: `${env.siteUrl}/sitemap.xml`,
  };
}
