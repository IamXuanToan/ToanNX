"use client";

import { useRouter } from "@/i18n/navigation";
import { pickAllowedValues, useTableState } from "@/shares/hooks/use-table-state";
import { withEditMode } from "@/shares/lib/edit-mode";

import { UTILITIES_ROUTES } from "../../constants/routes";
import { useBulkDeleteQrCodes } from "../../hooks/use-bulk-delete-qr-codes";
import { useDeleteQrCode } from "../../hooks/use-delete-qr-code";
import { useQrCodes } from "../../hooks/use-qr-codes";
import { QR_TYPES, type QrCode } from "../../types/qr-code.types";

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
  const bulkDelete = useBulkDeleteQrCodes();
  return {
    table,
    query,
    view: (code: QrCode) => router.push(UTILITIES_ROUTES.qrCodeDetail(code.id)),
    edit: (code: QrCode) => router.push(withEditMode(UTILITIES_ROUTES.qrCodeDetail(code.id))),
    remove: (code: QrCode) => remove.mutateAsync(code.id),
    bulkDelete: (codes: QrCode[]) => bulkDelete.mutateAsync(codes.map((code) => code.id)),
  };
}
