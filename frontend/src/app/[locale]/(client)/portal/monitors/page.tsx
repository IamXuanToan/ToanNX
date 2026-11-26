import { MonitorTargetListView } from "@/modules/workspace/views/monitor-target/monitor-target-list-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({
  title: "workspace.monitors.title",
});

/** Trang danh sách Endpoint giám sát Uptime. */
export default function MonitorsPage() {
  return <MonitorTargetListView />;
}
