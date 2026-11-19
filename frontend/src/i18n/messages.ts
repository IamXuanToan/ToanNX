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
  const [
    common,
    auth,
    account,
    iam,
    manageApp,
    attachment,
    customPages,
    qrCodes,
    shortLinks,
    journal,
    novel,
  ] = await Promise.all([
    import(`../messages/${locale}.json`),
    import(`../modules/auth/messages/${locale}.json`),
    import(`../modules/account/messages/${locale}.json`),
    import(`../modules/iam/messages/${locale}.json`),
    import(`../modules/manage-app/messages/${locale}.json`),
    import(`../modules/attachment/messages/${locale}.json`),
    import(`../modules/custom-pages/messages/${locale}.json`),
    import(`../modules/qr-codes/messages/${locale}.json`),
    import(`../modules/short-links/messages/${locale}.json`),
    import(`../modules/journal/messages/${locale}.json`),
    import(`../modules/novel/messages/${locale}.json`),
  ]);
  return {
    ...common.default,
    auth: auth.default,
    account: account.default,
    iam: iam.default,
    manageApp: manageApp.default,
    attachment: attachment.default,
    customPages: customPages.default,
    qrCodes: qrCodes.default,
    shortLinks: shortLinks.default,
    journal: journal.default,
    novel: novel.default,
  };
}

export type AppMessages = Awaited<ReturnType<typeof loadMessages>>;
