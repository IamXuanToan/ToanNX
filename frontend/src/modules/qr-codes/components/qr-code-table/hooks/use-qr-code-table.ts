"use client";

import { useRouter } from "@/i18n/navigation";
import { pickAllowedValues, useTableState } from "@/shares/hooks/use-table-state";

import { QR_CODES_ROUTES } from "../../../constants/routes";
import { useBulkDeleteQrCodes, useDeleteQrCode, useQrCodes } from "../../../hooks/use-qr-codes";
import { QR_TYPES, type QrCode } from "../../../types/qr-codes.types";

/**
 * State bảng mã QR: tìm theo tên, lọc loại (chọn nhiều), sắp xếp, phân trang URL, xóa và xóa hàng loạt.
 *
 * @returns Truy vấn, state bảng và handler.
 */
export function useQrCodeTable() {
  const router = useRouter();
  const table = useTableState({ ordering: "-created_at", filterKeys: ["qrType"] });
  const query = useQrCodes({
    ...table.filters,
    qrType: pickAllowedValues(table.getFilterValues("qrType"), QR_TYPES),
  });
  const remove = useDeleteQrCode();
  const bulkRemove = useBulkDeleteQrCodes();
  return {
    table,
    query,
    edit: (code: QrCode) => router.push(QR_CODES_ROUTES.codeDetail(code.id)),
    remove: (code: QrCode) => remove.mutateAsync(code.id),
    bulkRemove: (codes: QrCode[]) => bulkRemove.mutateAsync(codes.map((code) => code.id)),
  };
}
