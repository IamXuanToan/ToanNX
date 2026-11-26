import { createCrudService } from "@/shares/lib/api/create-crud-service";

import { WORKSPACE_API_ENDPOINTS } from "../constants/api-endpoints";
import type { MonitorIncident, MonitorIncidentFilters } from "../types/monitor-incident.types";

/** Service Sự cố Uptime (BE `monitor_incident_service.py`). */
export const monitorIncidentService = createCrudService<
  MonitorIncident,
  MonitorIncidentFilters,
  never,
  never,
  MonitorIncident
>(WORKSPACE_API_ENDPOINTS.monitorIncidents);
