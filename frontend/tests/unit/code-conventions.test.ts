import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import ts from "typescript";
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

  it("khai báo quyền trong permissions/ dùng createResourcePermissions + PERMISSION_ACTION, không hardcode chuỗi quyền", () => {
    const permissionFiles = tsFiles.filter((file) =>
      /^modules\/[^/]+\/permissions\/[^/]+-permission\.ts$/.test(toRel(file)),
    );
    expect(permissionFiles.length).toBeGreaterThan(0);

    const invalidPermissionFiles = permissionFiles.filter((file) => {
      const content = readFileSync(file, "utf8");
      const usesHelper =
        content.includes("createResourcePermissions(") && content.includes("PERMISSION_ACTION.");
      const hasRawLiteral = /["'][a-z_]+\.[a-z_]+\.[a-z_]+["']/.test(content);
      return !usesHelper || hasRawLiteral;
    });
    expect(invalidPermissionFiles.map(toRel)).toEqual([]);

    const rawPermissionUsages = tsFiles.filter((file) => {
      const content = readFileSync(file, "utf8").replace(
        /\b(?:useTranslations|createPageMetadata)\(\s*(?:\{[^}]*title:\s*)?["'][^"']+["']\s*(?:\})?\s*\)/g,
        "",
      );
      return /["'](?:system|utilities|novel|finance|workspace)\.[a-z_]+\.(?:read|create|update|delete|manage_all|read_private|manage|assign|revoke|export|import|chat|reveal)["']/.test(
        content,
      );
    });
    expect(rawPermissionUsages.map(toRel)).toEqual([]);
  });

  it("không hardcode queryKey chuỗi thô ở hook/component hoặc mã lỗi xác thực ngoài constants", () => {
    const rawQueryKeyFiles = tsFiles.filter((file) => {
      const rel = toRel(file);
      if (rel.includes("/constants/")) return false;
      const content = readFileSync(file, "utf8");
      return /queryKey\s*:\s*\[\s*["'][^"']+["']/.test(content);
    });
    expect(rawQueryKeyFiles.map(toRel)).toEqual([]);

    const rawAuthErrorCodeFiles = tsFiles.filter((file) => {
      const rel = toRel(file);
      if (rel.includes("/constants/")) return false;
      const content = readFileSync(file, "utf8");
      return /["'](AUTH_REFRESH_CONFLICT|AUTH_CSRF_FAILED|ACCOUNT_SOCIAL_NOT_LINKED)["']/.test(
        content,
      );
    });
    expect(rawAuthErrorCodeFiles.map(toRel)).toEqual([]);
  });

  it("không gắn thuộc tính HTML title= lên thẻ DOM hay UI primitive (dùng AppTooltip / shadcn Tooltip)", () => {
    const primitiveTooltipForwarders = new Set([
      "Badge",
      "Button",
      "Card",
      "Checkbox",
      "DropdownMenuTrigger",
      "Image",
      "Input",
      "Link",
      "PopoverTrigger",
      "Switch",
      "TableCell",
      "TableHead",
      "TableRow",
      "TabsTrigger",
      "Textarea",
      "TiptapToggle",
      "Toggle",
      "TooltipTrigger",
    ]);

    const violations: string[] = [];
    const tsxFiles = tsFiles.filter((file) => file.endsWith(".tsx"));

    for (const file of tsxFiles) {
      const content = readFileSync(file, "utf8");
      if (!content.includes("title")) continue;

      const sf = ts.createSourceFile(
        file,
        content,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX,
      );
      const visit = (node: ts.Node) => {
        if (ts.isJsxAttribute(node) && node.name.getText(sf) === "title") {
          const opening = node.parent?.parent;
          if (opening && (ts.isJsxOpeningElement(opening) || ts.isJsxSelfClosingElement(opening))) {
            const tagName = opening.tagName.getText(sf);
            const isDomTag = /^[a-z]/.test(tagName) && tagName !== "iframe";
            if (isDomTag || primitiveTooltipForwarders.has(tagName)) {
              const line = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
              violations.push(`${toRel(file)}:${line} <${tagName} title=...>`);
            }
          }
        }
        ts.forEachChild(node, visit);
      };
      visit(sf);
    }

    expect(violations).toEqual([]);
  });

  it("không gọi format.relativeTime trực tiếp hoặc dateStyle/timeStyle ngoài helper thời gian chuẩn", () => {
    const allowedRelativeTime = new Set([
      "shares/components/common/timestamp-text.tsx",
      "shares/lib/date-time-format.ts",
    ]);
    const relativeOffenders = tsFiles.filter((file) => {
      const rel = toRel(file);
      if (allowedRelativeTime.has(rel)) return false;
      const content = readFileSync(file, "utf8");
      if (content.includes("formatDateTimeWithRelative")) return false;
      return /\bformat\.relativeTime\s*\(/.test(content);
    });
    expect(relativeOffenders.map(toRel)).toEqual([]);

    const shorthandStyleOffenders = tsFiles.filter((file) => {
      const content = readFileSync(file, "utf8");
      return /\b(dateStyle|timeStyle)\s*:/.test(content);
    });
    expect(shorthandStyleOffenders.map(toRel)).toEqual([]);
  });

  it("không fallback trực tiếp ownerName || ownerEmail hoặc fullName || email trong component/hook", () => {
    const offenders = tsFiles.filter((file) => {
      const rel = toRel(file);
      if (rel === "shares/lib/user-display.ts") return false;
      const content = readFileSync(file, "utf8");
      return /\b(ownerName|fullName)\s*\|\|[\s\S]{0,40}\b(ownerEmail|email)\b/.test(content);
    });
    expect(offenders.map(toRel)).toEqual([]);
  });

  it("tooltip của cột chủ sở hữu/người dùng không được ưu tiên email thô trước nhãn fullname (username)", () => {
    const offenders = tsFiles.filter((file) => {
      const content = readFileSync(file, "utf8");
      return /<AppTooltip\s+content=\{[^}]*(ownerEmail|userEmail|owner\.email)\s*\|\|/.test(
        content,
      );
    });
    expect(offenders.map(toRel)).toEqual([]);
  });
});
