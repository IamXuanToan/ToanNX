import { describe, expect, it } from "vitest";

import { reorderArray } from "@/shares/components/common/sortable-list";

describe("reorderArray", () => {
  it("trả về mảng giữ nguyên nếu startIndex bằng endIndex", () => {
    const list = ["a", "b", "c"];
    expect(reorderArray(list, 1, 1)).toEqual(["a", "b", "c"]);
  });

  it("di chuyển phần tử từ đầu xuống cuối mảng", () => {
    const list = ["a", "b", "c", "d"];
    expect(reorderArray(list, 0, 3)).toEqual(["b", "c", "d", "a"]);
  });

  it("di chuyển phần tử từ cuối lên đầu mảng", () => {
    const list = ["a", "b", "c", "d"];
    expect(reorderArray(list, 3, 0)).toEqual(["d", "a", "b", "c"]);
  });

  it("di chuyển phần tử sang vị trí liền kề", () => {
    const list = ["a", "b", "c", "d"];
    expect(reorderArray(list, 1, 2)).toEqual(["a", "c", "b", "d"]);
  });

  it("giữ nguyên nếu index vượt phạm vi", () => {
    const list = ["a", "b", "c"];
    expect(reorderArray(list, 5, 1)).toEqual(["a", "b", "c"]);
  });
});
