/**
 * Tạo map hằng quyền `<module>.<resource>.<action>` từ scope module, tên tài nguyên và hậu tố hành động,
 * giữ nguyên kiểu chuỗi literal chính xác cho TypeScript.
 *
 * @param module - Phạm vi module (`SYSTEM_SCOPE`, `WORKSPACE_SCOPE`, ...).
 * @param resource - Tên tài nguyên backend (`user`, `assistant_conversation`, ...).
 * @param actions - Map khóa property FE sang hậu tố quyền (`PERMISSION_ACTION`).
 * @returns Object readonly chứa mã quyền đầy đủ dạng `<module>.<resource>.<action>`.
 */
export function createResourcePermissions<
  const TModule extends string,
  const TResource extends string,
  const TActions extends Record<string, string>,
>(
  module: TModule,
  resource: TResource,
  actions: TActions,
): { readonly [K in keyof TActions]: `${TModule}.${TResource}.${TActions[K]}` } {
  const entries = Object.entries(actions).map(([key, action]) => [
    key,
    `${module}.${resource}.${action}`,
  ]);
  return Object.freeze(Object.fromEntries(entries)) as {
    readonly [K in keyof TActions]: `${TModule}.${TResource}.${TActions[K]}`;
  };
}
