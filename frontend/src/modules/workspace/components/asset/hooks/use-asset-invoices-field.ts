"use client";

import { useState } from "react";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { ATTACHMENT_PERMISSIONS } from "@/modules/system/permissions/attachment-permission";

/** @returns Trạng thái mở AttachmentPicker (riêng tư) và quyền đọc/upload tệp. */
export function useAssetInvoicesField() {
  const [open, setOpen] = useState(false);
  const canReadAttachments = usePermission(ATTACHMENT_PERMISSIONS.read);
  const canUpload = usePermission(ATTACHMENT_PERMISSIONS.create);
  return { open, setOpen, canReadAttachments, canUpload };
}
