"use client";

import { useMemo } from "react";

import { useActiveLanguages } from "./use-active-languages";

/** Một ngôn ngữ được hỗ trợ cho các biểu mẫu đa ngôn ngữ. */
export type SupportedLanguage = {
  id: string;
  code: string;
  name: string;
  flagEmoji?: string;
  isDefault?: boolean;
};

const DEFAULT_LANGUAGES: readonly SupportedLanguage[] = [
  { id: "", code: "vi", name: "Tiếng Việt", flagEmoji: "🇻🇳", isDefault: true },
  { id: "", code: "en", name: "English", flagEmoji: "🇺🇸", isDefault: true },
];

/**
 * Đọc danh sách ngôn ngữ đang bật từ model `Language` (`GET /system/languages/active`),
 * fallback mặc định `vi` và `en`.
 *
 * @returns Danh sách ngôn ngữ và trạng thái tải.
 */
export function useSupportedLanguages() {
  const query = useActiveLanguages();

  const languages = useMemo<readonly SupportedLanguage[]>(() => {
    const items = query.data;
    if (!Array.isArray(items) || items.length === 0) {
      return DEFAULT_LANGUAGES;
    }
    return items.map((item) => ({
      id: item.id,
      code: item.code,
      name: item.name,
      flagEmoji: item.flagEmoji,
      isDefault: item.isDefault,
    }));
  }, [query.data]);

  return {
    languages,
    isLoading: query.isLoading,
  };
}
