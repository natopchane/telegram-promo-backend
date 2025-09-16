@echo off
title TelegramPromo - ALL
cd /d D:\telegram-promo

REM Открываем backend в новом окне
start "BACKEND" cmd /k "cd /d D:\telegram-promo\backend && npm start"

REM Запускаем frontend в текущем окне
cd /d D:\telegram-promo\frontend

REM Если SWC снова начнёт ругаться, раскомментируй строку ниже:
REM set NEXT_DISABLE_SWC_NATIVE=1

echo 🌐 Starting FRONTEND on http://localhost:3000 ...
npm run dev
pause
