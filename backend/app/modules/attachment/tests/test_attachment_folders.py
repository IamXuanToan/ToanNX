"""Kiểm tra cây thư mục, phân quyền và bất biến đường dẫn storage."""

from typing import Any

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.attachment.models.attachment import Attachment
from app.modules.attachment.models.attachment_folder import AttachmentFolder
from app.modules.attachment.permissions.attachment_folder_permission import AttachmentFolderPermission
from app.modules.attachment.permissions.attachment_permission import AttachmentPermission as P
from app.modules.attachment.tests.helpers.attachment_test_helper import PNG_BYTES
from app.modules.iam.tests.helpers.permission_helper import grant

pytestmark = pytest.mark.django_db
FILES = "/api/v1/attachments"
FOLDERS = f"{FILES}/folders"


class TestAttachmentFolders(BaseApiTestCase):
    """Test qua API thật để kiểm tra cả quyền, serializer và transaction."""

    def folder(self, api: Any, name: str, parent: str | None = None) -> dict[str, Any]:
        """Tạo thư mục theo contract API."""
        return self.assert_success(api.post(FOLDERS, {"name": name, "parent_id": parent}, format="json"), 201)

    def file(self, api: Any, folder_id: str | None = None) -> dict[str, Any]:
        """Upload ảnh vào nhóm nếu có."""
        data: dict[str, Any] = {"file": SimpleUploadedFile("image.png", PNG_BYTES, "image/png")}
        if folder_id:
            data["folder_id"] = folder_id
        return self.assert_success(api.post(FILES, data, format="multipart"), 201)

    def test_nested_move_filter_cycle_and_storage(
        self, superuser: Any, login: Any, settings: Any, tmp_path: Any
    ) -> None:
        """Chuyển cả nhánh giữ file vật lý; lọc cha gồm hậu duệ và chặn chu trình."""
        settings.MEDIA_ROOT = tmp_path
        api = login(superuser)
        root = self.folder(api, "Root")
        child = self.folder(api, "Child", root["id"])
        leaf = self.folder(api, "Leaf", child["id"])
        other = self.folder(api, "Other")
        image = self.file(api, leaf["id"])
        stored = Attachment.objects.get(pk=image["id"])
        storage_name = stored.file.name
        assert len(storage_name.split("/")) == 4
        assert self.assert_success(api.get(FILES, {"folder": root["id"]}))[0]["id"] == image["id"]
        self.assert_error(
            api.patch(f"{FOLDERS}/{root['id']}", {"parent_id": leaf["id"]}, format="json"),
            400,
            "ATTACHMENT_FOLDER_CYCLE",
        )
        self.assert_error(
            api.patch(f"{FOLDERS}/{root['id']}", {"parent_id": root["id"]}, format="json"),
            400,
            "ATTACHMENT_FOLDER_CYCLE",
        )
        self.assert_success(
            api.patch(
                f"{FOLDERS}/{child['id']}", {"parent_id": other["id"], "name": "Renamed"}, format="json"
            )
        )
        leaf_model = AttachmentFolder.objects.get(pk=leaf["id"])
        assert [str(pk) for pk in leaf_model.ancestor_ids] == [other["id"], child["id"]]
        assert self.assert_success(api.get(FILES, {"folder": root["id"]})) == []
        assert self.assert_success(api.get(FILES, {"folder": other["id"]}))[0]["id"] == image["id"]
        current = self.assert_success(api.get(f"{FILES}/{image['id']}"))
        stored.refresh_from_db()
        assert stored.file.name == storage_name and current["url"] == image["url"]
        assert stored.file.storage.exists(storage_name)

    @pytest.mark.parametrize("delete_files", [False, True])
    def test_delete_entire_branch(
        self, delete_files: bool, superuser: Any, login: Any, settings: Any, tmp_path: Any
    ) -> None:
        """Cả hai lựa chọn áp dụng đệ quy, không xóa file vật lý hoặc nhánh khác."""
        settings.MEDIA_ROOT = tmp_path
        api = login(superuser)
        root = self.folder(api, "Root")
        child = self.folder(api, "Child", root["id"])
        leaf = self.folder(api, "Leaf", child["id"])
        outside = self.folder(api, "Outside")
        images = [self.file(api, folder["id"]) for folder in (root, child, leaf, outside)]
        result = self.assert_success(
            api.post(f"{FOLDERS}/{root['id']}/delete", {"delete_files": delete_files}, format="json")
        )
        assert result["count"] == 3
        assert (
            AttachmentFolder.objects.filter(
                pk__in=[root["id"], child["id"], leaf["id"]], deleted_at__isnull=False
            ).count()
            == 3
        )
        for image in images[:3]:
            stored = Attachment.objects.get(pk=image["id"])
            assert (stored.deleted_at is not None) == delete_files
            if not delete_files:
                assert stored.folder_id is None
            assert stored.file.storage.exists(stored.file.name)
        assert Attachment.objects.get(pk=images[3]["id"]).deleted_at is None
        assert AttachmentFolder.objects.get(pk=outside["id"]).deleted_at is None
        if not delete_files:
            assert len(self.assert_success(api.get(FILES, {"folder": "UNFILED"}))) == 3

    def test_sibling_names_and_reuse(self, superuser: Any, login: Any) -> None:
        """Tên duy nhất trong cùng cha; tên có thể lặp ở nhánh khác hoặc sau xóa."""
        api = login(superuser)
        root = self.folder(api, "Photos")
        self.assert_error(
            api.post(FOLDERS, {"name": " photos "}, format="json"), 409, "ATTACHMENT_FOLDER_NAME_EXISTS"
        )
        child = self.folder(api, "Photos", root["id"])
        self.assert_error(
            api.patch(f"{FOLDERS}/{child['id']}", {"parent_id": None}, format="json"),
            409,
            "ATTACHMENT_FOLDER_NAME_EXISTS",
        )
        assert api.delete(f"{FOLDERS}/{root['id']}").status_code == 204
        self.folder(api, "Photos")

    def test_owner_and_delete_permissions(
        self, user: Any, superuser: Any, login: Any, settings: Any, tmp_path: Any
    ) -> None:
        """Quyền folder không mở quyền file, manage_all không cho gán sai chủ."""
        settings.MEDIA_ROOT = tmp_path
        foreign = self.folder(login(superuser), "Private")
        grant(
            user,
            AttachmentFolderPermission.FOLDER_READ,
            AttachmentFolderPermission.FOLDER_CREATE,
            AttachmentFolderPermission.FOLDER_UPDATE,
            AttachmentFolderPermission.FOLDER_DELETE,
            P.FILE_CREATE,
            P.FILE_READ,
            P.FILE_UPDATE,
        )
        api = login(user)
        root = self.folder(api, "Mine")
        image = self.file(api, root["id"])
        assert len(self.assert_success(api.get(FOLDERS))) == 1
        self.assert_error(api.get(f"{FOLDERS}/{foreign['id']}"), 404, "NOT_FOUND")
        self.assert_error(
            api.post(f"{FOLDERS}/{root['id']}/delete", {"delete_files": True}, format="json"),
            403,
            "PERMISSION_DENIED",
        )
        assert AttachmentFolder.objects.get(pk=root["id"]).deleted_at is None
        assert Attachment.objects.get(pk=image["id"]).deleted_at is None
        grant(user, P.FILE_MANAGE_ALL)
        self.assert_error(
            api.patch(f"{FILES}/{image['id']}", {"folder_id": foreign["id"]}, format="json"),
            400,
            "ATTACHMENT_FOLDER_OWNER_MISMATCH",
        )
        self.assert_error(
            api.patch(f"{FOLDERS}/{root['id']}", {"parent_id": foreign["id"]}, format="json"),
            400,
            "ATTACHMENT_FOLDER_OWNER_MISMATCH",
        )
        self.assert_success(
            api.post(f"{FOLDERS}/{root['id']}/delete", {"delete_files": False}, format="json")
        )
        assert Attachment.objects.get(pk=image["id"]).folder_id is None

    def test_bulk_move_atomic_and_filters(
        self, superuser: Any, login: Any, settings: Any, tmp_path: Any
    ) -> None:
        """Chuyển nhiều file giữ URL, kiểm tra giao giữa loại và đuôi, rollback khi id lỗi."""
        settings.MEDIA_ROOT = tmp_path
        api = login(superuser)
        root = self.folder(api, "Root")
        images = [self.file(api), self.file(api)]
        ids = [image["id"] for image in images]
        self.assert_success(
            api.post(f"{FILES}/bulk-update", {"ids": ids, "folder_id": root["id"]}, format="json")
        )
        assert Attachment.objects.filter(pk__in=ids, folder_id=root["id"]).count() == 2
        renamed = self.assert_success(
            api.patch(f"{FOLDERS}/{root['id']}", {"name": "Renamed"}, format="json")
        )
        assert renamed["file_count"] == 2
        assert (
            len(
                self.assert_success(
                    api.get(FILES, {"kind": "IMAGE", "content_type": "image/png", "folder": root["id"]})
                )
            )
            == 2
        )
        assert self.assert_success(api.get(FILES, {"kind": "VIDEO", "content_type": "image/png"})) == []
        self.assert_error(
            api.post(
                f"{FILES}/bulk-update",
                {"ids": [*ids, "00000000-0000-0000-0000-000000000001"], "folder_id": None},
                format="json",
            ),
            404,
            "NOT_FOUND",
        )
        assert Attachment.objects.filter(pk__in=ids, folder_id=root["id"]).count() == 2

    @pytest.mark.parametrize(
        "path,body",
        [
            (FOLDERS, {"name": "No"}),
            (f"{FILES}/bulk-update", {"ids": ["00000000-0000-0000-0000-000000000001"], "folder_id": None}),
        ],
    )
    def test_write_requires_action_permission(
        self, path: str, body: dict[str, Any], user: Any, login: Any
    ) -> None:
        """Không cấp ngầm quyền tạo nhóm/chuyển file khi chỉ được đăng nhập."""
        self.assert_error(login(user).post(path, body, format="json"), 403, "PERMISSION_DENIED")
