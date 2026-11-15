"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { useListQuery } from "@/shares/hooks/use-list-query";
import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { qrCodeKeys } from "../constants/query-keys";
import { qrCodeService } from "../services/qr-code.service";
import type { QrCodeFilters, QrCodeInput, QrPreviewInput } from "../types/qr-codes.types";

const INVALIDATE = [qrCodeKeys.all];

/** @param filters - Bộ lọc và phân trang. @returns Danh sách mã QR. */
export function useQrCodes(filters: QrCodeFilters, enabled = true) {
  return useListQuery(qrCodeKeys.list(filters), (signal) => qrCodeService.list(filters, signal), {
    enabled,
  });
}

/** @param id - Id. @returns Chi tiết mã QR. */
export function useQrCode(id: string) {
  return useQuery({
    queryKey: qrCodeKeys.detail(id),
    queryFn: ({ signal }) => qrCodeService.get(id, signal),
  });
}

/** @returns Danh mục ngân hàng (tĩnh trong phiên). */
export function useQrBanks() {
  return useQuery({
    queryKey: qrCodeKeys.banks(),
    queryFn: ({ signal }) => qrCodeService.banks(signal),
    staleTime: Infinity,
  });
}

/** @param input - Dữ liệu đã ổn định (debounce ở hook gọi). @returns Xem trước (giữ ảnh cũ khi đang tải ảnh mới). */
export function useQrPreview(input: QrPreviewInput | null) {
  return useQuery({
    queryKey: qrCodeKeys.preview(input ?? {}),
    queryFn: ({ signal }) => qrCodeService.preview(input!, signal),
    enabled: input !== null,
    placeholderData: keepPreviousData,
    retry: false,
  });
}

/** @returns Mutation tạo mã QR (lỗi do form tự hiện). */
export function useCreateQrCode() {
  return useResourceMutation({
    mutationFn: (input: QrCodeInput) => qrCodeService.create(input),
    invalidate: INVALIDATE,
    toastError: false,
  });
}

/** @param id - Id. @returns Mutation sửa mã QR (ảnh vẽ lại trong cùng attachment). */
export function useUpdateQrCode(id: string) {
  return useResourceMutation({
    mutationFn: (input: Partial<QrCodeInput>) => qrCodeService.update(id, input),
    invalidate: INVALIDATE,
    toastError: false,
  });
}

/** @returns Mutation xóa một mã QR. */
export function useDeleteQrCode() {
  return useResourceMutation({
    mutationFn: (id: string) => qrCodeService.remove(id),
    invalidate: INVALIDATE,
    success: "deleted",
  });
}

/** @returns Mutation xóa nhiều mã QR. */
export function useBulkDeleteQrCodes() {
  return useResourceMutation({
    mutationFn: (ids: string[]) => qrCodeService.bulkRemove(ids),
    invalidate: INVALIDATE,
    success: "bulkDeleted",
  });
}
