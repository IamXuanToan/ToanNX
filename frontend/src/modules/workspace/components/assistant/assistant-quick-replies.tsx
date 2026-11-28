"use client";

import { Button } from "@/shares/components/ui/button";

import type {
  AssistantQuickInput as AssistantQuickInputData,
  AssistantQuickReply,
} from "../../types/assistant.types";
import { AssistantQuickInput } from "./assistant-quick-input";

/**
 * Khối trả lời nhanh dưới câu hỏi của Trợ lý: chip lựa chọn gọn (bấm là gửi) và ô nhập trực tiếp khi câu hỏi cho
 * phép gõ giá trị khác (số kèm đơn vị, chữ, mật khẩu).
 *
 * @param props - Lựa chọn, mô tả ô nhập, trạng thái khóa và hàm gửi.
 * @returns Khối trả lời nhanh hoặc `null` khi không có gì để chọn/nhập.
 */
export function AssistantQuickReplies({
  replies,
  input,
  disabled,
  label,
  onSelect,
}: {
  replies: AssistantQuickReply[];
  input?: AssistantQuickInputData | null;
  disabled: boolean;
  label: string;
  onSelect: (text: string, options?: { secret: boolean }) => void;
}) {
  if (replies.length === 0 && !input) return null;
  return (
    <div className="space-y-1.5" data-testid="assistant-quick-replies">
      {replies.length > 0 ? (
        <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
          {replies.map((reply) => (
            <Button
              key={`${reply.caption}-${reply.text}`}
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => onSelect(reply.text)}
              className="hover:border-primary/50 hover:bg-primary/5 hover:text-primary h-7 rounded-full px-3 text-xs font-medium"
            >
              {reply.caption}
            </Button>
          ))}
        </div>
      ) : null}
      {input ? <AssistantQuickInput input={input} disabled={disabled} onSubmit={onSelect} /> : null}
    </div>
  );
}
