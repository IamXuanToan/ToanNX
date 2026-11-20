import type common from "./messages/vi.json";
import type manageApp from "./modules/manage-app/messages/vi.json";
import type system from "./modules/system/messages/vi.json";
import type novel from "./modules/novel/messages/vi.json";
import type utilities from "./modules/utilities/messages/vi.json";
import type { routing } from "./i18n/routing";

/** Kiểu message gộp (tiếng Việt là nguồn chuẩn; test đảm bảo tiếng Anh có đủ khóa). */
type Messages = typeof common & {
  system: typeof system;
  manageApp: typeof manageApp;
  novel: typeof novel;
  utilities: typeof utilities;
};

declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: Messages;
  }
}
