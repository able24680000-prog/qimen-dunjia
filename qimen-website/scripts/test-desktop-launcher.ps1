[CmdletBinding()]
param()

Set-StrictMode -Version 2.0
$ErrorActionPreference = 'Stop'

$launcherPath = Join-Path $PSScriptRoot 'start-desktop.ps1'
$siteUrl = 'http://127.0.0.1:5174/'

$response = Invoke-WebRequest -Uri $siteUrl -UseBasicParsing -TimeoutSec 3
if ($response.StatusCode -ne 200) {
  throw "Expected the local site to return HTTP 200 before testing the launcher."
}

$process = Start-Process `
  -FilePath 'C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe' `
  -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', "`"$launcherPath`"", '-NoOpen') `
  -WindowStyle Hidden `
  -PassThru

if (-not $process.WaitForExit(6000)) {
  Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
  throw 'Launcher did not recognize the running site within 6 seconds.'
}

if ($process.ExitCode -ne 0) {
  throw "Launcher exited with code $($process.ExitCode)."
}

Write-Output 'Desktop launcher running-site test passed.'

