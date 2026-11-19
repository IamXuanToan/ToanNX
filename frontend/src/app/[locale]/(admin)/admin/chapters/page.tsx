import { ChapterListView } from "@/modules/novel/views/chapter-list-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "novel.nav.chapters" });

export default function AdminChapterListPage() {
  return <ChapterListView />;
}
