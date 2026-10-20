param([Parameter(Mandatory=$true)][string]$BrowserExecutable)
$ErrorActionPreference = 'Stop'
$browserFile = Get-Item -LiteralPath $BrowserExecutable
if ($browserFile.Attributes -band [System.IO.FileAttributes]::ReparsePoint) { throw 'Browser path must not be a reparse point.' }
$signature = Get-AuthenticodeSignature -LiteralPath $browserFile.FullName
$publisher = -join ([char[]]@(0x5317,0x4EAC,0x4E09,0x5FEB,0x5728,0x7EBF,0x79D1,0x6280,0x6709,0x9650,0x516C,0x53F8))
if ($signature.Status -ne 'Valid' -or $signature.SignerCertificate.Subject -notmatch ('O=' + [regex]::Escape($publisher) + '(?:,|$)')) {
  throw 'Tabbit browser signature or publisher verification failed.'
}
# Start the installed browser normally; it refreshes its own versioned CLI
# registration. Never edit registration, ACLs, endpoint files or user profiles.
Start-Process -FilePath $browserFile.FullName -WindowStyle Hidden
Write-Output '{"started":true}'
