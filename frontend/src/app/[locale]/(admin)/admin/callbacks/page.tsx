import { CallbackListView } from "@/modules/system/views/callback/callback-list-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "system.callbacks.title" });

/** Trang danh mục URL callback (OAuth). */
export default function CallbacksPage() {
  return <CallbackListView />;
}
