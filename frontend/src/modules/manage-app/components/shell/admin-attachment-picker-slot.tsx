"use client";

import { AttachmentPicker } from "@/modules/system/components/attachment/attachment-picker";
import { ATTACHMENT_PERMISSIONS } from "@/modules/system/permissions/attachment-permission";
import { usePermission } from "@/modules/system/hooks/use-permission";

export function AdminAttachmentPickerSlot(props: {
  onSelect: (file: { id: string; url: string }) => void;
  onClose: () => void;
}) {
  const canUpload = usePermission(ATTACHMENT_PERMISSIONS.create);
  return <AttachmentPicker canUpload={canUpload} {...props} />;
}
