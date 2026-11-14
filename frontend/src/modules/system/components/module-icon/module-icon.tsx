"use client";

import { Boxes } from "lucide-react";
import { DynamicIcon, type IconName, iconNames } from "lucide-react/dynamic";

import { cn } from "cn";

const ICON_NAMES = new Set<string>(iconNames);

/**
 * Tên có phải icon lucide-react hợp lệ hay không.
 *
 * @param name - Tên kebab-case, ví dụ `shield-check`.
 * @returns True nếu lucide có icon này.
 */
export function isLucideIconName(name: string): name is IconName {
  return ICON_NAMES.has(name);
}

/**
 * Icon của module: SVG tự upload (`iconUrl`, URL tuyệt đối từ backend) hoặc icon lucide theo tên.
 * Tên không hợp lệ → icon mặc định `Boxes`.
 *
 * @param props - `icon`, `iconUrl`, className, nhãn trợ năng.
 * @returns Icon.
 */
export function ModuleIcon({
  icon,
  iconUrl,
  className,
  label,
}: {
  icon: string;
  iconUrl?: string | null;
  className?: string;
  label?: string;
}) {
  const classes = cn("size-4 shrink-0", className);
  if (iconUrl) {
    // SVG phục vụ từ media/object storage: dùng <img> (không chạy script trong SVG), không qua next/image.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={iconUrl} alt={label ?? ""} className={cn(classes, "object-contain")} />;
  }
  if (isLucideIconName(icon)) {
    return (
      <DynamicIcon
        name={icon}
        className={classes}
        aria-label={label}
        aria-hidden={label ? undefined : true}
        fallback={() => <Boxes className={classes} aria-hidden />}
      />
    );
  }
  return <Boxes className={classes} aria-label={label} aria-hidden={label ? undefined : true} />;
}
