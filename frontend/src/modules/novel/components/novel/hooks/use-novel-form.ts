/**
 * Hook quản lý form tiểu thuyết (tạo mới hoặc chỉnh sửa).
 */

import { useRouter } from "@/i18n/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { NOVEL_ROUTES } from "../../../constants/routes";
import { useCreateNovel } from "../../../hooks/use-create-novel";
import { useUpdateNovel } from "../../../hooks/use-update-novel";
import {
  NOVEL_DEFAULTS,
  type NovelFormValues,
  fromNovel,
  novelSchema,
  toNovelInput,
} from "../../../schemas/novel.schema";
import type { Novel, NovelDetail } from "../../../types/novel.types";

/**
 * Quản lý form tiểu thuyết.
 *
 * @param props - Tiểu thuyết có sẵn (khi sửa) và callback sau khi lưu thành công.
 * @returns Instance form, submit handler và cờ trạng thái submitting.
 */
export function useNovelForm({
  novel,
  onSaved,
}: {
  novel?: NovelDetail | Novel;
  onSaved?: (novel: Novel) => unknown;
} = {}) {
  const router = useRouter();
  const create = useCreateNovel();
  const update = useUpdateNovel(novel?.id ?? "");

  const form = useForm<NovelFormValues>({
    resolver: zodResolver(novelSchema((k: string) => k)),
    defaultValues: novel ? fromNovel(novel) : NOVEL_DEFAULTS,
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = toNovelInput(values);
      let saved: Novel;
      if (novel) {
        saved = (await update.mutateAsync(payload)) as Novel;
      } else {
        saved = (await create.mutateAsync(payload)) as Novel;
      }
      if (onSaved) onSaved(saved);
      // Tạo mới xong mà nơi dùng không tự xử lý → về danh sách.
      else if (!novel) router.push(NOVEL_ROUTES.adminNovels);
    } catch {
      // Lỗi API được toast hoặc hiển thị root error
    }
  });

  return {
    form,
    onSubmit,
    isSubmitting: create.isPending || update.isPending,
  };
}
