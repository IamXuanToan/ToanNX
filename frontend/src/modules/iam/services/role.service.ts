import { createCrudService } from "@/shares/lib/api/create-crud-service";

import { IAM_API_ENDPOINTS } from "../constants/api-endpoints";
import type { Role, RoleDetail, RoleFilters, RoleInput } from "../types/iam.types";

const crud = createCrudService<Role, RoleFilters, RoleInput, Omit<RoleInput, "code">, RoleDetail>(
  IAM_API_ENDPOINTS.roles,
);

/** Service vai trò (BE `iam/services/role_service.py`): CRUD chuẩn + bật/tắt hàng loạt. */
export const roleService = {
  ...crud,

  /** Toàn bộ vai trò (kể cả đang tắt) cho bộ lọc và ô chọn: không truyền `page` → BE trả hết. */
  listAll(signal?: AbortSignal): Promise<Role[]> {
    return crud.listAll({ ordering: "-created_at" }, signal);
  },

  /** @param ids - Id vai trò. @param isActive - Trạng thái mới. @returns Số bản ghi đã cập nhật. */
  bulkSetActive(ids: string[], isActive: boolean): Promise<number> {
    return crud.bulkUpdate(ids, { isActive });
  },
};
