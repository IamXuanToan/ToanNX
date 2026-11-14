"use client";

import { type ChangeEvent, useState } from "react";

import { useUpdateModule, useUploadModuleIcon } from "../../../hooks/use-modules";
import type { ModuleInfo } from "../../../types/system.types";
import { isLucideIconName } from "../../module-icon/module-icon";

/** Chỉ nhận SVG; backend kiểm tra lại nội dung (không script, không link ngoài). */
export const SVG_ACCEPT = ".svg,image/svg+xml";

/**
 * State và hành động của dialog đổi icon module.
 *
 * @param module - Module đang sửa.
 * @returns State form, cờ hợp lệ và các hành động.
 */
export function useModuleIconDialog(module: ModuleInfo) {
  const [open, setOpen] = useState(false);
  const [iconName, setIconName] = useState(module.icon);
  const update = useUpdateModule();
  const upload = useUploadModuleIcon();
  const name = iconName.trim();
  const isNameValid = name === "" || isLucideIconName(name);

  return {
    open,
    setOpen: (value: boolean) => {
      setOpen(value);
      if (value) setIconName(module.icon);
    },
    iconName,
    setIconName,
    previewName: isNameValid && name ? name : module.icon,
    isNameValid,
    isBusy: update.isPending || upload.isPending,
    /** Lưu tên icon lucide (rỗng = về icon mặc định của module). */
    saveIconName: () => {
      if (!isNameValid) return;
      update.mutate({ code: module.code, input: { icon: name } });
    },
    /** Upload file SVG và đặt làm icon. */
    onFileChange: (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (file) upload.mutate({ code: module.code, file });
    },
    /** Gỡ icon SVG, quay về icon lucide. */
    removeSvg: () => update.mutate({ code: module.code, input: { iconId: null } }),
  };
}
