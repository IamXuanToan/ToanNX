import type { AnyExtension, JSONContent } from "@tiptap/core";
import { renderToReactElement } from "@tiptap/static-renderer/pm/react";
import { cn } from "cn";
import Image from "next/image";

import { AppTooltip } from "./app-tooltip";
import {
  createBaseExtensions,
  formatTiptapImageWidth,
  getTiptapImageWrapperAlignClass,
} from "./tiptap-extensions";
import { TIPTAP_PROSE_CLASS } from "./hooks/use-tiptap-editor";

/**
 * Hiển thị tài liệu Tiptap ở chế độ chỉ đọc, chạy được ở server (không cần DOM): dùng cùng danh sách
 * extension với `TiptapEditor`, nên hiển thị đúng như lúc soạn (kể cả kích thước & căn lề ảnh).
 * Module truyền node riêng qua `extensions`.
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
        options: {
          nodeMapping: {
            taskItem: ({ node, children }) => (
              <li
                data-type="taskItem"
                data-checked={node.attrs?.checked ? "true" : "false"}
                className="flex items-start gap-2.5"
              >
                <span
                  aria-hidden
                  className={cn(
                    "mt-1 flex size-4 shrink-0 items-center justify-center rounded border text-[10px] font-bold",
                    node.attrs?.checked
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background",
                  )}
                >
                  {node.attrs?.checked ? "✓" : ""}
                </span>
                <div className="min-w-0 flex-1 [&_p]:my-0">{children}</div>
              </li>
            ),
            image: ({ node }) => {
              const src = typeof node.attrs?.src === "string" ? node.attrs.src : "";
              if (!src) return null;
              const alt = typeof node.attrs?.alt === "string" ? node.attrs.alt : "";
              const title = typeof node.attrs?.title === "string" ? node.attrs.title : undefined;
              const align = typeof node.attrs?.align === "string" ? node.attrs.align : null;
              const cssWidth = formatTiptapImageWidth(node.attrs?.width, align);

              const imageElement = (
                <Image
                  src={src}
                  alt={alt}
                  width={1200}
                  height={800}
                  unoptimized
                  style={{ width: cssWidth ? "100%" : "auto", height: "auto" }}
                  className="block max-w-full rounded-xl"
                />
              );

              return (
                <figure className={cn("my-3 flex w-full", getTiptapImageWrapperAlignClass(align))}>
                  <div
                    className={cn("max-w-full", !cssWidth && "w-auto")}
                    style={cssWidth ? { width: cssWidth } : undefined}
                  >
                    {title ? <AppTooltip content={title}>{imageElement}</AppTooltip> : imageElement}
                    {alt ? (
                      <figcaption className="text-muted-foreground mt-1.5 text-center text-xs">
                        {alt}
                      </figcaption>
                    ) : null}
                  </div>
                </figure>
              );
            },
          },
        },
      })}
    </div>
  );
}
