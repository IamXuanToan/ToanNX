"use client";

import { useState } from "react";

import { useRouter } from "@/i18n/navigation";
import { PageCreateDialog } from "@/modules/utilities/components/page/page-create-dialog";

import { PORTAL_ROUTES } from "../../constants/routes";

/**
 * Component Tạo trang mới cho Client Portal:
 * Mở dialog chọn loại trang và thiết lập ban đầu trước khi vào màn hình soạn thảo.
 *
 * @param props - Cờ quyền tạo và sửa đường dẫn.
 * @returns Giao diện tạo trang.
 */
export function PortalPageCreate({
  canCreatePath,
  canUpdatePath,
}: {
  canCreatePath: boolean;
  canUpdatePath: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  return (
    <PageCreateDialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          router.push(PORTAL_ROUTES.pages);
        }
      }}
      canCreatePath={canCreatePath}
      canUpdatePath={canUpdatePath}
      portalMode={true}
    />
  );
}
