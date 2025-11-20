#!/bin/bash
set -e

echo "========================================"
echo "MorphProtocol Demo App - Build and Install"
echo "========================================"
echo ""

cd "$(dirname "$0")"

echo "[1/4] Building web app..."
npm run build

echo ""
echo "[2/4] Syncing Capacitor..."
npx cap sync

echo ""
echo "[3/4] Building Android APK..."
cd android
./gradlew assembleDebug
cd ..

echo ""
echo "[4/4] Installing on device..."
echo "Checking for connected devices..."
adb devices
echo ""
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

echo ""
echo "========================================"
echo "✅ Success! App installed on device."
echo "========================================"
echo ""
echo "You can now:"
echo "1. Open 'MorphProtocol Demo' on your phone"
echo "2. Enter your server details"
echo "3. Click Connect"
echo ""
