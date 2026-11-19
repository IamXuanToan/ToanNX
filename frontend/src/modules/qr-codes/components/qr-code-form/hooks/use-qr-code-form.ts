"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { useRouter } from "@/i18n/navigation";
import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";
import { isApiError } from "@/shares/lib/api/api-error";

import { QR_CODES_ROUTES } from "../../../constants/routes";
import { useCreateQrCode } from "../../../hooks/use-create-qr-code";
import { useQrBanks } from "../../../hooks/use-qr-banks";
import { useQrPreview } from "../../../hooks/use-qr-preview";
import { useUpdateQrCode } from "../../../hooks/use-update-qr-code";
import {
  fromQrCode,
  QR_FORM_DEFAULTS,
  qrCodeSchema,
  type QrCodeFormValues,
  toQrInput,
} from "../../../schemas/qr-code.schema";
import type { QrCodeDetail, QrPreviewInput } from "../../../types/qr-code.types";

const PREVIEW_DELAY_MS = 300;

/** Lỗi field của BE (`content.account_number`…) → tên ô phẳng của form. */
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
 * State form mã QR **dùng chung cho tạo và sửa**: xem trước trực tiếp (gọi BE sau 300 ms ngừng gõ, SVG do BE vẽ
 * nên khớp ảnh lưu), lưu xong tạo → sang trang chi tiết.
 *
 * @param params - Mã QR đang sửa.
 * @returns Form, ngân hàng, xem trước, submit.
 */
export function useQrCodeForm({ code }: { code?: QrCodeDetail }) {
  const t = useTranslations("qrCodes.validation");
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

  // Chỉ xem trước khi dữ liệu hợp lệ; chờ người dùng ngừng gõ để không gọi BE mỗi phím.
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
    let saved: QrCodeDetail;
    try {
      saved = code
        ? await update.mutateAsync(toQrInput(values))
        : await create.mutateAsync(toQrInput(values));
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
      return;
    }
    if (!code) router.push(QR_CODES_ROUTES.codeDetail(saved.id));
  });

  return {
    form,
    banks,
    preview,
    qrType: watched.qrType,
    onSubmit,
    isSubmitting: form.formState.isSubmitting,
  };
}
