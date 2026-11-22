import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Quy ước bảng (rule frontend §3.1): kiểm trên mã nguồn để bảng mới không quên.
 * - Có Xoá từng dòng → phải có Xoá hàng loạt (cột chọn dòng tự hiện).
 * - Có công tắc trạng thái (`TableStatusSwitch`) → phải có Đổi trạng thái hàng loạt (`bulkStatus`).
 * - Không ẩn nút thao tác vì thiếu quyền (`onEdit={canUpdate ? fn : undefined}`), quyền khai ở `can`.
 */
const SRC = join(process.cwd(), "src", "modules");

/** Mọi `.tsx` trong `components/` (đệ quy: component nằm trong `components/<nhóm>/`). */
function componentFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return componentFiles(path);
    return entry.name.endsWith(".tsx") ? [path] : [];
  });
}

const TABLE_FILES = readdirSync(SRC, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .flatMap((module) => {
    const dir = join(SRC, module.name, "components");
    if (!existsSync(dir)) return [];
    return componentFiles(dir).map((path) => ({
      name: `${module.name}/${relative(dir, path).replaceAll("\\", "/")}`,
      source: readFileSync(path, "utf8"),
    }));
  })
  .filter((file) => file.source.includes("<DataTable"));

describe("quy ước DataTable", () => {
  it("tìm thấy các bảng", () => {
    expect(TABLE_FILES.length).toBeGreaterThan(10);
  });

  it.each(TABLE_FILES.map((file) => [file.name, file.source]))(
    "%s: có Xoá từng dòng thì có Xoá hàng loạt",
    (_, source) => {
      if (source.includes("onDelete=")) expect(source).toContain("onBulkDelete=");
    },
  );

  it.each(TABLE_FILES.map((file) => [file.name, file.source]))(
    "%s: có công tắc trạng thái thì có cập nhật hàng loạt",
    (_, source) => {
      if (source.includes("<TableStatusSwitch")) expect(source).toContain("bulkStatus=");
    },
  );

  it.each(TABLE_FILES.map((file) => [file.name, file.source]))(
    "%s: không ẩn thao tác chuẩn vì thiếu quyền",
    (_, source) => {
      expect(source).not.toMatch(/on(View|Edit|Copy|Delete)=\{can\w+ \?/);
    },
  );
});
