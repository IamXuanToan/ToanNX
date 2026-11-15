"use client";

import { Loader2 } from "lucide-react";
import type { ComponentProps } from "react";

import { Button } from "@/shares/components/ui/button";

import { useFormId } from "../../form/form";

/**
 * Nút gửi form chuẩn: luôn gắn `form=<id của Form>` nên bấm được cả khi nằm ngoài thẻ `<form>`
 * (thanh nút ở đầu `FormPage`); đang gửi thì hiện vòng quay.
 *
 * @param props - Props của `Button` cộng cờ đang gửi.
 * @returns Nút submit.
 */
export function FormSubmitButton({
  isSubmitting,
  children,
  disabled,
  ...props
}: ComponentProps<typeof Button> & { isSubmitting?: boolean }) {
  const formId = useFormId();
  return (
    <Button {...props} type="submit" form={formId} disabled={disabled || isSubmitting}>
      {isSubmitting ? <Loader2 className="animate-spin" /> : null}
      {children}
    </Button>
  );
}
