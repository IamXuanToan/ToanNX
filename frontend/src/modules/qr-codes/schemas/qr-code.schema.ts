import { z } from "zod";

import type { QrCodeDetail, QrCodeInput, QrContent } from "../types/qr-codes.types";

type Translate = (key: "required" | "url" | "accountNumber" | "message" | "color") => string;

const HEX = /^#[0-9a-fA-F]{6}$/;
const MESSAGE = /^[A-Za-z0-9 ]{0,25}$/;

/**
 * Schema form mã QR (trường phẳng cho RHF; chỉ kiểm trường của loại đang chọn). BE kiểm lại và chuẩn hóa
 * (in hoa, bỏ dấu tên chủ tài khoản).
 *
 * @param t - Hàm dịch `qrCodes.validation`.
 * @returns Zod schema.
 */
export function qrCodeSchema(t: Translate) {
  return z
    .object({
      name: z.string().trim().min(1, t("required")).max(150),
      qrType: z.enum(["BANK_TRANSFER", "URL", "TEXT"]),
      bankBin: z.string(),
      accountNumber: z.string().trim(),
      accountName: z.string().trim().max(50),
      amount: z.union([z.number().int().positive(), z.literal("")]),
      message: z.string().trim(),
      url: z.string().trim(),
      text: z.string().max(1000),
      size: z.number().int().min(128).max(1024),
      foreground: z.string().regex(HEX, t("color")),
      background: z.string().regex(HEX, t("color")),
      margin: z.number().int().min(0).max(8),
      errorCorrection: z.enum(["L", "M", "Q", "H"]),
      logo: z
        .object({
          id: z.uuid(),
          url: z.string(),
          name: z.string(),
          size: z.number().optional(),
          contentType: z.string().optional(),
        })
        .nullable(),
    })
    .superRefine((values, context) => {
      const issue = (path: string, message: string) =>
        context.addIssue({ code: "custom", path: [path], message });
      if (values.qrType === "BANK_TRANSFER") {
        if (!values.bankBin) issue("bankBin", t("required"));
        if (!/^[0-9A-Za-z]{4,19}$/.test(values.accountNumber))
          issue("accountNumber", t("accountNumber"));
        if (!values.accountName) issue("accountName", t("required"));
        const plain = values.message.normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/gi, "d");
        if (!MESSAGE.test(plain)) issue("message", t("message"));
      } else if (values.qrType === "URL") {
        if (!/^https?:\/\/\S+$/i.test(values.url)) issue("url", t("url"));
      } else if (!values.text.trim()) {
        issue("text", t("required"));
      }
    });
}

export type QrCodeFormValues = z.infer<ReturnType<typeof qrCodeSchema>>;

export const QR_FORM_DEFAULTS: QrCodeFormValues = {
  name: "",
  qrType: "BANK_TRANSFER",
  bankBin: "",
  accountNumber: "",
  accountName: "",
  amount: "",
  message: "",
  url: "",
  text: "",
  size: 512,
  foreground: "#000000",
  background: "#FFFFFF",
  margin: 2,
  errorCorrection: "M",
  logo: null,
};

/** @param values - Giá trị form. @returns Nội dung theo loại gửi BE. */
export function toQrContent(values: QrCodeFormValues): QrContent {
  if (values.qrType === "BANK_TRANSFER") {
    return {
      bankBin: values.bankBin,
      accountNumber: values.accountNumber,
      accountName: values.accountName,
      amount: values.amount === "" ? null : values.amount,
      message: values.message,
    };
  }
  return values.qrType === "URL" ? { url: values.url } : { text: values.text };
}

/** @param values - Giá trị form. @returns Body tạo/sửa. */
export function toQrInput(values: QrCodeFormValues): QrCodeInput {
  return {
    name: values.name,
    qrType: values.qrType,
    content: toQrContent(values),
    design: {
      size: values.size,
      foreground: values.foreground,
      background: values.background,
      margin: values.margin,
      errorCorrection: values.errorCorrection,
    },
    logoId: values.logo?.id ?? null,
  };
}

/** @param code - Mã QR có sẵn. @returns Giá trị form. */
export function fromQrCode(code: QrCodeDetail): QrCodeFormValues {
  const content = code.content as Partial<Record<string, unknown>>;
  return {
    ...QR_FORM_DEFAULTS,
    name: code.name,
    qrType: code.qrType,
    bankBin: String(content.bankBin ?? ""),
    accountNumber: String(content.accountNumber ?? ""),
    accountName: String(content.accountName ?? ""),
    amount: typeof content.amount === "number" ? content.amount : "",
    message: String(content.message ?? ""),
    url: String(content.url ?? ""),
    text: String(content.text ?? ""),
    logo: code.logo ? { ...code.logo, name: "Logo" } : null,
    ...code.design,
  };
}
