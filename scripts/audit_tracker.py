"""Quản lý file theo dõi rà soát code toàn hệ thống (`docs/reports/code-audit-tracker.md`).

Hỗ trợ các skill chỉnh sửa (`start-task`, `fix`, `refactor`, `test`, `db-migration`) ghi nhận
file thay đổi theo ngày, và giúp các skill rà soát (`review-code`, `review-security`,
`i18n-audit`, `permission-audit`) lọc đúng các file vừa đổi / chưa kiểm gần nhất thay vì quét
lại toàn bộ repo không cần thiết.
"""

from __future__ import annotations

import argparse
import dataclasses
import datetime as dt
import re
import subprocess
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TRACKER_PATH = ROOT / "docs" / "reports" / "code-audit-tracker.md"
EXCLUDED_EXACT = {"docs/reports/code-audit-tracker.md"}
EXCLUDED_FILES = {
    ".env",
    ".env.local",
    "backend/.env",
    "backend/.env.local",
    "frontend/.env",
    "frontend/.env.local",
    "frontend/.openapi.json",
    "frontend/pnpm-lock.yaml",
    "backend/uv.lock",
}
EXCLUDED_PREFIXES = (
    ".claude/",
    ".git/",
    ".mypy_cache/",
    ".pytest_cache/",
    ".ruff_cache/",
    ".venv/",
    "backend/.mypy_cache/",
    "backend/.pytest_cache/",
    "backend/.ruff_cache/",
    "backend/.venv/",
    "backend/media/",
    "backend/staticfiles/",
    "frontend/.next/",
    "frontend/.next-e2e/",
    "frontend/.next-verify/",
    "frontend/.playwright-cli/",
    "frontend/node_modules/",
    "frontend/playwright-report/",
    "frontend/test-results/",
    "graphify-out/",
    "tmp/",
)
EXCLUDED_EXTS = {
    ".pyc",
    ".pyo",
    ".pyd",
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
    ".gif",
    ".ico",
    ".woff",
    ".woff2",
    ".ttf",
    ".eot",
    ".sqlite3",
    ".db",
    ".pdf",
    ".zip",
}

AXES = ("code", "security", "i18n", "permission")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")

SUMMARY_START = "<!-- AUDIT_SUMMARY:START -->"
SUMMARY_END = "<!-- AUDIT_SUMMARY:END -->"
QUEUE_START = "<!-- AUDIT_QUEUE:START -->"
QUEUE_END = "<!-- AUDIT_QUEUE:END -->"
LOG_START = "<!-- AUDIT_LOG:START -->"
LOG_END = "<!-- AUDIT_LOG:END -->"
TABLES_START = "<!-- AUDIT_TABLES:START -->"
TABLES_END = "<!-- AUDIT_TABLES:END -->"

GROUP_LABELS = {
    "backend/core": "Backend · Core (`backend/app/core`)",
    "backend/system": "Backend · System (`backend/app/system`)",
    "backend/utilities": "Backend · Utilities (`backend/app/utilities`)",
    "backend/novel": "Backend · Novel (`backend/app/novel`)",
    "backend/finance": "Backend · Finance (`backend/app/finance`)",
    "backend/workspace": "Backend · Workspace (`backend/app/workspace`)",
    "backend/config": "Backend · Config & Root (`backend/config`, env, pyproject)",
    "frontend/shares": "Frontend · Shares (`frontend/src/shares`)",
    "frontend/system": "Frontend · System (`frontend/src/modules/system`)",
    "frontend/utilities": "Frontend · Utilities (`frontend/src/modules/utilities`)",
    "frontend/novel": "Frontend · Novel (`frontend/src/modules/novel`)",
    "frontend/finance": "Frontend · Finance (`frontend/src/modules/finance`)",
    "frontend/workspace": "Frontend · Workspace (`frontend/src/modules/workspace`)",
    "frontend/portal": "Frontend · Portal (`frontend/src/modules/portal`)",
    "frontend/home": "Frontend · Home (`frontend/src/modules/home`)",
    "frontend/manage-app": "Frontend · Manage App (`frontend/src/modules/manage-app`)",
    "frontend/core-i18n": (
        "Frontend · Core I18n, Proxy & Messages (`frontend/src/i18n`, `messages`, `proxy.ts`)"
    ),
    "frontend/app-routes": "Frontend · App Router (`frontend/src/app`)",
    "frontend/tests": "Frontend · Tests (`frontend/tests`)",
    "frontend/config": "Frontend · Config & Public (`frontend/*.ts`, `.env.example`, `public/`)",
    "scripts-ci": "Scripts & CI (`scripts/`, `.github/`)",
    "rules-skills": "Rules, Skills & Prompts (`.agents/`, `AGENTS.md`, `CLAUDE.md`, `prompt.md`)",
    "docs": "Tài liệu hệ thống (`docs/`)",
}

GROUP_ORDER = list(GROUP_LABELS.keys())


