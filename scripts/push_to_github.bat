@echo off
cd /d "d:\Loadopt"
echo ========================================================
echo Pushing LoadOpt to GitHub: vaibhavgupta8890-cpu/Loadopt
echo ========================================================
echo.
git push -u origin main
echo.
if %errorlevel% equ 0 (
    echo ========================================================
    echo SUCCESS! All files uploaded to:
    echo https://github.com/vaibhavgupta8890-cpu/Loadopt
    echo ========================================================
) else (
    echo.
    echo If prompted, please click "Sign in with your browser"
    echo and authorize for account: vaibhavgupta8890-cpu
)
echo.
pause
