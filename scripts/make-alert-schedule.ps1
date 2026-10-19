# Writes the SQL that makes Supabase call the alert checker every 5 minutes,
# with your CRON_SECRET filled in, then opens it in Notepad to paste into Supabase.
# Run from the marketcap folder:  powershell -ExecutionPolicy Bypass -File scripts\make-alert-schedule.ps1
param([string]$SiteUrl = 'https://marketcap-rosy.vercel.app')

$root = Split-Path $PSScriptRoot -Parent
$envFile = Join-Path $root '.env.local'
$line = Get-Content $envFile | Where-Object { $_ -like 'CRON_SECRET=*' } | Select-Object -First 1
$secret = if ($line) { $line.Substring('CRON_SECRET='.Length).Trim() } else { '' }
if (-not $secret) {
  Write-Host 'No CRON_SECRET in .env.local yet. Run scripts\set-keys.ps1 first.' -ForegroundColor Red
  exit 1
}

$sql = @"
-- Marketcap: run the price-alert checker every 5 minutes.
-- Paste into Supabase -> SQL Editor -> New query -> Run. Safe to run again.
-- Contains your CRON_SECRET: don't share this file (it is git-ignored).

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

select cron.unschedule(jobid) from cron.job where jobname = 'marketcap-check-alerts';

select cron.schedule(
  'marketcap-check-alerts',
  '*/5 * * * *',
  `$`$
  select net.http_post(
    url := '$SiteUrl/api/cron/check-alerts',
    headers := jsonb_build_object('Authorization', 'Bearer $secret', 'Content-Type', 'application/json'),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  `$`$
);
"@

$out = Join-Path $root 'supabase\schedule-alerts.local.sql'
[IO.File]::WriteAllText($out, $sql, (New-Object Text.UTF8Encoding $false))
Write-Host "Written to supabase\schedule-alerts.local.sql - opening it in Notepad." -ForegroundColor Green
notepad $out
