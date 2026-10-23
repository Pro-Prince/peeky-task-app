Add-Type -AssemblyName System.Drawing

function Resize-Img {
    param(
        [string]$SourcePath,
        [string]$TargetPath,
        [int]$TargetWidth,
        [int]$TargetHeight
    )
    $src = [System.Drawing.Image]::FromFile($SourcePath)
    $bmp = New-Object System.Drawing.Bitmap($TargetWidth, $TargetHeight)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.DrawImage($src, 0, 0, $TargetWidth, $TargetHeight)
    $g.Dispose()
    $src.Dispose()
    $bmp.Save($TargetPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

$srcPath = "assets\app-icon.png"
Resize-Img -SourcePath $srcPath -TargetPath "build\appx\StoreLogo.png" -TargetWidth 50 -TargetHeight 50
Resize-Img -SourcePath $srcPath -TargetPath "build\appx\Square44x44Logo.png" -TargetWidth 44 -TargetHeight 44
Resize-Img -SourcePath $srcPath -TargetPath "build\appx\Square150x150Logo.png" -TargetWidth 150 -TargetHeight 150
Resize-Img -SourcePath $srcPath -TargetPath "build\appx\Wide310x150Logo.png" -TargetWidth 310 -TargetHeight 150

Write-Output "Exact tile dimensions generated successfully."
