param([string]$ProjectDirectory = (Split-Path -Parent $PSScriptRoot), [string]$TaskName = 'AI Builders YouTube Archives', [switch]$PlanOnly)
$ErrorActionPreference = 'Stop'
$launcher = Join-Path $ProjectDirectory 'scripts/run-subscription-archives.ps1'
if (!(Test-Path -LiteralPath $launcher -PathType Leaf)) { throw 'Archive launcher is missing.' }
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument ('-NoProfile -NonInteractive -WindowStyle Hidden -File "' + $launcher + '" -ProjectDirectory "' + $ProjectDirectory + '"') -WorkingDirectory $ProjectDirectory
$triggers = @('10:15','11:15','14:15','16:15') | ForEach-Object { New-ScheduledTaskTrigger -Daily -At $_ }
$settings = New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes 55) -RestartCount 2 -RestartInterval (New-TimeSpan -Minutes 10) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
$principal = New-ScheduledTaskPrincipal -UserId ([System.Security.Principal.WindowsIdentity]::GetCurrent().Name) -LogonType Interactive -RunLevel Limited
$task = New-ScheduledTask -Action $action -Trigger $triggers -Settings $settings -Principal $principal -Description 'Domi independent browser captions, Chinese summaries and full-text archive verification. Shares the archive worker lock; no chat browser tool dependency.'
if ($PlanOnly) { $task | ConvertTo-Json -Depth 8; exit 0 }
Register-ScheduledTask -TaskName $TaskName -InputObject $task -Force | Out-Null
Get-ScheduledTask -TaskName $TaskName | Select-Object TaskName,State,@{n='Times';e={$_.Triggers.StartBoundary}},@{n='Command';e={$_.Actions.Execute}},@{n='Arguments';e={$_.Actions.Arguments}} | ConvertTo-Json -Depth 4
