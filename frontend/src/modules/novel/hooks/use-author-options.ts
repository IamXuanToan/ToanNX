/**
 * Hook truy vấn toàn bộ tác giả làm danh mục lựa chọn (options).
 */

import { useQuery } from "@tanstack/react-query";

import { novelKeys } from "../constants/query-keys";
import { authorService } from "../services/author.service";

/**
 * Hook tải toàn bộ tác giả để đưa vào danh mục lựa chọn của form truyện.
 *
 * @returns Mảng options chứa `{ value: id, label: name }`.
 */
export function useAuthorOptions() {
  const query = useQuery({
    queryKey: novelKeys.author.list({ all: true }),
    queryFn: ({ signal }) => authorService.listAll({}, signal),
    staleTime: 60_000,
  });

  const options = (query.data ?? []).map((item) => ({
    value: item.id,
    label: item.name,
  }));

  return { ...query, options };
}
