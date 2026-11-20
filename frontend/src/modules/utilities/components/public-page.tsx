import Image from "next/image";
import { cn } from "cn";
import type { CSSProperties } from "react";

import { TiptapContent } from "@/shares/components/common/tiptap-content";

import { PAGE_EXTENSIONS } from "../extensions/page-extensions";
import type { PublicPage as PublicPageData } from "../types/page.types";

const BUTTON_RADIUS = {
  rounded: "[&_.page-button]:rounded-xl",
  square: "[&_.page-button]:rounded-none",
  pill: "[&_.page-button]:rounded-full",
} as const;

/**
 * Trang công khai đã render (chạy được ở server): ảnh bìa, ảnh đại diện, tiêu đề, nội dung Tiptap theo theme.
 * Nội dung đã được BE lọc (ảnh xóa, link rút gọn tắt bị bỏ) nên chỉ hiển thị.
 *
 * @param props - Dữ liệu công khai.
 * @returns Trang.
 */
export function PublicPage({ page }: { page: PublicPageData }) {
  const theme = page.theme;
  const style = {
    "--page-primary": theme.primaryColor ?? "#2563eb",
    ...(theme.backgroundColor ? { backgroundColor: theme.backgroundColor } : {}),
    ...(theme.textColor ? { color: theme.textColor } : {}),
  } as CSSProperties;
  return (
    <main
      style={style}
      className={cn(
        "min-h-svh",
        theme.mode === "dark" && !theme.backgroundColor && "bg-neutral-950 text-neutral-100",
        theme.mode === "light" && !theme.backgroundColor && "bg-white text-neutral-900",
      )}
    >
      {page.coverUrl ? (
        <div className="relative h-48 w-full overflow-hidden sm:h-64">
          <Image
            src={page.coverUrl}
            alt={page.title}
            fill
            sizes="100vw"
            priority
            className="object-cover"
          />
        </div>
      ) : null}
      <article className="mx-auto max-w-2xl px-4 py-10">
        <header className="mb-8 flex flex-col items-center gap-4 text-center">
          {page.avatarUrl ? (
            <div
              className={cn(
                "relative size-24 shrink-0 overflow-hidden rounded-full border-4 shadow-sm",
                page.coverUrl && "-mt-20",
              )}
            >
              <Image
                src={page.avatarUrl}
                alt={page.title}
                fill
                sizes="96px"
                className="object-cover"
              />
            </div>
          ) : null}
          <h1 className="text-3xl font-bold">{page.title}</h1>
          {page.description ? <p className="opacity-80">{page.description}</p> : null}
        </header>
        <TiptapContent
          content={page.content}
          extensions={PAGE_EXTENSIONS}
          className={BUTTON_RADIUS[theme.buttonStyle ?? "rounded"]}
        />
      </article>
    </main>
  );
}
