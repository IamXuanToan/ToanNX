import { ModuleLauncherView } from "@/modules/manage-app/views/launcher/module-launcher-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "common.nav.modulesLabel" });

/** Màn chọn module của khu vực quản trị. */
export default function AdminHomePage() {
  return <ModuleLauncherView />;
}
