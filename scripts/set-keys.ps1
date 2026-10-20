# Asks for your API keys and saves them to .env.local (which is never uploaded to GitHub).
# Run from the marketcap folder:  powershell -ExecutionPolicy Bypass -File scripts\set-keys.ps1
# Leave a prompt empty to keep the value that's already saved.

$envFile = Join-Path (Split-Path $PSScriptRoot -Parent) '.env.local'

$settings = @(
  @{ Name = 'FINNHUB_API_KEY'; Prompt = 'Finnhub API key'; Secret = $true },
  @{ Name = 'TWELVEDATA_API_KEY'; Prompt = 'Twelve Data API key'; Secret = $true },
  @{ Name = 'EODHD_API_KEY'; Prompt = 'EODHD API key (Nigerian prices)'; Secret = $true },
  @{ Name = 'NEXT_PUBLIC_SUPABASE_URL'; Prompt = 'Supabase Project URL (https://....supabase.co)'; Secret = $false },
  @{ Name = 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'; Prompt = 'Supabase publishable (anon) key'; Secret = $true },
  @{ Name = 'SUPABASE_SECRET_KEY'; Prompt = 'Supabase SECRET key (sb_secret_...)'; Secret = $true },
  @{ Name = 'RESEND_API_KEY'; Prompt = 'Resend API key (re_...)'; Secret = $true },
  @{ Name = 'CRON_SECRET'; Prompt = 'Alert checker password (Enter = create one for me)'; Secret = $true; Generate = $true }
)

function Read-Value([string]$prompt, [bool]$secret) {
  if (-not $secret) { return (Read-Host -Prompt $prompt).Trim().Trim('"', "'") }
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
Write-Host 'Paste each value (right-click or Ctrl+V), then press Enter.' -ForegroundColor Cyan
Write-Host 'Keys show as stars. Press Enter on an empty prompt to keep the saved value.' -ForegroundColor Cyan
Write-Host ''

$lines = @(
  "# Your secret API keys. This file is NOT uploaded to GitHub (it's in .gitignore).",
  "# Re-run scripts\set-keys.ps1 to change them.",
  ""
)
$summary = @()
foreach ($s in $settings) {
  $existing = Get-Existing $s.Name
  $label = $s.Prompt
  if ($existing) { $label = "$label [saved - Enter to keep]" }
  $value = Read-Value $label $s.Secret
  if (-not $value) { $value = $existing }
  if (-not $value -and $s.Generate) {
    # 32 random bytes as hex: a strong password nobody has to remember
    $bytes = New-Object byte[] 32
    [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    $value = -join ($bytes | ForEach-Object { $_.ToString('x2') })
  }
  $lines += "$($s.Name)=$value"
  $summary += ("{0}: {1}" -f $s.Name, $(if ($value) { "$($value.Length) characters" } else { 'EMPTY' }))
}

# UTF-8 without a byte-order mark, so Next.js reads the first line correctly
[IO.File]::WriteAllText($envFile, ($lines -join "`n") + "`n", (New-Object Text.UTF8Encoding $false))

Write-Host ''
Write-Host 'Saved to .env.local:' -ForegroundColor Green
$summary | ForEach-Object { Write-Host "  $_" -ForegroundColor Green }
