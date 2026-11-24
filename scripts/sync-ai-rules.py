"""Sinh rule AI cho Claude Code từ nguồn duy nhất `.agents/rules/*.md`.

Nguồn có frontmatter `trigger` (always_on | model_decision | glob | manual), `description`, `globs` (khi glob).
Ánh xạ sang cơ chế của Claude Code:

| trigger        | Sinh ra                                   | Claude Code nạp khi                    |
| -------------- | ----------------------------------------- | -------------------------------------- |
| always_on      | .claude/rules/<tên>.md                    | luôn                                   |
| glob           | .claude/rules/<tên>.md (+ `paths:`)       | đọc/sửa file khớp mẫu                  |
| model_decision | .claude/skills/rule-<tên>/SKILL.md        | tự chọn theo `description`             |
| manual         | .claude/commands/<tên>.md                 | người dùng gõ `/<tên>`                 |

`<tên>` là tên file nguồn bỏ số thứ tự (`10-backend.md` → `backend`). File sinh ra có dòng đánh dấu; chỉ những file có
dấu này mới bị ghi đè/xóa, nên skill và command viết tay khác không bị đụng.

Chạy từ gốc repo:
    python scripts/sync-ai-rules.py          # sinh lại
    python scripts/sync-ai-rules.py --check  # chỉ kiểm, lệch thì thoát mã 1 (dùng trong check-all/CI)
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE_DIR = ROOT / ".agents" / "rules"
CLAUDE_DIR = ROOT / ".claude"
RULES_DIR = CLAUDE_DIR / "rules"
SKILLS_DIR = CLAUDE_DIR / "skills"
COMMANDS_DIR = CLAUDE_DIR / "commands"
MARKER = "Sinh tự động từ .agents/rules/"
TRIGGERS = ("always_on", "model_decision", "glob", "manual")
SKILL_PREFIX = "rule-"
FRONTMATTER = re.compile(r"\A---\n(.*?)\n---\n(.*)\Z", re.S)


def parse(path: Path) -> tuple[dict[str, str], str]:
    """Tách frontmatter (key: value một dòng) và thân rule."""
    text = path.read_text(encoding="utf-8").replace("\r\n", "\n")
    match = FRONTMATTER.match(text)
    if not match:
        raise SystemExit(f"{path.name}: thiếu frontmatter `---`.")
    meta: dict[str, str] = {}
    for line in match.group(1).splitlines():
        if ":" in line:
            key, value = line.split(":", 1)
            meta[key.strip()] = value.strip()
    trigger = meta.get("trigger", "")
    if trigger not in TRIGGERS:
        raise SystemExit(f"{path.name}: trigger phải là một trong {TRIGGERS}, đang là {trigger!r}.")
    if not meta.get("description"):
        raise SystemExit(f"{path.name}: thiếu description.")
    if trigger == "glob" and not meta.get("globs"):
        raise SystemExit(f"{path.name}: trigger glob phải có globs.")
    return meta, match.group(2).lstrip("\n")


def rule_name(path: Path) -> str:
    """`10-backend.md` → `backend`."""
    return re.sub(r"^\d+-", "", path.stem)


def yaml_text(value: str) -> str:
    """Chuỗi YAML an toàn trong ngoặc kép."""
    return '"' + value.replace("\\", "\\\\").replace('"', '\\"') + '"'


def render(path: Path) -> tuple[Path, str]:
    """Đích và nội dung file sinh cho Claude Code."""
    meta, body = parse(path)
    name = rule_name(path)
    marker = f"<!-- {MARKER}{path.name} bằng scripts/sync-ai-rules.py. Không sửa tay. -->\n\n"
    trigger = meta["trigger"]
    if trigger == "always_on":
        return RULES_DIR / f"{name}.md", marker + body
    if trigger == "glob":
        globs = [item.strip() for item in meta["globs"].split(",") if item.strip()]
        paths = "\n".join(f"  - {yaml_text(item)}" for item in globs)
        return RULES_DIR / f"{name}.md", f"---\npaths:\n{paths}\n---\n\n{marker}{body}"
    if trigger == "model_decision":
        header = f"---\nname: {SKILL_PREFIX}{name}\ndescription: {yaml_text(meta['description'])}\n---\n\n"
        return SKILLS_DIR / f"{SKILL_PREFIX}{name}" / "SKILL.md", header + marker + body
    header = f"---\ndescription: {yaml_text(meta['description'])}\n---\n\n"
    return COMMANDS_DIR / f"{name}.md", header + marker + body


def generated_files() -> list[Path]:
    """File sinh tự động đang có (nhận ra qua dòng đánh dấu)."""
    found: list[Path] = []
    candidates = [*RULES_DIR.glob("*.md"), *COMMANDS_DIR.glob("*.md"), *SKILLS_DIR.glob(f"{SKILL_PREFIX}*/SKILL.md")]
    for path in candidates:
        if MARKER in path.read_text(encoding="utf-8"):
            found.append(path)
    return found


def main() -> int:
    check = "--check" in sys.argv[1:]
    sources = sorted(SOURCE_DIR.glob("*.md"))
    if not sources:
        raise SystemExit(f"Không có rule nguồn trong {SOURCE_DIR}.")
    expected: dict[Path, str] = {}
    for source in sources:
        target, content = render(source)
        if target in expected:
            raise SystemExit(f"Trùng tên rule sinh ra: {target.relative_to(ROOT)}.")
        expected[target] = content
    stale = [path for path in generated_files() if path not in expected]
    changed = [
        path
        for path, content in expected.items()
        if not path.exists() or path.read_text(encoding="utf-8") != content
    ]
    if check:
        for path in changed:
            print(f"Lệch: {path.relative_to(ROOT)}")
        for path in stale:
            print(f"Thừa: {path.relative_to(ROOT)}")
        if changed or stale:
            print("Rule AI cho Claude Code chưa khớp .agents/rules/. Chạy: python scripts/sync-ai-rules.py")
            return 1
        print(f"Rule AI khớp ({len(expected)} rule).")
        return 0
    for path, content in expected.items():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8", newline="\n")
    for path in stale:
        path.unlink()
        if path.name == "SKILL.md" and not any(path.parent.iterdir()):
            path.parent.rmdir()
    print(f"Đã sinh {len(expected)} rule, cập nhật {len(changed)}, xóa {len(stale)} file thừa.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
