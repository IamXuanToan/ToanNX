import { describe, expect, it } from "vitest";

import { isColumnWidths } from "@/shares/components/common/hooks/use-column-resizing";

describe("cấu hình độ rộng cột từ storage", () => {
  it("chỉ nhận bản đồ các độ rộng hữu hạn và dương", () => {
    expect(isColumnWidths({ user: 320, status: 128 })).toBe(true);
    expect(isColumnWidths({})).toBe(true);
    for (const value of [
      null,
      [],
      "320",
      { user: "320" },
      { user: 0 },
      { user: -10 },
      { user: NaN },
      { user: Infinity },
    ]) {
      expect(isColumnWidths(value)).toBe(false);
    }
  });
});
