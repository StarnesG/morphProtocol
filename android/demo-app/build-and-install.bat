@echo off
echo ========================================
echo MorphProtocol Demo App - Build and Install
echo ========================================
echo.

cd /d %~dp0

echo [1/4] Building web app...
call npm run build
if errorlevel 1 (
    echo.
    echo ❌ Web build failed!
    pause
    exit /b 1
)

echo.
echo [2/4] Syncing Capacitor...
call npx cap sync
if errorlevel 1 (
    echo.
    echo ❌ Capacitor sync failed!
    pause
    exit /b 1
)

echo.
echo [3/4] Building Android APK...
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
echo [4/4] Installing on device...
echo Checking for connected devices...
adb devices
echo.
adb install -r android\app\build\outputs\apk\debug\app-debug.apk
if errorlevel 1 (
    echo.
    echo ❌ Installation failed!
    echo.
    echo Make sure:
    echo - USB debugging is enabled on your phone
    echo - Phone is connected via USB
    echo - You've authorized the computer on your phone
    echo.
    echo Or copy the APK manually from:
    echo android\app\build\outputs\apk\debug\app-debug.apk
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ Success! App installed on device.
echo ========================================
echo.
echo You can now:
echo 1. Open "MorphProtocol Demo" on your phone
echo 2. Enter your server details
echo 3. Click Connect
echo.
pause
