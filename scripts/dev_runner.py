"""Điều phối chạy đồng thời backend Django và frontend Next.js trên Windows.

Dùng Win32 Job Object (`JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE`) và `SetConsoleCtrlHandler`
để khi nhấn Ctrl+C, đóng cửa sổ terminal, hoặc một trong hai server tự thoát,
toàn bộ cây tiến trình backend + frontend đều dừng ngay lập tức, không sót tiến trình nền.
"""

from __future__ import annotations

import argparse
import contextlib
import ctypes
import os
import shutil
import signal
import subprocess
import sys
import threading
from ctypes import wintypes
from pathlib import Path
from typing import Any

JOB_OBJECT_EXTENDED_LIMIT_INFORMATION_CLASS = 9
JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE = 0x00002000

CTRL_C_EVENT = 0
CTRL_BREAK_EVENT = 1
CTRL_CLOSE_EVENT = 2
CTRL_LOGOFF_EVENT = 5
CTRL_SHUTDOWN_EVENT = 6


class _IoCounters(ctypes.Structure):
    _fields_ = [
        ("ReadOperationCount", ctypes.c_uint64),
        ("WriteOperationCount", ctypes.c_uint64),
        ("OtherOperationCount", ctypes.c_uint64),
        ("ReadTransferCount", ctypes.c_uint64),
        ("WriteTransferCount", ctypes.c_uint64),
        ("OtherTransferCount", ctypes.c_uint64),
    ]


class _JobObjectBasicLimitInformation(ctypes.Structure):
    _fields_ = [
        ("PerProcessUserTimeLimit", ctypes.c_int64),
        ("PerJobUserTimeLimit", ctypes.c_int64),
        ("LimitFlags", wintypes.DWORD),
        ("MinimumWorkingSetSize", ctypes.c_size_t),
        ("MaximumWorkingSetSize", ctypes.c_size_t),
        ("ActiveProcessLimit", wintypes.DWORD),
        ("Affinity", ctypes.c_size_t),
        ("PriorityClass", wintypes.DWORD),
        ("SchedulingClass", wintypes.DWORD),
    ]


class _JobObjectExtendedLimitInformation(ctypes.Structure):
    _fields_ = [
        ("BasicLimitInformation", _JobObjectBasicLimitInformation),
        ("IoInfo", _IoCounters),
        ("ProcessMemoryLimit", ctypes.c_size_t),
        ("JobMemoryLimit", ctypes.c_size_t),
        ("PeakProcessMemoryUsed", ctypes.c_size_t),
        ("PeakJobMemoryUsed", ctypes.c_size_t),
    ]


def _configure_stdio() -> None:
    """Ép UTF-8 để thông báo tiếng Việt không lỗi trên console Windows."""
    for stream in (sys.stdout, sys.stderr):
        reconfigure = getattr(stream, "reconfigure", None)
        if reconfigure is not None:
            reconfigure(encoding="utf-8", errors="replace")


def _write_line(message: str, *, error: bool = False) -> None:
    """Ghi một dòng thông báo ra stdout/stderr và flush ngay."""
    stream = sys.stderr if error else sys.stdout
    stream.write(f"{message}\n")
    stream.flush()


def _create_kill_on_close_job(kernel32: Any) -> int | None:
    """Tạo Win32 Job Object tự hủy toàn bộ tiến trình con khi handle đóng."""
    job_handle = kernel32.CreateJobObjectW(None, None)
    if not job_handle:
        return None
    info = _JobObjectExtendedLimitInformation()
    info.BasicLimitInformation.LimitFlags = JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE
    ok = kernel32.SetInformationJobObject(
        job_handle,
        JOB_OBJECT_EXTENDED_LIMIT_INFORMATION_CLASS,
        ctypes.byref(info),
        ctypes.sizeof(info),
    )
    if not ok:
        kernel32.CloseHandle(job_handle)
        return None
    return int(job_handle)


def _free_ports(root_dir: Path, ports: list[int], frontend_dir: Path) -> bool:
    """Gọi script PowerShell giải phóng các cổng dev còn bận và xóa lock Next cũ."""
    ps_exe = shutil.which("powershell") or "powershell.exe"
    script_path = root_dir / "scripts" / "free-port.ps1"
    cmd = [
        ps_exe,
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        str(script_path),
        "-Ports",
        ",".join(str(port) for port in ports),
        "-FrontendDir",
        str(frontend_dir),
    ]
    result = subprocess.run(cmd, check=False)  # noqa: S603
    return result.returncode == 0


