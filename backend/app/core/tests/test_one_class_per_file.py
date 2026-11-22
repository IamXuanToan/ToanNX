"""Quy ước tổ chức code backend, kiểm bằng AST (docstring có ví dụ `class ...` không bị đếm).

- Mỗi file một class cấp module (rule backend §2.2). Ngoại lệ: file model (model + enum của nó), file APIView
  `<resource>_view.py` chứa đúng `XxxView` + `XxxObjectView`.
- Method công khai của service không dùng `@staticmethod`/`@classmethod` (rule backend §4).
- Điểm vào (view, task, command) không gọi `Model.objects` hay tạo `XxxRepository()` (rule backend §1).
"""

import ast
from pathlib import Path

APP = Path(__file__).resolve().parents[2]
SKIP_PARTS = {"tests", "migrations", "__pycache__"}
APIVIEW_CLASSES = 2


def _sources() -> list[tuple[str, ast.Module]]:
    result = []
    for path in sorted(APP.rglob("*.py")):
        if SKIP_PARTS & set(path.parts):
            continue
        result.append((path.relative_to(APP).as_posix(), ast.parse(path.read_text(encoding="utf-8"))))
    return result


SOURCES = _sources()


def test_one_class_per_file() -> None:
    """File không phải model/APIView chỉ có một class cấp module."""
    offenders = []
    for name, tree in SOURCES:
        classes = [node.name for node in tree.body if isinstance(node, ast.ClassDef)]
        is_model = "/models/" in f"/{name}"
        is_apiview = name.endswith("_view.py") and len(classes) == APIVIEW_CLASSES
        if len(classes) > 1 and not is_model and not is_apiview:
            offenders.append(f"{name}: {classes}")
    assert not offenders, "Nhiều class một file:\n" + "\n".join(offenders)


def test_service_public_methods_are_not_static() -> None:
    """Method công khai của service là method instance (gọi qua `self.<tên>_service`)."""
    offenders = []
    for name, tree in SOURCES:
        if "/services/" not in f"/{name}":
            continue
        for cls in (node for node in tree.body if isinstance(node, ast.ClassDef)):
            for fn in cls.body:
                if not isinstance(fn, ast.FunctionDef) or fn.name.startswith("_"):
                    continue
                decorators = {getattr(d, "id", None) for d in fn.decorator_list}
                if decorators & {"staticmethod", "classmethod"}:
                    offenders.append(f"{name}: {cls.name}.{fn.name}")
    assert not offenders, "Method công khai tĩnh trong service:\n" + "\n".join(offenders)


def test_entry_points_do_not_touch_orm_or_repositories() -> None:
    """View, task, command chỉ gọi service."""
    offenders = []
    for name, tree in SOURCES:
        path = f"/{name}"
        if not any(part in path for part in ("/views/", "/tasks/", "/management/commands/")):
            continue
        for node in ast.walk(tree):
            if isinstance(node, ast.Attribute) and node.attr == "objects":
                offenders.append(f"{name}:{node.lineno} .objects")
            if (
                isinstance(node, ast.Call)
                and isinstance(node.func, ast.Name)
                and node.func.id.endswith("Repository")
            ):
                offenders.append(f"{name}:{node.lineno} {node.func.id}()")
    assert not offenders, "Điểm vào gọi ORM/repository:\n" + "\n".join(offenders)
