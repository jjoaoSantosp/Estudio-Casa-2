@echo off
rem Encerra somente o processo que esta escutando em 127.0.0.1:3000
rem (nao mexe em outros programas Node nem no navegador).

for /f "tokens=5" %%p in ('netstat -ano ^| findstr /C:"127.0.0.1:3000" ^| findstr /C:"0.0.0.0:0"') do (
    taskkill /PID %%p /F >nul 2>&1
)

echo Servidor da Agenda Casa 2 Studio encerrado.
timeout /t 2 >nul