@dataclasses.dataclass
class AuditRecord:
    """Bản ghi theo dõi rà soát của một file trong repo."""

    path: str
    kind: str
    last_modified: str
    source: str
    code: str
    security: str
    i18n: str
    permission: str
    status: str
    note: str = "—"

    def get_axis(self, axis: str) -> str:
        """Lấy giá trị ô của một trục kiểm tra."""
        return str(getattr(self, axis))

    def set_axis(self, axis: str, value: str) -> None:
        """Gán giá trị ô của một trục kiểm tra."""
        setattr(self, axis, value)


def _today_str() -> str:
    return dt.date.today().isoformat()


def _run_git(args: list[str]) -> str:
    proc = subprocess.run(  # noqa: S603 - chỉ gọi git cố định với tham số nội bộ
        ["git", *args],  # noqa: S607
        cwd=ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        check=False,
    )
    if proc.returncode != 0:
        raise RuntimeError(f"git {' '.join(args)} lỗi: {proc.stderr.strip()}")
    return proc.stdout


def normalize_rel_path(raw: str) -> str:
    """Chuẩn hóa đường dẫn về POSIX tương đối từ gốc repo."""
    text = raw.strip().strip("`").replace("\\", "/")
    if text.startswith("./"):
        text = text[2:]
    candidate = Path(text)
    if candidate.is_absolute():
        try:
            text = candidate.resolve().relative_to(ROOT.resolve()).as_posix()
        except ValueError:  # noqa: S110 - đường dẫn ngoài repo thì giữ nguyên chuỗi đã chuẩn hóa
            return text
    return text


def is_tracked_target(rel: str) -> bool:
    """Kiểm tra file có thuộc danh sách cần đưa vào tracker hay không."""
    if not rel or rel in EXCLUDED_EXACT or rel in EXCLUDED_FILES:
        return False
    if any(rel.startswith(prefix) for prefix in EXCLUDED_PREFIXES):
        return False
    if "/__pycache__/" in rel or rel.endswith(".egg-info"):
        return False
    return Path(rel).suffix.lower() not in EXCLUDED_EXTS


def collect_repo_files() -> list[str]:
    """Liệt kê mọi file tracked và file mới chưa gitignore trong repo."""
    tracked_raw = _run_git(["ls-files", "-z"])
    untracked_raw = _run_git(["ls-files", "--others", "--exclude-standard", "-z"])
    items = set()
    for chunk in (tracked_raw + untracked_raw).split("\0"):
        rel = normalize_rel_path(chunk)
        if is_tracked_target(rel):
            items.add(rel)
    return sorted(items)


def git_file_history() -> dict[str, tuple[str, str]]:
    """Đọc ngày sửa và commit gần nhất của từng file từ `git log`."""
    output = _run_git(["log", "--format=COMMIT:%cs|%h", "--name-only"])
    history: dict[str, tuple[str, str]] = {}
    current_date = _today_str()
    current_hash = "HEAD"
    for line in output.splitlines():
        if line.startswith("COMMIT:"):
            meta = line[len("COMMIT:") :]
            if "|" in meta:
                current_date, current_hash = meta.split("|", 1)
            continue
        rel = normalize_rel_path(line)
        if rel and rel not in history:
            history[rel] = (current_date, current_hash)
    return history


def git_dirty_files() -> dict[str, str]:
    """Đọc các file đang thay đổi / mới trong working tree từ `git status`."""
    output = _run_git(["status", "--porcelain", "-z"])
    dirty: dict[str, str] = {}
    tokens = output.split("\0")
    idx = 0
    while idx < len(tokens):
        entry = tokens[idx]
        idx += 1
        if len(entry) < 4:
            continue
        code = entry[:2]
        path_raw = entry[3:]
        if ("R" in code or "C" in code) and idx < len(tokens):
            path_raw = tokens[idx]
            idx += 1
        rel = normalize_rel_path(path_raw)
        if is_tracked_target(rel):
            dirty[rel] = code.strip() or "M"
    return dirty


def file_mtime_date(rel: str) -> str:
    """Lấy ngày sửa trên hệ thống file (fallback nếu chưa có trong git log)."""
    target = ROOT / rel
    if target.exists():
        ts = target.stat().st_mtime
        return dt.date.fromtimestamp(ts).isoformat()
    return _today_str()


def group_of(rel: str) -> str:
    """Xác định nhóm hiển thị của file."""
    if rel.startswith("backend/app/"):
        parts = rel.split("/")
        if len(parts) >= 4:
            mod = parts[2]
            key = f"backend/{mod}"
            if key in GROUP_LABELS:
                return key
        return "backend/config"
    if rel.startswith("backend/"):
        return "backend/config"
    if rel.startswith("frontend/src/shares/"):
        return "frontend/shares"
    if rel.startswith("frontend/src/modules/"):
        parts = rel.split("/")
        if len(parts) >= 5:
            mod = parts[3]
            key = f"frontend/{mod}"
            if key in GROUP_LABELS:
                return key
    if rel.startswith("frontend/src/app/"):
        return "frontend/app-routes"
    if rel.startswith("frontend/src/"):
        return "frontend/core-i18n"
    if rel.startswith("frontend/tests/"):
        return "frontend/tests"
    if rel.startswith("frontend/"):
        return "frontend/config"
    if rel.startswith("scripts/") or rel.startswith(".github/"):
        return "scripts-ci"
    if rel.startswith("docs/"):
        return "docs"
    return "rules-skills"


