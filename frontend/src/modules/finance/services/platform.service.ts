import { apiClient } from "@/shares/lib/api/api-client";
import { createCrudService } from "@/shares/lib/api/create-crud-service";

import { FINANCE_API_ENDPOINTS } from "../constants/api-endpoints";
import type { Platform, PlatformFilters, PlatformInput } from "../types/platform.types";

const crud = createCrudService<Platform, PlatformFilters, PlatformInput, PlatformInput, Platform>(
  FINANCE_API_ENDPOINTS.platforms,
);

/** Service nền tảng (BE `finance/services/platform_service.py`). */
export const platformService = {
  ...crud,

  /** @returns Số nền tảng mẫu mới tạo (Facebook, YouTube, TikTok, Shopee). */
  async seedDefaults(): Promise<number> {
    return (await apiClient.post<{ created: number }>(FINANCE_API_ENDPOINTS.platformSeed)).data
      .created;
  },
};
