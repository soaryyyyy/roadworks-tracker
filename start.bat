@echo off
chcp 65001 >nul
title Roadworks Tracker - Lancement du projet
color 0A

echo ╔══════════════════════════════════════════════════════════╗
echo ║        ROADWORKS TRACKER - Script de lancement          ║
echo ║        Projet ITU - S5 - Groupe Mr Rojo                 ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

REM ── Vérification de Docker ──
echo [1/5] Verification de Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] Docker n'est pas installe ou n'est pas dans le PATH.
    echo          Installez Docker Desktop : https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] Docker n'est pas demarre. Veuillez lancer Docker Desktop.
    pause
    exit /b 1
)
echo          OK - Docker est disponible.
echo.

REM ── Vérification du fichier firebase-key.json ──
echo [2/5] Verification du fichier firebase-key.json...
if not exist "backend\firebase-key.json" (
    echo [ERREUR] Le fichier backend\firebase-key.json est manquant !
    echo.
    echo          Ce fichier contient la cle de service Firebase necessaire au backend.
    echo          Demandez-le a l'equipe ou telechargez-le depuis la console Firebase :
    echo            Console Firebase ^> Parametres ^> Comptes de service ^> Generer une cle
    echo          Puis placez-le dans : backend\firebase-key.json
    echo.
    pause
    exit /b 1
)
echo          OK - firebase-key.json trouve.
echo.

REM ── Nettoyage des anciens conteneurs ──
echo [3/5] Arret des anciens conteneurs (si existants)...
docker compose down >nul 2>&1
echo          OK - Environnement nettoye.
echo.

REM ── Lancement des services ──
echo [4/5] Lancement de tous les services...
echo          Cela peut prendre quelques minutes au premier lancement
echo          (telechargement des images + compilation du backend).
echo.
docker compose up -d

if %errorlevel% neq 0 (
    echo.
    echo [ERREUR] Le lancement a echoue. Consultez les logs :
    echo          docker compose logs
    pause
    exit /b 1
)

echo.

REM ── Attente du backend ──
echo [5/5] Attente du demarrage du backend (compilation Maven + Spring Boot)...
echo          Cela peut prendre 2-3 minutes au premier lancement...
echo.

set RETRIES=0
set MAX_RETRIES=60

:wait_loop
if %RETRIES% geq %MAX_RETRIES% (
    echo.
    echo [ATTENTION] Le backend met plus de temps que prevu.
    echo             Verifiez les logs : docker compose logs backend
    goto :show_urls
)

timeout /t 5 /nobreak >nul

docker exec monprojet-backend curl -sf http://localhost:8080/api-docs >nul 2>&1
if %errorlevel% equ 0 (
    echo          Backend demarre avec succes !
    goto :show_urls
)

REM Fallback si curl n'existe pas dans le conteneur
docker exec monprojet-backend wget -qO- http://localhost:8080/api-docs >nul 2>&1
if %errorlevel% equ 0 (
    echo          Backend demarre avec succes !
    goto :show_urls
)

set /a RETRIES=%RETRIES%+1
set /a ELAPSED=%RETRIES%*5
echo          Attente... (%ELAPSED%s)
goto :wait_loop

:show_urls
echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║               PROJET LANCE AVEC SUCCES !                ║
echo ╠══════════════════════════════════════════════════════════╣
echo ║                                                          ║
echo ║  Frontend (public)   : http://localhost:5173              ║
echo ║  Backoffice (admin)  : http://localhost:5174              ║
echo ║  API Backend         : http://localhost:8080              ║
echo ║  Swagger UI          : http://localhost:8080/swagger-ui.html ║
echo ║  Carte (TileServer)  : http://localhost:8089              ║
echo ║                                                          ║
echo ╠══════════════════════════════════════════════════════════╣
echo ║  Comptes par defaut :                                    ║
echo ║    Admin : admin / admin                                 ║
echo ║                                                          ║
echo ║  Commandes utiles :                                      ║
echo ║    Logs      : docker compose logs -f                    ║
echo ║    Arreter   : docker compose down                       ║
echo ║    Reinit DB : lancer reset-database.bat                 ║
echo ╚══════════════════════════════════════════════════════════╝
echo.
pause
