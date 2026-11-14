"use client";

import { useDeferredValue, useState } from "react";

import { useUsers } from "../../../hooks/use-account-queries";

const PAGE_SIZE = 20;

/**
 * State tìm kiếm/phân trang của bảng người dùng.
 *
 * @returns Truy vấn, từ khóa, trang và setter.
 */
export function useUserTable() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const keyword = useDeferredValue(search.trim());
  const query = useUsers({ search: keyword, page, pageSize: PAGE_SIZE });
  return {
    query,
    search,
    onSearchChange: (value: string) => {
      setSearch(value);
      setPage(1);
    },
    setPage,
  };
}
