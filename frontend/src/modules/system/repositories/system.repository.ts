import { API_ENDPOINTS } from "@/shares/constants/api-endpoints";
import { apiClient } from "@/shares/lib/api/api-client";

import type { ModuleInfo, ModuleUpdateInput } from "../types/system.types";

/** Gọi API module System. */
export const systemRepository = {
  /** Danh sách module đã cài. @param signal - Tín hiệu hủy. @returns Module. */
  async listModules(signal?: AbortSignal): Promise<ModuleInfo[]> {
    return (await apiClient.get<ModuleInfo[]>(API_ENDPOINTS.system.modules, { signal })).data;
  },
  /** Cập nhật module (bật/tắt, icon). @param code - Mã module. @param input - Dữ liệu. @returns Module. */
  async updateModule(code: string, input: ModuleUpdateInput): Promise<ModuleInfo> {
    return (await apiClient.patch<ModuleInfo>(API_ENDPOINTS.system.module(code), input)).data;
  },
};
