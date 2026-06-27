@echo off
title Build KL Student APK
set "PATH=%PATH%;C:\flutter_windows_3.32.4-stable\flutter\bin"
set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
if not exist "C:\tmp" mkdir "C:\tmp"
set "TMP=C:\tmp"
set "TEMP=C:\tmp"
cd /d "D:\AITUTOR\kl_student"

echo ============================================
echo   Building KL Student APK (first run is slow)
echo ============================================
echo.

call flutter build apk --release

echo.
if exist "build\app\outputs\flutter-apk\app-release.apk" (
  echo ============================================
  echo   BUILD SUCCESS!
  echo   APK: D:\AITUTOR\kl_student\build\app\outputs\flutter-apk\app-release.apk
  echo ============================================
  explorer "build\app\outputs\flutter-apk"
) else (
  echo ============================================
  echo   BUILD FAILED - read the messages above.
  echo ============================================
)
echo.
pause
