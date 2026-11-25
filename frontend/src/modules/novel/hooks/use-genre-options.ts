/**
 * Hook truy vấn toàn bộ thể loại làm danh mục lựa chọn (options).
 */

import { useQuery } from "@tanstack/react-query";

import { usePermission } from "@/modules/system/hooks/use-permission";

import { novelKeys } from "../constants/query-keys";
import { GENRE_PERMISSIONS } from "../permissions/genre-permission";
import { genreService } from "../services/genre.service";

/**
 * Hook tải toàn bộ thể loại để đưa vào danh mục lựa chọn của form truyện.
 *
 * @returns Mảng options chứa `{ value: id, label: name }`.
 */
export function useGenreOptions() {
  const canRead = usePermission(GENRE_PERMISSIONS.read);
  const query = useQuery({
    queryKey: novelKeys.genre.list({ all: true }),
    queryFn: ({ signal }) => genreService.listAll({}, signal),
    staleTime: 60_000,
    enabled: canRead,
  });

  const options = (query.data ?? []).map((item) => ({
    value: item.id,
    label: item.name,
  }));

  return { ...query, options };
}
