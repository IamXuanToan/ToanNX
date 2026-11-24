"use client";

import { useState } from "react";

import { useRouter } from "@/i18n/navigation";

import { UTILITIES_ROUTES } from "../../constants/routes";
import { PageCreateDialog } from "./page-create-dialog";

/**
 * Luồng khởi tạo trang tùy chỉnh: hiển thị dialog chọn kiểu trang và cài đặt ban đầu.
 *
 * @param props - Quyền tạo và cập nhật đường dẫn giữa.
 * @returns Dialog tạo trang toàn trang.
 */
export function PageCreateFlow({
  canCreatePath = false,
  canUpdatePath = false,
}: {
  canCreatePath?: boolean;
  canUpdatePath?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  return (
    <PageCreateDialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          router.push(UTILITIES_ROUTES.pages);
        }
      }}
      canCreatePath={canCreatePath}
      canUpdatePath={canUpdatePath}
    />
  );
}
