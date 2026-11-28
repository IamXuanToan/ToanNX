"use client";

import { cn } from "cn";
import { Check, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/shares/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shares/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/shares/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shares/components/ui/select";

import { FORM_CONTROL_TRIGGER_CLASS } from "./form-control.styles";
import { SEARCHABLE_THRESHOLD, useSelectField } from "./hooks/use-select-field";

/** Một lựa chọn của `SelectField`. */
export type SelectOption = {
  value: string;
  label: string;
  /** Dòng phụ dưới nhãn (mã, mô tả ngắn); cũng được tìm theo. */
  description?: string;
  /** Mã màu tùy chọn hiển thị chấm tròn nhận diện trước nhãn. */
  color?: string;
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
              <span className="flex items-center gap-2">
                {option.color ? (
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: option.color }}
                  />
                ) : null}
                <span>{option.label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Popover open={state.open} onOpenChange={state.setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          id={id}
          role="combobox"
          aria-expanded={state.open}
          aria-controls={state.listId}
          aria-invalid={invalid || undefined}
          aria-label={ariaLabel}
          disabled={disabled}
          className={cn(FORM_CONTROL_TRIGGER_CLASS, "justify-between", className)}
        >
          <span
            className={cn(
              "flex min-w-0 items-center gap-2 truncate",
              !selected && "text-muted-foreground",
            )}
          >
            {selected?.color ? (
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: selected.color }}
              />
            ) : null}
            <span className="truncate">{selected?.label ?? placeholder ?? t("placeholder")}</span>
          </span>
          <ChevronDown className="text-muted-foreground size-4 shrink-0" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) min-w-60 p-0">
        <Command shouldFilter={false} className="rounded-xl">
          <CommandInput
            value={state.keyword}
            onValueChange={state.onKeywordChange}
            placeholder={t("search")}
          />
          <CommandList id={state.listId} className="max-h-64 p-1">
            {state.filtered.length === 0 ? (
              <CommandEmpty>{t("empty")}</CommandEmpty>
            ) : (
              <CommandGroup>
                {state.filtered.map((option) => {
                  const isSelected = option.value === value;
                  return (
                    <CommandItem
                      key={option.value}
                      value={option.label}
                      disabled={option.disabled}
                      onSelect={() => !option.disabled && state.select(option.value)}
                      className="cursor-pointer gap-2"
                    >
                      <span className="flex min-w-0 flex-1 items-center gap-2">
                        {option.color ? (
                          <span
                            className="size-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: option.color }}
                          />
                        ) : null}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate">{option.label}</span>
                          {option.description ? (
                            <span className="text-muted-foreground block truncate text-xs">
                              {option.description}
                            </span>
                          ) : null}
                        </span>
                      </span>
                      {isSelected ? <Check className="text-primary size-4 shrink-0" /> : null}
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
