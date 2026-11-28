"use client";

import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import { Braces } from "lucide-react";

/**
 * Giao diện Badge hiển thị trường trộn `{{key}}` inline bên trong `TiptapEditor`.
 *
 * @param props - Thuộc tính NodeView từ Tiptap.
 * @returns Badge inline không thể sửa từng ký tự bên trong.
 */
export function MergeFieldBadgeView({ node }: NodeViewProps) {
  const fieldKey = String(node.attrs.fieldKey || "");
  const label = String(node.attrs.label || "");

  return (
    <NodeViewWrapper
      as="span"
      data-merge-field={fieldKey}
      contentEditable={false}
      className="border-primary/30 bg-primary/10 text-primary mx-0.5 inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 align-baseline font-mono text-xs font-medium select-none"
    >
      <Braces className="size-3 shrink-0 opacity-75" aria-hidden="true" />
      <span>{label ? `${label} · {{${fieldKey}}}` : `{{${fieldKey}}}`}</span>
    </NodeViewWrapper>
  );
}
