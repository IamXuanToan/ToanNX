import { apiClient } from "@/shares/lib/api/api-client";
import { createCrudService } from "@/shares/lib/api/create-crud-service";

import { WORKSPACE_API_ENDPOINTS } from "../constants/api-endpoints";
import type {
  MonitorPingResult,
  MonitorTarget,
  MonitorTargetFilters,
  MonitorTargetInput,
} from "../types/monitor-target.types";

/** Service Giám sát Uptime/HTTP & ping thủ công (BE `monitor_target_service.py`). */
export const monitorTargetService = {
  ...createCrudService<
    MonitorTarget,
    MonitorTargetFilters,
    MonitorTargetInput,
    Partial<MonitorTargetInput>,
    MonitorTarget
  >(WORKSPACE_API_ENDPOINTS.monitorTargets),

  /** Ping endpoint tức thời ngoài transaction, ghi sự cố nếu đổi trạng thái. */
  async ping(id: string): Promise<MonitorPingResult> {
    return (await apiClient.post<MonitorPingResult>(WORKSPACE_API_ENDPOINTS.monitorTargetPing(id)))
      .data;
  },
};
