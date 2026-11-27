import { describe, expect, it } from "vitest";

import { resolveNotificationLink } from "@/modules/system/lib/notification-link";

describe("resolveNotificationLink", () => {
  it("chuyển các link admin tài chính và phiên cũ về Client Portal", () => {
    expect(resolveNotificationLink("/admin/finance/incomes/123")).toBe(
      "/portal/finance/incomes/123",
    );
    expect(resolveNotificationLink("/admin/finance/sepay")).toBe("/portal/finance/sepay");
    expect(resolveNotificationLink("/admin/sessions")).toBe("/portal/profile?profileTab=security");
  });

  it("giữ nguyên link Client Portal và link hợp lệ khác", () => {
    expect(resolveNotificationLink("/portal/finance/incomes/abc")).toBe(
      "/portal/finance/incomes/abc",
    );
    expect(resolveNotificationLink("/portal/reminders")).toBe("/portal/reminders");
    expect(resolveNotificationLink("")).toBe("");
  });
});
