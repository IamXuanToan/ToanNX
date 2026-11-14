"use client";

import { useState } from "react";

import { useRouter } from "@/i18n/navigation";
import { APP_ROUTES } from "@/shares/constants/routes";

import type { RoleDetail } from "../../../types/iam.types";

/**
 * Trạng thái dialog tạo vai trò; tạo xong chuyển tới trang chi tiết để gán quyền.
 *
 * @returns Trạng thái mở và callback hoàn tất.
 */
export function useCreateRoleDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return {
    open,
    setOpen,
    onDone: (role: RoleDetail) => {
      setOpen(false);
      router.push(APP_ROUTES.adminRoleDetail(role.id));
    },
  };
}
