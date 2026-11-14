"use client";

import { usePermission } from "@/modules/auth/hooks/use-permission";

import { useModules, useUpdateModule } from "../../../hooks/use-modules";
import { SYSTEM_PERMISSIONS } from "../../../navigation";

/**
 * Dữ liệu và hành động của bảng module.
 *
 * @returns Truy vấn, quyền quản lý và hàm bật/tắt.
 */
export function useModuleTable() {
  const query = useModules();
  const update = useUpdateModule();
  const canManage = usePermission(SYSTEM_PERMISSIONS.moduleManage);
  return {
    query,
    canManage,
    pendingCode: update.isPending ? update.variables?.code : undefined,
    setEnabled: (code: string, enabled: boolean) => update.mutate({ code, input: { enabled } }),
  };
}
