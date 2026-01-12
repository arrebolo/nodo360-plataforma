# Script de limpieza visual Nodo360 - Fase 2
# Colores restantes detectados

$replacements = @{
    # Brand variants
    '\[#ff6b35\]' = 'brand-light'
    '\[#f7931a\]' = 'brand'
    '\[#ff7a45\]' = 'brand-light'
    '\[#ff8c5a\]' = 'brand-light/80'
    '\[#FDB931\]' = 'gold'
    
    # Dark theme
    '\[#1a1f2e\]' = 'dark-surface'
    '\[#252b3d\]' = 'dark-soft'
    '\[#0f1419\]' = 'dark-secondary'
    '\[#0a0d14\]' = 'dark-deep'
    '\[#141821\]' = 'dark-secondary'
    '\[#1a1a1a\]' = 'dark-tertiary'
    '\[#1a1d24\]' = 'dark-secondary'
    '\[#2a2a2a\]' = 'dark-border'
    
    # Accent/UI
    '\[#24D4FF\]' = 'accent-blue'
    '\[#00C98D\]' = 'success'
    '\[#4caf50\]' = 'success'
    '\[#FFD700\]' = 'gold'
    '\[#dc2626\]' = 'error-dark'
    '\[#6d28d9\]' = 'purple-700'
    
    # Text
    '\[#C5C7D3\]' = 'white/70'
}

$files = Get-ChildItem -Path "app","components","lib" -Recurse -Include *.tsx,*.ts -ErrorAction SilentlyContinue

$totalChanges = 0

foreach ($file in $files) {
    $lines = Get-Content $file.FullName -ErrorAction SilentlyContinue
    if (-not $lines) { continue }
    
    $content = $lines -join "`n"
    $originalContent = $content
    
    foreach ($search in $replacements.Keys) {
        $replacement = $replacements[$search]
        
        # bg-[#xxx] -> bg-token
        $content = $content -ireplace "bg-$search", "bg-$replacement"
        # text-[#xxx] -> text-token
        $content = $content -ireplace "text-$search", "text-$replacement"
        # border-[#xxx] -> border-token
        $content = $content -ireplace "border-$search", "border-$replacement"
        # from-[#xxx] -> from-token
        $content = $content -ireplace "from-$search", "from-$replacement"
        # to-[#xxx] -> to-token
        $content = $content -ireplace "to-$search", "to-$replacement"
        # via-[#xxx] -> via-token
        $content = $content -ireplace "via-$search", "via-$replacement"
        # ring-[#xxx] -> ring-token
        $content = $content -ireplace "ring-$search", "ring-$replacement"
        # shadow-[#xxx] -> shadow-token
        $content = $content -ireplace "shadow-$search", "shadow-$replacement"
        # hover:bg-[#xxx] -> hover:bg-token
        $content = $content -ireplace "hover:bg-$search", "hover:bg-$replacement"
        # hover:text-[#xxx] -> hover:text-token
        $content = $content -ireplace "hover:text-$search", "hover:text-$replacement"
        # hover:border-[#xxx] -> hover:border-token
        $content = $content -ireplace "hover:border-$search", "hover:border-$replacement"
        # focus:ring-[#xxx] -> focus:ring-token
        $content = $content -ireplace "focus:ring-$search", "focus:ring-$replacement"
        # focus:border-[#xxx] -> focus:border-token
        $content = $content -ireplace "focus:border-$search", "focus:border-$replacement"
        # placeholder:text-[#xxx]
        $content = $content -ireplace "placeholder:text-$search", "placeholder:text-$replacement"
    }
    
    if ($content -ne $originalContent) {
        Set-Content $file.FullName -Value $content -NoNewline
        Write-Host "OK $($file.Name)" -ForegroundColor Green
        $totalChanges++
    }
}

Write-Host ""
Write-Host "=== FASE 2 COMPLETADA ===" -ForegroundColor Yellow
Write-Host "Archivos modificados: $totalChanges" -ForegroundColor Cyan