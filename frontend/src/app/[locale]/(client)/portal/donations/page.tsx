import { PortalDonationView } from "@/modules/portal/views/donation/portal-donation-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "portal.navigation.donations" });

/** Trang Thống kê Quyên góp cá nhân (Client Portal). */
export default function PortalDonationsPage() {
  return <PortalDonationView />;
}
