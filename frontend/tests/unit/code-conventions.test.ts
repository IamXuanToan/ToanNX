import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Rule chung & Rule frontend:
 * - Tập trung hằng số (locale, timezone, tiền tệ, khóa storage, ID toast) vào `constants/` hoặc `shares/lib/`.
 * - Chuẩn hóa điều hướng `<Link />` từ `@/i18n/navigation` (không import `next/link` trong `[locale]`/module).
 * - Không export hằng `UPPER_CASE` trong file component `.tsx` (rule frontend §2.1: một file một đơn vị).
 */
const SRC = join(process.cwd(), "src");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

function toRel(file: string): string {
  return relative(SRC, file).replaceAll("\\", "/");
}

const tsFiles = walk(SRC).filter(
  (file) =>
    (file.endsWith(".ts") || file.endsWith(".tsx")) &&
    !file.endsWith("api-schema.gen.ts") &&
    !toRel(file).startsWith("shares/constants/"),
);

describe("Quy ước tập trung hằng số và Link", () => {
  it("không import next/link trong src ngoài app/not-found.tsx", () => {
    const offenders = tsFiles.filter((file) => {
      const rel = toRel(file);
      if (rel === "app/not-found.tsx") return false;
      const content = readFileSync(file, "utf8");
      return /from\s+["']next\/link["']/.test(content);
    });

    expect(offenders.map(toRel)).toEqual([]);
  });

  it("không hardcode so sánh locale === 'en' hoặc chuỗi locale/timezone ngoài shares/lib và constants", () => {
    const offenders = tsFiles.filter((file) => {
      const rel = toRel(file);
      if (rel.startsWith("shares/lib/") || rel.includes("/constants/")) return false;
      const content = readFileSync(file, "utf8");
      return (
        /locale\s*===\s*["']en["']/.test(content) ||
        /["'](vi-VN|en-US|vi-VN-u-ca-chinese|Asia\/Ho_Chi_Minh)["']/.test(content)
      );
    });

    expect(offenders.map(toRel)).toEqual([]);
  });

  it("không gọi .toLocaleString() trực tiếp ngoài shares/components/ui và shares/lib", () => {
    const offenders = tsFiles.filter((file) => {
      const rel = toRel(file);
      if (rel.startsWith("shares/components/ui/") || rel.startsWith("shares/lib/")) return false;
      const content = readFileSync(file, "utf8");
      return /\.toLocaleString\(/.test(content);
    });

    expect(offenders.map(toRel)).toEqual([]);
  });

  it("không export hằng UPPER_CASE từ file component .tsx", () => {
    const tsxFiles = tsFiles.filter((file) => {
      const rel = toRel(file);
      if (!rel.endsWith(".tsx")) return false;
      if (rel.startsWith("shares/components/ui/") || rel.startsWith("app/")) return false;
      return true;
    });

    const offenders = tsxFiles.filter((file) =>
      readFileSync(file, "utf8")
        .split(/\r?\n/)
        .some((line) => /^export\s+const\s+[A-Z][A-Z0-9_]*\s*[=:]/.test(line)),
    );

    expect(offenders.map(toRel)).toEqual([]);
  });

  it("không lặp lại khóa lưu trữ OAuth, toast phiên hoặc nháp trang tùy chỉnh ngoài constants", () => {
    const offenders = tsFiles.filter((file) => {
      const rel = toRel(file);
      if (rel.includes("/constants/")) return false;
      const content = readFileSync(file, "utf8");
      return /["'](session-expired|logout-success|oauth_state|oauth_mode|oauth_next|custom-page-draft:)["']/.test(
        content,
      );
    });

    expect(offenders.map(toRel)).toEqual([]);
  });
});
