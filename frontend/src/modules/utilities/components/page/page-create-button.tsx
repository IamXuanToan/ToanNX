"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/shares/components/ui/button";

import { PageCreateDialog } from "./page-create-dialog";

/**
 * Nút mở dialog tạo trang mới hỗ trợ cấu hình cài đặt ban đầu.
 *
 * @param props - Quyền tạo đường dẫn, quyền sửa đường dẫn và link quay lại.
 * @returns Nút bấm và Dialog tạo trang.
 */
export function PageCreateButton({
  canCreatePath = false,
  canUpdatePath = false,
  portalMode = false,
}: {
  canCreatePath?: boolean;
  canUpdatePath?: boolean;
  portalMode?: boolean;
}) {
  const t = useTranslations("utilities.customPages.pages");
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)} className="gap-1.5">
        <Plus className="size-4" />
        <span>{t("create")}</span>
      </Button>
      <PageCreateDialog
        open={open}
        onOpenChange={setOpen}
        canCreatePath={canCreatePath}
        canUpdatePath={canUpdatePath}
        portalMode={portalMode}
      />
    </>
  );
}
