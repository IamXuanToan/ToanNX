import Image from "next/image";
import { cn } from "cn";

import { TiptapContent } from "@/shares/components/common/tiptap-content";

import { PAGE_EXTENSIONS } from "../../extensions/page-extensions";
import type { PublicPage } from "../../types/page.types";

/**
 * Hiển thị trang soạn thảo tự do (`LEGACY_PAGE` / custom) dùng chung đúng hệ màu & định dạng
 * với `TiptapEditor` (không ghi đè bảng màu nút/nền).
 *
 * @param props - Dữ liệu trang công khai.
 * @returns Giao diện bài viết Tiptap đồng nhất với trình soạn thảo.
 */
export function LegacyTiptapPageRenderer({ page }: { page: PublicPage }) {
  return (
    <main className="bg-background text-foreground min-h-svh">
      {page.coverUrl ? (
        <div className="relative h-48 w-full overflow-hidden sm:h-64">
          <Image
            src={page.coverUrl}
            alt={page.title}
            fill
            sizes="100vw"
            priority
            unoptimized
            className="object-cover"
          />
        </div>
      ) : null}
      <article className="mx-auto max-w-2xl overflow-x-hidden px-4 py-7 break-words sm:py-10 [&_img]:h-auto [&_img]:max-w-full [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_table]:block [&_table]:w-full [&_table]:overflow-x-auto">
        <header className="mb-6 flex flex-col items-center gap-4 text-center sm:mb-8">
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
                unoptimized
                className="object-cover"
              />
            </div>
          ) : null}
          <h1 className="text-2xl font-bold break-words sm:text-3xl">{page.title}</h1>
          {page.description ? <p className="text-muted-foreground">{page.description}</p> : null}
        </header>
        <TiptapContent content={page.content} extensions={PAGE_EXTENSIONS} />
      </article>
    </main>
  );
}
