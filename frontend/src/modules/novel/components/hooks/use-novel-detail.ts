/**
 * Hook quản lý trạng thái và dữ liệu của màn hình chi tiết tiểu thuyết.
 */

"use client";

import { useChapters } from "../../hooks/use-chapters";
import { useClientNovel } from "../../hooks/use-client-novel";
import { useToggleFavorite } from "../../hooks/use-toggle-favorite";
import type { ChapterListItem } from "../../types/chapter.types";

/**
 * Quản lý dữ liệu chi tiết tiểu thuyết, danh sách chương và thao tác yêu thích của độc giả.
 *
 * @param slug - Slug của tiểu thuyết.
 * @returns Trạng thái query tiểu thuyết, danh sách chương và mutation toggle yêu thích.
 */
export function useNovelDetail(slug: string) {
  const novelQuery = useClientNovel(slug);
  const chaptersQuery = useChapters(
    { novel_slug: slug, page_size: 500, ordering: "chapter_number" },
    Boolean(slug),
  );
  const toggleFavorite = useToggleFavorite();

  const handleToggleFavorite = () => {
    if (novelQuery.data?.id) {
      toggleFavorite.mutate({
        novelId: novelQuery.data.id,
        novelSlug: slug,
      });
    }
  };

  const rawChapters = chaptersQuery.data;
  const chapters: ChapterListItem[] = rawChapters
    ? Array.isArray(rawChapters)
      ? rawChapters
      : (rawChapters as unknown as { items?: ChapterListItem[] }).items || []
    : [];

  return {
    novel: novelQuery.data,
    chapters,
    isLoading: novelQuery.isLoading || chaptersQuery.isLoading,
    isError: novelQuery.isError,
    toggleFavorite: handleToggleFavorite,
    isFavoriting: toggleFavorite.isPending,
  };
}
