"use client";

import { cn } from "cn";
import { type ReactNode, useId } from "react";

import {
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/shares/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/shares/components/ui/radio-group";

/** Một lựa chọn của `RadioGroupField`. */
export type RadioOption = {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
};

/**
 * Nhóm lựa chọn một-trong-nhiều dạng thẻ (2–5 lựa chọn cần mô tả). Lựa chọn ngắn, nhiều hơn 5
 * thì dùng `SelectField`. Thẻ đang chọn viền + nền màu nhấn nhạt.
 *
 * @param props - Tiêu đề nhóm, lựa chọn, giá trị và callback.
 * @returns Nhóm radio.
 */
export function RadioGroupField({
  name,
  legend,
  description,
  value,
  onChange,
  options,
  disabled,
  className,
}: {
  name?: string;
  legend?: ReactNode;
  description?: ReactNode;
  value?: string | null;
  onChange: (value: string) => void;
  options: RadioOption[];
  disabled?: boolean;
  className?: string;
}) {
  const groupId = useId();
  return (
    <FieldSet className={cn("gap-3", className)}>
      {legend ? <FieldLegend variant="label">{legend}</FieldLegend> : null}
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <RadioGroup
        name={name}
        value={value ?? undefined}
        onValueChange={onChange}
        disabled={disabled}
        className="gap-2"
      >
        {options.map((option) => {
          const itemId = `${groupId}-${option.value}`;
          return (
            <FieldLabel
              key={option.value}
              htmlFor={itemId}
              className={cn(
                "hover:bg-surface-hover flex w-full cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
                "has-data-checked:border-primary/40 has-data-checked:bg-primary-light",
                (disabled || option.disabled) && "cursor-not-allowed opacity-50",
              )}
            >
              <RadioGroupItem
                value={option.value}
                id={itemId}
                disabled={option.disabled}
                className="mt-0.5"
              />
              <FieldContent>
                <FieldTitle>{option.label}</FieldTitle>
                {option.description ? (
                  <FieldDescription>{option.description}</FieldDescription>
                ) : null}
              </FieldContent>
            </FieldLabel>
          );
        })}
      </RadioGroup>
    </FieldSet>
  );
}
