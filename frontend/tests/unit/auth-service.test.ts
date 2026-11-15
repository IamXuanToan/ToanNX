import { describe, expect, it } from "vitest";

import { sanitizeNextPath } from "@/modules/auth/services/auth.service";
import { canAccessAdmin, hasPermission } from "@/modules/auth/services/current-user.service";
import type { CurrentUser } from "@/modules/auth/types/auth.types";

function current(overrides: Partial<CurrentUser["user"]>, permissions: string[] = []): CurrentUser {
  return {
    user: {
      id: "1",
      email: "a@b.c",
      username: null,
      firstName: "",
      lastName: "",
      fullName: "",
      avatar: null,
      isActive: true,
      isStaff: false,
      isSuperuser: false,
      isNovel: false,
      lastLogin: null,
      lastSeenAt: null,
      dateJoined: "",
      ...overrides,
    },
    roles: [],
    permissions,
  };
}

describe("sanitizeNextPath", () => {
  it("chỉ chấp nhận đường dẫn nội bộ", () => {
    expect(sanitizeNextPath("/vi/quan-tri")).toBe("/vi/quan-tri");
    expect(sanitizeNextPath("//evil.com")).toBeNull();
    expect(sanitizeNextPath("https://evil.com")).toBeNull();
    expect(sanitizeNextPath("/\\evil.com")).toBeNull();
    expect(sanitizeNextPath(null)).toBeNull();
  });
});

describe("hasPermission / canAccessAdmin", () => {
  it("superuser có mọi quyền, người dùng thường theo danh sách", () => {
    expect(hasPermission(current({ isSuperuser: true }), "iam.user.read")).toBe(true);
    expect(hasPermission(current({}, ["iam.user.read"]), "iam.user.read")).toBe(true);
    expect(hasPermission(current({}, ["iam.user.read"]), "iam.user.create")).toBe(false);
    expect(hasPermission(current({ isActive: false, isSuperuser: true }), "x.y.z")).toBe(false);
    expect(hasPermission(undefined, "iam.user.read")).toBe(false);
  });

  it("chỉ staff/superuser đang hoạt động được vào quản trị", () => {
    expect(canAccessAdmin(current({ isStaff: true }))).toBe(true);
    expect(canAccessAdmin(current({}))).toBe(false);
    expect(canAccessAdmin(current({ isStaff: true, isActive: false }))).toBe(false);
  });
});
