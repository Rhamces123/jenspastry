@echo off
setlocal
echo ==========================================
echo  BAKEOLOGY - Auto Git Push to GitHub
echo ==========================================

REM Get optional commit message argument or use default with timestamp
set MSG=%*
if "%MSG%"=="" (
    for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
    set MSG=Update BAKEOLOGY app - %datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2% %datetime:~8,2%:%datetime:~10,2%
)

echo.
echo [1/3] Staging all files...
git add -A

echo [2/3] Committing with message: "%MSG%"...
git commit -m "%MSG%"

echo [3/3] Pushing to GitHub (origin main)...
git push origin main

echo.
echo ==========================================
echo  Successfully pushed to GitHub!
echo ==========================================
pause
