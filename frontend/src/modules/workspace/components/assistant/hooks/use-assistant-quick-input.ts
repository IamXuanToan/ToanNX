"use client";

import type { FormEvent } from "react";
import { useState } from "react";

import type { AssistantQuickInput } from "../../../types/assistant.types";

/**
 * State ô nhập nhanh dưới câu hỏi lựa chọn: giữ giá trị, ẩn/hiện mật khẩu và ghép đơn vị khi gửi số.
 *
 * @param input - Mô tả ô nhập (`number` kèm đơn vị, `text`, `secret`).
 * @param onSubmit - Gửi nội dung; `secret` cho biết cần che bong bóng chờ.
 * @returns Giá trị, kiểu input, cờ hiện mật khẩu và handler submit.
 */
export function useAssistantQuickInput(
  input: AssistantQuickInput,
  onSubmit: (text: string, options: { secret: boolean }) => void,
) {
  const [value, setValue] = useState("");
  const [revealed, setRevealed] = useState(false);
  const isSecret = input.kind === "secret";
  const isNumber = input.kind === "number";
  const trimmed = value.trim();
  const canSubmit = isNumber ? /^\d+$/.test(trimmed) && Number(trimmed) > 0 : trimmed.length > 0;

  function submit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!canSubmit) return;
    // Số được gửi kèm đơn vị ("15 phút") để server hiểu đúng ô đang hỏi.
    const text = isNumber && input.unit ? `${trimmed} ${input.unit}` : trimmed;
    onSubmit(text, { secret: isSecret });
    setValue("");
    setRevealed(false);
  }

  return {
    value,
    setValue,
    revealed,
    toggleRevealed: () => setRevealed((prev) => !prev),
    isSecret,
    isNumber,
    inputType: isNumber ? "number" : isSecret && !revealed ? "password" : "text",
    canSubmit,
    submit,
  };
}
