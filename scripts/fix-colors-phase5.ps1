# Script de limpieza visual Nodo360 - Fase 5
# Procesa TODOS los archivos tsx/ts recursivamente

$files = Get-ChildItem -Path "." -Recurse -Include *.tsx,*.ts -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch 'node_modules' }
$totalChanges = 0

foreach ($file in $files) {
    $lines = Get-Content $file.FullName -ErrorAction SilentlyContinue
    if (-not $lines) { continue }
    
    $content = $lines -join "`n"
    $originalContent = $content
    
    # Brand colors
    $content = $content -replace '\[#ff6b35\]', 'brand-light'
    $content = $content -replace '\[#FF6B35\]', 'brand-light'
    $content = $content -replace '\[#f7931a\]', 'brand'
    $content = $content -replace '\[#F7931A\]', 'brand'
    $content = $content -replace '\[#ff8c5a\]', 'brand-light'
    
    # Dark theme
    $content = $content -replace '\[#0a0d14\]', 'dark-deep'
    $content = $content -replace '\[#0f1419\]', 'dark-secondary'
    $content = $content -replace '\[#141821\]', 'dark-secondary'
    $content = $content -replace '\[#1a1f2e\]', 'dark-surface'
    $content = $content -replace '\[#252b3d\]', 'dark-soft'
    
    # Accent/UI
    $content = $content -replace '\[#24D4FF\]', 'accent-blue'
    $content = $content -replace '\[#24d4ff\]', 'accent-blue'
    $content = $content -replace '\[#00C98D\]', 'success'
    $content = $content -replace '\[#00c98d\]', 'success'
    $content = $content -replace '\[#4caf50\]', 'success'
    $content = $content -replace '\[#4CAF50\]', 'success'
    
    # Purple
    $content = $content -replace '\[#6d28d9\]', 'purple-700'
    $content = $content -replace '\[#4338ca\]', 'indigo-700'
    $content = $content -replace '\[#1d4ed8\]', 'blue-700'
    
    # Text muted
    $content = $content -replace '\[#C5C7D3\]', 'white/70'
    $content = $content -replace '\[#c5c7d3\]', 'white/70'
    
    if ($content -ne $originalContent) {
        Set-Content $file.FullName -Value $content -NoNewline
        Write-Host "OK $($file.Name)" -ForegroundColor Green
        $totalChanges++
    }
}

Write-Host ""
Write-Host "=== FASE 5 COMPLETADA ===" -ForegroundColor Yellow
Write-Host "Archivos modificados: $totalChanges" -ForegroundColor Cyan