import { ClassificationRuleListView } from "@/modules/finance/views/classification-rule/classification-rule-list-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "finance.nav.rules" });

/** Danh sách quy tắc phân loại cá nhân. */
export default function Page() {
  return <ClassificationRuleListView />;
}
