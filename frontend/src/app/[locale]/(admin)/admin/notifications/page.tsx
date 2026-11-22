import { NotificationDeliveryView } from "@/modules/system/views/notification-delivery-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({
  title: "system.notifications.deliveries.title",
});

/** Trang notifications. */
export default function Page() {
  return <NotificationDeliveryView />;
}
