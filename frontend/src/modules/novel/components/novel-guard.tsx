/**
 * Thành phần bảo vệ quyền truy cập vào module Novel (Truyện chữ).
 *
 * Kiểm tra điều kiện:
 * 1. Nếu người dùng chưa đăng nhập: chuyển hướng về trang đăng nhập với query `redirect`.
 * 2. Nếu đã đăng nhập nhưng tài khoản không có quyền đọc truyện (`!isNovel && !isSuperuser`):
 *    hiển thị toast từ chối và đưa về trang chủ.
 */

"use client";

import type { ReactNode } from "react";

import { Skeleton } from "@/shares/components/ui/skeleton";

import { useNovelGuard } from "./hooks/use-novel-guard";

/**
 * Thuộc tính của component `NovelGuard`.
 */
export type NovelGuardProps = {
  /** Nội dung được bảo vệ cần hiển thị khi có quyền */
  children: ReactNode;
};

/**
 * Guard bọc ngoài các trang của module Novel để kiểm tra xác thực và quyền `isNovel`.
 *
 * @param props - Thuộc tính `NovelGuardProps`.
 * @returns Khung nội dung nếu đủ quyền, hoặc skeleton trong thời gian kiểm tra.
 */
export function NovelGuard({ children }: NovelGuardProps) {
  const { isLoading, canAccess } = useNovelGuard();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[3/4] w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!canAccess) {
    return null;
  }

  return <>{children}</>;
}
