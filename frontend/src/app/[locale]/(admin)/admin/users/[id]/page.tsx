import { ACCOUNT_API_ENDPOINTS } from "@/modules/account/constants/api-endpoints";
import { UserDetailView } from "@/modules/account/views/user-detail-view";
import { UserRolePickerView } from "@/modules/iam/views/user-role-picker-view";
import { RecordHistoryView } from "@/modules/journal/views/record-history-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "common.nav.users" });

/**
 * Trang chi tiết người dùng: thông tin tài khoản (Account) + vai trò (IAM) qua slot `extensions`, lưu cùng form.
 *
 * @param props - Tham số route.
 * @returns UserDetailView kèm chọn vai trò.
 */
export default async function UserDetailPage({ params }: PageProps<"/[locale]/admin/users/[id]">) {
  const { id } = await params;
  return (
    <UserDetailView
      id={id}
      extensions={<UserRolePickerView userId={id} />}
      history={
        <RecordHistoryView
          path={`${ACCOUNT_API_ENDPOINTS.users}/${id}/history`}
          fieldPrefix="account.users.fields"
        />
      }
    />
  );
}
