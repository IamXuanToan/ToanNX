import { ClassificationRuleCreateView } from "@/modules/finance/views/classification-rule/classification-rule-create-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "finance.nav.rules" });

/** Tạo mới quy tắc phân loại cá nhân. */
export default function Page() {
  return <ClassificationRuleCreateView />;
}
