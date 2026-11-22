"use client";

import type { ReactNode } from "react";

import { usePermission } from "../../hooks/use-permission";

type PermissionGateProps = {
  /** Mã quyền cần có. */
  permission: string;
  /** Nội dung hiển thị khi có quyền. */
  children: ReactNode;
  /** Nội dung thay thế khi không có quyền. */
  fallback?: ReactNode;
};

/**
 * Ẩn/hiện nội dung theo quyền. Chỉ điều khiển hiển thị; backend vẫn enforce quyền.
 *
 * @param props - Quyền, nội dung và nội dung thay thế.
 * @returns Nội dung phù hợp.
 */
export function PermissionGate({ permission, children, fallback = null }: PermissionGateProps) {
  return usePermission(permission) ? children : fallback;
}
