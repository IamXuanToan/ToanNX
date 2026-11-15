import { IAM_API_ENDPOINTS } from "@/modules/iam/constants/api-endpoints";
import { RoleDetailView } from "@/modules/iam/views/role-detail-view";
import { RecordHistoryView } from "@/modules/journal/views/record-history-view";
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
          path={`${IAM_API_ENDPOINTS.roles}/${id}/history`}
          fieldPrefix="iam.roles.fields"
        />
      }
    />
  );
}
