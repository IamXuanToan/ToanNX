"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";

/**
 * Thao tác trên thẻ kết quả của Trợ lý (sao chép link thật do server trả).
 *
 * @returns Hàm sao chép kèm thông báo.
 */
export function useAssistantResultCard() {
  const t = useTranslations("workspace.assistant.resultCard");
  return {
    copy: (value: string) => {
      void navigator.clipboard.writeText(value);
      toast.success(t("copied"));
    },
  };
}
