import { createContext } from "react";

import type { AdminGroup } from "@/shares/types/navigation.types";

/** Nhóm module người dùng vào được (do `AdminShell` tính; `null` = ngoài `AdminModulesProvider`). */
export const AdminModulesContext = createContext<AdminGroup[] | null>(null);
