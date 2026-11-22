import { UserListView } from "@/modules/system/views/user/user-list-view";
import { UserRoleFilterView } from "@/modules/system/views/user-role/user-role-filter-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "common.nav.users" });

/** Trang danh sách người dùng. */
export default function UsersPage() {
  return <UserListView roleFilter={<UserRoleFilterView />} />;
}