def _kill_pid_tree(pid: int) -> None:
    """Tắt cưỡng bức cây tiến trình theo PID như lớp dự phòng."""
    subprocess.run(  # noqa: S603
        ["taskkill.exe", "/PID", str(pid), "/T", "/F"],  # noqa: S607
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        check=False,
    )


def _remove_stale_next_lock(frontend_dir: Path) -> None:
    """Xóa file lock của Next.js nếu đã được nhả để lần chạy sau khởi động ngay."""
    lock_file = frontend_dir / ".next" / "dev" / "lock"
    with contextlib.suppress(OSError):
        lock_file.unlink(missing_ok=True)


class _DevSupervisor:
    """Quản lý vòng đời hai tiến trình backend và frontend trong cùng Job Object."""

    def __init__(
        self,
        *,
        root_dir: Path,
        backend_dir: Path,
        frontend_dir: Path,
        backend_port: int,
        frontend_port: int,
    ) -> None:
        self._root_dir = root_dir
        self._backend_dir = backend_dir
        self._frontend_dir = frontend_dir
        self._backend_port = backend_port
        self._frontend_port = frontend_port

        self._kernel32: Any = ctypes.WinDLL("kernel32", use_last_error=True)
        self._job_handle: int | None = _create_kill_on_close_job(self._kernel32)
        self._processes: list[subprocess.Popen[bytes]] = []
        self._stop_event = threading.Event()
        self._shutdown_lock = threading.Lock()
        self._has_shutdown = False
        self._ctrl_handler_ref: Any = None

    def _assign_to_job(self, process: subprocess.Popen[bytes]) -> None:
        """Gán tiến trình con vào Job Object để luôn chết cùng supervisor."""
        if self._job_handle is None:
            return
        handle = int(getattr(process, "_handle", 0))
        if handle:
            self._kernel32.AssignProcessToJobObject(
                wintypes.HANDLE(self._job_handle),
                wintypes.HANDLE(handle),
            )

    def _register_ctrl_handlers(self) -> None:
        """Bắt Ctrl+C, Ctrl+Break và đóng cửa sổ console trên Windows."""
        handler_type = ctypes.WINFUNCTYPE(wintypes.BOOL, wintypes.DWORD)

        def _on_ctrl(ctrl_type: int) -> bool:
            if ctrl_type in (CTRL_C_EVENT, CTRL_BREAK_EVENT):
                self.shutdown()
                return True
            if ctrl_type in (CTRL_CLOSE_EVENT, CTRL_LOGOFF_EVENT, CTRL_SHUTDOWN_EVENT):
                self.shutdown()
                return False
            return False

        # Bật lại xử lý Ctrl+C phòng trường hợp tiến trình cha từng vô hiệu hóa kế thừa CTRL_C.
        self._kernel32.SetConsoleCtrlHandler(None, False)
        self._ctrl_handler_ref = handler_type(_on_ctrl)
        self._kernel32.SetConsoleCtrlHandler(self._ctrl_handler_ref, True)

        def _on_signal(_signum: int, _frame: Any) -> None:
            self.shutdown()

        signal.signal(signal.SIGINT, _on_signal)
        signal.signal(signal.SIGTERM, _on_signal)

    def _start_processes(self) -> tuple[subprocess.Popen[bytes], subprocess.Popen[bytes]]:
        """Khởi chạy đồng thời backend Django và frontend Next.js."""
        pnpm_path = shutil.which("pnpm")
        if not pnpm_path:
            raise FileNotFoundError("Không tìm thấy pnpm trong PATH.")

        creationflags = getattr(subprocess, "CREATE_NEW_PROCESS_GROUP", 0)

        backend_env = os.environ.copy()
        backend_env["PYTHONUTF8"] = "1"
        backend_env["PYTHONUNBUFFERED"] = "1"
        venv_dir = self._backend_dir / ".venv"
        if venv_dir.is_dir():
            backend_env["VIRTUAL_ENV"] = str(venv_dir)
            scripts_dir = str(venv_dir / "Scripts")
            backend_env["PATH"] = f"{scripts_dir}{os.pathsep}{backend_env.get('PATH', '')}"

        backend_proc = subprocess.Popen(  # noqa: S603
            [sys.executable, "manage.py", "runserver", str(self._backend_port)],
            cwd=str(self._backend_dir),
            env=backend_env,
            stdin=subprocess.DEVNULL,
            creationflags=creationflags,
        )
        self._processes.append(backend_proc)
        self._assign_to_job(backend_proc)

        frontend_env = os.environ.copy()
        frontend_proc = subprocess.Popen(  # noqa: S603
            [pnpm_path, "exec", "next", "dev", "-p", str(self._frontend_port)],
            cwd=str(self._frontend_dir),
            env=frontend_env,
            stdin=subprocess.DEVNULL,
            creationflags=creationflags,
        )
        self._processes.append(frontend_proc)
        self._assign_to_job(frontend_proc)

        return backend_proc, frontend_proc

    def shutdown(self) -> None:
        """Dừng toàn bộ backend và frontend ngay lập tức (an toàn khi gọi nhiều lần)."""
        with self._shutdown_lock:
            if self._has_shutdown:
                return
            self._has_shutdown = True
            self._stop_event.set()

            _write_line("\n[dev] Dang dung ca backend va frontend...")
            if self._job_handle is not None:
                self._kernel32.TerminateJobObject(wintypes.HANDLE(self._job_handle), 0)
                self._kernel32.CloseHandle(wintypes.HANDLE(self._job_handle))
                self._job_handle = None

            for proc in self._processes:
                if proc.poll() is None:
                    _kill_pid_tree(proc.pid)
                try:
                    proc.wait(timeout=2)
                except subprocess.TimeoutExpired:
                    proc.kill()

            _free_ports(
                self._root_dir,
                [self._backend_port, self._frontend_port],
                self._frontend_dir,
            )
            _remove_stale_next_lock(self._frontend_dir)
            # Khôi phục con trỏ terminal nếu tiến trình con vừa thoát giữa chừng.
            sys.stdout.write("\x1b[?25h")
            sys.stdout.flush()

    def run(self) -> int:
        """Chạy cặp server cho đến khi người dùng dừng hoặc một server tự thoát."""
        if not _free_ports(
            self._root_dir,
            [self._backend_port, self._frontend_port],
            self._frontend_dir,
        ):
            return 1

        self._register_ctrl_handlers()
        try:
            backend_proc, frontend_proc = self._start_processes()
            while not self._stop_event.wait(0.25):
                backend_rc = backend_proc.poll()
                if backend_rc is not None:
                    if not self._stop_event.is_set():
                        _write_line(
                            f"[dev] Backend da dung dot ngot (ma thoat {backend_rc}). Dang dung frontend...",
                            error=True,
                        )
                        return backend_rc if backend_rc != 0 else 1
                    return 0

                frontend_rc = frontend_proc.poll()
                if frontend_rc is not None:
                    if not self._stop_event.is_set():
                        _write_line(
                            f"[dev] Frontend da dung dot ngot (ma thoat {frontend_rc}). Dang dung backend...",
                            error=True,
                        )
                        return frontend_rc if frontend_rc != 0 else 1
                    return 0
            return 0
        finally:
            self.shutdown()


def _parse_args() -> argparse.Namespace:
    """Đọc tham số thư mục và cổng dev từ dòng lệnh."""
    root_default = Path(__file__).resolve().parent.parent
    parser = argparse.ArgumentParser(description="Chạy và quản lý backend/frontend dev server.")
    parser.add_argument("--backend-dir", type=Path, default=root_default / "backend")
    parser.add_argument("--frontend-dir", type=Path, default=root_default / "frontend")
    parser.add_argument("--backend-port", type=int, default=8001)
    parser.add_argument("--frontend-port", type=int, default=3001)
    return parser.parse_args()


def main() -> int:
    """Điểm vào chính của supervisor dev server."""
    _configure_stdio()
    args = _parse_args()
    root_dir = Path(__file__).resolve().parent.parent
    supervisor = _DevSupervisor(
        root_dir=root_dir,
        backend_dir=args.backend_dir.resolve(),
        frontend_dir=args.frontend_dir.resolve(),
        backend_port=args.backend_port,
        frontend_port=args.frontend_port,
    )
    exit_code = supervisor.run()
    _write_line("[dev] Da dung ca backend va frontend.")
    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
