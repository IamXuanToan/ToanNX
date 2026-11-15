import { beforeEach, describe, expect, it, vi } from "vitest";

import { permissionService } from "@/modules/iam/services/permission.service";
import { roleService } from "@/modules/iam/services/role.service";
import type { Permission, Role } from "@/modules/iam/types/iam.types";
import { apiClient } from "@/shares/lib/api/api-client";
import type { ApiResult } from "@/shares/types/api.types";

vi.mock("@/shares/lib/api/api-client", () => ({ apiClient: { get: vi.fn() } }));

function pageResult<T>(item: T, page: number): ApiResult<T[]> {
  return {
    data: [item],
    meta: {
      requestId: null,
      timestamp: "",
      pagination: { page, pageSize: 100, total: 101, totalPages: 2 },
    },
  };
}

beforeEach(() => vi.clearAllMocks());

describe("danh mục IAM vượt một trang", () => {
  it("không bỏ quyền ở các trang sau, truyền signal cho từng request", async () => {
    const permission: Permission = {
      id: "1",
      code: "account.user.read",
      module: "account",
      resource: "user",
      action: "read",
      name: "Đọc",
      description: "Xem người dùng",
    };
    vi.mocked(apiClient.get)
      .mockResolvedValueOnce(pageResult(permission, 1))
      .mockResolvedValueOnce(
        pageResult({ ...permission, id: "101", code: "authentication.session.read" }, 2),
      );
    const signal = new AbortController().signal;
    const result = await permissionService.list(signal);
    expect(result.map((item) => item.id)).toEqual(["1", "101"]);
    expect(apiClient.get).toHaveBeenLastCalledWith("/iam/permissions", {
      query: { page: 2, pageSize: 100, ordering: "-created_at" },
      signal,
    });
  });

  it("không bỏ vai trò ở trang sau của ô chọn", async () => {
    const role: Role = {
      id: "1",
      code: "ADMIN",
      name: "Admin",
      description: "",
      isSystem: true,
      autoGrant: "all",
      isActive: true,
      permissionCount: 0,
      userCount: 0,
      createdAt: "",
      updatedAt: "",
    };
    vi.mocked(apiClient.get)
      .mockResolvedValueOnce(pageResult(role, 1))
      .mockResolvedValueOnce(
        pageResult({ ...role, id: "101", code: "CUSTOM", isActive: false }, 2),
      );
    expect((await roleService.listAll()).map((item) => item.id)).toEqual(["1", "101"]);
  });

  it("lỗi trang sau phải báo lỗi, không trả danh mục thiếu", async () => {
    vi.mocked(apiClient.get)
      .mockResolvedValueOnce(pageResult({ id: "1" }, 1))
      .mockRejectedValueOnce(new Error("network"));
    await expect(permissionService.list()).rejects.toThrow("network");
  });
});
