Add-Type -AssemblyName System.Drawing

$sizes = @(16, 48, 128)

foreach ($size in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    
    # Background
    $g.Clear([System.Drawing.Color]::FromArgb(8, 12, 24))
    
    # Draw cyan circle
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(0, 200, 240))
    $margin = [int]($size * 0.15)
    $rect = New-Object System.Drawing.Rectangle($margin, $margin, ($size - 2*$margin), ($size - 2*$margin))
    $g.FillEllipse($brush, $rect)
    
    # Draw inner dark circle
    $darkBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(0, 13, 20))
    $innerMargin = [int]($size * 0.4)
    $innerRect = New-Object System.Drawing.Rectangle($innerMargin, $innerMargin, ($size - 2*$innerMargin), ($size - 2*$innerMargin))
    $g.FillEllipse($darkBrush, $innerRect)
    
    $g.Dispose()
    $brush.Dispose()
    $darkBrush.Dispose()
    
    $bmp.Save("icon$size.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    
    Write-Host "Created icon$size.png"
}

Write-Host "All icons generated successfully!"

# Made with Bob
