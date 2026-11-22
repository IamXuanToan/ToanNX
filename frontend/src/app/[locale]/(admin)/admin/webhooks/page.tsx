import { WebhookListView } from "@/modules/system/views/webhook-list-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "system.webhooks.title" });

/** Trang danh mục webhook của hệ thống. */
export default function WebhooksPage() {
  return <WebhookListView />;
}
