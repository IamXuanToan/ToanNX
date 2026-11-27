import { RecordHistoryView } from "@/modules/system/views/journal-entry/record-history-view";
import { WORKSPACE_API_ENDPOINTS } from "@/modules/workspace/constants/api-endpoints";
import { AssetDetailView } from "@/modules/workspace/views/asset/asset-detail-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "workspace.assets.editTitle" });

/** Chi tiết Thiết bị cá nhân kèm phiếu bảo hành và lịch sử thay đổi. */
export default async function AssetDetailPage({
  params,
}: PageProps<"/[locale]/portal/assets/[id]">) {
  const { id } = await params;
  return (
    <AssetDetailView
      id={id}
      history={
        <RecordHistoryView
          path={`${WORKSPACE_API_ENDPOINTS.assets}/${id}/history`}
          fieldPrefix="workspace.assets.fields"
        />
      }
    />
  );
}
