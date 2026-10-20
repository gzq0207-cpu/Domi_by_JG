param([string]$ProjectDirectory = (Split-Path -Parent $PSScriptRoot), [string]$StateDirectory = (Join-Path $env:USERPROFILE '.follow-builders'))
$ErrorActionPreference = 'Stop'
$runtime = Join-Path $ProjectDirectory 'node_modules/electron/dist/electron.exe'
$consumer = Join-Path $ProjectDirectory 'scripts/process-subscription-archives.cjs'
if (!(Test-Path -LiteralPath $runtime -PathType Leaf) -or !(Test-Path -LiteralPath $consumer -PathType Leaf)) { throw 'Archive runtime is missing.' }
Set-Location -LiteralPath $ProjectDirectory
$env:ELECTRON_RUN_AS_NODE = '1'
$env:FOLLOW_BUILDERS_HOME = $StateDirectory
$logPath = Join-Path $StateDirectory 'archive-scheduler.log'
# Worker owns the shared lock, reuses verified caches and resumes interrupted
# work. Avoid --force in scheduled runs so real access/quota backoff is kept.
& $runtime $consumer --budget-minutes 45 --notify 2>&1 | ForEach-Object { $_.ToString() } | Out-File -LiteralPath $logPath -Append -Encoding utf8
exit $LASTEXITCODE
