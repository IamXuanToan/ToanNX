"use client";

import { useId, useState } from "react";

import type { AdminModule } from "@/shares/types/navigation.types";

/**
 * Thuộc tính của hook `useSidebarModuleGroup`.
 */
export interface UseSidebarModuleGroupProps {
  /** Đối tượng module chứa các item điều hướng */
  module: AdminModule;
  /** Hàm kiểm tra một href có đang active hay không */
  isActive: (href: string) => boolean;
}

/**
 * Hook quản lý trạng thái mở/đóng và nhận diện trang đang active cho nhóm module trên Sidebar.
 *
 * @param props - Thuộc tính `UseSidebarModuleGroupProps`.
 * @returns Trạng thái mở rộng (expanded), id vùng nội dung aria-controls và hàm toggle mở/đóng.
 */
export function useSidebarModuleGroup({ module, isActive }: UseSidebarModuleGroupProps) {
  const [open, setOpen] = useState(true);
  const contentId = useId();
  const containsActive = module.items.some((item) => isActive(item.href));
  // Nhóm chứa trang đang xem không bao giờ bị đóng
  const expanded = open || containsActive;

  return {
    expanded,
    contentId,
    toggleOpen: () => setOpen(!expanded),
  };
}
