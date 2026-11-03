@echo off
cd /d "%~dp0"
echo Encendiendo base de datos...
docker compose up -d
echo Iniciando backend y frontend...
start "Backend" cmd /k "cd backend && python -m alembic upgrade head && python -m uvicorn app.main:app --reload"
start "Frontend" cmd /k "cd frontend && npm run dev"
timeout /t 8 >nul
start http://localhost:5173
