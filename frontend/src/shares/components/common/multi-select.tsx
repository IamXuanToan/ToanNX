"use client";

import { cn } from "cn";
import { Check, ChevronDown, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/shares/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/shares/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/shares/components/ui/popover";

import { FORM_CONTROL_TRIGGER_CLASS } from "./form-control.styles";
import { useMultiSelect } from "./hooks/use-multi-select";
import type { SelectOption } from "./select-field";

/**
 * Chọn nhiều giá trị (theo CommonMultiSelect của Medoly, dựng cùng khuôn popover với `SelectField`):
 * giá trị đã chọn là chip có nút xoá trong ô; popover có ô tìm (bỏ dấu), "Bỏ chọn tất cả",
 * danh sách có dấu tích. Điều khiển (controlled).
 *
 * @param props - Lựa chọn, giá trị, callback và trạng thái.
 * @returns Ô chọn nhiều.
 */
export function MultiSelect({
  options,
  value,
  onChange,
  id,
  placeholder,
  disabled,
  invalid,
  className,
  "aria-label": ariaLabel,
}: {
  options: SelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  const t = useTranslations("common.select");
  const {
    listId,
    open,
    keyword,
    setKeyword,
    filtered,
    selected,
    toggle,
    handleOpenChange,
    clearAll,
  } = useMultiSelect({ options, value, onChange });

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-invalid={invalid || undefined}
          aria-label={ariaLabel}
          disabled={disabled}
          className={cn(FORM_CONTROL_TRIGGER_CLASS, "h-auto min-h-10 py-1.5", className)}
        >
          <span className="flex min-w-0 flex-1 flex-wrap gap-1">
            {selected.length ? (
              selected.map((option) => (
                <span
                  key={option.value}
                  className="bg-secondary inline-flex h-7 max-w-40 items-center gap-1 rounded-lg pr-1 pl-2.5"
                >
                  <span className="truncate">{option.label}</span>
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={t("remove", { label: option.label })}
                    className="hover:bg-foreground/10 rounded-md p-0.5"
                    onClick={(event) => {
                      event.stopPropagation();
                      toggle(option.value);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        event.stopPropagation();
                        toggle(option.value);
                      }
                    }}
                  >
                    <X className="size-3.5" />
                  </span>
                </span>
              ))
            ) : (
              <span className="text-muted-foreground leading-7">
                {placeholder ?? t("placeholder")}
              </span>
            )}
          </span>
          <ChevronDown className="text-muted-foreground size-4 shrink-0" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) min-w-60 p-0">
        <Command className="rounded-xl">
          <CommandInput value={keyword} onValueChange={setKeyword} placeholder={t("search")} />
          <CommandList id={listId} aria-multiselectable className="max-h-64 p-1">
            {value.length ? (
              <div className="p-1">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-muted-foreground hover:bg-accent h-8 w-full justify-start text-xs font-normal"
                  onClick={clearAll}
                >
                  <X className="size-3.5" />
                  {t("clearAll")}
                </Button>
              </div>
            ) : null}
            {filtered.length === 0 ? (
              <CommandEmpty>{t("empty")}</CommandEmpty>
            ) : (
              <CommandGroup>
                {filtered.map((option) => {
                  const checked = value.includes(option.value);
                  return (
                    <CommandItem
                      key={option.value}
                      value={option.label}
                      disabled={option.disabled}
                      onSelect={() => toggle(option.value)}
                      className="cursor-pointer gap-2"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{option.label}</span>
                        {option.description ? (
                          <span className="text-muted-foreground block truncate text-xs">
                            {option.description}
                          </span>
                        ) : null}
                      </span>
                      {checked ? <Check className="text-primary size-4 shrink-0" /> : null}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
