import { SubscriptionCreateView } from "@/modules/workspace/views/subscription/subscription-create-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({
  title: "workspace.subscriptions.createTitle",
});

/** Trang tạo Dịch vụ định kỳ mới. */
export default function SubscriptionCreatePage() {
  return <SubscriptionCreateView />;
}
