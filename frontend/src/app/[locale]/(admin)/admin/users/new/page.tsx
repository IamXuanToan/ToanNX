import { UserCreateView } from "@/modules/system/views/user/user-create-view";
import { UserRolePickerView } from "@/modules/system/views/user-role/user-role-picker-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "system.account.users.create" });

/**
 * Trang tạo người dùng (Account) + chọn vai trò (IAM) qua slot `extensions`;
 * `?copyFrom=<id>` để sao chép từ người dùng có sẵn (kèm vai trò).
 *
 * @param props - Tham số route và query.
 * @returns View tạo mới.
 */
export default async function UserCreatePage({
  searchParams,
}: PageProps<"/[locale]/admin/users/new">) {
  const { copyFrom } = await searchParams;
  const sourceId = typeof copyFrom === "string" ? copyFrom : undefined;
  return (
    <UserCreateView copyFrom={sourceId} extensions={<UserRolePickerView copyFrom={sourceId} />} />
  );
}