def kind_of(rel: str) -> str:
    """Phân loại vai trò kỹ thuật ngắn gọn của file."""
    name = Path(rel).name
    if rel.endswith("api-schema.gen.ts"):
        return "generated-types"
    if "/migrations/" in rel:
        return "migration"
    if "/tests/" in rel or name.endswith((".test.ts", ".test.tsx", ".spec.ts")):
        return "test"
    if rel.startswith("docs/"):
        return "doc"
    if rel.startswith(".agents/") or name in {"AGENTS.md", "CLAUDE.md", "prompt.md", "SYSTEM_CONTEXT.md"}:
        return "skill" if ".agents/skills/" in rel else "rule"
    if rel.startswith(".github/"):
        return "workflow"
    if rel.startswith("scripts/"):
        return "script"
    if "/messages/" in rel and name.endswith(".json"):
        return "messages"
    if rel.startswith("backend/"):
        for folder, kind in (
            ("/views/", "view"),
            ("/services/", "service"),
            ("/repositories/", "repository"),
            ("/models/", "model"),
            ("/serializers/", "serializer"),
            ("/permissions/", "permission"),
            ("/constants/", "constant"),
            ("/filters/", "filter"),
            ("/tasks/", "task"),
            ("/management/", "command"),
            ("/decorators/", "decorator"),
            ("/signals/", "signal"),
        ):
            if folder in rel:
                return kind
        if name in {"urls.py", "module.py", "apps.py", "settings.py"}:
            return name.removesuffix(".py")
        return "be-module"
    if rel.startswith("frontend/"):
        if name.endswith(".svg"):
            return "asset-svg"
        if name.endswith(".css"):
            return "style"
        if "/permissions/" in rel:
            return "permission"
        if "/hooks/" in rel or name.startswith("use-"):
            return "hook"
        if "/views/" in rel:
            return "view"
        if "/services/" in rel:
            return "service"
        if "/schemas/" in rel:
            return "schema"
        if "/types/" in rel:
            return "types"
        if "/constants/" in rel or name == "navigation.ts":
            return "constant"
        if "/components/" in rel:
            return "component"
        if rel.startswith("frontend/src/app/"):
            return "route-page"
        return "fe-config" if "/" not in rel.removeprefix("frontend/") else "fe-module"
    return "config"


def applicable_axes(rel: str) -> set[str]:
    """Xác định 4 trục rà soát áp dụng cho từng loại file."""
    axes = {"code"}
    ext = Path(rel).suffix.lower()
    is_generated_types = rel.endswith("api-schema.gen.ts")

    # Security
    if rel.startswith(("backend/app/", "backend/config/", "scripts/", ".github/")) or rel in {
        "backend/conftest.py",
        "backend/.env.example",
        "backend/build_files.sh",
    }:
        if "/migrations/" not in rel:
            axes.add("security")
    elif (
        rel.startswith(("frontend/src/", "frontend/tests/"))
        and ext in {".ts", ".tsx", ".js", ".mjs"}
        and not is_generated_types
    ) or (
        rel
        in {
            "frontend/next.config.ts",
            "frontend/public/firebase-messaging-sw.js",
            "frontend/.env.example",
            "frontend/package.json",
        }
        or (rel.startswith(".agents/skills/") and ext == ".py")
    ):
        axes.add("security")

    # i18n
    if (
        (
            rel.startswith("frontend/src/")
            and not is_generated_types
            and ext in {".ts", ".tsx", ".json"}
            and "/types/" not in rel
            and "/permissions/" not in rel
            and not rel.endswith("api-endpoints.ts")
            and not rel.endswith("query-keys.ts")
        )
        or rel
        in {
            "frontend/tests/unit/messages.test.ts",
            "frontend/tests/e2e/localization.spec.ts",
        }
        or rel.endswith(("_error_code.py", "error_codes.py", "test_error_codes.py"))
    ):
        axes.add("i18n")

    # Permission
    if rel.startswith("backend/app/"):
        if (
            any(
                part in rel
                for part in (
                    "/views/",
                    "/permissions/",
                    "/services/",
                    "/decorators/",
                    "/registry/",
                    "/authentication/",
                    "/middleware/",
                )
            )
            or Path(rel).name in {"module.py", "urls.py", "admin.py"}
            or any(token in rel for token in ("permission", "role", "iam", "endpoint_access", "auth"))
        ):
            axes.add("permission")
    elif rel.startswith("frontend/src/") and not is_generated_types:
        if (
            any(
                part in rel
                for part in (
                    "/permissions/",
                    "/views/",
                    "/auth/",
                    "/manage-app/",
                    "/role/",
                    "/user/",
                    "/shell/",
                    "/layout/",
                    "/profile/",
                )
            )
            or Path(rel).name in {"navigation.ts", "routes.ts", "use-permission.ts", "use-edit-mode.ts"}
            or rel.endswith("-table.tsx")
            or rel.endswith("-form.tsx")
            or rel.startswith("frontend/src/modules/portal/constants/navigation")
        ):
            axes.add("permission")
    elif rel.startswith("frontend/tests/") and any(
        token in rel
        for token in ("permission", "role", "auth", "protected-route", "table-conventions", "sidebar")
    ):
        axes.add("permission")

    return axes


