"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";

/** @param url - URL tuyệt đối của file. @returns Thao tác sao chép, có báo lỗi khi clipboard không khả dụng. */
export function useAttachmentDetails(url: string) {
  const t = useTranslations("attachment");
  return {
    copy: async () => {
      try {
        await navigator.clipboard.writeText(url);
        toast.success(t("copied"));
      } catch {
        toast.error(t("copyFailed"));
      }
    },
  };
}
