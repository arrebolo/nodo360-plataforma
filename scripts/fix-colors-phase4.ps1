# Script de limpieza visual Nodo360 - Fase 4
# Patrones con opacity y casos especiales

$files = Get-ChildItem -Path "app","components","lib" -Recurse -Include *.tsx,*.ts -ErrorAction SilentlyContinue
$totalChanges = 0

foreach ($file in $files) {
    $lines = Get-Content $file.FullName -ErrorAction SilentlyContinue
    if (-not $lines) { continue }
    
    $content = $lines -join "`n"
    $originalContent = $content
    
    # Brand colors con y sin opacity
    $content = $content -ireplace '\[#ff6b35\]', 'brand-light'
    $content = $content -ireplace '\[#f7931a\]', 'brand'
    $content = $content -ireplace '\[#ff8c5a\]', 'brand-light'
    
    # Dark theme
    $content = $content -ireplace '\[#0a0d14\]', 'dark-deep'
    $content = $content -ireplace '\[#0f1419\]', 'dark-secondary'
    $content = $content -ireplace '\[#141821\]', 'dark-secondary'
    $content = $content -ireplace '\[#1a1f2e\]', 'dark-surface'
    $content = $content -ireplace '\[#252b3d\]', 'dark-soft'
    
    # Accent/UI
    $content = $content -ireplace '\[#24D4FF\]', 'accent-blue'
    $content = $content -ireplace '\[#00C98D\]', 'success'
    $content = $content -ireplace '\[#4caf50\]', 'success'
    $content = $content -ireplace '\[#6d28d9\]', 'purple-700'
    
    # Text muted
    $content = $content -ireplace '\[#C5C7D3\]', 'white/70'
    
    if ($content -ne $originalContent) {
        Set-Content $file.FullName -Value $content -NoNewline
        Write-Host "OK $($file.Name)" -ForegroundColor Green
        $totalChanges++
    }
}

Write-Host ""
Write-Host "=== FASE 4 COMPLETADA ===" -ForegroundColor Yellow
Write-Host "Archivos modificados: $totalChanges" -ForegroundColor Cyan