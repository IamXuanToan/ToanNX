"use client";

import { cn } from "cn";
import { type ReactNode, useId } from "react";

import { Checkbox } from "@/shares/components/ui/checkbox";
import { FieldDescription } from "@/shares/components/ui/field";
import { Label } from "@/shares/components/ui/label";

/**
 * Checkbox có nhãn (và mô tả) chuẩn — cả nhãn bấm được. Bật/tắt một thiết lập dạng công tắc thì dùng
 * `SwitchField`; đồng ý/chọn trong danh sách thì dùng component này.
 *
 * @param props - Nhãn, mô tả, trạng thái và callback.
 * @returns Checkbox có nhãn.
 */
export function CheckboxField({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
  className,
}: {
  id?: string;
  label: ReactNode;
  description?: ReactNode;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}) {
  const generatedId = useId();
  const checkboxId = id ?? generatedId;
  return (
    <div className={cn("flex w-fit max-w-full flex-col gap-1.5", className)}>
      <div className="flex min-h-10 items-center gap-2.5">
        <Checkbox
          id={checkboxId}
          checked={checked}
          disabled={disabled}
          onCheckedChange={(value) => onCheckedChange?.(value === true)}
        />
        <Label
          htmlFor={checkboxId}
          className={cn(
            "cursor-pointer leading-snug font-normal",
            disabled && "cursor-not-allowed opacity-50",
          )}
        >
          {label}
        </Label>
      </div>
      {description ? (
        <FieldDescription className="pl-6.5 text-pretty">{description}</FieldDescription>
      ) : null}
    </div>
  );
}
