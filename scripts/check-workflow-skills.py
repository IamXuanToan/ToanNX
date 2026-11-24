"""Kiểm skill workflow có thể được chọn và giống nhau ở Codex/Claude."""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NAMES = ("start-task", "fix", "review-code")
REFERENCES = {
    "start-task": ("references/acceptance-matrix.md",),
    "fix": ("references/regression-matrix.md",),
    "review-code": ("references/review-matrix.md",),
}
SPECIALISTS = (
    "ui-ux",
    "web-design-guidelines",
    "vercel-react-best-practices",
    "security-best-practices",
    "django-perf-review",
    "vitest",
    "playwright-best-practices",
    "playwright-cli",
    "web-perf",
    "sepay",
)
FRONTMATTER = re.compile(r"\A---\n(?P<header>.*?)\n---\n(?P<body>.*)\Z", re.S)


def check_skill(name: str) -> list[str]:
    """Trả các lỗi cấu trúc của một skill, không thay đổi file."""
    errors: list[str] = []
    source = ROOT / ".agents" / "skills" / name / "SKILL.md"
    mirror = ROOT / ".claude" / "skills" / name / "SKILL.md"
    if not source.is_file() or not mirror.is_file():
        return [f"{name}: thiếu SKILL.md ở .agents hoặc .claude"]
    content = source.read_text(encoding="utf-8").replace("\r\n", "\n")
    if content != mirror.read_text(encoding="utf-8").replace("\r\n", "\n"):
        errors.append(f"{name}: bản Claude khác nguồn .agents")
    match = FRONTMATTER.match(content)
    if not match:
        return [*errors, f"{name}: thiếu frontmatter YAML"]
    header = match.group("header")
    metadata = dict(re.findall(r"(?m)^(name|description):\s*(.+)$", header))
    if metadata.get("name") != name:
        errors.append(f"{name}: trường name không khớp tên thư mục")
    raw_description = metadata.get("description", "").strip()
    if not (raw_description.startswith('"') and raw_description.endswith('"')):
        errors.append(f"{name}: description phải được bọc dấu nháy YAML")
    description = raw_description.strip('"')
    if not description or len(description) > 1024:
        errors.append(f"{name}: description trống hoặc dài hơn 1024 ký tự")
    if not match.group("body").strip():
        errors.append(f"{name}: thiếu hướng dẫn trong thân skill")
    if re.search(r"(?m)^user-invocable:\s*false\s*$", header):
        errors.append(f"{name}: đang tắt gọi trực tiếp bằng /{name}")
    if re.search(r"(?m)^disable-model-invocation:\s*true\s*$", header):
        errors.append(f"{name}: đang tắt kích hoạt tự động trong Claude")
    if re.search(r"(?m)^context:\s*fork\s*$", header):
        errors.append(f"{name}: chạy tách hội thoại nên không lấy được task hiện hành")
    policy = source.parent / "agents" / "openai.yaml"
    if policy.is_file() and "allow_implicit_invocation: false" in policy.read_text(encoding="utf-8"):
        errors.append(f"{name}: đang tắt kích hoạt tự động")
    for relative in REFERENCES[name]:
        resource = source.parent / relative
        claude_resource = mirror.parent / relative
        if relative not in match.group("body"):
            errors.append(f"{name}: chưa dẫn tới {relative}")
        if not resource.is_file() or not claude_resource.is_file():
            errors.append(f"{name}: thiếu {relative} ở .agents hoặc .claude")
        elif resource.read_bytes() != claude_resource.read_bytes():
            errors.append(f"{name}: bản Claude của {relative} khác nguồn .agents")
    return errors


def main() -> int:
    """Kiểm ba skill và bảng định tuyến trong rule AI."""
    for stream in (sys.stdout, sys.stderr):
        configure = getattr(stream, "reconfigure", None)
        if configure is not None:
            configure(encoding="utf-8")
    errors = [error for name in NAMES for error in check_skill(name)]
    router = (ROOT / ".agents" / "rules" / "01-workflow.md").read_text(encoding="utf-8")
    for name in NAMES:
        if not re.search(rf"(?m)^\|[^\n]*`{re.escape(name)}`[^\n]*\|$", router):
            errors.append(f"{name}: thiếu trong bảng chọn workflow")
    for name in SPECIALISTS:
        source = ROOT / ".agents" / "skills" / name / "SKILL.md"
        mirror = ROOT / ".claude" / "skills" / name / "SKILL.md"
        if not source.is_file() or not mirror.is_file():
            errors.append(f"{name}: skill chuyên môn chưa cài ở cả .agents và .claude")
            continue
        content = source.read_text(encoding="utf-8").replace("\r\n", "\n")
        specialist_match = FRONTMATTER.match(content)
        if not specialist_match:
            errors.append(f"{name}: thiếu frontmatter để trigger")
        elif not re.search(rf'(?m)^name:\s*"?{re.escape(name)}"?\s*$', specialist_match.group("header")):
            errors.append(f"{name}: name trong frontmatter không khớp thư mục")
        elif not re.search(r"(?m)^description:\s*\S", specialist_match.group("header")):
            errors.append(f"{name}: thiếu description để chọn theo ngữ nghĩa")
        if content != mirror.read_text(encoding="utf-8").replace("\r\n", "\n"):
            errors.append(f"{name}: bản Claude khác nguồn .agents")
    for error in errors:
        sys.stderr.write(f"Lỗi: {error}\n")
    if errors:
        return 1
    sys.stdout.write(f"Skill workflow khớp ở Codex/Claude ({len(NAMES)} skill).\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
