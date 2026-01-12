# Script de limpieza visual Nodo360 - Fase 3

$replacements = @{
    '\[#ff6b35\]' = 'brand-light'
    '\[#ffa52a\]' = 'brand'
    '\[#ffa942\]' = 'brand'
    '\[#1a1f2e\]' = 'dark-surface'
    '\[#0f1419\]' = 'dark-secondary'
    '\[#0a0d14\]' = 'dark-deep'
    '\[#141821\]' = 'dark-secondary'
    '\[#24D4FF\]' = 'accent-blue'
    '\[#00C98D\]' = 'success'
    '\[#4caf50\]' = 'success'
    '\[#6d28d9\]' = 'purple-700'
    '\[#C5C7D3\]' = 'white/70'
}

$prefixes = @('bg-','text-','border-','from-','to-','via-','ring-','shadow-','hover:bg-','hover:text-','hover:border-','focus:ring-','focus:border-','placeholder:text-','divide-','accent-')

$files = Get-ChildItem -Path "app","components","lib" -Recurse -Include *.tsx,*.ts -ErrorAction SilentlyContinue
$totalChanges = 0

foreach ($file in $files) {
    $lines = Get-Content $file.FullName -ErrorAction SilentlyContinue
    if (-not $lines) { continue }
    
    $content = $lines -join "`n"
    $originalContent = $content
    
    foreach ($search in $replacements.Keys) {
        $replacement = $replacements[$search]
        foreach ($prefix in $prefixes) {
            $content = $content -ireplace "$prefix$search", "$prefix$replacement"
        }
    }
    
    if ($content -ne $originalContent) {
        Set-Content $file.FullName -Value $content -NoNewline
        Write-Host "OK $($file.Name)" -ForegroundColor Green
        $totalChanges++
    }
}

Write-Host ""
Write-Host "=== FASE 3 COMPLETADA ===" -ForegroundColor Yellow
Write-Host "Archivos modificados: $totalChanges" -ForegroundColor Cyan