def _extract_old_date(cell: str) -> str | None:
    cell = cell.strip()
    if DATE_RE.match(cell):
        return cell
    match = re.search(r"(\d{4}-\d{2}-\d{2})", cell)
    return match.group(1) if match else None


def _is_axis_current(cell: str, last_modified: str) -> bool:
    if cell == "N/A":
        return True
    if not DATE_RE.match(cell):
        return False
    return cell >= last_modified


def compute_status(record: AuditRecord, preferred_clean: str = "PASS") -> str:
    """Tính lại `Trạng thái` dựa trên ngày sửa và 4 ô kiểm tra."""
    axes = applicable_axes(record.path)
    for axis in AXES:
        cell = record.get_axis(axis)
        if axis not in axes:
            continue
        if not _is_axis_current(cell, record.last_modified):
            return "NEEDS_CHECK"
    if record.status == "FIXED" or preferred_clean == "FIXED":
        return "FIXED"
    return "PASS"


def _escape_cell(value: str) -> str:
    return value.replace("|", "\\|").replace("\n", " ").strip() or "—"


def _unescape_cell(value: str) -> str:
    return value.replace("\\|", "|").strip()


def _split_row(line: str) -> list[str]:
    inner = line.strip()
    if inner.startswith("|"):
        inner = inner[1:]
    if inner.endswith("|"):
        inner = inner[:-1]
    parts: list[str] = []
    buf: list[str] = []
    i = 0
    while i < len(inner):
        if inner[i] == "\\" and i + 1 < len(inner) and inner[i + 1] == "|":
            buf.append("|")
            i += 2
        elif inner[i] == "|":
            parts.append("".join(buf).strip())
            buf = []
            i += 1
        else:
            buf.append(inner[i])
            i += 1
    parts.append("".join(buf).strip())
    return parts


def parse_tracker(path: Path = TRACKER_PATH) -> tuple[dict[str, AuditRecord], str]:
    """Đọc bảng file và phần Nhật ký (`AUDIT_LOG`) từ file tracker hiện có."""
    if not path.exists():
        return {}, ""
    content = path.read_text(encoding="utf-8")

    log_block = ""
    if LOG_START in content and LOG_END in content:
        start = content.index(LOG_START) + len(LOG_START)
        end = content.index(LOG_END)
        log_block = content[start:end].strip()

    records: dict[str, AuditRecord] = {}
    table_section = content
    if TABLES_START in content and TABLES_END in content:
        start = content.index(TABLES_START) + len(TABLES_START)
        end = content.index(TABLES_END)
        table_section = content[start:end]

    for line in table_section.splitlines():
        stripped = line.strip()
        if not stripped.startswith("|") or stripped.startswith("| ---"):
            continue
        cols = _split_row(stripped)
        if len(cols) != 10:
            continue
        if cols[0] == "File":
            continue
        rel = normalize_rel_path(cols[0])
        if not rel or not is_tracked_target(rel):
            continue
        records[rel] = AuditRecord(
            path=rel,
            kind=_unescape_cell(cols[1]),
            last_modified=_unescape_cell(cols[2]),
            source=_unescape_cell(cols[3]),
            code=_unescape_cell(cols[4]),
            security=_unescape_cell(cols[5]),
            i18n=_unescape_cell(cols[6]),
            permission=_unescape_cell(cols[7]),
            status=_unescape_cell(cols[8]),
            note=_unescape_cell(cols[9]),
        )
    return records, log_block


