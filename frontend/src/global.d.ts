import type common from "./messages/vi.json";
import type account from "./modules/account/messages/vi.json";
import type auth from "./modules/auth/messages/vi.json";
import type iam from "./modules/iam/messages/vi.json";
import type manageApp from "./modules/manage-app/messages/vi.json";
import type attachment from "./modules/attachment/messages/vi.json";
import type journal from "./modules/journal/messages/vi.json";
import type novel from "./modules/novel/messages/vi.json";
import type utilities from "./modules/utilities/messages/vi.json";
import type { routing } from "./i18n/routing";

/** Kiểu message gộp (tiếng Việt là nguồn chuẩn; test đảm bảo tiếng Anh có đủ khóa). */
type Messages = typeof common & {
  auth: typeof auth;
  account: typeof account;
  iam: typeof iam;
  manageApp: typeof manageApp;
  attachment: typeof attachment;
  journal: typeof journal;
  novel: typeof novel;
  utilities: typeof utilities;
};

declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: Messages;
  }
}
