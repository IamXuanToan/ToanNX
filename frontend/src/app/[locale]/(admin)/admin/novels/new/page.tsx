import { NovelCreateView } from "@/modules/novel/views/novel/novel-create-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "novel.nav.novels" });

export default function AdminNovelCreatePage() {
  return <NovelCreateView />;
}
