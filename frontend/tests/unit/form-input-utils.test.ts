import { describe, expect, it } from "vitest";

import { mergeTags, splitTags } from "@/shares/components/common/tags-input/tags-input";
import {
  isValidSlugValue,
  sanitizeCodeInput,
  sanitizeSlugInput,
} from "@/shares/lib/code-slug-input";
import { normalizeSearchText } from "@/shares/lib/search-text";

describe("slug / mã", () => {
  it("slug: bỏ dấu, viết thường, khoảng trắng thành gạch, bỏ ký tự lạ, gộp gạch", () => {
    expect(sanitizeSlugInput("Bài Viết  Mới!!")).toBe("bai-viet-moi");
    expect(sanitizeSlugInput("Đường dẫn")).toBe("duong-dan");
    expect(sanitizeSlugInput("--hello---world")).toBe("hello-world");
    expect(isValidSlugValue("hello-world")).toBe(true);
    expect(isValidSlugValue("hello-")).toBe(false);
  });

  it("mã: chỉ giữ chữ, số, . _ -; bắt đầu bằng chữ/số; viết hoa khi cần", () => {
    expect(sanitizeCodeInput("_novel editor!", { uppercase: true })).toBe("NOVELEDITOR");
    expect(sanitizeCodeInput("abc.def-1_x")).toBe("abc.def-1_x");
  });
});

describe("thẻ và tìm kiếm", () => {
  it("tách thẻ theo dấu phẩy/xuống dòng, bỏ trùng không phân biệt hoa thường", () => {
    expect(splitTags("a, b\nc,,")).toEqual(["a", "b", "c"]);
    expect(mergeTags(["Tin"], ["tin", "Mới"])).toEqual(["Tin", "Mới"]);
  });

  it("tìm không phân biệt dấu tiếng Việt", () => {
    expect(normalizeSearchText("Người Dùng Đã Khoá")).toBe("nguoi dung da khoa");
  });
});
