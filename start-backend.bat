@echo off
title TelegramPromo - BACKEND
cd /d D:\telegram-promo\backend

REM Проверка .env
if not exist ".env" (
  echo [ERROR] backend\.env не найден. Создай файл с PORT, MONGO_URI, ADMIN_KEY.
  pause
  exit /b 1
)

echo 🚀 Starting BACKEND on http://localhost:5000 ...
npm start
pause
