@echo off
echo ========================================
echo MorphProtocol Demo App - Build APK Only
echo ========================================
echo.

cd /d %~dp0

echo [1/3] Building web app...
call npm run build
if errorlevel 1 (
    echo.
    echo ❌ Web build failed!
    pause
    exit /b 1
)

echo.
echo [2/3] Syncing Capacitor...
call npx cap sync
if errorlevel 1 (
    echo.
    echo ❌ Capacitor sync failed!
    pause
    exit /b 1
)

echo.
echo [3/3] Building Android APK...
cd android
call gradlew.bat assembleDebug
if errorlevel 1 (
    echo.
    echo ❌ APK build failed!
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo ========================================
echo ✅ Success! APK built successfully.
echo ========================================
echo.
echo APK location:
echo android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo To install:
echo 1. Copy app-debug.apk to your phone
echo 2. Open the file on your phone
echo 3. Allow installation from unknown sources
echo 4. Tap Install
echo.
echo Or connect via USB and run:
echo adb install -r android\app\build\outputs\apk\debug\app-debug.apk
echo.
pause
