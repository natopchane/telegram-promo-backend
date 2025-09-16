@echo off
title TelegramPromo - FRONTEND
cd /d D:\telegram-promo\frontend

REM Если на твоём ПК вдруг снова упадёт SWC — раскомментируй следующую строку:
REM set NEXT_DISABLE_SWC_NATIVE=1

echo 🌐 Starting FRONTEND on http://localhost:3000 ...
npm run dev
pause
