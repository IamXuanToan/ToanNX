import { AssistantView } from "@/modules/workspace/views/assistant/assistant-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({
  title: "workspace.assistant.title",
});

/** Trang Trợ lý AI cá nhân. */
export default function AssistantPage() {
  return <AssistantView />;
}
