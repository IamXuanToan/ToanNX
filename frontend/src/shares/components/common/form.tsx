"use client";

import { type ComponentProps, useId } from "react";

import { FormIdContext } from "./form-id-context";

/**
 * Form hệ thống: luôn `noValidate` (lỗi hiển thị bằng React Hook Form/shadcn, không popup của trình
 * duyệt) và luôn có `id`, để nút submit nằm ngoài thẻ `<form>` (thanh nút ở đầu trang của `FormPage`)
 * vẫn gửi đúng form qua thuộc tính `form`. Đọc id bằng `useFormId`.
 *
 * @param props - Props của `<form>`.
 * @returns Thẻ form.
 */
export function Form({ id, ...props }: ComponentProps<"form">) {
  const generated = useId();
  const formId = id ?? generated;
  return (
    <FormIdContext.Provider value={formId}>
      <form {...props} id={formId} noValidate />
    </FormIdContext.Provider>
  );
}
