@echo off
chcp 65001 >nul
title Roadworks Tracker - Reinitialisation BDD
color 0E

echo ╔══════════════════════════════════════════════════════════╗
echo ║    ROADWORKS TRACKER - Reinitialisation de la base      ║
echo ╚══════════════════════════════════════════════════════════╝
echo.
echo [ATTENTION] Cette operation va reinitialiser toute la base de donnees.
echo             Toutes les donnees existantes seront perdues.
echo.

set /p CONFIRM="Etes-vous sur ? (o/N) : "
if /i not "%CONFIRM%"=="o" (
    echo Annule.
    pause
    exit /b 0
)

echo.
echo Reinitialisation en cours...

docker cp "%~dp0database\reset-database.sql" monprojet-postgres14:/tmp/reset-database.sql
if %errorlevel% neq 0 (
    echo [ERREUR] Le conteneur PostgreSQL n'est pas demarre.
    echo          Lancez d'abord le projet avec start.bat
    pause
    exit /b 1
)

docker exec monprojet-postgres14 psql -U roadworks -d roadworks -f /tmp/reset-database.sql

echo.
echo Base de donnees reinitialisee avec succes !
echo.
pause
