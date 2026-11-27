import { describe, expect, it } from "vitest";

import {
  formatOwnerDisplayName,
  formatOwnerDisplayTooltip,
  formatUserDisplayName,
  formatUserDisplayTooltip,
} from "@/shares/lib/user-display";

describe("user-display", () => {
  it("định dạng fullname (username) khi có đủ họ tên và username", () => {
    expect(
      formatUserDisplayName({
        fullName: "Nguyễn Xuân Toàn",
        username: "toannx",
        email: "nxtoan2k4@gmail.com",
      }),
    ).toBe("Nguyễn Xuân Toàn (toannx)");

    expect(
      formatUserDisplayName({
        lastName: "Nguyễn",
        firstName: "Xuân Toàn",
        username: "toannx",
      }),
    ).toBe("Nguyễn Xuân Toàn (toannx)");
  });

  it("chỉ hiển thị username khi không có fullname, và fallback về fullname/email khi thiếu", () => {
    expect(
      formatUserDisplayName({
        fullName: "   ",
        username: "toannx",
        email: "nxtoan2k4@gmail.com",
      }),
    ).toBe("toannx");

    expect(
      formatUserDisplayName({
        fullName: "Nguyễn Xuân Toàn",
        username: "",
        email: "nxtoan2k4@gmail.com",
      }),
    ).toBe("Nguyễn Xuân Toàn");

    expect(
      formatUserDisplayName({
        email: "nxtoan2k4@gmail.com",
      }),
    ).toBe("nxtoan2k4@gmail.com");

    expect(formatUserDisplayName(null)).toBe("");
    expect(formatUserDisplayName(undefined)).toBe("");
  });

  it("chuẩn hóa nhãn chủ sở hữu từ dữ liệu phẳng ownerName / ownerUsername / ownerEmail", () => {
    expect(
      formatOwnerDisplayName({
        ownerName: "Nguyễn Xuân Toàn",
        ownerUsername: "toannx",
        ownerEmail: "nxtoan2k4@gmail.com",
      }),
    ).toBe("Nguyễn Xuân Toàn (toannx)");

    expect(
      formatOwnerDisplayName({
        ownerName: "",
        ownerUsername: "toannx",
        ownerEmail: "nxtoan2k4@gmail.com",
      }),
    ).toBe("toannx");

    expect(
      formatOwnerDisplayName({
        ownerName: "",
        ownerUsername: "",
        ownerEmail: "nxtoan2k4@gmail.com",
      }),
    ).toBe("nxtoan2k4@gmail.com");

    expect(formatOwnerDisplayName(null)).toBe("");
  });

  it("dựng tooltip ưu tiên đầy đủ fullname (username) kèm email phụ không trùng lặp", () => {
    expect(
      formatUserDisplayTooltip({
        fullName: "Nguyễn Xuân Toàn",
        username: "toannx",
        email: "nxtoan2k4@gmail.com",
      }),
    ).toBe("Nguyễn Xuân Toàn (toannx) · nxtoan2k4@gmail.com");

    expect(
      formatUserDisplayTooltip({
        username: "toannx",
        email: "nxtoan2k4@gmail.com",
      }),
    ).toBe("toannx · nxtoan2k4@gmail.com");

    expect(
      formatUserDisplayTooltip({
        email: "nxtoan2k4@gmail.com",
      }),
    ).toBe("nxtoan2k4@gmail.com");

    expect(
      formatOwnerDisplayTooltip({
        ownerName: "Nguyễn Xuân Toàn",
        ownerUsername: "toannx",
        ownerEmail: "nxtoan2k4@gmail.com",
      }),
    ).toBe("Nguyễn Xuân Toàn (toannx) · nxtoan2k4@gmail.com");

    expect(formatUserDisplayTooltip(null)).toBeUndefined();
    expect(formatOwnerDisplayTooltip(undefined)).toBeUndefined();
  });
});
