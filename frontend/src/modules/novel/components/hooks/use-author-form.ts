/**
 * Hook quản lý form tác giả (tạo mới hoặc chỉnh sửa).
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useCreateAuthor } from "../../hooks/use-create-author";
import { useUpdateAuthor } from "../../hooks/use-update-author";
import {
  AUTHOR_DEFAULTS,
  type AuthorFormValues,
  authorSchema,
  fromAuthor,
  toAuthorInput,
} from "../../schemas/author.schema";
import type { Author } from "../../types/author.types";

/**
 * Quản lý form tác giả.
 *
 * @param props - Tác giả có sẵn (khi sửa) và callback sau khi lưu thành công.
 * @returns Instance form, submit handler và cờ trạng thái submitting.
 */
export function useAuthorForm({
  author,
  onSaved,
}: {
  author?: Author;
  onSaved?: (author: Author) => unknown;
} = {}) {
  const create = useCreateAuthor();
  const update = useUpdateAuthor(author?.id ?? "");

  const form = useForm<AuthorFormValues>({
    resolver: zodResolver(authorSchema((k: string) => k)),
    defaultValues: author ? fromAuthor(author) : AUTHOR_DEFAULTS,
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = toAuthorInput(values);
      let saved: Author;
      if (author) {
        saved = (await update.mutateAsync(payload)) as Author;
      } else {
        saved = (await create.mutateAsync(payload)) as Author;
      }
      onSaved?.(saved);
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
