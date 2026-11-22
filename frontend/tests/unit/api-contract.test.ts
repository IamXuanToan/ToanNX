/**
 * Hợp đồng FE ↔ BE lúc biên dịch: kiểu viết tay của từng module phải có **đúng tập field** của response
 * BE (sinh từ OpenAPI bằng `pnpm api:types`). BE thêm/bớt/đổi tên field mà FE chưa theo → `pnpm typecheck` đỏ.
 * Chỉ so tên field (kiểu giá trị FE có thể hẹp hơn, ví dụ union trạng thái).
 */
import { describe, expectTypeOf, it } from "vitest";

import type { User } from "@/modules/system/types/user.types";
import type { Attachment } from "@/modules/system/types/attachment.types";
import type { AttachmentFolder } from "@/modules/system/types/attachment-folder.types";
import type { AdminSession } from "@/modules/system/types/admin-session.types";
import type { PagePath } from "@/modules/utilities/types/page-path.types";
import type { Page, PageDetail } from "@/modules/utilities/types/page.types";
import type { Permission, Role, RoleDetail, RoleSummary } from "@/modules/system/types/iam.types";
import type { JournalResource } from "@/modules/system/types/journal-entry.types";
import type { QrCode, QrCodeDetail } from "@/modules/utilities/types/qr-code.types";
import type {
  PublicShortLink,
  ShortLink,
  ShortLinkDetail,
} from "@/modules/utilities/types/short-link.types";
import type { ChapterDetail } from "@/modules/novel/types/chapter.types";
import type { FavoriteItem } from "@/modules/novel/types/favorite.types";
import type { Novel, NovelDetail } from "@/modules/novel/types/novel.types";
import type { ReadingHistoryItem } from "@/modules/novel/types/reading-history.types";
import type { ApiModel } from "@/shares/types/api-schema";
import type { HistoryEntry } from "@/shares/types/api.types";

describe("hợp đồng kiểu FE ↔ OpenAPI", () => {
  it("tập field khớp response của BE", () => {
    expectTypeOf<keyof ShortLink>().toEqualTypeOf<keyof ApiModel<"ShortLinkListResponse">>();
    expectTypeOf<keyof ShortLinkDetail>().toEqualTypeOf<
      keyof ApiModel<"ShortLinkDetailResponse">
    >();
    expectTypeOf<keyof PublicShortLink>().toEqualTypeOf<
      keyof ApiModel<"ShortLinkPublicResponse">
    >();
    expectTypeOf<keyof QrCode>().toEqualTypeOf<keyof ApiModel<"QrCodeListResponse">>();
    expectTypeOf<keyof QrCodeDetail>().toEqualTypeOf<keyof ApiModel<"QrCodeDetailResponse">>();
    expectTypeOf<keyof Page>().toEqualTypeOf<keyof ApiModel<"PageListResponse">>();
    expectTypeOf<keyof PageDetail>().toEqualTypeOf<keyof ApiModel<"PageDetailResponse">>();
    expectTypeOf<keyof PagePath>().toEqualTypeOf<keyof ApiModel<"PagePathResponse">>();
    expectTypeOf<keyof Role>().toEqualTypeOf<keyof ApiModel<"RoleListResponse">>();
    expectTypeOf<keyof RoleDetail>().toEqualTypeOf<keyof ApiModel<"RoleDetailResponse">>();
    expectTypeOf<keyof RoleSummary>().toEqualTypeOf<keyof ApiModel<"RoleSummaryResponse">>();
    expectTypeOf<keyof Permission>().toEqualTypeOf<keyof ApiModel<"PermissionListResponse">>();
    expectTypeOf<keyof User>().toEqualTypeOf<keyof ApiModel<"UserDetailResponse">>();
    expectTypeOf<keyof Attachment>().toEqualTypeOf<keyof ApiModel<"AttachmentDetailResponse">>();
    expectTypeOf<keyof AttachmentFolder>().toEqualTypeOf<
      keyof ApiModel<"AttachmentFolderResponse">
    >();
    expectTypeOf<keyof AdminSession>().toEqualTypeOf<keyof ApiModel<"AdminAuthSessionResponse">>();
    expectTypeOf<keyof HistoryEntry>().toEqualTypeOf<keyof ApiModel<"CoreJournalEntryResponse">>();
    expectTypeOf<keyof JournalResource>().toEqualTypeOf<
      keyof ApiModel<"JournalResourceResponse">
    >();
    expectTypeOf<keyof Novel>().toEqualTypeOf<keyof ApiModel<"NovelListResponse">>();
    expectTypeOf<keyof NovelDetail>().toEqualTypeOf<keyof ApiModel<"NovelDetailResponse">>();
    expectTypeOf<keyof ChapterDetail>().toEqualTypeOf<keyof ApiModel<"ChapterDetailResponse">>();
    expectTypeOf<keyof ReadingHistoryItem>().toEqualTypeOf<
      keyof ApiModel<"ReadingHistoryResponse">
    >();
    expectTypeOf<keyof FavoriteItem>().toEqualTypeOf<keyof ApiModel<"FavoriteResponse">>();
  });
});
