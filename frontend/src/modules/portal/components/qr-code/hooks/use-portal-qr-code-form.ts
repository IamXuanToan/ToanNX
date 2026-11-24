"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import { useCreateQrCode } from "@/modules/utilities/hooks/use-create-qr-code";
import { useQrBanks } from "@/modules/utilities/hooks/use-qr-banks";
import { useQrPreview } from "@/modules/utilities/hooks/use-qr-preview";
import { useUpdateQrCode } from "@/modules/utilities/hooks/use-update-qr-code";
import {
  fromQrCode,
  QR_FORM_DEFAULTS,
  qrCodeSchema,
  type QrCodeFormValues,
  toQrInput,
} from "@/modules/utilities/schemas/qr-code.schema";
import type { QrCodeDetail, QrPreviewInput } from "@/modules/utilities/types/qr-code.types";
import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";
import { isApiError } from "@/shares/lib/api/api-error";

import { PORTAL_ROUTES } from "../../../constants/routes";

const PREVIEW_DELAY_MS = 300;

const BACKEND_FIELDS: Record<string, keyof QrCodeFormValues> = {
  name: "name",
  bankBin: "bankBin",
  accountNumber: "accountNumber",
  accountName: "accountName",
  amount: "amount",
  message: "message",
  url: "url",
  text: "text",
  logoId: "logo",
};

/**
 * Hook quản lý trạng thái form tạo và sửa mã QR trong Client Portal:
 * Xem trước trực tiếp theo thời gian thực (debounce 300ms) và chuyển hướng về danh sách QR cá nhân khi thành công.
 *
 * @param params - Chi tiết mã QR (khi sửa).
 * @returns State form, ngân hàng, xem trước trực tiếp và hàm submit.
 */
export function usePortalQrCodeForm({ code }: { code?: QrCodeDetail }) {
  const t = useTranslations("utilities.qrCodes.validation");
  const tQr = useTranslations("utilities.qrCodes");
  const router = useRouter();
  const create = useCreateQrCode();
  const update = useUpdateQrCode(code?.id ?? "");
  const banks = useQrBanks();
  const errorMessage = useApiErrorMessage();
  const schema = useMemo(() => qrCodeSchema(t), [t]);

  const form = useForm<QrCodeFormValues>({
    resolver: zodResolver(schema),
    defaultValues: QR_FORM_DEFAULTS,
    values: code ? fromQrCode(code) : undefined,
    mode: "onChange",
  });

  const watched = useWatch({ control: form.control });
  const [previewInput, setPreviewInput] = useState<QrPreviewInput | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const parsed = schema.safeParse({ ...watched, name: watched.name || "preview" });
      if (!parsed.success) return;
      const { qrType, content, design, logoId } = toQrInput(parsed.data);
      setPreviewInput({ qrType, content, design, logoId });
    }, PREVIEW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [watched, schema]);

  const preview = useQrPreview(previewInput);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (code) {
        await update.mutateAsync(toQrInput(values));
        toast.success(tQr("messages.updateSuccess"));
      } else {
        await create.mutateAsync(toQrInput(values));
        toast.success(tQr("messages.createSuccess"));
      }
      router.push(PORTAL_ROUTES.qrCodes);
    } catch (error) {
      const details = isApiError(error) ? error.details : {};
      const nested = {
        ...(details.content as Record<string, string[]> | undefined),
        name: details.name,
        logoId: details.logoId ?? details.logo_id,
      };
      let matched = false;
      for (const [field, messages] of Object.entries(nested)) {
        const name =
          BACKEND_FIELDS[field.replace(/_([a-z])/g, (_, char: string) => char.toUpperCase())];
        if (name && Array.isArray(messages) && messages[0]) {
          form.setError(name, { message: String(messages[0]) });
          matched = true;
        }
      }
      if (!matched) form.setError("root", { message: errorMessage(error) });
    }
  });

  return {
    form,
    banks,
    preview,
    onSubmit,
    isSubmitting: create.isPending || update.isPending,
    qrType: watched.qrType ?? "BANK_TRANSFER",
  };
}
