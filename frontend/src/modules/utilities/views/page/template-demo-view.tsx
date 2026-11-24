"use client";

import type { DemoTemplateTypeValue } from "../../constants/page-constants";
import { TemplateDemoShowcase } from "../../components/page/template-demo-showcase";

/**
 * Giao diện xem trước sống động các mẫu template (Affiliate, Bio, Donation).
 *
 * @param props - Loại template cần xem trước.
 * @returns View demo trực tiếp.
 */
export function TemplateDemoView({ type }: { type?: DemoTemplateTypeValue }) {
  return <TemplateDemoShowcase type={type} />;
}
