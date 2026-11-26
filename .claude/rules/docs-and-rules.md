---
paths:
  - "docs/*.md"
  - "docs/**/*.md"
  - "CLAUDE.md"
  - "AGENTS.md"
  - "SYSTEM_CONTEXT.md"
  - "prompt.md"
  - ".agents/rules/*.md"
  - ".agents/skills/*/SKILL.md"
  - ".agents/skills/*/references/*.md"
  - ".claude/skills/*/SKILL.md"
  - ".claude/skills/*/references/*.md"
  - ".claude/rules/*.md"
  - "scripts/sync-ai-rules.py"
  - "scripts/check-workflow-skills.py"
  - "scripts/check-all.*"
---

<!-- Sinh tự động từ .agents/rules/40-docs-and-rules.md bằng scripts/sync-ai-rules.py. Không sửa tay. -->

# Tài liệu và rule

## Cấu trúc `docs/`

| Thư mục | Nội dung |
| --- | --- |
| `docs/rules/` | Rule bắt buộc (`common`, `backend`, `frontend`, `git`) — nguồn chuẩn |
| `docs/common-catalog.md` | Danh mục common BE + FE đang có |
| `docs/architecture/` | Kiến trúc, xác thực, phân quyền, i18n, kiểm thử, hạ tầng free |
| `docs/guides/` | Cài đặt, vận hành (deploy, R2, OAuth, thông báo, tài chính) |
| `docs/modules/<m>/README.md` | Mỗi module: model, quyền, route, sự kiện, webhook |
| `docs/features/<chức-năng>.md` | Mỗi chức năng dùng chung: làm gì, chạy thế nào, quy định |
| `docs/plans/<YYYY>/<MM>/<DD>/`, `docs/reports/` | Kế hoạch chia theo năm/tháng/ngày lập, báo cáo (lịch sử, không sửa đường dẫn cũ trong đó) |

Tên file kebab-case tiếng Anh, nội dung tiếng Việt có dấu, câu ngắn, không chép lại rule mà dẫn link. Plan mới lưu đúng vào `docs/plans/<YYYY>/<MM>/<DD>/<ten>-plan.md` theo ngày lập, không đặt ở gốc `docs/plans/`.

## Đồng bộ

- `CLAUDE.md` ↔ `AGENTS.md`: sửa một bên thì sửa bên kia cùng lần, nội dung rule phải khớp.
- `docs/rules/` đổi phần đã tóm tắt trong `CLAUDE.md`/`AGENTS.md`/`prompt.md`/rule AI → sửa cả các nơi đó.
- **Rule AI**: nguồn duy nhất là `.agents/rules/*.md` (frontmatter `trigger`). Bản cho Claude Code trong
  `.claude/rules/`, `.claude/skills/rule-*/`, `.claude/commands/` **được sinh tự động** — không sửa tay; sửa nguồn rồi
  chạy `python scripts/sync-ai-rules.py` (kiểm lệch: `--check`).
- **Tự động cập nhật khi có rule mới**: khi người dùng đặt quy chuẩn/ràng buộc mới chưa có trong `docs/rules/`, chủ động cập
  nhật ngay `docs/rules/`, `.agents/rules/`, `AGENTS.md`, `CLAUDE.md`, `prompt.md` (và test quy ước nếu kiểm được), chạy
  `python scripts/sync-ai-rules.py --check` trong cùng lượt mà không cần nhắc lại.
- Skill project ở `.agents/skills/<tên>/`; `start-task`, `fix`, `review-code` là skill nội bộ liên kết sang
  `.claude/skills/<tên>/`. Skill ngoài cài bằng CLI có nguồn/commit trong `skills-lock.json`. Chỉ
  `.claude/skills/rule-*/` là đầu ra của script đồng bộ rule. Chạy `python scripts/check-workflow-skills.py`
  để kiểm metadata và bản Claude của ba skill workflow.

## Viết rule AI (`.agents/rules/<số>-<tên>.md`)

```yaml
---
trigger: always_on | model_decision | glob | manual
globs: backend/**/*.py, frontend/src/**/*.tsx   # chỉ khi trigger: glob
description: Một câu nói rule dùng khi nào (AI dựa vào đây để tự chọn với model_decision)
---
```

| Trigger | Ý nghĩa | Dùng cho | Sinh ra cho Claude Code |
| --- | --- | --- | --- |
| `always_on` | Luôn kích hoạt | Quy tắc quan trọng | `.claude/rules/<tên>.md` |
| `model_decision` | AI tự quyết khi cần | Hướng dẫn chuyên sâu | `.claude/skills/rule-<tên>/SKILL.md` |
| `glob` | Kích hoạt theo file | Backend, Frontend | `.claude/rules/<tên>.md` + `paths:` |
| `manual` | Chỉ khi gọi | Lệnh đặc biệt thật sự cần gọi tường minh | `.claude/commands/<tên>.md` (`/<tên>`) |

- Ngắn gọn (dưới ~80 dòng), chỉ điều bắt buộc + trỏ tới `docs/` để xem chi tiết; không chép nguyên văn rule dài.
- Tên file có số thứ tự nhóm: `0x` cốt lõi, `1x` backend, `2x` frontend, `3x` env, `4x` tài liệu, `5x` chuyên sâu,
  `9x` bảng kiểm và audit. Checklist là `always_on`, audit toàn hệ thống là `model_decision` khi được yêu cầu.
