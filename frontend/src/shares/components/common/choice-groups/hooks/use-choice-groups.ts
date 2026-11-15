"use client";

import { useState } from "react";

import type { ChoiceGroup } from "../choice-groups";

/**
 * State của `ChoiceGroups`: nhóm đang mở (mặc định mở hết, kể cả nhóm mới hiện khi đổi bộ lọc; chỉ
 * nhớ nhóm người dùng đã thu), đếm và chọn/bỏ chọn theo mục hoặc cả nhóm.
 *
 * @param params - Nhóm, giá trị và callback đổi giá trị.
 * @returns State mở/thu và handler chọn.
 */
export function useChoiceGroups({
  groups,
  value,
  onChange,
}: {
  groups: ChoiceGroup[];
  value: readonly string[];
  onChange?: (value: string[]) => void;
}) {
  const keys = groups.map((group) => group.key);
  const [closed, setClosed] = useState<string[]>([]);
  const openKeys = keys.filter((key) => !closed.includes(key));
  const selectableValues = (group: ChoiceGroup) =>
    group.items.filter((item) => !item.disabled).map((item) => item.value);

  return {
    openKeys,
    allOpen: openKeys.length === keys.length,
    setOpenKeys: (next: string[]) =>
      setClosed((prev) => [
        ...prev.filter((key) => !keys.includes(key)),
        ...keys.filter((key) => !next.includes(key)),
      ]),
    expandAll: () => setClosed([]),
    collapseAll: () => setClosed(keys),
    selectableValues,
    selectedCount: (group: ChoiceGroup) =>
      group.items.filter((item) => value.includes(item.value)).length,
    toggle: (item: string, selected: boolean) =>
      onChange?.(selected ? [...value, item] : value.filter((v) => v !== item)),
    toggleGroup: (group: ChoiceGroup, selected: boolean) => {
      const values = selectableValues(group);
      onChange?.(
        selected
          ? [...new Set([...value, ...values])]
          : value.filter((item) => !values.includes(item)),
      );
    },
  };
}
