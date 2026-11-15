import { beforeEach, describe, expect, it, vi } from "vitest";

import { permissionService } from "@/modules/iam/services/permission.service";
import { roleService } from "@/modules/iam/services/role.service";
import type { Permission, Role } from "@/modules/iam/types/iam.types";
import { apiClient } from "@/shares/lib/api/api-client";
import type { ApiResult } from "@/shares/types/api.types";

vi.mock("@/shares/lib/api/api-client", () => ({ apiClient: { get: vi.fn(), post: vi.fn() } }));

function allResult<T>(items: T[]): ApiResult<T[]> {
  return { data: items, meta: { requestId: null, timestamp: "" } };
}

const permission: Permission = {
  id: "1",
  code: "account.user.read",
  module: "account",
  resource: "user",
  action: "read",
  name: "Đọc",
  description: "Xem người dùng",
};

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

beforeEach(() => vi.clearAllMocks());

describe("danh mục IAM tải đủ trong một request", () => {
  it("không truyền page/pageSize nên BE trả toàn bộ quyền; truyền signal", async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce(
      allResult([permission, { ...permission, id: "101", code: "authentication.session.read" }]),
    );
    const signal = new AbortController().signal;
    const result = await permissionService.list(signal);
    expect(result.map((item) => item.id)).toEqual(["1", "101"]);
    expect(apiClient.get).toHaveBeenCalledTimes(1);
    expect(apiClient.get).toHaveBeenCalledWith("/iam/permissions", {
      query: { ordering: "-created_at" },
      signal,
    });
  });

  it("ô chọn vai trò lấy cả vai trò đang tắt, không phân trang", async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce(
      allResult([role, { ...role, id: "101", code: "CUSTOM", isActive: false }]),
    );
    expect((await roleService.listAll()).map((item) => item.id)).toEqual(["1", "101"]);
    const [, options] = vi.mocked(apiClient.get).mock.calls[0];
    expect(options?.query).not.toHaveProperty("page");
  });

  it("bulk dùng path chuẩn của router BE", async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: { count: 2 },
      meta: { requestId: null, timestamp: "" },
    });
    expect(await roleService.bulkSetActive(["1", "2"], false)).toBe(2);
    expect(apiClient.post).toHaveBeenCalledWith("/iam/roles/bulk-update", {
      ids: ["1", "2"],
      isActive: false,
    });
  });

  it("lỗi mạng được ném ra, không trả danh mục rỗng", async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error("network"));
    await expect(permissionService.list()).rejects.toThrow("network");
  });
});
