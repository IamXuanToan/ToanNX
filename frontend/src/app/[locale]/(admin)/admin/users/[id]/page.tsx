import { UserDetailView } from "@/modules/account/views/user-detail-view";
import { UserRolesCard } from "@/modules/iam/components/user-roles-card/user-roles-card";

/**
 * Trang chi tiết người dùng: thông tin tài khoản (Account) + vai trò (IAM).
 *
 * @param props - Tham số route.
 * @returns UserDetailView kèm card vai trò.
 */
export default async function UserDetailPage({ params }: PageProps<"/[locale]/admin/users/[id]">) {
  const { id } = await params;
  return <UserDetailView id={id} aside={<UserRolesCard userId={id} />} />;
}
