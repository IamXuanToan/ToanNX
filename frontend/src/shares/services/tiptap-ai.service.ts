import { apiClient } from "@/shares/lib/api/api-client";

export type TiptapAiMode = "generate" | "rewrite" | "expand" | "summarize" | "fix_grammar";

export type TiptapAiComposePayload = {
  prompt: string;
  mode: TiptapAiMode;
  selectedText?: string;
  documentContext?: string;
  usePersonalRag?: boolean;
};

export type TiptapAiComposeResult = {
  html: string;
  modelUsed: string;
  tokensUsed: number;
  ragSources: string[];
};

/** Service gọi AI sinh & biên tập nội dung chuẩn HTML Tiptap (kèm RAG cá nhân). */
export const tiptapAiService = {
  async compose(payload: TiptapAiComposePayload): Promise<TiptapAiComposeResult> {
    return (
      await apiClient.post<TiptapAiComposeResult>("/workspace/assistant/compose", payload, {
        timeoutMs: 65_000,
      })
    ).data;
  },
};
