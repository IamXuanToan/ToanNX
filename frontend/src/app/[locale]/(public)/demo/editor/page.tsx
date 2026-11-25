import { createPageMetadata } from "@/shares/lib/seo";
import { NotionDemoView } from "@/modules/utilities/views/page/notion-demo-view";

export const generateMetadata = createPageMetadata({
  title: "utilities.customPages.demo.notionEditor",
  index: true,
});

/**
 * Trang trình diễn trình soạn thảo Notion-like công khai (`/demo/editor`).
 *
 * @returns NotionDemoView.
 */
export default function DemoNotionEditorPage() {
  return <NotionDemoView />;
}
