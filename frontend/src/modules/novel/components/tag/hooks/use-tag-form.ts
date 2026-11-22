/**
 * Hook quản lý form thẻ truyện (tạo mới hoặc chỉnh sửa).
 */

import { useRouter } from "@/i18n/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { NOVEL_ROUTES } from "../../../constants/routes";
import { useCreateTag } from "../../../hooks/use-create-tag";
import { useUpdateTag } from "../../../hooks/use-update-tag";
import {
  TAG_DEFAULTS,
  type TagFormValues,
  fromTag,
  tagSchema,
  toTagInput,
} from "../../../schemas/tag.schema";
import type { Tag } from "../../../types/tag.types";

/**
 * Quản lý form thẻ truyện.
 *
 * @param props - Thẻ có sẵn (khi sửa) và callback sau khi lưu thành công.
 * @returns Instance form, submit handler và cờ trạng thái submitting.
 */
export function useTagForm({
  tag,
  onSaved,
}: {
  tag?: Tag;
  onSaved?: (tag: Tag) => unknown;
} = {}) {
  const router = useRouter();
  const create = useCreateTag();
  const update = useUpdateTag(tag?.id ?? "");

  const form = useForm<TagFormValues>({
    resolver: zodResolver(tagSchema((k: string) => k)),
    defaultValues: tag ? fromTag(tag) : TAG_DEFAULTS,
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = toTagInput(values);
      let saved: Tag;
      if (tag) {
        saved = (await update.mutateAsync(payload)) as Tag;
      } else {
        saved = (await create.mutateAsync(payload)) as Tag;
      }
      if (onSaved) onSaved(saved);
      // Tạo mới xong mà nơi dùng không tự xử lý → về danh sách.
      else if (!tag) router.push(NOVEL_ROUTES.adminTags);
    } catch {
      // lỗi API được quản lý bởi useResourceMutation
    }
  });

  return {
    form,
    onSubmit,
    isSubmitting: create.isPending || update.isPending,
  };
}
