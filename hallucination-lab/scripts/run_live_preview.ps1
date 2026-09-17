<#
.SYNOPSIS
  Run the Hallucination Lab with real Lab Model calls, on Windows.

.DESCRIPTION
  The hosted lab on GitHub Pages is static and cannot call the gateway: there
  would be nowhere to keep the API key except inside the public JavaScript
  bundle. This runs the proxy locally and serves the lab from it, so the browser
  and the API share an origin and the key stays in the proxy process.

.EXAMPLE
  $env:GATEWAY_API_KEY = "sk-..."
  .\scripts\run_live_preview.ps1

  Then open http://localhost:8100/
#>
[CmdletBinding()]
param(
  [string]$ApiKey      = $env:GATEWAY_API_KEY,
  [string]$GatewayUrl  = "https://ai-gateway.barry.edu/v1",
  [string]$LabModel    = "gemma-4-31b-it",
  [int]   $Port        = 8100
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

function Need($cmd, $hint) {
  if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
    Write-Host "Missing: $cmd" -ForegroundColor Red
    Write-Host "  $hint"
    exit 1
  }
}
Need "node" "Install Node 20+ from https://nodejs.org (the LTS installer is fine)."
Need "npm"  "npm ships with Node; reinstall Node if it is missing."

$python = $null
foreach ($c in @("python", "py", "python3")) {
  if (Get-Command $c -ErrorAction SilentlyContinue) { $python = $c; break }
}
if (-not $python) {
  Write-Host "Missing: python" -ForegroundColor Red
  Write-Host "  Install Python 3.11+ from https://python.org and tick 'Add python.exe to PATH'."
  exit 1
}

if (-not $ApiKey) {
  $envFile = Join-Path $repoRoot "proxy\.env"
  if (Test-Path $envFile) {
    $line = Select-String -Path $envFile -Pattern '^GATEWAY_API_KEY=(.+)$' | Select-Object -First 1
    if ($line) { $ApiKey = $line.Matches[0].Groups[1].Value.Trim('"') }
  }
}
if (-not $ApiKey) {
  Write-Host "No API key." -ForegroundColor Red
  Write-Host '  $env:GATEWAY_API_KEY = "sk-..." ; .\scripts\run_live_preview.ps1'
  exit 1
}

Write-Host "==> writing proxy\.env (gitignored)" -ForegroundColor Cyan
@"
GATEWAY_BASE_URL=$GatewayUrl
GATEWAY_API_KEY=$ApiKey
LAB_MODEL=$LabModel
VISION_ENABLED=0
FACULTY_NAME="Dr. Ellen Marsh"
FACULTY_FIELD=nursing
RATE_LIMIT_PER_MIN=60
GATEWAY_TIMEOUT_S=180
STATIC_DIR=../frontend/dist-preview
"@ | Set-Content -Path (Join-Path $repoRoot "proxy\.env") -Encoding ascii

Write-Host "==> building the live-call frontend" -ForegroundColor Cyan
Push-Location (Join-Path $repoRoot "frontend")
if (-not (Test-Path "node_modules")) { npm ci }
npm run build:preview | Out-Null
Pop-Location

Write-Host "==> installing proxy dependencies" -ForegroundColor Cyan
Push-Location (Join-Path $repoRoot "proxy")
& $python -m pip install -q -r requirements.txt

# The proxy reads its settings from the environment, not from the .env file.
Get-Content ".env" | ForEach-Object {
  if ($_ -match '^\s*([A-Z_]+)=(.*)$') {
    [Environment]::SetEnvironmentVariable($Matches[1], $Matches[2].Trim('"'), "Process")
  }
}

Write-Host "==> starting the proxy on port $Port" -ForegroundColor Cyan
$proxy = Start-Process -FilePath $python -ArgumentList "-m","uvicorn","app:app","--port","$Port" -PassThru -NoNewWindow

$ok = $false
foreach ($i in 1..30) {
  Start-Sleep -Seconds 1
  try {
    $h = Invoke-RestMethod -Uri "http://localhost:$Port/api/health" -TimeoutSec 3
    if ($h.gateway_configured) { $ok = $true; break }
  } catch { }
}
Pop-Location

if (-not $ok) {
  Write-Host "The proxy did not come up. Scroll up for the error." -ForegroundColor Red
  if ($proxy -and -not $proxy.HasExited) { Stop-Process -Id $proxy.Id -Force }
  exit 1
}

Write-Host ""
Write-Host "  Live preview:  http://localhost:$Port/"            -ForegroundColor Green
Write-Host "  Instructor:    http://localhost:$Port/?mode=instructor" -ForegroundColor Green
Write-Host ""
Write-Host "  Output panels read 'Live run' when the call reached the model."
Write-Host "  This gateway runs near 5.5 tokens/second: W7 takes about 12 seconds,"
Write-Host "  W3 and W5 take 40 or more. Ctrl-C stops the proxy."
Write-Host ""

Start-Process "http://localhost:$Port/?mode=instructor"
try { Wait-Process -Id $proxy.Id } finally {
  if ($proxy -and -not $proxy.HasExited) { Stop-Process -Id $proxy.Id -Force }
}
