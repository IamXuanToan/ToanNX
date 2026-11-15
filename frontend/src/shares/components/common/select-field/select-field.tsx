"use client";

import { cn } from "cn";
import { Check, ChevronDown, Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { Popover, PopoverContent, PopoverTrigger } from "@/shares/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shares/components/ui/select";

import { FORM_CONTROL_TRIGGER_CLASS } from "../form-control/form-control.styles";
import { SEARCHABLE_THRESHOLD, useSelectField } from "./hooks/use-select-field";

/** Một lựa chọn của `SelectField`. */
export type SelectOption = {
  value: string;
  label: string;
  /** Dòng phụ dưới nhãn (mã, mô tả ngắn); cũng được tìm theo. */
  description?: string;
  disabled?: boolean;
};

type SelectFieldProps = {
  options: SelectOption[];
  value: string | undefined;
  onValueChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  /** Ép dạng có/không ô tìm; mặc định tự bật khi có từ `SEARCHABLE_THRESHOLD` lựa chọn. */
  searchable?: boolean;
  className?: string;
  "aria-label"?: string;
};

/**
 * Select chuẩn của hệ thống: mọi ô chọn trong app dùng component này, không dùng `<select>`
 * hay `Select` của `ui/` trực tiếp. Ít lựa chọn → Select thường; nhiều lựa chọn
 * (≥ `SEARCHABLE_THRESHOLD`) → popover có ô tìm (không phân biệt dấu), điều khiển được bằng bàn phím.
 *
 * @param props - Lựa chọn, giá trị, callback và trạng thái.
 * @returns Ô chọn.
 */
export function SelectField({
  options,
  value,
  onValueChange,
  id,
  placeholder,
  disabled,
  invalid,
  searchable,
  className,
  "aria-label": ariaLabel,
}: SelectFieldProps) {
  const t = useTranslations("common.select");
  const state = useSelectField(options, onValueChange);
  const selected = options.find((option) => option.value === value);
  const isSearchable = searchable ?? options.length >= SEARCHABLE_THRESHOLD;

  if (!isSearchable) {
    return (
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger
          id={id}
          aria-invalid={invalid || undefined}
          aria-label={ariaLabel}
          className={cn("w-full", className)}
        >
          <SelectValue placeholder={placeholder ?? t("placeholder")} />
        </SelectTrigger>
        <SelectContent position="popper" className="rounded-xl p-1">
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              className="h-10 rounded-lg px-3"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Popover open={state.open} onOpenChange={state.setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          role="combobox"
          aria-expanded={state.open}
          aria-controls={state.listId}
          aria-invalid={invalid || undefined}
          aria-label={ariaLabel}
          disabled={disabled}
          className={cn(FORM_CONTROL_TRIGGER_CLASS, "justify-between", className)}
        >
          <span className={cn("min-w-0 truncate", !selected && "text-muted-foreground")}>
            {selected?.label ?? placeholder ?? t("placeholder")}
          </span>
          <ChevronDown className="text-muted-foreground size-4 shrink-0" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) min-w-60 gap-1 rounded-xl p-1"
      >
        <div className="relative">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden
          />
          <input
            autoFocus
            value={state.keyword}
            onChange={(event) => state.onKeywordChange(event.target.value)}
            onKeyDown={state.onKeyDown}
            placeholder={t("search")}
            aria-label={t("search")}
            aria-controls={state.listId}
            className="placeholder:text-muted-foreground h-10 w-full rounded-lg bg-transparent pr-3 pl-9 text-sm outline-none"
          />
        </div>
        <div className="bg-border -mx-1 h-px" />
        <ul id={state.listId} role="listbox" className="max-h-64 overflow-y-auto">
          {state.filtered.length === 0 ? (
            <li className="text-muted-foreground px-3 py-6 text-center text-sm">{t("empty")}</li>
          ) : (
            state.filtered.map((option, index) => {
              const isSelected = option.value === value;
              return (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={option.disabled || undefined}
                  onMouseEnter={() => state.setActiveIndex(index)}
                  onClick={() => !option.disabled && state.select(option.value)}
                  className={cn(
                    "flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-sm",
                    index === state.activeIndex && "bg-accent",
                    option.disabled && "pointer-events-none opacity-50",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{option.label}</span>
                    {option.description ? (
                      <span className="text-muted-foreground block truncate text-xs">
                        {option.description}
                      </span>
                    ) : null}
                  </span>
                  {isSelected ? <Check className="text-primary size-4 shrink-0" /> : null}
                </li>
              );
            })
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
