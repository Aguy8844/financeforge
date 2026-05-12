$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$releaseDir = Join-Path $root "release"

if (-not (Test-Path $releaseDir)) {
  New-Item -ItemType Directory -Path $releaseDir | Out-Null
}

Push-Location $root
try {
  npm.cmd run build:de
  npm.cmd run build:en

  Copy-Item -Path "README.md" -Destination "dist-de\README.md" -Force
  Copy-Item -Path "README.en.md" -Destination "dist-en\README.md" -Force
  Copy-Item -Path "scripts\start-static-financeforge.bat" -Destination "dist-de\start-financeforge.bat" -Force
  Copy-Item -Path "scripts\start-static-financeforge.bat" -Destination "dist-en\start-financeforge.bat" -Force

  $deZip = Join-Path $releaseDir "financeforge-de.zip"
  $enZip = Join-Path $releaseDir "financeforge-en.zip"

  if (Test-Path $deZip) { Remove-Item -Path $deZip -Force }
  if (Test-Path $enZip) { Remove-Item -Path $enZip -Force }

  Compress-Archive -Path "dist-de\*" -DestinationPath $deZip
  Compress-Archive -Path "dist-en\*" -DestinationPath $enZip

  Write-Host "Created:"
  Write-Host $deZip
  Write-Host $enZip
}
finally {
  Pop-Location
}
