"use client";

import { cn } from "cn";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useMemo, useState } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/shares/components/ui/popover";
import { filterOptionsByKeyword } from "@/shares/lib/search-text";

import {
  FORM_CONTROL_OPTION_CLASS,
  FORM_CONTROL_POPOVER_CLASS,
  FORM_CONTROL_TRIGGER_CLASS,
} from "../form-control/form-control.styles";
import type { SelectOption } from "../select-field/select-field";

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
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const filtered = useMemo(() => filterOptionsByKeyword(options, keyword), [options, keyword]);
  const selected = options.filter((option) => value.includes(option.value));
  const toggle = (next: string) =>
    onChange(value.includes(next) ? value.filter((item) => item !== next) : [...value, next]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setKeyword("");
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
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
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={cn("w-(--radix-popover-trigger-width) min-w-60", FORM_CONTROL_POPOVER_CLASS)}
      >
        <div className="relative">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden
          />
          <input
            autoFocus
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder={t("search")}
            aria-label={t("search")}
            className="placeholder:text-muted-foreground h-10 w-full rounded-lg bg-transparent pr-3 pl-9 text-sm outline-none"
          />
        </div>
        <div className="bg-border -mx-1 h-px" />
        <ul id={listId} role="listbox" aria-multiselectable className="max-h-64 overflow-y-auto">
          {value.length ? (
            <li>
              <button
                type="button"
                className={cn(FORM_CONTROL_OPTION_CLASS, "text-muted-foreground hover:bg-accent")}
                onClick={() => onChange([])}
              >
                <X className="size-4" />
                {t("clearAll")}
              </button>
            </li>
          ) : null}
          {filtered.length === 0 ? (
            <li className="text-muted-foreground px-3 py-6 text-center text-sm">{t("empty")}</li>
          ) : (
            filtered.map((option) => {
              const checked = value.includes(option.value);
              return (
                <li key={option.value} role="option" aria-selected={checked}>
                  <button
                    type="button"
                    disabled={option.disabled}
                    className={cn(
                      FORM_CONTROL_OPTION_CLASS,
                      "hover:bg-accent disabled:pointer-events-none disabled:opacity-50",
                    )}
                    onClick={() => toggle(option.value)}
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
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
