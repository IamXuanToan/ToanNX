import { DonationListView } from "@/modules/utilities/views/donation/donation-list-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "utilities.nav.donations" });

/** Trang quản lý quyên góp toàn sàn (Admin). */
export default function AdminDonationsPage() {
  return <DonationListView />;
}
