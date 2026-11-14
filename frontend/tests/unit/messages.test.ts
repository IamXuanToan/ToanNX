import { describe, expect, it } from "vitest";

import { loadMessages } from "@/i18n/messages";

type Tree = { [key: string]: string | Tree };

function flatten(tree: Tree, prefix = ""): Map<string, string> {
  const result = new Map<string, string>();
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") result.set(path, value);
    else for (const [nested, text] of flatten(value, path)) result.set(nested, text);
  }
  return result;
}

/** Tên biến nội suy cấp cao nhất, ví dụ `{name}` hoặc `{total, plural, ...}`. */
function placeholders(text: string): string[] {
  const names = new Set<string>();
  let depth = 0;
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === "{") {
      if (depth === 0)
        names.add(
          text
            .slice(index + 1)
            .split(/[,}]/)[0]
            .trim(),
        );
      depth += 1;
    } else if (text[index] === "}") {
      depth -= 1;
    }
  }
  return [...names].sort();
}

describe("i18n messages", async () => {
  const vi = flatten((await loadMessages("vi")) as unknown as Tree);
  const en = flatten((await loadMessages("en")) as unknown as Tree);

  it("vi và en có cùng tập khóa (không thiếu, không thừa)", () => {
    expect([...en.keys()].filter((key) => !vi.has(key))).toEqual([]);
    expect([...vi.keys()].filter((key) => !en.has(key))).toEqual([]);
  });

  it("không có chuỗi rỗng", () => {
    for (const [key, text] of [...vi, ...en]) expect(text.trim(), key).not.toBe("");
  });

  it("biến nội suy khớp giữa hai ngôn ngữ và ngoặc cân bằng", () => {
    for (const [key, text] of vi) {
      expect(placeholders(en.get(key) ?? ""), key).toEqual(placeholders(text));
      for (const value of [text, en.get(key) ?? ""]) {
        expect(value.split("{").length, key).toBe(value.split("}").length);
      }
    }
  });

  it("namespace của module không đè namespace dùng chung", async () => {
    const common = await import("@/messages/vi.json");
    const moduleNamespaces = ["auth", "iam", "system", "dashboard"];
    expect(Object.keys(common.default).filter((key) => moduleNamespaces.includes(key))).toEqual([]);
  });
});
