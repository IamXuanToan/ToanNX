import { describe, expect, it } from "vitest";

import {
  parseFilterValues,
  pickAllowedValues,
  readTableUrlState,
  writeTableUrlState,
} from "@/shares/hooks/use-table-state";

const DEFAULTS = { pageSize: 20, ordering: "-created_at" };

describe("readTableUrlState", () => {
  it("URL trống thì lấy mặc định", () => {
    expect(readTableUrlState(new URLSearchParams(""), DEFAULTS)).toEqual({
      search: "",
      page: 1,
      pageSize: 20,
      ordering: "-created_at",
    });
  });

  it("đọc đủ tham số", () => {
    const params = new URLSearchParams("search=an&page=3&pageSize=50&ordering=email");
    expect(readTableUrlState(params, DEFAULTS)).toEqual({
      search: "an",
      page: 3,
      pageSize: 50,
      ordering: "email",
    });
  });

  it("bỏ giá trị không hợp lệ", () => {
    const params = new URLSearchParams("page=-2&pageSize=5000");
    const state = readTableUrlState(params, DEFAULTS);
    expect(state.page).toBe(1);
    expect(state.pageSize).toBe(20);
  });

  it("cắt gọn từ khóa tìm kiếm vượt giới hạn trên URL để tránh lỗi 400", () => {
    const tooManyTerms = new URLSearchParams("search=mot+hai+ba+bon+nam+sau");
    expect(readTableUrlState(tooManyTerms, DEFAULTS).search).toBe("mot hai ba bon nam");

    const tooLong = new URLSearchParams(`search=${"x".repeat(150)}`);
    expect(readTableUrlState(tooLong, DEFAULTS).search).toBe("x".repeat(100));
  });
});

describe("writeTableUrlState", () => {
  it("đổi tìm kiếm/phân trang không làm mất bộ lọc ghép từ module khác", () => {
    const base = new URLSearchParams("role=role-id&isActive=false&page=4&search=old");
    const result = new URLSearchParams(
      writeTableUrlState(
        { search: "new", page: 1, pageSize: 20, ordering: "-created_at" },
        DEFAULTS,
        base,
      ),
    );
    expect(result.get("role")).toBe("role-id");
    expect(result.get("isActive")).toBe("false");
    expect(result.get("search")).toBe("new");
    expect(result.has("page")).toBe(false);
    expect(base.get("page")).toBe("4");
  });
  it("bỏ giá trị mặc định để URL gọn", () => {
    expect(
      writeTableUrlState({ search: " ", page: 1, pageSize: 20, ordering: "-created_at" }, DEFAULTS),
    ).toBe("");
  });

  it("ghi giá trị khác mặc định", () => {
    expect(
      writeTableUrlState({ search: " an ", page: 2, pageSize: 50, ordering: "email" }, DEFAULTS),
    ).toBe("search=an&page=2&pageSize=50&ordering=email");
  });
});

describe("parseFilterValues", () => {
  it("rỗng thì mảng rỗng", () => {
    expect(parseFilterValues(undefined)).toEqual([]);
    expect(parseFilterValues("")).toEqual([]);
  });

  it("tách dấu phẩy, bỏ khoảng trắng, trống và trùng", () => {
    expect(parseFilterValues("ACTIVE, EXPIRED,,ACTIVE")).toEqual(["ACTIVE", "EXPIRED"]);
  });
});

describe("pickAllowedValues", () => {
  const allowed = ["true", "false"] as const;

  it("bỏ giá trị lạ trên URL", () => {
    expect(pickAllowedValues(["true", "maybe"], allowed)).toEqual(["true"]);
  });

  it("không còn gì thì undefined (không lọc)", () => {
    expect(pickAllowedValues(["maybe"], allowed)).toBeUndefined();
    expect(pickAllowedValues([], allowed)).toBeUndefined();
  });
});
