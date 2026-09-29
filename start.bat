@echo off
chcp 65001 >nul
title Le Comptoir de 3iL

:: ── Recherche de Maven ──────────────────────────────────────────────────────
set MVN=mvn
where mvn >nul 2>&1
if errorlevel 1 (
    set MVN=C:\DEV26\utils\maven\bin\mvn.cmd
    if not exist "%MVN%" (
        echo [ERREUR] Maven introuvable.
        echo Installez Maven ou ajoutez-le au PATH, puis relancez ce script.
        pause
        exit /b 1
    )
)

:: ── Recherche de Python ──────────────────────────────────────────────────────
where python >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Python introuvable. Installez Python 3 et ajoutez-le au PATH.
    pause
    exit /b 1
)

echo.
echo  ╔══════════════════════════════════════╗
echo  ║      Le Comptoir de 3iL              ║
echo  ║  API  → http://localhost:8080        ║
echo  ║  Site → http://localhost:5500        ║
echo  ╚══════════════════════════════════════╝
echo.
echo  Démarrage de l'API Spring Boot et du serveur front...
echo  Fermez les deux fenêtres pour tout arrêter.
echo.

:: ── Démarrage du back-end ────────────────────────────────────────────────────
start "API – Le Comptoir de 3iL" cmd /k "title API – Le Comptoir de 3iL && cd /d "%~dp0backend" && "%MVN%" spring-boot:run"

:: ── Petit délai pour laisser Maven démarrer avant d'ouvrir le front ──────────
timeout /t 3 /nobreak >nul

:: ── Démarrage du front-end ───────────────────────────────────────────────────
start "Front – Le Comptoir de 3iL" cmd /k "title Front – Le Comptoir de 3iL && cd /d "%~dp0frontend" && python -m http.server 5500"

:: ── Ouverture du navigateur (après ~10 s, le temps que l'API démarre) ────────
timeout /t 10 /nobreak >nul
start "" "http://localhost:5500"

exit /b 0
