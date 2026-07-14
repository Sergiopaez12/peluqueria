@echo off
title 🚀 INICIADOR - BARBER APP
color 0B
echo ========================================================
echo          🚀 INICIANDO SISTEMA BARBER APP 💈          
echo ========================================================
echo.
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4 Address Direcci"') do (
    for /f "tokens=1" %%b in ("%%a") do set MI_IP=%%b
)
if not defined MI_IP set MI_IP=127.0.0.1
echo [INFO] Tu IP actual detectada en la red es: %MI_IP%
echo.
echo [1/3] Verificando y enciendo el servidor Backend (Puerto 5000)...
start /min "Backend BarberApp (Puerto 5000)" cmd /k "cd /d c:\aplicativos\backend && node index.js"

echo [2/3] Esperando 4 segundos a que conecte la base de datos...
ping 127.0.0.1 -n 5 >nul

echo [3/3] Abriendo el navegador e iniciando la App...
echo.
start http://localhost:8081
cd /d c:\aplicativos\mobile-app
set REACT_NATIVE_PACKAGER_HOSTNAME=%MI_IP%
npx expo start --host lan --web
