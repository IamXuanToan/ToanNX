"use client";

import { useId } from "react";

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/shares/components/ui/field";
import { Switch } from "@/shares/components/ui/switch";

/**
 * Hàng công tắc có nhãn và mô tả (dùng trong form).
 *
 * @param props - Nhãn, mô tả, giá trị và callback.
 * @returns Field công tắc.
 */
export function SwitchField({
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
  error,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  error?: { message?: string };
}) {
  const id = useId();
  return (
    <Field orientation="horizontal" data-invalid={Boolean(error)} className="rounded-lg border p-3">
      <FieldContent>
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        {description ? (
          <FieldDescription id={`${id}-description`}>{description}</FieldDescription>
        ) : null}
        <FieldError id={`${id}-error`} errors={[error]} />
      </FieldContent>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={
          [description ? `${id}-description` : "", error ? `${id}-error` : ""]
            .filter(Boolean)
            .join(" ") || undefined
        }
      />
    </Field>
  );
}
