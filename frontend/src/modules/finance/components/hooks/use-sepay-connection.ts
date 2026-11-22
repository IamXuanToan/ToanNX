"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { useDeleteSepayConnection } from "../../hooks/use-delete-sepay-connection";
import { useRotateSepaySecret } from "../../hooks/use-rotate-sepay-secret";
import { useSaveSepayConnection } from "../../hooks/use-save-sepay-connection";
import { useSepayStatus } from "../../hooks/use-sepay-status";
import { useTestSepayConnection } from "../../hooks/use-test-sepay-connection";

/**
 * State kết nối SePay của chính mình: token (chỉ ghi), URL webhook + secret riêng, kiểm tra, bật/tắt, xóa.
 *
 * @returns Truy vấn + handler.
 */
export function useSepayConnection() {
  const t = useTranslations("finance.sepay");
  const status = useSepayStatus();
  const save = useSaveSepayConnection();
  const remove = useDeleteSepayConnection();
  const rotate = useRotateSepaySecret();
  const test = useTestSepayConnection();
  const [token, setToken] = useState("");
  return {
    status,
    token,
    setToken,
    saveToken: async () => {
      await save.mutateAsync({ token });
      setToken("");
    },
    setActive: (isActive: boolean) => save.mutate({ isActive }),
    remove: () => remove.mutate(),
    rotate: () => rotate.mutate(),
    test: async () => {
      const count = await test.mutateAsync();
      toast.success(t("testOk", { count }));
    },
    copy: (value: string) => {
      void navigator.clipboard.writeText(value);
      toast.success(t("copied"));
    },
    isSaving: save.isPending,
    isTesting: test.isPending,
  };
}
