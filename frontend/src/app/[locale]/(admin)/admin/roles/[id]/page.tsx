import { RoleDetailView } from "@/modules/iam/views/role-detail-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "common.nav.roles" });

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
