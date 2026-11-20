"use client";
import { useId, type ReactNode } from "react";
import { Controller, type Control, type FieldPath, type FieldValues, type ControllerRenderProps } from "react-hook-form";
import { Field, FieldLabel, FieldDescription, FieldError } from "@/shares/components/ui/field";
type Props<T extends FieldValues, TName extends FieldPath<T>> = {
  control: Control<T>;
  name: TName;
  label: ReactNode;
  description?: ReactNode;
  /** Trường bắt buộc: nhãn có dấu `*` đỏ, control có `aria-required`. */
  required?: boolean;
  children: (
    field: ControllerRenderProps<T, TName> & {
      id: string;
      "aria-invalid": boolean;
      "aria-required"?: boolean;
      "aria-describedby"?: string;
    },
  ) => ReactNode;
};
/**
 * Nối label, mô tả và lỗi RHF với mọi common input bằng id truy cập được. Trường bắt buộc truyền
 * `required`: nhãn có dấu `*` màu đỏ (chuẩn duy nhất để đánh dấu bắt buộc, không ghi "không bắt buộc").
 */
export function FormField<T extends FieldValues, TName extends FieldPath<T>>({
  control,
  name,
  label,
  description,
  required,
  children,
}: Props<T, TName>) {
  const id = useId();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          {/* Dấu * đứng ngoài <label> để tên truy cập của ô vẫn đúng là nhãn (đọc "bắt buộc" qua aria-required). */}
          <div className="flex items-center gap-1">
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            {required ? (
              <span aria-hidden className="text-destructive text-sm leading-none font-medium">
                *
              </span>
            ) : null}
          </div>
          {children({
            ...field,
            id,
            "aria-invalid": fieldState.invalid,
            "aria-required": required || undefined,
            "aria-describedby":
              [
                description && !fieldState.error ? id + "-description" : "",
                fieldState.error ? id + "-error" : "",
              ]
                .filter(Boolean)
                .join(" ") || undefined,
          })}
          {/* Dưới ô chỉ một dòng: có lỗi thì lỗi thế chỗ gợi ý. */}
          {description && !fieldState.error ? (
            <FieldDescription id={id + "-description"}>{description}</FieldDescription>
          ) : null}
          <FieldError id={id + "-error"} errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}
