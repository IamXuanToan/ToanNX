import { cn } from "cn";
import type { CSSProperties } from "react";

import { TiptapContent } from "@/shares/components/common/tiptap-content/tiptap-content";

import { PAGE_EXTENSIONS } from "../../extensions/page-extensions";
import type { PublicPage as PublicPageData } from "../../types/page.types";

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
        // Ảnh do người dùng chọn (Thư viện hoặc object storage); không qua next/image vì domain thay đổi theo môi trường.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={page.coverUrl} alt="" className="h-48 w-full object-cover sm:h-64" />
      ) : null}
      <article className="mx-auto max-w-2xl px-4 py-10">
        <header className="mb-8 flex flex-col items-center gap-4 text-center">
          {page.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={page.avatarUrl}
              alt=""
              className={cn(
                "size-24 rounded-full border-4 object-cover",
                page.coverUrl && "-mt-20",
              )}
            />
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
