import type { ListParams } from "@/shares/types/api.types";

import type { MONITOR_METHODS, MONITOR_STATUSES } from "../constants/defaults";

export type MonitorMethod = (typeof MONITOR_METHODS)[number];
export type MonitorStatus = (typeof MONITOR_STATUSES)[number];

/** Endpoint giám sát Uptime/HTTP (khớp `MonitorTargetResponse`). */
export type MonitorTarget = {
  id: string;
  ownerId: string;
  ownerEmail: string;
  name: string;
  url: string;
  method: MonitorMethod;
  expectedStatus: number;
  timeoutSeconds: number;
  checkIntervalMinutes: number;
  isActive: boolean;
  lastStatus: MonitorStatus;
  lastStatusCode: number | null;
  lastLatencyMs: number | null;
  lastCheckedAt: string | null;
  consecutiveFailures: number;
  createdAt: string;
  updatedAt: string;
};

/** Kết quả ping thủ công endpoint (khớp `MonitorTargetPingResponse`). */
export type MonitorPingResult = {
  targetId: string;
  status: MonitorStatus;
  statusCode: number | null;
  latencyMs: number | null;
  checkedAt: string;
  errorMessage: string;
  incidentId: string | null;
};

/** Đầu vào tạo/cập nhật endpoint giám sát. */
export type MonitorTargetInput = {
  name: string;
  url: string;
  method?: MonitorMethod;
  expectedStatus?: number;
  timeoutSeconds?: number;
  checkIntervalMinutes?: number;
  isActive?: boolean;
};

/** Bộ lọc danh sách Uptime Monitor. */
export type MonitorTargetFilters = ListParams & {
  lastStatus?: readonly string[];
  isActive?: boolean;
  method?: readonly string[];
  owner?: string;
};
