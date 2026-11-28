import { useMutation, useQueryClient } from "@tanstack/react-query";

import { languageKeys } from "../constants/query-keys";
import { languageService } from "../services/language.service";
import type { LanguageUpdateInput } from "../types/language.types";

/**
 * Cập nhật thông tin ngôn ngữ hệ thống.
 *
 * @returns Mutation cập nhật ngôn ngữ.
 */
export function useUpdateLanguage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: LanguageUpdateInput }) =>
      languageService.update(id, input),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: languageKeys.all });
      queryClient.invalidateQueries({ queryKey: languageKeys.detail(id) });
    },
  });
}
