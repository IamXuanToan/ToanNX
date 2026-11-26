import { RecordHistoryView } from "@/modules/system/views/journal-entry/record-history-view";
import { WORKSPACE_API_ENDPOINTS } from "@/modules/workspace/constants/api-endpoints";
import { VaultItemDetailView } from "@/modules/workspace/views/vault-item/vault-item-detail-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({
  title: "workspace.vault.editTitle",
});

/** Chi tiết mục Két sắt bí mật (hỗ trợ giải mã nếu có quyền `reveal`). */
export default async function VaultDetailPage({
  params,
}: PageProps<"/[locale]/portal/vault/[id]">) {
  const { id } = await params;
  return (
    <VaultItemDetailView
      id={id}
      history={
        <RecordHistoryView
          path={`${WORKSPACE_API_ENDPOINTS.vaultItems}/${id}/history`}
          fieldPrefix="workspace.vault.fields"
        />
      }
    />
  );
}
