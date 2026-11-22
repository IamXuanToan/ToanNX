import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Rule frontend §2.1: một component / một hook một file; hook không khai trong `.tsx`; context tách
 * `-context.ts` / `-provider.tsx` / `use-*.ts`. Ngoại lệ: shadcn `components/ui/*`, `page.tsx`, `layout.tsx`.
 */
const SRC = join(process.cwd(), "src");

function tsxFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === "ui" ? [] : tsxFiles(path);
    if (!path.endsWith(".tsx") || /[\\/](page|layout)\.tsx$/.test(path)) return [];
    return [path];
  });
}

const FILES = tsxFiles(SRC).map((path) => ({
  name: path.replace(SRC, "src"),
  source: readFileSync(path, "utf8"),
}));

describe("một đơn vị một file", () => {
  it.each(FILES.map((file) => [file.name, file.source]))("%s", (_, source) => {
    const components = [
      ...source.matchAll(/^(?:export\s+)?(?:default\s+)?function\s+([A-Z]\w*)/gm),
    ];
    const hooks = [...source.matchAll(/^(?:export\s+)?function\s+(use[A-Z]\w*)/gm)];
    expect(components.length, "nhiều component trong một file").toBeLessThanOrEqual(1);
    expect(
      hooks.map((match) => match[1]),
      "hook phải ở file use-*.ts",
    ).toEqual([]);
    expect(source.includes("createContext("), "context phải ở file -context.ts").toBe(false);
  });
});
