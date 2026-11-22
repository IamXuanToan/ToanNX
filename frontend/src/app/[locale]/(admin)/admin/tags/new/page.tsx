import { TagCreateView } from "@/modules/novel/views/tag-create-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "novel.nav.tags" });

export default function AdminTagCreatePage() {
  return <TagCreateView />;
}
