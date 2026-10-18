# Asks for your API keys and saves them to .env.local (which is never uploaded to GitHub).
# Run from the marketcap folder:  powershell -ExecutionPolicy Bypass -File scripts\set-keys.ps1
# Leave a prompt empty to keep the key that's already saved.

$envFile = Join-Path (Split-Path $PSScriptRoot -Parent) '.env.local'

function Read-Secret([string]$prompt) {
  $secure = Read-Host -Prompt $prompt -AsSecureString
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try { return ([Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)).Trim().Trim('"', "'") }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
}

function Get-Existing([string]$name) {
  if (-not (Test-Path $envFile)) { return '' }
  $line = Get-Content $envFile | Where-Object { $_ -like "$name=*" } | Select-Object -First 1
  if ($line) { return $line.Substring($name.Length + 1).Trim() } else { return '' }
}

Write-Host ''
Write-Host 'Paste each key (right-click or Ctrl+V), then press Enter. It shows as stars.' -ForegroundColor Cyan
Write-Host ''

$finnhub = Read-Secret 'Finnhub API key'
if (-not $finnhub) { $finnhub = Get-Existing 'FINNHUB_API_KEY' }
$twelve = Read-Secret 'Twelve Data API key'
if (-not $twelve) { $twelve = Get-Existing 'TWELVEDATA_API_KEY' }

$content = @"
# Your secret API keys. This file is NOT uploaded to GitHub (it's in .gitignore).
# Re-run scripts\set-keys.ps1 to change them.

FINNHUB_API_KEY=$finnhub
TWELVEDATA_API_KEY=$twelve
"@

# UTF-8 without a byte-order mark, so Next.js reads the first line correctly
[IO.File]::WriteAllText($envFile, $content + "`n", (New-Object Text.UTF8Encoding $false))

Write-Host ''
Write-Host ("Saved to .env.local - Finnhub: {0} characters, Twelve Data: {1} characters." -f $finnhub.Length, $twelve.Length) -ForegroundColor Green
Write-Host 'You can now delete "API KEYS.txt".'
