import { ChapterCreateView } from "@/modules/novel/views/chapter-create-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "novel.nav.chapters" });

export default function AdminChapterCreatePage() {
  return <ChapterCreateView />;
}
