"use client";

import { useState } from "react";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { ATTACHMENT_PERMISSIONS } from "@/modules/system/permissions/attachment-permission";

/** @returns Trạng thái mở thư viện + quyền upload. */
export function useInvoiceAttachmentsField() {
  const [open, setOpen] = useState(false);
  const canUpload = usePermission(ATTACHMENT_PERMISSIONS.create);
  return { open, setOpen, canUpload };
}
