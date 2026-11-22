"use client";

import { useState } from "react";

import { useQrCodes } from "../../../hooks/use-qr-codes";

/**
 * Hook quản lý tìm kiếm và truy vấn danh sách mã QR cho component QrCodePicker.
 *
 * @param open - Trạng thái mở của dialog picker.
 * @returns Trạng thái tìm kiếm, danh sách mã QR và cờ đang tải.
 */
export function useQrCodePicker({ open }: { open: boolean }) {
  const [search, setSearch] = useState("");
  const query = useQrCodes({ search, page: 1, pageSize: 60, ordering: "-updated_at" }, open);
  const items = query.data?.items ?? [];

  return {
    search,
    setSearch,
    items,
    isPending: query.isPending,
  };
}
