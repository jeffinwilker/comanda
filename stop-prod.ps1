$repo = (Resolve-Path "$PSScriptRoot").Path
$pattern = [Regex]::Escape($repo)

$procs = Get-CimInstance Win32_Process | Where-Object {
  $_.Name -eq "node.exe" -and
  $_.CommandLine -match $pattern -and
  $_.CommandLine -match "next start"
}

if (-not $procs) {
  Write-Host "No matching prod server process found."
  exit 0
}

$procs | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
Write-Host ("Stopped {0} process(es)." -f $procs.Count)
