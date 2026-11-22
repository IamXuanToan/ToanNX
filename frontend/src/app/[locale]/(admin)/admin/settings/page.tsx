import { SystemSettingsView } from "@/modules/system/views/system-settings-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "common.nav.settings" });

/** Trang quản lý cấu hình hệ thống. */
export default function SettingsPage() {
  return <SystemSettingsView />;
}
