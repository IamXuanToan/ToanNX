import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Mọi class màu theo tên ngữ nghĩa (`text-destructive-foreground`, `bg-success-bg`…) phải có token
 * `--color-<tên>` trong `@theme` của `globals.css`. Thiếu token thì Tailwind không sinh CSS, chữ âm thầm ăn
 * màu cha (lỗi số trên badge chuông, icon thông báo mức INFO). Rule frontend §4.0.
 */
const SRC = join(process.cwd(), "src");
const CSS = readFileSync(join(SRC, "app", "globals.css"), "utf8");
const THEME_COLORS = new Set([...CSS.matchAll(/--color-([a-z0-9-]+)\s*:/g)].map((m) => m[1]));
/** Bảng màu mặc định của Tailwind và từ khoá màu đặc biệt: luôn có CSS. */
const DEFAULT_PALETTE = new Set(
  "slate gray zinc neutral stone red orange amber yellow lime green emerald teal cyan sky blue indigo violet purple fuchsia pink rose white black transparent current inherit".split(
    " ",
  ),
);
/** Hậu tố utility không phải màu đi sau cùng tiền tố (`text-sm`, `border-t`, `ring-offset-2`…). */
const NON_COLOR =
  /^(xs|sm|base|lg|xl|\dxl|left|right|center|start|end|justify|wrap|nowrap|balance|pretty|ellipsis|clip|none|solid|dashed|dotted|double|hidden|collapse|separate|t|b|l|r|x|y|s|e|inset|offset|opacity|fixed|local|scroll|repeat|cover|contain|auto|top|bottom|no|origin|gradient|linear|radial|conic|blend)(-|$)/;
const COLOR_CLASS =
  /(?<![\w-])(?:[a-z0-9-]+:)*(?:bg|text|border|ring|fill|stroke|outline|divide|from|to|via|decoration|accent|caret|placeholder)-([a-z]+(?:-[a-z]+)*)(?:\/\d+)?(?![\w-])/g;

function tsxFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === "ui" ? [] : tsxFiles(path);
    return path.endsWith(".tsx") ? [path] : [];
  });
}

describe("token màu", () => {
  it("class màu ngữ nghĩa nào cũng có --color-* trong globals.css", () => {
    const missing = tsxFiles(SRC).flatMap((file) =>
      [...readFileSync(file, "utf8").matchAll(COLOR_CLASS)]
        .map((match) => match[1])
        .filter(
          (name) =>
            !THEME_COLORS.has(name) &&
            !DEFAULT_PALETTE.has(name.split("-")[0]) &&
            !NON_COLOR.test(name),
        )
        .map((name) => `${file.replace(SRC, "src")}: ${name}`),
    );
    expect(missing).toEqual([]);
  });
});
