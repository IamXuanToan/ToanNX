import type { ListParams } from "@/shares/types/api.types";
import type { AttachmentSummary } from "@/shares/types/attachment.types";

export const QR_TYPES = ["BANK_TRANSFER", "URL", "TEXT"] as const;
export const ERROR_CORRECTION_LEVELS = ["L", "M", "Q", "H"] as const;

export type QrType = (typeof QR_TYPES)[number];

/** Nội dung theo loại (BE `content`). */
export type QrContent =
  | {
      bankBin: string;
      accountNumber: string;
      accountName: string;
      amount: number | null;
      message: string;
    }
  | { url: string }
  | { text: string };

/** Kiểu dáng (BE `design`). */
export type QrDesign = {
  size: number;
  foreground: string;
  background: string;
  margin: number;
  errorCorrection: (typeof ERROR_CORRECTION_LEVELS)[number];
};

/** Một dòng danh sách. */
export type QrCode = {
  id: string;
  name: string;
  qrType: QrType;
  image: AttachmentSummary;
  owner: { id: string; email: string; fullName: string };
  createdAt: string;
  updatedAt: string;
};

/** Chi tiết. */
export type QrCodeDetail = Omit<QrCode, "owner"> & {
  ownerId: string;
  content: QrContent;
  design: QrDesign;
  logo: AttachmentSummary | null;
  payload: string;
};

/** Ngân hàng nhận VietQR. */
export type QrBank = { bin: string; code: string; shortName: string; name: string };

/** Bộ lọc danh sách. */
export type QrCodeFilters = ListParams & { qrType?: QrType[]; owner?: string[] };

/** Dữ liệu tạo/sửa và xem trước. */
export type QrCodeInput = {
  name: string;
  qrType: QrType;
  content: QrContent;
  design: QrDesign;
  logoId: string | null;
};
export type QrPreviewInput = Omit<QrCodeInput, "name">;
export type QrPreview = { payload: string; svg: string };
