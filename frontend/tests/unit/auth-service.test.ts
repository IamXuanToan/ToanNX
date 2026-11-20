import { describe, expect, it } from "vitest";

import { createForgotPasswordSchema } from "@/modules/system/schemas/forgot-password.schema";
import { createResetPasswordSchema } from "@/modules/system/schemas/reset-password.schema";
import { sanitizeNextPath } from "@/modules/system/services/auth.service";
import { canAccessAdmin, hasPermission } from "@/modules/system/services/current-user.service";
import type { CurrentUser } from "@/modules/system/types/auth.types";

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
    expect(hasPermission(current({ isSuperuser: true }), "system.user.read")).toBe(true);
    expect(hasPermission(current({}, ["system.user.read"]), "system.user.read")).toBe(true);
    expect(hasPermission(current({}, ["system.user.read"]), "system.user.create")).toBe(false);
    expect(hasPermission(current({ isActive: false, isSuperuser: true }), "x.y.z")).toBe(false);
    expect(hasPermission(undefined, "system.user.read")).toBe(false);
  });

  it("chỉ staff/superuser đang hoạt động được vào quản trị", () => {
    expect(canAccessAdmin(current({ isStaff: true }))).toBe(true);
    expect(canAccessAdmin(current({}))).toBe(false);
    expect(canAccessAdmin(current({ isStaff: true, isActive: false }))).toBe(false);
  });
});

describe("createForgotPasswordSchema", () => {
  const schema = createForgotPasswordSchema((key) => key);

  it("chấp nhận email hợp lệ và từ chối email sai định dạng", () => {
    expect(schema.safeParse({ email: "user@example.com" }).success).toBe(true);
    expect(schema.safeParse({ email: "  user@example.com  " }).success).toBe(true);
    expect(schema.safeParse({ email: "" }).success).toBe(false);
    expect(schema.safeParse({ email: "not-an-email" }).success).toBe(false);
  });
});

describe("createResetPasswordSchema", () => {
  const schema = createResetPasswordSchema((key) => key);

  it("chấp nhận mật khẩu khớp và tối thiểu 8 ký tự", () => {
    expect(
      schema.safeParse({ password: "StrongPassword123", confirmPassword: "StrongPassword123" })
        .success,
    ).toBe(true);
    expect(schema.safeParse({ password: "123", confirmPassword: "123" }).success).toBe(false);
    expect(
      schema.safeParse({ password: "StrongPassword123", confirmPassword: "DifferentPassword" })
        .success,
    ).toBe(false);
  });
});
