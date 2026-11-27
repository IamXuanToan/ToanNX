"use client";

import { useTranslations } from "next-intl";
import { type ComponentProps, useContext } from "react";

import { Link } from "@/i18n/navigation";
import { Button } from "@/shares/components/ui/button";

import { FormPageBackContext } from "./hooks/use-form-page-header";

/**
 * Nút `Quay lại` dùng trong `<FormActions>`:
 * - Khi trang bọc trong `<FormPage backHref={...}>`, nút `Quay lại` đã cố định sẵn trên header nên component
 *   tự ẩn để không lặp nút và không bị mất khi chuyển tab.
 * - Khi form đứng độc lập hoặc nằm trong `FormPage` chưa truyền `backHref`, giữ nguyên nút `Quay lại`.
 *
 * @param props - Đường dẫn quay lại danh sách.
 * @returns Nút `Quay lại` hoặc `null`.
 */
export function FormBackButton({ href }: { href: ComponentProps<typeof Link>["href"] }) {
  const tCommon = useTranslations("common.actions");
  const hasHeaderBack = useContext(FormPageBackContext);

  if (hasHeaderBack) return null;

  return (
    <Button asChild type="button" variant="outline">
      <Link href={href}>{tCommon("back")}</Link>
    </Button>
  );
}
