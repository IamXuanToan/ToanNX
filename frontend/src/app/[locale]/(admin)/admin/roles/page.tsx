import { RoleListView } from "@/modules/iam/views/role-list-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "common.nav.roles" });

/** Trang danh sách vai trò. */
export default function RolesPage() {
  return <RoleListView />;
}
