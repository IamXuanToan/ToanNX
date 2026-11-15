import type { components } from "./api-schema.gen";

/** `created_at` → `createdAt` (cùng quy tắc với `keysToCamel` của `apiClient`). */
type CamelCase<S extends string> = S extends `${infer Head}_${infer Tail}`
  ? `${Head}${Capitalize<CamelCase<Tail>>}`
  : S;

/** Đổi khóa của kiểu sinh từ OpenAPI (snake_case) sang dạng FE nhận được sau `apiClient` (camelCase). */
export type Camelize<T> = T extends readonly (infer Item)[]
  ? Camelize<Item>[]
  : T extends object
    ? { [Key in keyof T as Key extends string ? CamelCase<Key> : Key]: Camelize<T[Key]> }
    : T;

/** Mọi schema của BE (sinh bằng `pnpm api:types`, không sửa tay `api-schema.gen.ts`). */
export type ApiSchemas = components["schemas"];

/**
 * Kiểu dữ liệu FE nhận được cho một schema của BE, ví dụ `ApiModel<"ShortLinkListResponse">`.
 * Module mới có thể dùng trực tiếp thay vì viết tay; kiểu viết tay thì đối chiếu trong `tests/unit/api-contract.test.ts`.
 */
export type ApiModel<Name extends keyof ApiSchemas> = Camelize<ApiSchemas[Name]>;
