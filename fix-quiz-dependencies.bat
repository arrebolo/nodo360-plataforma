@echo off
echo ========================================
echo INSTALANDO DEPENDENCIAS PARA QUIZ UI
echo ========================================
echo.

echo Instalando framer-motion y canvas-confetti...
call npm install framer-motion canvas-confetti

echo.
echo Instalando tipos TypeScript...
call npm install --save-dev @types/canvas-confetti

echo.
echo ========================================
echo VERIFICANDO INSTALACION
echo ========================================
call npm list framer-motion canvas-confetti

echo.
echo ========================================
echo VERIFICANDO TYPESCRIPT
echo ========================================
call npx tsc --noEmit

echo.
echo ========================================
echo COMPLETADO
echo ========================================
echo.
echo Si no hay errores arriba, el sistema esta listo para funcionar.
echo.
pause
