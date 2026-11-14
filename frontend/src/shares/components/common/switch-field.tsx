"use client";

import { useId } from "react";

import { Field, FieldContent, FieldDescription, FieldLabel } from "@/shares/components/ui/field";
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
}: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <Field orientation="horizontal" className="rounded-lg border p-3">
      <FieldContent>
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        {description ? <FieldDescription>{description}</FieldDescription> : null}
      </FieldContent>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </Field>
  );
}
