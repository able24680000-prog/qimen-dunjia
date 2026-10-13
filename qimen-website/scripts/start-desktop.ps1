[CmdletBinding()]
param(
  [switch]$NoOpen,
  [ValidateRange(1, 65535)]
  [int]$Port = 5174
)

Set-StrictMode -Version 2.0
$ErrorActionPreference = 'Stop'

$siteRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$url = "http://127.0.0.1:$Port/"
$stdoutLog = Join-Path $env:TEMP 'qimen-desktop-launcher.out.log'
$stderrLog = Join-Path $env:TEMP 'qimen-desktop-launcher.err.log'

function ConvertFrom-Utf8Base64 {
  param([Parameter(Mandatory = $true)][string]$Value)

  return [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($Value))
}

function Show-LauncherError {
  param([Parameter(Mandatory = $true)][string]$Message)

  $caption = ConvertFrom-Utf8Base64 '5aWH6Zeo6YGB55Sy5ZCv5Yqo5Zmo'
  try {
    Add-Type -AssemblyName PresentationFramework
    [System.Windows.MessageBox]::Show(
      $Message,
      $caption,
      [System.Windows.MessageBoxButton]::OK,
      [System.Windows.MessageBoxImage]::Error
    ) | Out-Null
  }
  catch {
    Write-Error $Message
  }
}

function Test-QimenServer {
  try {
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2
    return $response.StatusCode -eq 200 -and $response.Content.Contains('id="root"')
  }
  catch {
    return $false
  }
}

if (-not (Test-QimenServer)) {
  $npm = Get-Command 'npm.cmd' -ErrorAction SilentlyContinue
  if (-not $npm) {
    $message = ConvertFrom-Utf8Base64 '5pyq5om+5YiwIG5wbS5jbWTjgILor7flhYjlronoo4UgTm9kZS5qc++8jOaIluajgOafpeezu+e7nyBQQVRI44CC'
    Show-LauncherError $message
    exit 1
  }

  Remove-Item -LiteralPath $stdoutLog, $stderrLog -Force -ErrorAction SilentlyContinue

  try {
    Start-Process `
      -FilePath $npm.Source `
      -ArgumentList @('run', 'dev', '--', '--host', '127.0.0.1', '--port', "$Port", '--strictPort') `
      -WorkingDirectory $siteRoot `
      -WindowStyle Hidden `
      -RedirectStandardOutput $stdoutLog `
      -RedirectStandardError $stderrLog | Out-Null
  }
  catch {
    $message = ConvertFrom-Utf8Base64 '5aWH6Zeo6YGB55Sy5pys5Zyw572R56uZ5ZCv5Yqo5aSx6LSl44CC6K+35qOA5p+l6aG555uu55uu5b2V5LiO5Li05pe25pel5b+X44CC'
    Show-LauncherError "$message`n$stdoutLog`n$stderrLog"
    exit 1
  }

  $ready = $false
  for ($attempt = 0; $attempt -lt 40; $attempt += 1) {
    Start-Sleep -Milliseconds 500
    if (Test-QimenServer) {
      $ready = $true
      break
    }
  }

  if (-not $ready) {
    $message = ConvertFrom-Utf8Base64 '5aWH6Zeo6YGB55Sy5pys5Zyw572R56uZ5ZCv5Yqo5aSx6LSl44CC6K+35qOA5p+l6aG555uu55uu5b2V5LiO5Li05pe25pel5b+X44CC'
    Show-LauncherError "$message`n$stdoutLog`n$stderrLog"
    exit 1
  }
}

if (-not $NoOpen) {
  Start-Process $url
}

exit 0

