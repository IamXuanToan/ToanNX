import type { AttachmentFolder } from "../types/attachment-folder.types";

/** @param folder - Thư mục cần hiển thị. @param folders - Danh mục đã giới hạn quyền. @returns Đường dẫn logic có chặn dữ liệu vòng lặp. */
export function folderPath(folder: AttachmentFolder, folders: readonly AttachmentFolder[]): string {
  const names = [folder.name];
  const visited = new Set([folder.id]);
  let parentId = folder.parentId;
  while (parentId && !visited.has(parentId)) {
    visited.add(parentId);
    const parent = folders.find((item) => item.id === parentId);
    if (!parent) break;
    names.unshift(parent.name);
    parentId = parent.parentId;
  }
  return names.join(" / ");
}

/** @param candidate - Cha dự kiến. @param folderId - Nhánh đang sửa. @param folders - Cây đầy đủ. @returns Có thể đặt nhánh dưới cha này mà không tạo vòng lặp. */
export function canParentFolder(
  candidate: AttachmentFolder,
  folderId: string,
  folders: readonly AttachmentFolder[],
): boolean {
  const visited = new Set<string>();
  let current: AttachmentFolder | undefined = candidate;
  while (current) {
    if (current.id === folderId || visited.has(current.id)) return false;
    visited.add(current.id);
    current = folders.find((item) => item.id === current?.parentId);
  }
  return true;
}
