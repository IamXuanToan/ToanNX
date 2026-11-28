import { useMutation, useQueryClient } from "@tanstack/react-query";

import { languageKeys } from "../constants/query-keys";
import { languageService } from "../services/language.service";
import type { LanguageCreateInput } from "../types/language.types";

/**
 * Tạo mới một ngôn ngữ hệ thống.
 *
 * @returns Mutation tạo ngôn ngữ.
 */
export function useCreateLanguage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LanguageCreateInput) => languageService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: languageKeys.all });
    },
  });
}
