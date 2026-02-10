@echo off
chcp 65001 >nul
title Roadworks Tracker - Arret
color 0C

echo ╔══════════════════════════════════════════════════════════╗
echo ║          ROADWORKS TRACKER - Arret du projet            ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

echo Arret de tous les services...
docker compose down

echo.
echo Tous les services ont ete arretes.
echo Les donnees de la base PostgreSQL sont conservees dans le volume Docker.
echo.
echo Pour supprimer aussi les donnees : docker compose down -v
echo.
pause
