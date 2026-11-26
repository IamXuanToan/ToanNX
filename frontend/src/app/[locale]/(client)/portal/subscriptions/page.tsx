import { SubscriptionListView } from "@/modules/workspace/views/subscription/subscription-list-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({
  title: "workspace.subscriptions.title",
});

/** Trang danh sách Dịch vụ định kỳ. */
export default function SubscriptionsPage() {
  return <SubscriptionListView />;
}
