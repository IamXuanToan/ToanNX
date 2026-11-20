import type { AppLocale } from "./routing";

/**
 * Nạp và gộp message theo namespace: message dùng chung (`src/messages`) và
 * message của từng module (`src/modules/<module>/messages`).
 * Mỗi module sở hữu đúng một namespace để tránh xung đột khóa.
 *
 * @param locale - Ngôn ngữ cần nạp.
 * @returns Message đã gộp theo namespace.
 */
export async function loadMessages(locale: AppLocale) {
  const [common, system, manageApp, novel, utilities] = await Promise.all([
    import(`../messages/${locale}.json`),
    import(`../modules/system/messages/${locale}.json`),
    import(`../modules/manage-app/messages/${locale}.json`),
    import(`../modules/novel/messages/${locale}.json`),
    import(`../modules/utilities/messages/${locale}.json`),
  ]);
  return {
    ...common.default,
    system: system.default,
    manageApp: manageApp.default,
    novel: novel.default,
    utilities: utilities.default,
  };
}

export type AppMessages = Awaited<ReturnType<typeof loadMessages>>;
