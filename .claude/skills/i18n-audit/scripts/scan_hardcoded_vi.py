"""Quét chuỗi tiếng Việt còn nằm trong file TS/TSX của `frontend/src/` (chỉ đọc)."""

from __future__ import annotations

import re
import sys
from pathlib import Path

VIET_PATTERN = re.compile(
    r"[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ"
    r"ÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]"
)
COMMENT_LINE = re.compile(r"^\s*(//|/\*|\*)")
IMPORT_LINE = re.compile(r"^\s*(import|export\s+type)\b")
TS_TOKEN = re.compile(
    r"\{/\*[\s\S]*?\*/\}|/\*[\s\S]*?\*/|//[^\n]*|"
    r'"(?:\\.|[^"\\\n])*"|\'(?:\\.|[^\'\\\n])*\'|`(?:\\.|[^`\\])*`'
)


def _strip_comments(source: str) -> str:
    """Xóa comment `//`, `/* */` và JSX `{/* */}` nhưng giữ nguyên chuỗi và số dòng."""

    def _replace(match: re.Match[str]) -> str:
        token = match.group(0)
        if token[0] in ("'", '"', "`"):
            return token
        return "\n" * token.count("\n")

    return TS_TOKEN.sub(_replace, source)


def main() -> int:
    """Quét toàn bộ TS/TSX trong `frontend/src` và in các dòng chứa ký tự tiếng Việt."""
    for stream in (sys.stdout, sys.stderr):
        configure = getattr(stream, "reconfigure", None)
        if configure is not None:
            configure(encoding="utf-8")

    root = Path.cwd()
    src_dir = root / "frontend" / "src"
    if not src_dir.is_dir():
        src_dir = root / "src"
    if not src_dir.is_dir():
        sys.stderr.write("Không tìm thấy thư mục frontend/src.\n")
        return 1

    files_hit = 0
    lines_hit = 0
    for path in sorted(src_dir.rglob("*.ts*")):
        rel = path.relative_to(src_dir).as_posix()
        if any(seg in rel for seg in (".test.", ".spec.", "__tests__", "api-schema.gen.ts")):
            continue
        cleaned = _strip_comments(path.read_text(encoding="utf-8", errors="ignore"))
        hits: list[tuple[int, str]] = []
        for idx, line in enumerate(cleaned.splitlines(), 1):
            stripped = line.strip()
            if not stripped or COMMENT_LINE.match(stripped) or IMPORT_LINE.match(stripped):
                continue
            if VIET_PATTERN.search(stripped):
                hits.append((idx, stripped[:140]))
        if hits:
            files_hit += 1
            lines_hit += len(hits)
            sys.stdout.write(f"\n[{rel}] ({len(hits)})\n")
            for lineno, text in hits[:30]:
                sys.stdout.write(f"  L{lineno}: {text}\n")
            if len(hits) > 30:
                sys.stdout.write(f"  ... +{len(hits) - 30} dòng nữa\n")

    sys.stdout.write(f"\nFILES_WITH_VI={files_hit} TOTAL_LINES={lines_hit}\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
