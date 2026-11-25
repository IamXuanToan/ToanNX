"use client";

import { cn } from "cn";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { KeyboardEvent } from "react";

import { Button } from "@/shares/components/ui/button";
import { Calendar } from "@/shares/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/shares/components/ui/popover";
import { getDateDisplayFormat, getDateFnsLocale } from "@/shares/lib/date-fns-locale";

import { FORM_CONTROL_TRIGGER_CLASS } from "./form-control.styles";
import { useDatePicker } from "./hooks/use-date-picker";

/** Props của `DatePicker`. */
export type DatePickerProps = {
  id?: string;
  /** Ngày ISO `yyyy-MM-dd`, rỗng = chưa chọn. */
  value?: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  invalid?: boolean;
  className?: string;
  fromDate?: Date;
  toDate?: Date;
};

/**
 * Chọn ngày chuẩn (theo CommonDatePicker của Medoly): nút cao 40px hiển thị ngày theo ngôn ngữ
 * (`dd/MM/yyyy` ở vi), lịch có dropdown tháng/năm, nút "Hôm nay" và "Xoá". Giá trị là chuỗi ISO
 * `yyyy-MM-dd` để gửi thẳng backend. Điều khiển (controlled).
 *
 * @param props - Xem `DatePickerProps`.
 * @returns Ô chọn ngày.
 */
export function DatePicker({
  id,
  value,
  onChange,
  placeholder,
  disabled,
  clearable = true,
  invalid,
  className,
  fromDate,
  toDate,
}: DatePickerProps) {
  const t = useTranslations("common.datePicker");
  const locale = useLocale();
  const dateFnsLocale = getDateFnsLocale(locale);
  const { open, setOpen, calendarId, selected, year, select, clear } = useDatePicker({
    value,
    onChange,
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-haspopup="dialog"
          aria-controls={calendarId}
          disabled={disabled}
          aria-expanded={open}
          aria-invalid={invalid || undefined}
          className={cn(FORM_CONTROL_TRIGGER_CLASS, className)}
        >
          <CalendarIcon className="text-muted-foreground size-4 shrink-0" aria-hidden />
          <span className={cn("min-w-0 flex-1 truncate", !selected && "text-muted-foreground")}>
            {selected
              ? format(selected, getDateDisplayFormat(locale), { locale: dateFnsLocale })
              : (placeholder ?? t("placeholder"))}
          </span>
          {clearable && value && !disabled ? (
            <span
              role="button"
              tabIndex={0}
              aria-label={t("clear")}
              className="text-muted-foreground hover:text-foreground shrink-0 rounded-md"
              onClick={clear}
              onKeyDown={(event: KeyboardEvent) => {
                if (event.key === "Enter" || event.key === " ") clear(event);
              }}
            >
              <X className="size-4" />
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        id={calendarId}
        className="w-auto gap-0 overflow-hidden rounded-xl p-0"
        align="start"
      >
        <Calendar
          mode="single"
          captionLayout="dropdown"
          selected={selected}
          defaultMonth={selected ?? new Date()}
          startMonth={fromDate ?? new Date(year - 100, 0)}
          endMonth={toDate ?? new Date(year + 10, 11)}
          locale={dateFnsLocale}
          disabled={[
            ...(fromDate ? [{ before: fromDate }] : []),
            ...(toDate ? [{ after: toDate }] : []),
          ]}
          onSelect={select}
        />
        <div className="flex items-center justify-between gap-2 border-t px-3 py-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs font-medium"
            onClick={() => select(new Date())}
          >
            {t("today")}
          </Button>
          {clearable ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground text-xs font-medium"
              disabled={!value}
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              {t("clear")}
            </Button>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
