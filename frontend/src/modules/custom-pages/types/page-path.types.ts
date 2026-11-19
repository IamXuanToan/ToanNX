import type { ListParams } from "@/shares/types/api.types";

/** Đường dẫn giữa (`toannx.com/<segment>/…`). */
export type PagePath = {
  id: string;
  segment: string;
  name: string;
  description: string;
  isActive: boolean;
  position: number;
  pageCount: number;
  createdAt: string;
  updatedAt: string;
};

export type PagePathInput = {
  segment: string;
  name: string;
  description: string;
  isActive: boolean;
  position: number;
};

export type PagePathFilters = ListParams & { isActive?: ("true" | "false")[] };
