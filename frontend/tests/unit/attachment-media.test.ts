import { describe, expect, it } from "vitest";

import { mediaFormatsFor, normalizeMediaFormats } from "@/modules/attachment/constants/media-types";
import type { AttachmentFolder } from "@/modules/attachment/types/attachment-folder.types";
import { canParentFolder, folderPath } from "@/modules/attachment/utils/folder-path";

/** @param id - ID giả. @param parentId - Cha. @returns Thư mục đủ contract. */
function folder(id: string, parentId: string | null): AttachmentFolder {
  return { id, parentId, name: id, fileCount: 0, createdById: "owner", createdAt: "" };
}

describe("bộ lọc media", () => {
  it("chuyển loại bỏ đuôi không tương thích, chọn nhiều loại lấy hợp", () => {
    expect(normalizeMediaFormats(["VIDEO"], ["image/png", "video/mp4"])).toEqual(["video/mp4"]);
    expect(
      mediaFormatsFor(["IMAGE", "VIDEO"]).some((item) => item.value === "application/pdf"),
    ).toBe(false);
    expect(normalizeMediaFormats([], ["video/mp4", "unknown"])).toEqual(["video/mp4"]);
  });
});

describe("cây thư mục", () => {
  const folders = [folder("Root", null), folder("Child", "Root"), folder("Leaf", "Child")];
  it("hiển thị đường dẫn nhiều cấp và loại cha gây chu trình", () => {
    expect(folderPath(folders[2], folders)).toBe("Root / Child / Leaf");
    expect(canParentFolder(folders[2], "Root", folders)).toBe(false);
    expect(canParentFolder(folders[0], "Root", folders)).toBe(false);
    expect(canParentFolder(folders[0], "Leaf", folders)).toBe(true);
  });
  it("không lặp vô hạn khi dữ liệu có chu trình hoặc thiếu cha", () => {
    const invalid = [folder("A", "B"), folder("B", "A")];
    expect(folderPath(invalid[0], invalid)).toBe("B / A");
    expect(canParentFolder(invalid[0], "Other", invalid)).toBe(false);
    expect(folderPath(folder("Leaf", "missing"), [])).toBe("Leaf");
  });
});
