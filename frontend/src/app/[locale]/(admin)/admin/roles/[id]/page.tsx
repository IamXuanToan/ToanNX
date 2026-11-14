import { RoleDetailView } from "@/modules/iam/views/role-detail-view";

/**
 * Trang chi tiết vai trò.
 *
 * @param props - Tham số route.
 * @returns RoleDetailView.
 */
export default async function RoleDetailPage({ params }: PageProps<"/[locale]/admin/roles/[id]">) {
  const { id } = await params;
  return <RoleDetailView id={id} />;
}
