import { WarrantyClaimListView } from "@/modules/workspace/views/asset-warranty-claim/warranty-claim-list-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({
  title: "workspace.warrantyClaims.title",
});

/** Trang danh sách Phiếu bảo hành / sửa chữa thiết bị. */
export default function WarrantyClaimsPage() {
  return <WarrantyClaimListView />;
}
