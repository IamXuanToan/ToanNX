import { RecordHistoryView } from "@/modules/system/views/journal-entry/record-history-view";
import { WORKSPACE_API_ENDPOINTS } from "@/modules/workspace/constants/api-endpoints";
import { WarrantyClaimDetailView } from "@/modules/workspace/views/asset-warranty-claim/warranty-claim-detail-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({
  title: "workspace.warrantyClaims.editTitle",
});

/** Chi tiết Phiếu bảo hành / sửa chữa thiết bị. */
export default async function WarrantyClaimDetailPage({
  params,
}: PageProps<"/[locale]/portal/warranty-claims/[id]">) {
  const { id } = await params;
  return (
    <WarrantyClaimDetailView
      id={id}
      history={
        <RecordHistoryView
          path={`${WORKSPACE_API_ENDPOINTS.warrantyClaims}/${id}/history`}
          fieldPrefix="workspace.warrantyClaims.fields"
        />
      }
    />
  );
}
