"use client";

import type { ReactNode } from "react";

import { cn } from "cn";
import { Button } from "@/shares/components/ui/button";

import { AppTooltip } from "./app-tooltip";

type TiptapToggleProps = {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
};

/** Nút bật/tắt định dạng nhỏ gọn trên thanh công cụ `TiptapToolbar`. */
export function TiptapToggle({ label, active, disabled, onClick, children }: TiptapToggleProps) {
  return (
    <AppTooltip content={label}>
      <span className="inline-flex">
        <Button
          type="button"
          size="icon-sm"
          variant={active ? "secondary" : "ghost"}
          aria-label={label}
          aria-pressed={active}
          disabled={disabled}
          onClick={onClick}
          className={cn(
            "rounded-lg transition-colors [&_svg]:size-4",
            active && "bg-primary/12 text-primary ring-primary/25 hover:bg-primary/18 ring-1",
          )}
        >
          {children}
        </Button>
      </span>
    </AppTooltip>
  );
}
