# KL Student — Android APK

A Flutter app that hosts the white & green KL Student UI natively (login → semesters →
courses → sessions → video / infographic / PDF / PPT / notes / quiz-with-scoring).
No database — sample data is bundled. Only the video needs internet.

## Build the APK (one click)
1. Double-click **`BUILD_APK.bat`** in this folder.
2. First build takes a few minutes (downloads Gradle dependencies).
3. When it says **BUILD SUCCESS**, the output folder opens automatically.

The APK appears at:
```
D:\AITUTOR\kl_student\build\app\outputs\flutter-apk\app-release.apk
```

## Or build manually (PowerShell)
```powershell
$env:Path += ";C:\flutter_windows_3.32.4-stable\flutter\bin"
cd D:\AITUTOR\kl_student
flutter build apk --release
```

## Or run on a connected phone / emulator
```powershell
flutter run --release
```

## Install on your phone
1. Copy `app-release.apk` to your phone (USB, Google Drive, WhatsApp, etc.)
2. Open it on the phone → allow "Install from unknown sources" → Install.
3. App appears as **KL Student**.

## To change content / colors
Everything lives in `assets/www/index.html` (the same file as the web demo).
Edit it, then rebuild. The `DATA` object near the bottom holds all sample courses,
sessions, and quiz questions.

> Note: the assistant couldn't run the Gradle build itself (its sandbox blocks the
> local "loopback" socket Gradle needs). Your normal terminal has no such limit,
> so `BUILD_APK.bat` will work.
