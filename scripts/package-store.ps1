param (
    [string]$RootDir = "C:\Users\HP\Desktop\peeky-task-app",
    [string]$UploadDir = "C:\Users\HP\Desktop\Upload-To-Microsoft-Store"
)

$ErrorActionPreference = "Stop"

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  Peeky Task: Microsoft Store Packaging Pipeline     " -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan

$ReleaseDir = Join-Path $RootDir "release"
$MakeAppx = "C:\Users\HP\AppData\Local\electron-builder\Cache\winCodeSign-2.6.0\winCodeSign-2.6.0-5puky\windows-10\x64\makeappx.exe"

if (-not (Test-Path $MakeAppx)) {
    throw "MakeAppx tool not found at $MakeAppx"
}

# 1. Kill any running PeekyTask instances
Write-Host "`n[Step 1/6] Stopping any active instances..." -ForegroundColor Yellow
Get-Process -Name "Peeky Task", "PeekyTask" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# 2. Build AppX using electron-builder
Write-Host "`n[Step 2/6] Building AppX via electron-builder..." -ForegroundColor Yellow
Set-Location $RootDir
$PkgJson = Get-Content (Join-Path $RootDir "package.json") | ConvertFrom-Json
$AppVersion = $PkgJson.version
$AppVersionQuad = "$AppVersion.0"

npm run build:msix
if ($LASTEXITCODE -ne 0) {
    throw "electron-builder build:msix failed with exit code $LASTEXITCODE"
}

$RawAppx = Join-Path $ReleaseDir "Peeky Task $AppVersion.appx"
if (-not (Test-Path $RawAppx)) {
    throw "Compiled package not found at $RawAppx"
}

# 3. Prepare payload package with consistent naming (no spaces)
Write-Host "`n[Step 3/6] Preparing clean payload package..." -ForegroundColor Yellow
$CleanAppxName = "PeekyTask_${AppVersionQuad}_x64.appx"
$CleanAppxPath = Join-Path $ReleaseDir $CleanAppxName
$BundleStageDir = Join-Path $ReleaseDir "bundle_stage"

if (Test-Path $BundleStageDir) { Remove-Item -Recurse -Force $BundleStageDir }
New-Item -ItemType Directory -Path $BundleStageDir | Out-Null

Copy-Item $RawAppx -Destination (Join-Path $BundleStageDir $CleanAppxName) -Force
Copy-Item $RawAppx -Destination $CleanAppxPath -Force
Write-Host "Payload prepared: $CleanAppxName" -ForegroundColor Green

# 4. Build .msixbundle with Windows SDK MakeAppx tool
Write-Host "`n[Step 4/6] Creating bundle via MakeAppx..." -ForegroundColor Yellow
$BundleName = "PeekyTask_${AppVersionQuad}.msixbundle"
$BundlePath = Join-Path $ReleaseDir $BundleName

if (Test-Path $BundlePath) { Remove-Item -Force $BundlePath }
& $MakeAppx bundle /v /o /bv $AppVersionQuad /d $BundleStageDir /p $BundlePath
if ($LASTEXITCODE -ne 0) {
    throw "MakeAppx bundle creation failed with exit code $LASTEXITCODE"
}
Write-Host "Bundle generated: $BundleName" -ForegroundColor Green

# 5. Validate Package and Bundle with MakeAppx
Write-Host "`n[Step 5/6] Validating package and bundle integrity..." -ForegroundColor Yellow

# A. Unpack AppX and verify executable and assets
$ValidateAppxDir = Join-Path $ReleaseDir "validate_unpack_appx"
if (Test-Path $ValidateAppxDir) { Remove-Item -Recurse -Force $ValidateAppxDir }

Write-Host "Validating AppX extraction with MakeAppx unpack..."
& $MakeAppx unpack /v /p $CleanAppxPath /d $ValidateAppxDir /o
if ($LASTEXITCODE -ne 0) {
    throw "MakeAppx unpack failed for $CleanAppxPath"
}

