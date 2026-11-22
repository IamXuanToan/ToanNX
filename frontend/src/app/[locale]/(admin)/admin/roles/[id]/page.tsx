import { SYSTEM_API_ENDPOINTS } from "@/modules/system/constants/api-endpoints";
import { RoleDetailView } from "@/modules/system/views/role/role-detail-view";
import { RecordHistoryView } from "@/modules/system/views/journal-entry/record-history-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "common.nav.roles" });

/**
 * Trang chi tiết vai trò (IAM) + lịch sử thay đổi (Journal) qua slot `history`.
 *
 * @param props - Tham số route.
 * @returns RoleDetailView.
 */
export default async function RoleDetailPage({ params }: PageProps<"/[locale]/admin/roles/[id]">) {
  const { id } = await params;
  return (
    <RoleDetailView
      id={id}
      history={
        <RecordHistoryView
          path={`${SYSTEM_API_ENDPOINTS.roles}/${id}/history`}
          fieldPrefix="system.iam.roles.fields"
        />
      }
    />
  );
}
