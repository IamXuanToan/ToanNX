"use client";

import { Eye, EyeOff, SendHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";

import { AppTooltip } from "@/shares/components/common/app-tooltip";
import { Button } from "@/shares/components/ui/button";
import { Input } from "@/shares/components/ui/input";

import type { AssistantQuickInput as AssistantQuickInputData } from "../../types/assistant.types";
import { useAssistantQuickInput } from "./hooks/use-assistant-quick-input";

/**
 * Ô nhập gọn ngay dưới câu hỏi lựa chọn: gõ số kèm đơn vị, chữ tự do hoặc mật khẩu (có nút ẩn/hiện).
 *
 * @param props - Mô tả ô nhập, trạng thái khóa và hàm gửi.
 * @returns Form một dòng.
 */
export function AssistantQuickInput({
  input,
  disabled,
  onSubmit,
}: {
  input: AssistantQuickInputData;
  disabled: boolean;
  onSubmit: (text: string, options: { secret: boolean }) => void;
}) {
  const t = useTranslations("workspace.assistant.quickInput");
  const state = useAssistantQuickInput(input, onSubmit);
  const sendLabel = t("send");
  const toggleLabel = state.revealed ? t("hideSecret") : t("showSecret");

  return (
    <form
      onSubmit={state.submit}
      className="flex items-center gap-1.5"
      data-testid="assistant-quick-input"
      autoComplete="off"
    >
      <div className="relative min-w-0 flex-1">
        <Input
          type={state.inputType}
          inputMode={state.isNumber ? "numeric" : undefined}
          min={state.isNumber ? 1 : undefined}
          value={state.value}
          onChange={(event) => state.setValue(event.target.value)}
          placeholder={input.placeholder}
          aria-label={input.placeholder}
          disabled={disabled}
          autoComplete={state.isSecret ? "new-password" : "off"}
          className={
            state.isSecret || input.unit
              ? "h-8 rounded-full pr-14 text-sm"
              : "h-8 rounded-full text-sm"
          }
        />
        {state.isNumber && input.unit ? (
          <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs">
            {input.unit}
          </span>
        ) : null}
        {state.isSecret ? (
          <AppTooltip content={toggleLabel}>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={toggleLabel}
              onClick={state.toggleRevealed}
              disabled={disabled}
              className="absolute top-1/2 right-1 size-6 -translate-y-1/2 rounded-full"
            >
              {state.revealed ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </Button>
          </AppTooltip>
        ) : null}
      </div>
      <AppTooltip content={sendLabel}>
        <span className="inline-flex">
          <Button
            type="submit"
            size="icon"
            aria-label={sendLabel}
            disabled={disabled || !state.canSubmit}
            className="size-8 shrink-0 rounded-full"
          >
            <SendHorizontal className="size-3.5" />
          </Button>
        </span>
      </AppTooltip>
    </form>
  );
}
