import { MonitorIncidentListView } from "@/modules/workspace/views/monitor-incident/monitor-incident-list-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({
  title: "workspace.monitorIncidents.title",
});

/** Trang danh sách Sự cố Uptime. */
export default function MonitorIncidentsPage() {
  return <MonitorIncidentListView />;
}
