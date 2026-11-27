import { WorkspaceSettingView } from "@/modules/workspace/views/workspace-setting/workspace-setting-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({
  title: "workspace.settings.title",
});

/** Trang Cài đặt Trợ lý AI, Digest & Telegram. */
export default function PortalWorkspaceSettingsPage() {
  return <WorkspaceSettingView />;
}
