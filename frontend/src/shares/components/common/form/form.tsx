"use client";

import { type ComponentProps, createContext, useContext, useId } from "react";

const FormIdContext = createContext<string | undefined>(undefined);

/**
 * Form hệ thống: luôn `noValidate` (lỗi hiển thị bằng React Hook Form/shadcn, không popup của trình
 * duyệt) và luôn có `id`, để nút submit nằm ngoài thẻ `<form>` (thanh nút ở đầu trang của `FormPage`)
 * vẫn gửi đúng form qua thuộc tính `form`.
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

/** @returns Id của `Form` gần nhất (cho nút submit đặt ngoài thẻ form). */
export function useFormId() {
  return useContext(FormIdContext);
}
