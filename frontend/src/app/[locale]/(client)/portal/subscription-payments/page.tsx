import { SubscriptionPaymentListView } from "@/modules/workspace/views/subscription-payment/subscription-payment-list-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({
  title: "workspace.subscriptionPayments.title",
});

/** Trang Lịch sử thanh toán gia hạn dịch vụ. */
export default function SubscriptionPaymentsPage() {
  return <SubscriptionPaymentListView />;
}
