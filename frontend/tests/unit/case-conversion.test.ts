import { describe, expect, it } from "vitest";

import { keysToCamel, keysToSnake, toCamelKey, toSnakeKey } from "@/shares/lib/api/case-conversion";

describe("case conversion", () => {
  it("chuyển khóa đơn", () => {
    expect(toSnakeKey("isSuperuser")).toBe("is_superuser");
    expect(toSnakeKey("pageSize")).toBe("page_size");
    expect(toCamelKey("last_login")).toBe("lastLogin");
    expect(toCamelKey("request_id")).toBe("requestId");
  });

  it("chuyển đệ quy object và mảng", () => {
    const input = { userId: "1", roleList: [{ roleId: "a", isActive: true }] };
    const snake = keysToSnake(input);
    expect(snake).toEqual({ user_id: "1", role_list: [{ role_id: "a", is_active: true }] });
    expect(keysToCamel(snake)).toEqual(input);
  });

  it("không biến đổi Date, File, Blob, FormData và giá trị nguyên thủy", () => {
    const date = new Date();
    const blob = new Blob(["x"]);
    const form = new FormData();
    const result = keysToSnake<Record<string, unknown>>({
      createdAt: date,
      fileData: blob,
      formData: form,
      count: 3,
    });
    expect(result.created_at).toBe(date);
    expect(result.file_data).toBe(blob);
    expect(result.form_data).toBe(form);
    expect(keysToSnake("plain")).toBe("plain");
    expect(keysToSnake(null)).toBeNull();
  });

  it("giữ nguyên nội dung khóa opaque", () => {
    const result = keysToCamel<Record<string, unknown>>(
      { meta_data: { some_key: 1 }, settings: { keep_me: true } },
      { opaqueKeys: ["settings"] },
    );
    expect(result).toEqual({ metaData: { someKey: 1 }, settings: { keep_me: true } });
  });
});
