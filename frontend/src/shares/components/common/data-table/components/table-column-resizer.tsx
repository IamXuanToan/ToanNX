"use client";

import { cn } from "cn";
import { useTranslations } from "next-intl";
import type { ComponentProps } from "react";

type ResizeControl = Pick<
  ComponentProps<"div">,
  | "onPointerDown"
  | "onPointerMove"
  | "onPointerUp"
  | "onPointerCancel"
  | "onLostPointerCapture"
  | "onDoubleClick"
  | "onKeyDown"
> & { min: number; max: number; value: number; active: boolean; edge: "left" | "right" };

/** @param props - Tên cột và handler resize do hook bảng cung cấp. @returns Tay nắm tách biệt thao tác sort/ghim, dùng được bằng bàn phím. */
export function TableColumnResizer({ label, control }: { label: string; control: ResizeControl }) {
  const t = useTranslations("common.table");
  const { min, max, value, active, edge, ...events } = control;
  return (
    <div
      {...events}
      role="separator"
      aria-orientation="vertical"
      aria-label={t("resizeColumn", { column: label })}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      tabIndex={0}
      title={t("resizeColumnHint")}
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => {
        event.stopPropagation();
        control.onDoubleClick?.(event);
      }}
      className={cn(
        "group/resize absolute inset-y-0 z-30 hidden w-3 cursor-col-resize touch-none outline-none select-none md:block",
        "after:bg-border hover:after:bg-primary focus-visible:after:bg-primary after:absolute after:inset-y-2 after:w-px after:transition-colors hover:after:w-0.5 focus-visible:after:w-0.5",
        edge === "left" ? "left-0 after:left-0" : "right-0 after:right-0",
        active && "after:bg-primary after:w-0.5",
      )}
    />
  );
}
