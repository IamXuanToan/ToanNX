"use client";

import { useState } from "react";

import type { Pagination } from "@/shares/types/api.types";

/**
 * Khoảng bản ghi đang xem (đánh số từ 1).
 *
 * @param pagination - Thông tin phân trang.
 * @returns `{ from, to }`; không có bản ghi thì `{ 0, 0 }`.
 */
export function getPageRange({ page, pageSize, total }: Pagination): { from: number; to: number } {
  if (total === 0) return { from: 0, to: 0 };
  return { from: (page - 1) * pageSize + 1, to: Math.min(page * pageSize, total) };
}

/**
 * Chuẩn hoá số trang người dùng gõ vào ô "Đến trang".
 *
 * @param raw - Chuỗi người dùng nhập.
 * @param totalPages - Tổng số trang.
 * @returns Trang hợp lệ trong [1, totalPages], hoặc null khi không phải số.
 */
export function parseJumpPage(raw: string, totalPages: number): number | null {
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value)) return null;
  return Math.min(Math.max(value, 1), Math.max(totalPages, 1));
}

/**
 * Hook quản lý trạng thái phân trang, tính toán dải bản ghi hiển thị và nhảy trang của DataPagination.
 *
 * @param pagination - Đối tượng dữ liệu phân trang.
 * @param onPageChange - Callback khi trang thay đổi.
 * @returns Dải bản ghi, chuỗi trang nhảy, hàm đổi chuỗi nhảy và hàm thực hiện nhảy trang.
 */
export function useDataPagination({
  pagination,
  onPageChange,
}: {
  pagination: Pagination;
  onPageChange: (page: number) => void;
}) {
  const { page } = pagination;
  const totalPages = Math.max(pagination.totalPages, 1);
  const { from, to } = getPageRange(pagination);
  const [jump, setJump] = useState(String(page));
  const [prevPage, setPrevPage] = useState(page);

  if (prevPage !== page) {
    setPrevPage(page);
    setJump(String(page));
  }

  const goTo = () => {
    const target = parseJumpPage(jump, totalPages);
    if (target === null) {
      setJump(String(page));
    } else if (target !== page) {
      onPageChange(target);
    } else {
      setJump(String(page));
    }
  };

  const handleJumpChange = (raw: string) => {
    setJump(raw.replace(/\D/g, ""));
  };

  return {
    from,
    to,
    totalPages,
    jump,
    handleJumpChange,
    goTo,
  };
}
