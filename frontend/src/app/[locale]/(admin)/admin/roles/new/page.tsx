import { RoleCreateView } from "@/modules/iam/views/role-create-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "iam.roles.create" });

/**
 * Trang tạo mới; `?copyFrom=<id>` để sao chép từ bản ghi có sẵn.
 *
 * @param props - Tham số route và query.
 * @returns View tạo mới.
 */
export default async function RoleCreatePage({
  searchParams,
}: PageProps<"/[locale]/admin/roles/new">) {
  const { copyFrom } = await searchParams;
  return <RoleCreateView copyFrom={typeof copyFrom === "string" ? copyFrom : undefined} />;
}
