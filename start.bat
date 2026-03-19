@echo off
echo =========================================
echo   AquaLog - Pump Operation Dashboard
echo =========================================
echo.

echo Starting Ollama with qwen2.5:14b model...
start /B ollama serve

timeout /t 5 /nobreak >nul

echo Checking for qwen2.5:14b model...
ollama list | findstr /C:"qwen2.5:14b" >nul
if errorlevel 1 (
    echo Pulling qwen2.5:14b model...
    ollama pull qwen2.5:14b
)

echo.
echo Starting AquaLog...
echo Access at: http://localhost:3000
echo.

bun run dev --hostname 0.0.0.0