def sync_records(
    existing: dict[str, AuditRecord],
    *,
    mark_all_date: str | None = None,
    fixed_paths: set[str] | None = None,
    fixed_notes: dict[str, str] | None = None,
) -> dict[str, AuditRecord]:
    """Đồng bộ danh sách file với Git & working tree hiện tại."""
    repo_files = collect_repo_files()
    history = git_file_history()
    dirty = git_dirty_files()
    today = _today_str()
    fixed_paths = fixed_paths or set()
    fixed_notes = fixed_notes or {}

    updated: dict[str, AuditRecord] = {}
    for rel in repo_files:
        axes = applicable_axes(rel)
        hist_date, hist_hash = history.get(rel, (file_mtime_date(rel), "new"))
        is_dirty = rel in dirty

        if is_dirty:
            last_mod = max(hist_date, file_mtime_date(rel), today)
            source = f"working-tree ({dirty[rel]})"
        else:
            last_mod = hist_date
            source = hist_hash

        prev = existing.get(rel)
        if prev is None:
            note = fixed_notes.get(rel, "—")
            rec = AuditRecord(
                path=rel,
                kind=kind_of(rel),
                last_modified=last_mod,
                source=source,
                code="N/A",
                security="N/A",
                i18n="N/A",
                permission="N/A",
                status="NEEDS_CHECK",
                note=note,
            )
            for axis in AXES:
                if axis in axes:
                    rec.set_axis(axis, mark_all_date if mark_all_date else "PENDING")
                else:
                    rec.set_axis(axis, "N/A")
            pref = "FIXED" if rel in fixed_paths else "PASS"
            rec.status = compute_status(rec, preferred_clean=pref)
            updated[rel] = rec
            continue

        # Cập nhật metadata nếu có file mới sửa
        rec = dataclasses.replace(
            prev,
            kind=kind_of(rel),
            last_modified=max(prev.last_modified, last_mod) if is_dirty else last_mod,
            source=source if (is_dirty or prev.source.startswith("working-tree")) else prev.source,
        )
        if mark_all_date:
            for axis in AXES:
                rec.set_axis(axis, mark_all_date if axis in axes else "N/A")
            if rel in fixed_notes:
                rec.note = fixed_notes[rel]
            rec.status = compute_status(rec, preferred_clean="FIXED" if rel in fixed_paths else "PASS")
        else:
            for axis in AXES:
                if axis not in axes:
                    rec.set_axis(axis, "N/A")
                    continue
                curr = rec.get_axis(axis)
                if curr == "N/A":
                    rec.set_axis(axis, "PENDING")
                elif DATE_RE.match(curr) and rec.last_modified > curr:
                    rec.set_axis(axis, f"PENDING (cũ: {curr})")
                elif is_dirty and curr == today and prev.source != source:
                    # Vẫn là hôm nay nhưng mới vừa sửa lại trên working tree sau khi check
                    rec.set_axis(axis, f"PENDING (cũ: {curr})")
            rec.status = compute_status(rec, preferred_clean=rec.status)
        updated[rel] = rec

    return updated


def default_log_block(today: str) -> str:
    """Tạo khối Nhật ký rà soát mẫu ban đầu nếu chưa có."""
    return (
        f"### Đợt rà soát toàn repo — {today}\n\n"
        "- **Phạm vi**: Toàn bộ Backend (`backend/app`, `backend/config`), Frontend (`frontend/src`, "
        "`frontend/tests`), Scripts/CI (`scripts/`, `.github/`) và Tài liệu/Rules (`docs/`, `.agents/`).\n"
        "- **Trục kiểm tra**: `/review-code` · `/review-security` · `/i18n-audit` · `/permission-audit`.\n"
        "- **Ghi chú**: Khởi tạo sổ theo dõi tập trung; các chỉnh sửa kế tiếp cập nhật qua "
        "`uv run --no-project python scripts/audit_tracker.py`."
    )


