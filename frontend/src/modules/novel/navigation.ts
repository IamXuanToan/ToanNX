import { BookOpen, FileText, FolderTree, Tags, Users } from "lucide-react";

import type { AdminModuleNavigation } from "@/shares/types/navigation.types";

import { NOVEL_ROUTES } from "./constants/routes";
import { AUTHOR_PERMISSIONS } from "./permissions/author-permission";
import { CHAPTER_PERMISSIONS } from "./permissions/chapter-permission";
import { GENRE_PERMISSIONS } from "./permissions/genre-permission";
import { NOVEL_PERMISSIONS } from "./permissions/novel-permission";
import { TAG_PERMISSIONS } from "./permissions/tag-permission";

/**
 * Cấu hình điều hướng quản trị của module Novel (Truyện chữ).
 *
 * Khai báo nhóm hiển thị độc lập "novel", các mục menu quản lý và quyền hạn truy cập tương ứng.
 */
export const novelNavigation: AdminModuleNavigation = {
  module: "novel",
  nameKey: "novel.module.name",
  descriptionKey: "novel.module.description",
  group: "novel",
  icon: BookOpen,
  items: [
    {
      labelKey: "novel.nav.novels",
      href: NOVEL_ROUTES.adminNovels,
      icon: BookOpen,
      permission: NOVEL_PERMISSIONS.read,
    },
    {
      labelKey: "novel.nav.chapters",
      href: NOVEL_ROUTES.adminChapters,
      icon: FileText,
      permission: CHAPTER_PERMISSIONS.read,
    },
    {
      labelKey: "novel.nav.authors",
      href: NOVEL_ROUTES.adminAuthors,
      icon: Users,
      permission: AUTHOR_PERMISSIONS.read,
    },
    {
      labelKey: "novel.nav.genres",
      href: NOVEL_ROUTES.adminGenres,
      icon: FolderTree,
      permission: GENRE_PERMISSIONS.read,
    },
    {
      labelKey: "novel.nav.tags",
      href: NOVEL_ROUTES.adminTags,
      icon: Tags,
      permission: TAG_PERMISSIONS.read,
    },
  ],
};
