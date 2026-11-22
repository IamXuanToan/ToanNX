import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Rule frontend §2: component và view của module chia theo model (`components/<nhóm>/`, `views/<nhóm>/`).
 * - Không có file ở gốc `components/` và `views/`; chỉ một cấp nhóm.
 * - Hook của component nằm trong `components/<nhóm>/hooks/`; không có `components/hooks/` cấp gốc, không có
 *   hook trong `views/`.
 * - Không có nhóm `shared`/`common` trong module (dùng chung toàn app thì ở `shares/`).
 * - View chỉ ghép component và kiểm quyền: chỉ được gọi `usePermission`, `useTranslations`, `useEditMode`.
 */
const MODULES = join(process.cwd(), "src", "modules");
const FORBIDDEN_GROUPS = new Set(["shared", "common", "hooks"]);
const VIEW_HOOKS = new Set(["usePermission", "useTranslations", "useEditMode"]);

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const modules = readdirSync(MODULES).filter((name) => statSync(join(MODULES, name)).isDirectory());

/** Đường tương đối kiểu `system/components/user/user-table.tsx`. */
function files(kind: "components" | "views") {
  return modules.flatMap((module) => {
    const dir = join(MODULES, module, kind);
    try {
      statSync(dir);
    } catch {
      return [];
    }
    return walk(dir).map((path) => ({
      module,
      path,
      parts: relative(dir, path).replaceAll("\\", "/").split("/"),
    }));
  });
}

describe("cấu trúc module: chia theo model", () => {
  it("component nằm trong components/<nhóm>/ hoặc components/<nhóm>/hooks/", () => {
    const offenders = files("components")
      .filter(
        ({ parts }) =>
          !(
            (parts.length === 2 && !FORBIDDEN_GROUPS.has(parts[0])) ||
            (parts.length === 3 && parts[1] === "hooks" && !FORBIDDEN_GROUPS.has(parts[0]))
          ),
      )
      .map(({ module, parts }) => `${module}/components/${parts.join("/")}`);
    expect(offenders).toEqual([]);
  });

  it("hook của component chỉ nằm trong components/<nhóm>/hooks/", () => {
    const offenders = files("components")
      .filter(({ parts }) => /^use-.+\.ts$/.test(parts.at(-1) ?? "") && parts[1] !== "hooks")
      .map(({ module, parts }) => `${module}/components/${parts.join("/")}`);
    expect(offenders).toEqual([]);
  });

  it("view nằm trong views/<nhóm>/, không có views/hooks", () => {
    const offenders = files("views")
      .filter(({ parts }) => parts.length !== 2 || FORBIDDEN_GROUPS.has(parts[0]))
      .map(({ module, parts }) => `${module}/views/${parts.join("/")}`);
    expect(offenders).toEqual([]);
  });

  it("view chỉ gọi usePermission, useTranslations, useEditMode", () => {
    const offenders = files("views").flatMap(({ module, parts, path }) => {
      const source = readFileSync(path, "utf8");
      const hooks = [...source.matchAll(/\b(use[A-Z]\w*)\(/g)].map((match) => match[1]);
      return hooks
        .filter((hook) => !VIEW_HOOKS.has(hook))
        .map((hook) => `${module}/views/${parts.join("/")}: ${hook}`);
    });
    expect(offenders).toEqual([]);
  });
});