def render_tracker(records: dict[str, AuditRecord], log_block: str | None = None) -> str:
    """Kết xuất nội dung hoàn chỉnh cho `docs/reports/code-audit-tracker.md`."""
    now_str = dt.datetime.now().strftime("%Y-%m-%d %H:%M")
    today = _today_str()
    grouped: dict[str, list[AuditRecord]] = defaultdict(list)
    for rec in records.values():
        grouped[group_of(rec.path)].append(rec)
    for items in grouped.values():
        items.sort(key=lambda r: r.path)

    total = len(records)
    pass_cnt = sum(1 for r in records.values() if r.status == "PASS")
    fixed_cnt = sum(1 for r in records.values() if r.status == "FIXED")
    pending_records = sorted((r for r in records.values() if r.status == "NEEDS_CHECK"), key=lambda r: r.path)
    pending_cnt = len(pending_records)

    # Summary table
    summary_lines = [
        (
            "| Khu vực | Tổng file | PASS | FIXED | NEEDS_CHECK "
            "| Đạt Code | Đạt Security | Đạt i18n | Đạt Permission |"
        ),
        "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ]
    for grp in GROUP_ORDER:
        items = grouped.get(grp, [])
        if not items:
            continue
        p = sum(1 for r in items if r.status == "PASS")
        f = sum(1 for r in items if r.status == "FIXED")
        n = sum(1 for r in items if r.status == "NEEDS_CHECK")

        def _ok(axis: str, group_items: list[AuditRecord] = items) -> str:
            app_items = [r for r in group_items if axis in applicable_axes(r.path)]
            if not app_items:
                return "N/A"
            ok_cnt = sum(1 for r in app_items if _is_axis_current(r.get_axis(axis), r.last_modified))
            return f"{ok_cnt}/{len(app_items)}"

        summary_lines.append(
            f"| {GROUP_LABELS[grp]} | {len(items)} | {p} | {f} | {n} | "
            f"{_ok('code')} | {_ok('security')} | {_ok('i18n')} | {_ok('permission')} |"
        )
    summary_lines.append(
        f"| **TỔNG CỘNG** | **{total}** | **{pass_cnt}** | **{fixed_cnt}** | **{pending_cnt}** | "
        f"— | — | — | — |"
    )

    # Pending queue
    if pending_records:
        queue_lines = [
            f"Hiện có **{pending_cnt}** file cần rà soát lại (đã sửa sau lần kiểm gần nhất hoặc mới tạo):",
            "",
            "| File | Nhóm | Thay đổi gần nhất | Nguồn | Trục chờ check | Ghi chú |",
            "| --- | --- | --- | --- | --- | --- |",
        ]
        for rec in pending_records:
            axes = applicable_axes(rec.path)
            waiting = [
                axis
                for axis in AXES
                if axis in axes and not _is_axis_current(rec.get_axis(axis), rec.last_modified)
            ]
            queue_lines.append(
                f"| `{rec.path}` | {group_of(rec.path)} | {rec.last_modified} | "
                f"{_escape_cell(rec.source)} | {', '.join(waiting) or 'all'} | {_escape_cell(rec.note)} |"
            )
    else:
        queue_lines = [
            f"Không có file nào đang chờ rà soát (`0/{total}` `NEEDS_CHECK`, cập nhật lúc `{now_str}`).",
        ]

    # Detailed tables by group
    table_header = (
        "| File | Loại | Thay đổi gần nhất | Thay đổi bởi / Commit "
        "| Code | Security | i18n | Permission | Trạng thái | Ghi chú |"
    )
    table_lines: list[str] = []
    for grp in GROUP_ORDER:
        items = grouped.get(grp, [])
        if not items:
            continue
        table_lines.append(f"### {GROUP_LABELS[grp]} ({len(items)} file)")
        table_lines.append("")
        table_lines.append(table_header)
        table_lines.append("| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |")
        for rec in items:
            table_lines.append(
                f"| `{rec.path}` | {_escape_cell(rec.kind)} | {rec.last_modified} | "
                f"{_escape_cell(rec.source)} | {_escape_cell(rec.code)} | {_escape_cell(rec.security)} | "
                f"{_escape_cell(rec.i18n)} | {_escape_cell(rec.permission)} | "
                f"{_escape_cell(rec.status)} | {_escape_cell(rec.note)} |"
            )
        table_lines.append("")

    effective_log = (log_block or "").strip() or default_log_block(today)
    stats_line = (
        f"- **Tổng file theo dõi**: `{total}` · **PASS**: `{pass_cnt}` "
        f"· **FIXED**: `{fixed_cnt}` · **NEEDS_CHECK**: `{pending_cnt}`"
    )
    return "\n".join(
        [
            "# Sổ theo dõi rà soát code toàn hệ thống (Code / Security / i18n / Permission)",
            "",
            f"- **Cập nhật lần cuối**: `{now_str}`",
            stats_line,
            "- **Script đồng bộ & truy vấn**: [`scripts/audit_tracker.py`](../../scripts/audit_tracker.py)",
            "",
            "## Quy trình vận hành với các skill",
            "",
            (
                "1. **Khi sửa hoặc tạo file code/tài liệu/config** "
                "(`start-task`, `fix`, `refactor`, `test`, `db-migration`, hoặc sửa tay):"
            ),
            "   - Đánh dấu file cần kiểm tra lại kèm ngày sửa và mô tả ngắn:",
            "     ```bash",
            (
                "     uv run --no-project python scripts/audit_tracker.py mark-changed "
                '--files <path...> --note "<mô tả thay đổi>"'
            ),
            "     ```",
            (
                "2. **Khi chạy skill rà soát** "
                "(`review-code`, `review-security`, `i18n-audit`, `permission-audit`):"
            ),
            (
                "   - Bước đầu tiên **chỉ lấy danh sách file đang chờ (`NEEDS_CHECK`)** "
                "thuộc trục tương ứng (trừ khi người dùng yêu cầu rà toàn repo):"
            ),
            "     ```bash",
            "     uv run --no-project python scripts/audit_tracker.py list-pending --axis code",
            "     ```",
            (
                "   - Rà đúng những file này (và caller/contract bị ảnh hưởng), "
                "sửa lỗi nếu có, chạy test liên quan rồi đóng dấu:"
            ),
            "     ```bash",
            (
                "     uv run --no-project python scripts/audit_tracker.py mark-checked "
                "--axis code --files <path...> --status PASS"
            ),
            "     ```",
            (
                "3. **Khi đổi trên Git / ngoài skill**: Chạy "
                "`uv run --no-project python scripts/audit_tracker.py sync` để tự động đối chiếu "
                "ngày commit `git log` + `git status` và đẩy các file sửa sau ngày kiểm lên hàng đợi."
            ),
            "",
            "> [!NOTE]",
            (
                "> Quy ước trạng thái: `PASS` = mọi trục áp dụng đều đã kiểm từ ngày thay đổi "
                "gần nhất trở về sau; `FIXED` = có sửa lỗi trong đợt rà soát và đã kiểm lại đạt; "
                "`NEEDS_CHECK` = file mới tạo hoặc có sửa đổi sau ngày kiểm gần nhất; "
                "`N/A` = trục không áp dụng cho loại file này."
            ),
            "",
            "## 1. Thống kê tổng hợp theo khu vực",
            "",
            SUMMARY_START,
            *summary_lines,
            SUMMARY_END,
            "",
            "## 2. Hàng đợi file cần rà soát lại (`NEEDS_CHECK`)",
            "",
            QUEUE_START,
            *queue_lines,
            QUEUE_END,
            "",
            "## 3. Nhật ký các đợt rà soát",
            "",
            LOG_START,
            effective_log,
            LOG_END,
            "",
            "## 4. Bảng theo dõi chi tiết từng file",
            "",
            TABLES_START,
            *table_lines,
            TABLES_END,
            "",
        ]
    )


def _write_tracker(records: dict[str, AuditRecord], log_block: str | None) -> None:
    TRACKER_PATH.parent.mkdir(parents=True, exist_ok=True)
    TRACKER_PATH.write_text(render_tracker(records, log_block), encoding="utf-8", newline="\n")


def _cmd_init(args: argparse.Namespace) -> int:
    existing, log_block = parse_tracker()
    records = sync_records(existing, mark_all_date=args.mark_all_checked)
    _write_tracker(records, log_block)
    sys.stdout.write(f"Đã ghi {len(records)} file vào {TRACKER_PATH.relative_to(ROOT).as_posix()}.\n")
    return 0


def _cmd_sync(args: argparse.Namespace) -> int:
    existing, log_block = parse_tracker()
    records = sync_records(existing)
    rendered = render_tracker(records, log_block)
    pending = [r for r in records.values() if r.status == "NEEDS_CHECK"]
    if args.check:
        current = TRACKER_PATH.read_text(encoding="utf-8") if TRACKER_PATH.exists() else ""
        if current != rendered:
            # Kiểm tra phần bảng + hàng đợi khác biệt thực sự (bỏ dòng timestamp dòng 3)
            def _strip_ts(text: str) -> str:
                without_header = re.sub(r"^- \*\*Cập nhật lần cuối\*\*:.*$", "", text, flags=re.MULTILINE)
                return re.sub(r", cập nhật lúc `\d{4}-\d{2}-\d{2} \d{2}:\d{2}`", "", without_header)

            if _strip_ts(current) != _strip_ts(rendered):
                sys.stderr.write(
                    f"Tracker {TRACKER_PATH.relative_to(ROOT).as_posix()} bị lệch với repo "
                    f"(NEEDS_CHECK={len(pending)}). Chạy `sync` để cập nhật.\n"
                )
                return 1
        if args.strict_clean and pending:
            sys.stderr.write(f"Còn {len(pending)} file NEEDS_CHECK trong tracker.\n")
            return 1
        sys.stdout.write(f"Tracker đồng bộ ({len(records)} file, NEEDS_CHECK={len(pending)}).\n")
        return 0

    _write_tracker(records, log_block)
    sys.stdout.write(f"Đã đồng bộ {len(records)} file (NEEDS_CHECK={len(pending)}).\n")
    return 0


def _cmd_mark_changed(args: argparse.Namespace) -> int:
    existing, log_block = parse_tracker()
    records = sync_records(existing)
    dirty = git_dirty_files()
    today = args.date or _today_str()
    targets: list[str] = []
    if args.all_dirty:
        targets.extend(dirty.keys())
    if args.files:
        for raw in args.files:
            rel = normalize_rel_path(raw)
            if rel in records:
                targets.append(rel)
    targets = sorted(set(targets))
    if not targets:
        sys.stdout.write("Không có file hợp lệ nào để đánh dấu thay đổi.\n")
        return 0

    axes_to_invalidate = (
        AXES if not args.axes else tuple(a.strip() for a in args.axes.split(",") if a.strip())
    )
    for rel in targets:
        rec = records[rel]
        rec.last_modified = max(rec.last_modified, today)
        rec.source = args.source or dirty.get(rel, "task")
        if args.note:
            rec.note = args.note
        app_axes = applicable_axes(rel)
        for axis in axes_to_invalidate:
            if axis not in AXES or axis not in app_axes:
                continue
            old_date = _extract_old_date(rec.get_axis(axis))
            rec.set_axis(axis, f"PENDING (cũ: {old_date})" if old_date else "PENDING")
        rec.status = compute_status(rec)

    _write_tracker(records, log_block)
    sys.stdout.write(f"Đã đánh dấu NEEDS_CHECK cho {len(targets)} file.\n")
    return 0


def _cmd_mark_checked(args: argparse.Namespace) -> int:
    existing, log_block = parse_tracker()
    records = sync_records(existing)
    today = args.date or _today_str()
    requested_axes = (
        AXES if args.axis == "all" else tuple(a.strip() for a in args.axis.split(",") if a.strip())
    )
    for axis in requested_axes:
        if axis not in AXES:
            raise ValueError(f"Trục không hợp lệ: {axis}")

    targets: list[str] = []
    if args.all_repo:
        targets = sorted(records.keys())
    elif args.all_pending:
        targets = sorted(
            rec.path
            for rec in records.values()
            if any(
                axis in applicable_axes(rec.path)
                and not _is_axis_current(rec.get_axis(axis), rec.last_modified)
                for axis in requested_axes
            )
        )
    elif args.files:
        for raw in args.files:
            rel = normalize_rel_path(raw)
            if rel in records:
                targets.append(rel)

    targets = sorted(set(targets))
    if not targets:
        sys.stdout.write("Không có file nào khớp điều kiện để đánh dấu đã kiểm.\n")
        return 0

    for rel in targets:
        rec = records[rel]
        app_axes = applicable_axes(rel)
        for axis in requested_axes:
            if axis in app_axes:
                rec.set_axis(axis, max(today, rec.last_modified))
        if args.note:
            rec.note = args.note
        rec.status = compute_status(rec, preferred_clean=args.status)

    _write_tracker(records, log_block)
    pending_left = sum(1 for r in records.values() if r.status == "NEEDS_CHECK")
    sys.stdout.write(
        f"Đã đóng dấu {args.status} ({', '.join(requested_axes)}) cho {len(targets)} file; "
        f"còn NEEDS_CHECK={pending_left}.\n"
    )
    return 0


def _cmd_list_pending(args: argparse.Namespace) -> int:
    existing, _ = parse_tracker()
    records = existing if args.no_sync else sync_records(existing)
    axes_filter = AXES if args.axis == "all" else (args.axis,)
    matches: list[tuple[AuditRecord, list[str]]] = []
    for rel in sorted(records.keys()):
        rec = records[rel]
        app_axes = applicable_axes(rel)
        waiting = [
            axis
            for axis in axes_filter
            if axis in app_axes and not _is_axis_current(rec.get_axis(axis), rec.last_modified)
        ]
        if waiting:
            matches.append((rec, waiting))

    if not matches:
        sys.stdout.write(f"OK: Không có file nào cần kiểm cho trục `{args.axis}`.\n")
        return 0

    if args.format == "paths":
        for rec, _ in matches:
            sys.stdout.write(f"{rec.path}\n")
        return 0

    for rec, waiting in matches:
        sys.stdout.write(
            f"{rec.path} | modified={rec.last_modified} | pending={','.join(waiting)} | {rec.note}\n"
        )
    return 0


def main() -> int:
    """Điểm vào CLI quản lý sổ theo dõi rà soát code."""
    parser = argparse.ArgumentParser(description="Quản lý docs/reports/code-audit-tracker.md")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_init = sub.add_parser("init", help="Khởi tạo / dựng lại sổ theo dõi toàn repo")
    p_init.add_argument("--mark-all-checked", help="Đánh dấu toàn bộ file đã kiểm vào ngày YYYY-MM-DD")

    p_sync = sub.add_parser("sync", help="Đồng bộ file mới & ngày sửa từ Git / working tree")
    p_sync.add_argument("--check", action="store_true", help="Chỉ kiểm tra tracker có khớp repo không")
    p_sync.add_argument("--strict-clean", action="store_true", help="Fail nếu còn file NEEDS_CHECK")

    p_changed = sub.add_parser("mark-changed", help="Đánh dấu file vừa sửa cần kiểm lại")
    p_changed.add_argument("--files", nargs="*", help="Danh sách file đã sửa/thêm")
    p_changed.add_argument(
        "--all-dirty", action="store_true", help="Tự lấy mọi file đang thay đổi trong git status"
    )
    p_changed.add_argument("--date", help="Ngày thay đổi (YYYY-MM-DD)")
    p_changed.add_argument("--source", help="Nguồn thay đổi (VD: start-task, fix)")
    p_changed.add_argument("--note", help="Ghi chú thay đổi")
    p_changed.add_argument(
        "--axes", help="Danh sách trục cần kiểm lại, cách nhau dấu phẩy (mặc định: tất cả trục áp dụng)"
    )

    p_checked = sub.add_parser("mark-checked", help="Đóng dấu file đã kiểm xong cho 1 hoặc tất cả trục")
    p_checked.add_argument("--axis", required=True, choices=[*AXES, "all"], help="Trục kiểm tra đã hoàn tất")
    p_checked.add_argument("--files", nargs="*", help="Danh sách file đã kiểm")
    p_checked.add_argument(
        "--all-pending", action="store_true", help="Đánh dấu mọi file đang chờ thuộc trục đã chọn"
    )
    p_checked.add_argument("--all-repo", action="store_true", help="Đánh dấu toàn bộ file trong tracker")
    p_checked.add_argument("--date", help="Ngày kiểm (YYYY-MM-DD)")
    p_checked.add_argument(
        "--status", default="PASS", choices=["PASS", "FIXED"], help="Trạng thái khi đủ mọi trục"
    )
    p_checked.add_argument("--note", help="Ghi chú kết quả")

    p_pending = sub.add_parser("list-pending", help="Liệt kê file cần kiểm tra cho một trục")
    p_pending.add_argument("--axis", default="all", choices=[*AXES, "all"], help="Trục cần lọc")
    p_pending.add_argument(
        "--no-sync", action="store_true", help="Đọc nguyên bảng hiện có, không sync với git"
    )
    p_pending.add_argument("--format", default="table", choices=["table", "paths"], help="Định dạng đầu ra")

    args = parser.parse_args()
    handlers = {
        "init": _cmd_init,
        "sync": _cmd_sync,
        "mark-changed": _cmd_mark_changed,
        "mark-checked": _cmd_mark_checked,
        "list-pending": _cmd_list_pending,
    }
    return handlers[args.cmd](args)


if __name__ == "__main__":
    sys.exit(main())
