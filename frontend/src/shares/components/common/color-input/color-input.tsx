"use client";

import { Input } from "@/shares/components/ui/input";

const HEX_COLOR_PATTERN = /^#[0-9A-F]{6}$/i;

/**
 * Ô chọn màu chuẩn: ô tròn bấm mở bảng màu của trình duyệt + ô nhập mã HEX (`#RRGGBB`, viết hoa).
 * Điều khiển (controlled).
 *
 * @param props - Giá trị HEX, màu mặc định, nhãn ô chọn và callback.
 * @returns Ô chọn màu.
 */
export function ColorInput({
  value,
  defaultColor = "#64748B",
  pickerLabel,
  placeholder = "#RRGGBB",
  disabled,
  invalid,
  onChange,
}: {
  value?: string;
  defaultColor?: string;
  pickerLabel: string;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  onChange: (value: string) => void;
}) {
  const normalized = String(value ?? "").toUpperCase();
  const pickerValue = HEX_COLOR_PATTERN.test(normalized) ? normalized : defaultColor.toUpperCase();

  return (
    <div className="flex min-w-0 items-center gap-2">
      <label
        className="border-input focus-within:ring-ring/50 relative size-10 shrink-0 overflow-hidden rounded-xl border focus-within:ring-3"
        style={{ backgroundColor: pickerValue }}
      >
        <input
          type="color"
          value={pickerValue}
          disabled={disabled}
          aria-label={pickerLabel}
          className="absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
          onChange={(event) => onChange(event.target.value.toUpperCase())}
        />
      </label>
      <Input
        value={normalized}
        disabled={disabled}
        maxLength={7}
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        className="min-w-0 font-mono uppercase"
        onChange={(event) => onChange(event.target.value.toUpperCase())}
      />
    </div>
  );
}
