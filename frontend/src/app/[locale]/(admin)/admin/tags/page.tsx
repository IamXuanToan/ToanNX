import { TagListView } from "@/modules/novel/views/tag-list-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "novel.nav.tags" });

export default function AdminTagListPage() {
  return <TagListView />;
}
