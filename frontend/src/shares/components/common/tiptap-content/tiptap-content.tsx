import type { AnyExtension, JSONContent } from "@tiptap/core";
import { renderToReactElement } from "@tiptap/static-renderer/pm/react";
import { cn } from "cn";

import { createBaseExtensions } from "../tiptap-editor/extensions";
import { TIPTAP_PROSE_CLASS } from "../tiptap-editor/hooks/use-tiptap-editor";

/**
 * Hiển thị tài liệu Tiptap ở chế độ chỉ đọc, chạy được ở server (không cần DOM): dùng cùng danh sách
 * extension với `TiptapEditor`, nên hiển thị đúng như lúc soạn. Module truyền node riêng qua `extensions`.
 *
 * @param props - Tài liệu, extension riêng, lớp thêm.
 * @returns Nội dung đã render.
 */
export function TiptapContent({
  content,
  extensions,
  className,
}: {
  content: JSONContent;
  extensions?: AnyExtension[];
  className?: string;
}) {
  return (
    <div className={cn(TIPTAP_PROSE_CLASS, className)}>
      {renderToReactElement({
        content,
        extensions: [...createBaseExtensions(), ...(extensions ?? [])],
      })}
    </div>
  );
}
