"use client";

import { useContext } from "react";

import { FormIdContext } from "../form-id-context";

/** @returns Id của `Form` gần nhất (cho nút submit đặt ngoài thẻ form). */
export function useFormId() {
  return useContext(FormIdContext);
}
