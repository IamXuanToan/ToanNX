"use client";

import { useRouter } from "@/i18n/navigation";
import { useCurrentUser } from "@/modules/system/hooks/use-current-user";
import { pickAllowedValues, useTableState } from "@/shares/hooks/use-table-state";
import { withEditMode } from "@/shares/lib/edit-mode";

import { UTILITIES_ROUTES } from "../../../constants/routes";
import { useBulkDeleteQrCodes } from "../../../hooks/use-bulk-delete-qr-codes";
import { useDeleteQrCode } from "../../../hooks/use-delete-qr-code";
import { useQrCodes } from "../../../hooks/use-qr-codes";
import { QR_TYPES, type QrCode } from "../../../types/qr-code.types";

type DetailRouteFn = (id: string) => { pathname: string; params: Record<string, string> };

/**
 * State bảng mã QR: tìm theo tên, lọc loại (chọn nhiều), sắp xếp, phân trang URL, xóa và xóa hàng loạt.
 * Hỗ trợ tùy biến detailRoute và ownerOnly cho Client Portal.
 *
 * @param options - Tùy chọn lọc chủ sở hữu và hàm sinh route chi tiết.
 * @returns Truy vấn, state bảng và handler.
 */
export function useQrCodeTable(options?: {
  ownerOnly?: boolean;
  ownerId?: string;
  detailRoute?: DetailRouteFn;
}) {
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();
  const effectiveOwnerId =
    options?.ownerId ?? (options?.ownerOnly ? currentUser?.user.id : undefined);

  const table = useTableState({ ordering: "-created_at", filterKeys: ["qrType"] });
  const query = useQrCodes({
    ...table.filters,
    qrType: pickAllowedValues(table.getFilterValues("qrType"), QR_TYPES),
    owner: effectiveOwnerId ? [effectiveOwnerId] : undefined,
  });
  const remove = useDeleteQrCode();
  const bulkDelete = useBulkDeleteQrCodes();

  const getTargetRoute = (id: string) =>
    (options?.detailRoute
      ? options.detailRoute(id)
      : UTILITIES_ROUTES.qrCodeDetail(id)) as Parameters<typeof router.push>[0];

  return {
    table,
    query,
    view: (code: QrCode) => router.push(getTargetRoute(code.id)),
    edit: (code: QrCode) => {
      const route = options?.detailRoute
        ? options.detailRoute(code.id)
        : UTILITIES_ROUTES.qrCodeDetail(code.id);
      router.push(withEditMode(route) as Parameters<typeof router.push>[0]);
    },
    remove: (code: QrCode) => remove.mutateAsync(code.id),
    bulkDelete: (codes: QrCode[]) => bulkDelete.mutateAsync(codes.map((code) => code.id)),
  };
}
