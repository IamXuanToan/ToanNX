/**
 * Hợp đồng FE ↔ BE lúc biên dịch: kiểu viết tay của từng module phải có **đúng tập field** của response
 * BE (sinh từ OpenAPI bằng `pnpm api:types`). BE thêm/bớt/đổi tên field mà FE chưa theo → `pnpm typecheck` đỏ.
 * Chỉ so tên field (kiểu giá trị FE có thể hẹp hơn, ví dụ union trạng thái).
 */
import { describe, expectTypeOf, it } from "vitest";

import type { User } from "@/modules/account/types/account.types";
import type { Attachment, AttachmentFolder } from "@/modules/attachment/types/attachment.types";
import type { AdminSession } from "@/modules/auth/types/admin-session.types";
import type { Page, PageDetail, PagePath } from "@/modules/custom-pages/types/custom-pages.types";
import type { Permission, Role, RoleDetail, RoleSummary } from "@/modules/iam/types/iam.types";
import type { JournalResource } from "@/modules/journal/types/journal.types";
import type { QrCode, QrCodeDetail } from "@/modules/qr-codes/types/qr-codes.types";
import type {
  PublicShortLink,
  ShortLink,
  ShortLinkDetail,
} from "@/modules/short-links/types/short-links.types";
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
  });
});
