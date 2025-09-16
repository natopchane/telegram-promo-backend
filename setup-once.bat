@echo off
title TelegramPromo - SETUP
echo 📦 Installing dependencies (backend + frontend)...
cd /d D:\telegram-promo\backend && npm install
cd /d D:\telegram-promo\frontend && npm install
echo ✅ Done. Теперь запускай start-all.bat
pause
