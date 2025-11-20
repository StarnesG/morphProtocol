@echo off
echo ========================================
echo MorphProtocol Demo App - Android Setup
echo ========================================
echo.

cd /d %~dp0

echo Checking Java version...
java -version
echo.

echo [1/4] Building web app...
call npm run build
if errorlevel 1 (
    echo.
    echo ❌ Web build failed!
    pause
    exit /b 1
)

echo.
echo [2/4] Adding Android platform...
call npx cap add android
if errorlevel 1 (
    echo.
    echo ❌ Failed to add Android platform!
    pause
    exit /b 1
)

echo.
echo [3/4] Updating Gradle wrapper to support Java 21...
cd android
echo distributionUrl=https\://services.gradle.org/distributions/gradle-8.5-all.zip > gradle\wrapper\gradle-wrapper.properties
cd ..

echo.
echo [4/4] Syncing Capacitor...
call npx cap sync
if errorlevel 1 (
    echo.
    echo ❌ Capacitor sync failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ Android setup complete!
echo ========================================
echo.
echo You can now build the APK with:
echo   build-and-install.bat
echo.
echo Or manually:
echo   cd android
echo   gradlew.bat assembleDebug
echo.
pause
