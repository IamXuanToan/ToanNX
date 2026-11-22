import { PermissionListView } from "@/modules/system/views/permission-list-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "common.nav.permissions" });

/** Trang danh mục quyền. */
export default function PermissionsPage() {
  return <PermissionListView />;
}
