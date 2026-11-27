import { WarrantyClaimCreateView } from "@/modules/workspace/views/asset-warranty-claim/warranty-claim-create-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({
  title: "workspace.warrantyClaims.createTitle",
});

/** Trang tạo Phiếu bảo hành / sửa chữa thiết bị mới. */
export default function WarrantyClaimCreatePage() {
  return <WarrantyClaimCreateView />;
}
