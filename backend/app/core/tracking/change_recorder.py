"""Hợp đồng nơi lưu lịch sử thay đổi (module system cung cấp bản thật)."""

from typing import Any

from app.core.tracking.change_set import ChangeSet


class ChangeRecorder:
    """Lưu `ChangeSet`. Lớp con khai qua setting `CORE_CHANGE_RECORDER`.

    Core chỉ biết hợp đồng này, không import module system (giống `AUTHENTICATION_BACKENDS`).
    """

    def record(self, change: ChangeSet) -> None:
        """Lưu một thay đổi (chạy trong transaction của thao tác gây ra nó).

        Args:
            change: Thay đổi.
        """
        raise NotImplementedError

    def history(self, resource: str, object_id: Any) -> Any:
        """Lịch sử của một bản ghi, mới nhất trước.

        Args:
            resource: `<module>.<model>`.
            object_id: Id bản ghi.

        Returns:
            Queryset/danh sách có các thuộc tính của `CoreJournalEntryResponseSerializer`.
        """
        raise NotImplementedError
