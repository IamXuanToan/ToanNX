"use client";

import { cn } from "cn";
import { Input } from "@/shares/components/ui/input";
import { Label } from "@/shares/components/ui/label";

const HEX_COLOR_PATTERN = /^#[0-9A-F]{6}$/i;

/**
 * Ô chọn màu chuẩn: ô tròn bấm mở bảng màu của trình duyệt + ô nhập mã HEX (`#RRGGBB`, viết hoa).
 * Điều khiển (controlled).
 *
 * @param props - Giá trị HEX, màu mặc định, nhãn ô chọn, callback; `inputClassName` chỉnh ô mã HEX khi đặt trên
 *   nền khác nền trang (ví dụ khung tối của trình sửa ảnh: chữ trắng trên nền mờ).
 * @returns Ô chọn màu.
 */
export function ColorInput({
  value,
  defaultColor = "#64748B",
  pickerLabel,
  placeholder = "#RRGGBB",
  disabled,
  invalid,
  inputClassName,
  onChange,
}: {
  value?: string;
  defaultColor?: string;
  pickerLabel: string;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  /** Class thêm cho ô nhập mã HEX (ghép bằng `cn`). */
  inputClassName?: string;
  onChange: (value: string) => void;
}) {
  const normalized = String(value ?? "").toUpperCase();
  const pickerValue = HEX_COLOR_PATTERN.test(normalized) ? normalized : defaultColor.toUpperCase();

  return (
    <div className="flex min-w-0 items-center gap-2">
      <Label
        className="border-input focus-within:ring-ring/50 relative size-10 shrink-0 cursor-pointer overflow-hidden rounded-xl border focus-within:ring-3"
        style={{ backgroundColor: pickerValue }}
      >
        <Input
          type="color"
          value={pickerValue}
          disabled={disabled}
          aria-label={pickerLabel}
          className="absolute inset-0 size-full cursor-pointer border-0 p-0 opacity-0 disabled:cursor-not-allowed"
          onChange={(event) => onChange(event.target.value.toUpperCase())}
        />
      </Label>
      <Input
        value={normalized}
        disabled={disabled}
        maxLength={7}
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        className={cn("min-w-0 font-mono uppercase", inputClassName)}
        onChange={(event) => onChange(event.target.value.toUpperCase())}
      />
    </div>
  );
}
