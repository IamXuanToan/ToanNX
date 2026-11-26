import type { ListParams } from "@/shares/types/api.types";

/** Sự cố gián đoạn endpoint (khớp `MonitorIncidentResponse`). */
export type MonitorIncident = {
  id: string;
  ownerId: string;
  ownerEmail: string;
  targetId: string;
  targetName: string;
  targetUrl: string;
  startedAt: string;
  resolvedAt: string | null;
  statusCode: number | null;
  errorMessage: string;
  durationSeconds: number | null;
  createdAt: string;
  updatedAt: string;
};

/** Bộ lọc Sự cố Uptime. */
export type MonitorIncidentFilters = ListParams & {
  target?: string;
  resolved?: boolean;
  owner?: string;
};
