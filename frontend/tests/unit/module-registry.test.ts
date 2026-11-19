import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const SRC = join(__dirname, "..", "..", "src");
const MODULES = readdirSync(join(SRC, "modules"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

const read = (path: string) => readFileSync(join(SRC, path), "utf8");
const has = (module: string, path: string) => existsSync(join(SRC, "modules", module, path));
const camel = (name: string) => name.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase());

/**
 * Thêm module FE phải ghép ở vài chỗ cố định (để giữ kiểu URL và kiểu message). Test này đảm bảo
 * không quên chỗ nào: thiếu là đỏ ngay, không đợi chạy app mới thấy thiếu dịch/menu/route.
 */
describe("đăng ký module FE", () => {
  it.each(MODULES.filter((module) => has(module, "constants/routes.ts")))(
    "%s: pathname được gộp vào i18n/routing.ts",
    (module) => {
      expect(read("i18n/routing.ts")).toContain(`@/modules/${module}/constants/routes`);
    },
  );

  it.each(MODULES.filter((module) => has(module, "messages/vi.json")))(
    "%s: message được nạp (messages.ts) và có kiểu (global.d.ts), đủ vi/en",
    (module) => {
      expect(read("i18n/messages.ts")).toContain(`../modules/${module}/messages/`);
      expect(read("global.d.ts")).toContain(`./modules/${module}/messages/vi.json`);
      expect(read("global.d.ts")).toContain(`${camel(module)}: typeof`);
      expect(has(module, "messages/en.json")).toBe(true);
    },
  );

  it.each(MODULES.filter((module) => has(module, "navigation.ts")))(
    "%s: navigation được đăng ký trong khung quản trị",
    (module) => {
      const navigation = read("modules/manage-app/constants/admin-navigation.ts");
      expect(navigation).toContain(`@/modules/${module}/navigation`);
    },
  );

  it("shares không import module", () => {
    const walk = (dir: string): string[] =>
      readdirSync(join(SRC, dir), { withFileTypes: true }).flatMap((entry) =>
        entry.isDirectory()
          ? walk(join(dir, entry.name))
          : /\.(ts|tsx)$/.test(entry.name)
            ? [join(dir, entry.name)]
            : [],
      );
    const offenders = walk("shares").filter((file) => read(file).includes('from "@/modules/'));
    expect(offenders).toEqual([]);
  });

  it("auth là module nền: không import module khác", () => {
    const walk = (dir: string): string[] =>
      readdirSync(join(SRC, dir), { withFileTypes: true }).flatMap((entry) =>
        entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)],
      );
    const offenders = walk("modules/auth").filter((file) =>
      /from "@\/modules\/(?!auth\/)/.test(read(file)),
    );
    expect(offenders).toEqual([]);
  });

  it("mọi nhóm module trong navigation.ts đều được khai trong ADMIN_GROUPS", () => {
    const adminNav = read("modules/manage-app/constants/admin-navigation.ts");
    const navModules = MODULES.filter((mod) => has(mod, "navigation.ts"));
    for (const mod of navModules) {
      const navContent = read(`modules/${mod}/navigation.ts`);
      const groupMatch = navContent.match(/group:\s*"([^"]+)"/);
      if (groupMatch) {
        expect(adminNav).toContain(`code: "${groupMatch[1]}"`);
      }
    }
  });
});
