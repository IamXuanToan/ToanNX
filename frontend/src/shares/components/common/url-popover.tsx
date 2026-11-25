"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Button } from "@/shares/components/ui/button";
import { FieldError } from "@/shares/components/ui/field";
import { Input } from "@/shares/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/shares/components/ui/popover";

import { useUrlPopover } from "./hooks/use-url-popover";

/** Ô nhập URL trong popover (liên kết, ảnh URL ngoài, video). */
export function UrlPopover({
  label,
  icon,
  disabled,
  initial = "",
  onApply,
  error,
  onOpen,
}: {
  label: string;
  icon: ReactNode;
  disabled?: boolean;
  initial?: string;
  onApply: (value: string) => boolean;
  error: string;
  onOpen: () => void;
}) {
  const t = useTranslations("common.editor");
  const { open, value, setValue, handleOpenChange, applyValue, handleKeyDown } = useUrlPopover({
    initial,
    onApply,
    onOpen,
  });

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label={label}
          title={label}
          disabled={disabled}
          className="rounded-lg"
        >
          {icon}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 space-y-2 rounded-xl" align="start">
        <div className="flex gap-2" role="group" aria-label={label}>
          <Input
            aria-label={label}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="https://"
            autoFocus
            className="h-9"
          />
          <Button type="button" size="sm" onClick={applyValue} className="h-9 shrink-0">
            {t("apply")}
          </Button>
        </div>
        <FieldError>{error}</FieldError>
      </PopoverContent>
    </Popover>
  );
}
