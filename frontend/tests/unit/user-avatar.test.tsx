// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  getUserDisplayName,
  getUserInitials,
  UserAvatar,
} from "@/shares/components/common/user-avatar";

describe("user-avatar helpers", () => {
  it("lấy displayName theo chuẩn fullname (username) > fullname > username > email", () => {
    expect(
      getUserDisplayName({
        fullName: "Nguyễn Xuân Toàn",
        username: "toannx",
        email: "toan@example.com",
      }),
    ).toBe("Nguyễn Xuân Toàn (toannx)");

    expect(
      getUserDisplayName({
        firstName: "Toàn",
        lastName: "Nguyễn",
        username: "toannx",
        email: "toan@example.com",
      }),
    ).toBe("Nguyễn Toàn (toannx)");

    expect(
      getUserDisplayName({
        fullName: "Nguyễn Xuân Toàn",
        email: "toan@example.com",
      }),
    ).toBe("Nguyễn Xuân Toàn");

    expect(
      getUserDisplayName({
        username: "toannx",
        email: "nxtoan2k4@gmail.com",
      }),
    ).toBe("toannx");

    expect(
      getUserDisplayName({
        email: "nxtoan2k4@gmail.com",
      }),
    ).toBe("nxtoan2k4@gmail.com");

    expect(getUserDisplayName(null)).toBe("");
    expect(getUserDisplayName(undefined)).toBe("");
  });

  it("lấy chữ cái đại diện (initials) chuẩn hóa, đồng bộ giữa trang chủ và dropdown", () => {
    // Trường hợp tên đầy đủ nhiều từ: chữ cái đầu của từ đầu + từ cuối
    expect(getUserInitials({ fullName: "Nguyễn Xuân Toàn" })).toBe("NT");
    expect(getUserInitials({ fullName: "John Doe" })).toBe("JD");

    // Trường hợp chỉ có họ và tên
    expect(getUserInitials({ lastName: "Nguyễn", firstName: "Toàn" })).toBe("NT");

    // Trường hợp chỉ có 1 từ
    expect(getUserInitials({ fullName: "Admin" })).toBe("A");

    // Trường hợp user chỉ có username "toannx" -> chữ T (thay vì chữ N từ email)
    expect(
      getUserInitials({
        username: "toannx",
        email: "nxtoan2k4@gmail.com",
      }),
    ).toBe("T");

    // Trường hợp user chỉ có email
    expect(getUserInitials({ email: "nxtoan2k4@gmail.com" })).toBe("N");

    // Trường hợp không có dữ liệu
    expect(getUserInitials(null)).toBe("?");
    expect(getUserInitials({})).toBe("?");
  });
});

describe("UserAvatar component", () => {
  it("hiển thị fallback chữ cái chuẩn khi không có ảnh đại diện", () => {
    render(
      <UserAvatar
        user={{
          username: "toannx",
          email: "nxtoan2k4@gmail.com",
        }}
      />,
    );

    // Fallback chữ T từ username
    expect(screen.getByText("T")).toBeTruthy();
  });

  it("ưu tiên hiển thị fallback từ fullName nhiều từ", () => {
    render(
      <UserAvatar
        user={{
          fullName: "Nguyễn Xuân Toàn",
          email: "nxtoan2k4@gmail.com",
        }}
      />,
    );

    expect(screen.getByText("NT")).toBeTruthy();
  });
});