$ManifestXml = [xml](Get-Content (Join-Path $ValidateAppxDir "AppxManifest.xml"))
$DeclaredExe = $ManifestXml.Package.Applications.Application.Executable
$FullExePath = Join-Path $ValidateAppxDir $DeclaredExe

if (-not (Test-Path $FullExePath)) {
    throw "Manifest declares Executable='$DeclaredExe', but file does not exist on disk at '$FullExePath'!"
}
Write-Host "--> PASSED: Executable '$DeclaredExe' physically exists inside package." -ForegroundColor Green

$DeclaredLogo = $ManifestXml.Package.Properties.Logo
if (-not (Test-Path (Join-Path $ValidateAppxDir $DeclaredLogo))) {
    throw "Manifest references logo '$DeclaredLogo', but file is missing!"
}
Write-Host "--> PASSED: Logo assets physically exist inside package." -ForegroundColor Green

# B. Unbundle MSIXBundle and verify payload package
$ValidateBundleDir = Join-Path $ReleaseDir "validate_unbundle"
if (Test-Path $ValidateBundleDir) { Remove-Item -Recurse -Force $ValidateBundleDir }

Write-Host "Validating Bundle extraction with MakeAppx unbundle..."
& $MakeAppx unbundle /v /p $BundlePath /d $ValidateBundleDir /o
if ($LASTEXITCODE -ne 0) {
    throw "MakeAppx unbundle failed for $BundlePath"
}

$ExtractedPayload = Join-Path $ValidateBundleDir $CleanAppxName
if (-not (Test-Path $ExtractedPayload)) {
    throw "Unbundled payload package '$CleanAppxName' not found in extracted bundle!"
}
Write-Host "--> PASSED: Bundle successfully extracted payload package '$CleanAppxName'." -ForegroundColor Green

# 6. Generate Microsoft Store upload artifact (.msixupload) and copy files
Write-Host "`n[Step 6/6] Generating .msixupload artifact and deploying..." -ForegroundColor Yellow
$UploadArtifactName = "PeekyTask_${AppVersionQuad}.msixupload"
$UploadArtifactPath = Join-Path $ReleaseDir $UploadArtifactName

if (Test-Path $UploadArtifactPath) { Remove-Item -Force $UploadArtifactPath }

$tempZip = Join-Path $ReleaseDir "temp_upload.zip"
if (Test-Path $tempZip) { Remove-Item -Force $tempZip }
Compress-Archive -Path $BundlePath -DestinationPath $tempZip -CompressionLevel Optimal
Move-Item $tempZip $UploadArtifactPath -Force

Write-Host "Store upload artifact created: $UploadArtifactName" -ForegroundColor Green

# Copy all clean artifacts to user upload folder
if (-not (Test-Path $UploadDir)) {
    New-Item -ItemType Directory -Path $UploadDir | Out-Null
}

Copy-Item $CleanAppxPath -Destination (Join-Path $UploadDir $CleanAppxName) -Force
Copy-Item $BundlePath -Destination (Join-Path $UploadDir $BundleName) -Force
Copy-Item $UploadArtifactPath -Destination (Join-Path $UploadDir $UploadArtifactName) -Force

# Also provide conventional .appx and .msixbundle filenames for convenience
Copy-Item $CleanAppxPath -Destination (Join-Path $UploadDir "Peeky Task $AppVersion.appx") -Force
Copy-Item $BundlePath -Destination (Join-Path $UploadDir "Peeky Task $AppVersion.msixbundle") -Force
Copy-Item $UploadArtifactPath -Destination (Join-Path $UploadDir "Peeky Task $AppVersion.msixupload") -Force

Write-Host "`n======================================================" -ForegroundColor Cyan
Write-Host "  ALL VALIDATIONS PASSED SUCCESSFULLY!                " -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "Artifacts deployed to: $UploadDir"
Get-ChildItem -Path $UploadDir | Select-Object Name, Length, LastWriteTime | Format-Table -AutoSize
