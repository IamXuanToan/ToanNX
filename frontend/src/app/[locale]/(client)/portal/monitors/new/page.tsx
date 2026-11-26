import { MonitorTargetCreateView } from "@/modules/workspace/views/monitor-target/monitor-target-create-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({
  title: "workspace.monitors.createTitle",
});

/** Trang tạo Endpoint giám sát Uptime mới. */
export default function MonitorCreatePage() {
  return <MonitorTargetCreateView />;
}
