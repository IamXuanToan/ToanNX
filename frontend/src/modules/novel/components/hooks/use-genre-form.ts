/**
 * Hook quản lý form thể loại (tạo mới hoặc chỉnh sửa).
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useCreateGenre } from "../../hooks/use-create-genre";
import { useUpdateGenre } from "../../hooks/use-update-genre";
import {
  GENRE_DEFAULTS,
  type GenreFormValues,
  fromGenre,
  genreSchema,
  toGenreInput,
} from "../../schemas/genre.schema";
import type { Genre } from "../../types/genre.types";

/**
 * Quản lý form thể loại.
 *
 * @param props - Thể loại có sẵn (khi sửa) và callback sau khi lưu thành công.
 * @returns Instance form, submit handler và cờ trạng thái submitting.
 */
export function useGenreForm({
  genre,
  onSaved,
}: {
  genre?: Genre;
  onSaved?: (genre: Genre) => unknown;
} = {}) {
  const create = useCreateGenre();
  const update = useUpdateGenre(genre?.id ?? "");

  const form = useForm<GenreFormValues>({
    resolver: zodResolver(genreSchema((k: string) => k)),
    defaultValues: genre ? fromGenre(genre) : GENRE_DEFAULTS,
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = toGenreInput(values);
      let saved: Genre;
      if (genre) {
        saved = (await update.mutateAsync(payload)) as Genre;
      } else {
        saved = (await create.mutateAsync(payload)) as Genre;
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
