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
  const { open, value, setValue, handleOpenChange, handleSubmit } = useUrlPopover({
    initial,
    onApply,
    onOpen,
  });

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label={label}
          title={label}
          disabled={disabled}
        >
          {icon}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 space-y-2 rounded-xl">
        <form className="flex gap-2" onSubmit={handleSubmit}>
          <Input
            aria-label={label}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="https://"
            autoFocus
          />
          <Button type="submit">{t("apply")}</Button>
        </form>
        <FieldError>{error}</FieldError>
      </PopoverContent>
    </Popover>
  );
}
