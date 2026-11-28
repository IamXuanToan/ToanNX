import { useMutation, useQueryClient } from "@tanstack/react-query";

import { languageKeys } from "../constants/query-keys";
import { languageService } from "../services/language.service";

/**
 * Xóa mềm một ngôn ngữ phụ khỏi danh mục.
 *
 * @returns Mutation xóa ngôn ngữ.
 */
export function useDeleteLanguage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => languageService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: languageKeys.all });
    },
  });
}
