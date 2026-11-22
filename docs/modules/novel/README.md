# Module Novel (`novel`)

Quản lý và đọc truyện tiểu thuyết. Phụ thuộc `system`.

- BE: `backend/app/novel/` · FE: `frontend/src/modules/novel/`
- URL quản trị: `/quan-tri/truyen/...` · nhóm `novel`

## Model

`Novel`, `Chapter`, `Author`, `Genre`, `Tag`; dữ liệu người đọc: `Favorite`, `ReadingHistory`.

## Quyền

| Class | Tài nguyên | `MEMBER` |
| --- | --- | --- |
| `NovelPermission` | `novel` (+ `manage_all`, `import`) | read, create, update, delete |
| `ChapterPermission` | `chapter` | read, create, update, delete |
| `AuthorPermission` | `author` | read |
| `GenrePermission` | `genre` | read |
| `TagPermission` | `tag` | read |

Tác giả, thể loại, tag là danh mục dùng chung: thành viên chỉ chọn, không tạo/sửa.

## Màn quản trị

| Cụm | Màn | Route |
| --- | --- | --- |
| Nội dung | Truyện · Chương | `tac-pham`, `chuong-truyen` |
| Danh mục | Tác giả · Thể loại · Tag | `tac-gia`, `the-loai`, `the` |

## Trang công khai

Danh mục truyện, chi tiết truyện, trang đọc chương, truyện yêu thích, lịch sử đọc.

## Sự kiện, webhook, callback

Không có.
