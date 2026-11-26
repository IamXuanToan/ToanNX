import { AssistantAdminView } from "@/modules/workspace/views/assistant/assistant-admin-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({
  title: "workspace.nav.assistantConfig",
});

/** Trang Admin quản trị Chatbot AI dùng chung toàn hệ thống. */
export default function AdminWorkspaceAssistantPage() {
  return <AssistantAdminView />;
}
