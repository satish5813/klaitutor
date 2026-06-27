@echo off
title Apply KL logo
cd /d "D:\AITUTOR\kl_student"

set "SRC=assets\branding\kl_logo.png"
if not exist "%SRC%" (
  echo.
  echo  Could not find the logo at:
  echo    D:\AITUTOR\kl_student\%SRC%
  echo.
  echo  Save the KL logo image to that exact path first, then run this again.
  echo.
  pause
  exit /b
)

echo Copying KL logo into the apps...
copy /Y "%SRC%" "assets\www\kl_logo.png" >nul
copy /Y "%SRC%" "..\student-app\kl_logo.png" >nul

echo.
echo  Done! The KL logo is now used in:
echo    - the Flutter app (login header)
echo    - the standalone web app
echo.
echo  Next: double-click BUILD_APK.bat to build the APK.
echo.
pause
