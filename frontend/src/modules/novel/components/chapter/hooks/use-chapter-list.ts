"use client";

import { useMemo, useState } from "react";

import type { ChapterListItem } from "../../../types/chapter.types";

/**
 * Thuộc tính của hook `useChapterList`.
 */
export interface UseChapterListProps {
  /** Danh sách các chương của truyện */
  chapters: ChapterListItem[];
  /** Danh sách các số chương người dùng đã đọc qua */
  readChapterNumbers?: number[];
}

/**
 * Hook quản lý tìm kiếm, sắp xếp và đánh dấu chương đã đọc cho ChapterList.
 *
 * @param props - Thuộc tính `UseChapterListProps`.
 * @returns State tìm kiếm, chiều sắp xếp, tập hợp chương đã đọc, danh sách chương đã lọc và hàm chuyển đổi sắp xếp.
 */
export function useChapterList({ chapters, readChapterNumbers = [] }: UseChapterListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAscending, setIsAscending] = useState(true);

  const readSet = useMemo(() => new Set(readChapterNumbers), [readChapterNumbers]);

  const filteredChapters = useMemo(() => {
    let result = [...chapters];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(
        (ch) => ch.title.toLowerCase().includes(term) || String(ch.chapterNumber).includes(term),
      );
    }

    result.sort((a, b) =>
      isAscending ? a.chapterNumber - b.chapterNumber : b.chapterNumber - a.chapterNumber,
    );

    return result;
  }, [chapters, searchTerm, isAscending]);

  const toggleSort = () => setIsAscending((prev) => !prev);

  return {
    searchTerm,
    setSearchTerm,
    isAscending,
    readSet,
    filteredChapters,
    toggleSort,
  };
}
