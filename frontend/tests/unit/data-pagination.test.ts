import { describe, expect, it } from "vitest";

import { getPageRange, parseJumpPage } from "@/shares/components/common/data-pagination";

describe("getPageRange", () => {
  it("không có bản ghi thì 0–0", () => {
    expect(getPageRange({ page: 1, pageSize: 20, total: 0, totalPages: 0 })).toEqual({
      from: 0,
      to: 0,
    });
  });

  it("trang đầu đủ dòng", () => {
    expect(getPageRange({ page: 1, pageSize: 20, total: 132, totalPages: 7 })).toEqual({
      from: 1,
      to: 20,
    });
  });

  it("trang cuối thiếu dòng thì `to` là tổng", () => {
    expect(getPageRange({ page: 7, pageSize: 20, total: 132, totalPages: 7 })).toEqual({
      from: 121,
      to: 132,
    });
  });
});

describe("parseJumpPage", () => {
  it("không phải số thì null", () => {
    expect(parseJumpPage("", 5)).toBeNull();
    expect(parseJumpPage("abc", 5)).toBeNull();
  });

  it("kẹp trong khoảng [1, tổng số trang]", () => {
    expect(parseJumpPage("0", 5)).toBe(1);
    expect(parseJumpPage("3", 5)).toBe(3);
    expect(parseJumpPage("99", 5)).toBe(5);
  });

  it("tổng 0 trang vẫn trả về trang 1", () => {
    expect(parseJumpPage("4", 0)).toBe(1);
  });
});
