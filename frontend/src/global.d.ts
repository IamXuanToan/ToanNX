import type common from "./messages/vi.json";
import type account from "./modules/account/messages/vi.json";
import type auth from "./modules/auth/messages/vi.json";
import type dashboard from "./modules/dashboard/messages/vi.json";
import type iam from "./modules/iam/messages/vi.json";
import type system from "./modules/system/messages/vi.json";
import type { routing } from "./i18n/routing";

/** Kiểu message gộp (tiếng Việt là nguồn chuẩn; test đảm bảo tiếng Anh có đủ khóa). */
type Messages = typeof common & {
  auth: typeof auth;
  account: typeof account;
  iam: typeof iam;
  system: typeof system;
  dashboard: typeof dashboard;
};

declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: Messages;
  }
}
