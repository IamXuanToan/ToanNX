/**
 * Hook truy vấn toàn bộ thẻ làm danh mục lựa chọn (options).
 */

import { useQuery } from "@tanstack/react-query";

import { novelKeys } from "../constants/query-keys";
import { tagService } from "../services/tag.service";

/**
 * Hook tải toàn bộ thẻ để đưa vào danh mục lựa chọn của form truyện.
 *
 * @returns Mảng options chứa `{ value: id, label: name }`.
 */
export function useTagOptions() {
  const query = useQuery({
    queryKey: novelKeys.tag.list({ all: true }),
    queryFn: ({ signal }) => tagService.listAll({}, signal),
    staleTime: 60_000,
  });

  const options = (query.data ?? []).map((item) => ({
    value: item.id,
    label: item.name,
  }));

  return { ...query, options };
}
