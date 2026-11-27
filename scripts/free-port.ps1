param(
    [Parameter(Mandatory = $true)]
    [string]$Ports,
    [string]$FrontendDir = ""
)

$ErrorActionPreference = "Continue"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$portList = @(
    $Ports -split '[,\s]+' |
        Where-Object { $_ -match '^\d+$' } |
        ForEach-Object { [int]$_ }
)
if ($portList.Count -eq 0) {
    Write-Error "[dev] Danh sach cong khong hop le: $Ports"
    exit 1
}

function Get-ProcessMap {
    $map = @{}
    foreach ($proc in (Get-CimInstance Win32_Process -ErrorAction SilentlyContinue)) {
        $map[[int]$proc.ProcessId] = $proc
    }
    return $map
}

function Get-ProtectedPids($ProcMap) {
    $protected = New-Object "System.Collections.Generic.HashSet[int]"
    $current = [int]$PID
    while ($current -gt 4 -and $ProcMap.ContainsKey($current)) {
        if (-not $protected.Add($current)) {
            break
        }
        $current = [int]$ProcMap[$current].ParentProcessId
    }
    return $protected
}

function Get-ListeningPids([int]$Port) {
    $pids = New-Object "System.Collections.Generic.HashSet[int]"
    try {
        $conns = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction Stop
        foreach ($conn in $conns) {
            $owner = [int]$conn.OwningProcess
            if ($owner -gt 4) {
                [void]$pids.Add($owner)
            }
        }
    }
    catch {
        $pattern = "^\s*TCP\s+\S+:$Port\s+\S+\s+LISTENING\s+(\d+)\s*$"
        foreach ($line in (netstat -ano 2>$null)) {
            if ($line -match $pattern) {
                $owner = [int]$Matches[1]
                if ($owner -gt 4) {
                    [void]$pids.Add($owner)
                }
            }
        }
    }
    return @($pids)
}

function Test-ServerWrapper($Proc) {
    $name = ([string]$Proc.Name).ToLowerInvariant()
    $cmd = [string]$Proc.CommandLine
    if ($name -eq "uv.exe" -or $name -eq "pnpm.exe") {
        return $true
    }
    if ($name -eq "python.exe") {
        return ($cmd -match "manage\.py\s+runserver" -or $cmd -match "dev_runner\.py")
    }
    if ($name -eq "node.exe") {
        return ($cmd -match "next|pnpm")
    }
    if ($name -eq "cmd.exe") {
        return ($cmd -match "pnpm|next-dev|next\s+dev|dev_runner\.py")
    }
    return $false
}

function Get-RootServerPid([int]$ListenPid, $ProcMap, $ProtectedPids) {
    $target = $ListenPid
    $current = $ListenPid
    $visited = New-Object "System.Collections.Generic.HashSet[int]"
    while ($ProcMap.ContainsKey($current) -and $visited.Add($current)) {
        $parentId = [int]$ProcMap[$current].ParentProcessId
        if ($parentId -le 4 -or $ProtectedPids.Contains($parentId) -or -not $ProcMap.ContainsKey($parentId)) {
            break
        }
        if (-not (Test-ServerWrapper $ProcMap[$parentId])) {
            break
        }
        $target = $parentId
        $current = $parentId
    }
    return $target
}

function Stop-ProcessTree([int]$TargetPid) {
    if (-not (Get-Process -Id $TargetPid -ErrorAction SilentlyContinue)) {
        return
    }
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = "taskkill.exe"
    $psi.Arguments = "/PID $TargetPid /T /F"
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $proc = [System.Diagnostics.Process]::Start($psi)
    if ($proc) {
        $proc.WaitForExit()
    }
    Stop-Process -Id $TargetPid -Force -ErrorAction SilentlyContinue
}

$procMap = Get-ProcessMap
$protectedPids = Get-ProtectedPids $procMap

foreach ($port in $portList) {
    $listening = @(Get-ListeningPids $port)
    if ($listening.Count -eq 0) {
        continue
    }

    $procMap = Get-ProcessMap
    foreach ($listenPid in $listening) {
        if ($protectedPids.Contains($listenPid)) {
            Write-Error "[dev] Cong $port dang thuoc tien trinh cha cua terminal hien tai (PID $listenPid)."
            exit 1
        }
        $rootPid = Get-RootServerPid $listenPid $procMap $protectedPids
        $procName = if ($procMap.ContainsKey($listenPid)) { $procMap[$listenPid].Name } else { "unknown" }
        Write-Host "[dev] Giai phong cong $port (PID $listenPid [$procName], goc $rootPid)..."
        Stop-ProcessTree $rootPid
        if ($rootPid -ne $listenPid) {
            Stop-ProcessTree $listenPid
        }
    }

    $freed = $false
    for ($attempt = 0; $attempt -lt 25; $attempt++) {
        if (@(Get-ListeningPids $port).Count -eq 0) {
            $freed = $true
            break
        }
        Start-Sleep -Milliseconds 200
    }

    if (-not $freed) {
        $remaining = @(Get-ListeningPids $port) -join ", "
        Write-Error "[dev] Khong the tat tien trinh chiem cong $port (PID: $remaining). Kiem tra quyen hoac tat thu cong."
        exit 1
    }
}

if ($FrontendDir) {
    $lockPath = Join-Path $FrontendDir ".next\dev\lock"
    if (Test-Path -LiteralPath $lockPath) {
        try {
            Remove-Item -LiteralPath $lockPath -Force -ErrorAction Stop
        }
        catch {
            $procMap = Get-ProcessMap
            $normalizedDir = [System.IO.Path]::GetFullPath($FrontendDir)
            foreach ($proc in $procMap.Values) {
                $pidInt = [int]$proc.ProcessId
                if ($protectedPids.Contains($pidInt)) {
                    continue
                }
                if (([string]$proc.Name).ToLowerInvariant() -eq "node.exe" -and ([string]$proc.CommandLine) -like "*$normalizedDir*" -and ([string]$proc.CommandLine) -match "next") {
                    Write-Host "[dev] Tat tien trinh Next.js cu giu lock (PID $pidInt)..."
                    Stop-ProcessTree $pidInt
                }
            }
            Start-Sleep -Milliseconds 300
            Remove-Item -LiteralPath $lockPath -Force -ErrorAction SilentlyContinue
        }
    }
}

exit 0
