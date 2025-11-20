# Build APK Without Android Studio

This guide shows you how to build and install the MorphProtocol demo app directly on your Android phone without using Android Studio.

## Prerequisites

### Required Software
- ✅ Node.js 16+ (already installed)
- ✅ Java JDK 11 or higher
- ✅ Android SDK Command Line Tools

### Check Java Installation

```bash
java -version
```

You should see Java 11 or higher. If not, download from:
- https://adoptium.net/ (recommended)
- https://www.oracle.com/java/technologies/downloads/

### Install Android SDK Command Line Tools

**Option 1: Via Android Studio (Easiest)**
1. Install Android Studio
2. Open SDK Manager (Tools → SDK Manager)
3. Install "Android SDK Command-line Tools"
4. Set environment variables (see below)

**Option 2: Standalone (No Android Studio)**
1. Download command line tools: https://developer.android.com/studio#command-tools
2. Extract to a folder (e.g., `C:\Android\cmdline-tools`)
3. Set environment variables (see below)

### Set Environment Variables

**Windows (PowerShell):**
```powershell
# Add to your PowerShell profile or set permanently via System Properties
$env:ANDROID_HOME = "C:\Users\YourName\AppData\Local\Android\Sdk"
$env:JAVA_HOME = "C:\Program Files\Java\jdk-11"
$env:PATH += ";$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\cmdline-tools\latest\bin"
```

**Windows (Command Prompt):**
```cmd
set ANDROID_HOME=C:\Users\YourName\AppData\Local\Android\Sdk
set JAVA_HOME=C:\Program Files\Java\jdk-11
set PATH=%PATH%;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\cmdline-tools\latest\bin
```

**Linux/Mac:**
```bash
export ANDROID_HOME=$HOME/Android/Sdk
export JAVA_HOME=/usr/lib/jvm/java-11-openjdk
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin
```

### Verify Installation

```bash
# Check Java
java -version

# Check Android SDK
adb version

# Check Gradle (after adding Android platform)
cd android
./gradlew --version  # Linux/Mac
gradlew.bat --version  # Windows
```

---

## Method 1: Build Debug APK (Fastest)

### Step 1: Prepare the Project

```bash
cd H:\morphProtocol\android\demo-app

# Build web app
npm run build

# Add Android platform (first time only)
npx cap add android

# Sync Capacitor
npx cap sync
```

### Step 2: Build Debug APK

**Windows:**
```bash
cd android
gradlew.bat assembleDebug
```

**Linux/Mac:**
```bash
cd android
./gradlew assembleDebug
```

### Step 3: Find the APK

The APK will be at:
```
android\app\build\outputs\apk\debug\app-debug.apk
```

### Step 4: Install on Phone

**Option A: Via USB Cable**

1. Enable USB debugging on your phone:
   - Settings → About Phone → Tap "Build Number" 7 times
   - Settings → Developer Options → Enable "USB Debugging"

2. Connect phone via USB

3. Install APK:
   ```bash
   adb install android\app\build\outputs\apk\debug\app-debug.apk
   ```

**Option B: Transfer APK File**

1. Copy `app-debug.apk` to your phone (USB, email, cloud storage)
2. On your phone, open the APK file
3. Allow installation from unknown sources if prompted
4. Tap "Install"

---

## Method 2: Build Release APK (Optimized)

Release APKs are smaller and faster but require signing.

### Step 1: Generate Signing Key (First Time Only)

```bash
cd H:\morphProtocol\android\demo-app\android\app

keytool -genkey -v -keystore morphprotocol-release.keystore -alias morphprotocol -keyalg RSA -keysize 2048 -validity 10000
```

Answer the prompts:
- Password: (choose a strong password)
- Name, Organization, etc.: (fill in your details)

**Keep this keystore file safe!** You'll need it for all future releases.

### Step 2: Configure Signing

Create `android/key.properties`:

```properties
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=morphprotocol
storeFile=app/morphprotocol-release.keystore
```

### Step 3: Update build.gradle

Edit `android/app/build.gradle`, add before `android {`:

```gradle
def keystorePropertiesFile = rootProject.file("key.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

Inside `android { ... }`, add:

```gradle
signingConfigs {
    release {
        keyAlias keystoreProperties['keyAlias']
        keyPassword keystoreProperties['keyPassword']
        storeFile file(keystoreProperties['storeFile'])
        storePassword keystoreProperties['storePassword']
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled false
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
}
```

### Step 4: Build Release APK

**Windows:**
```bash
cd android
gradlew.bat assembleRelease
```

**Linux/Mac:**
```bash
cd android
./gradlew assembleRelease
```

### Step 5: Find and Install

APK location:
```
android\app\build\outputs\apk\release\app-release.apk
```

Install same as debug APK (via USB or file transfer).

---

## Method 3: One-Command Build Script

Create `build-and-install.bat` (Windows) or `build-and-install.sh` (Linux/Mac):

**Windows (build-and-install.bat):**
```batch
@echo off
echo Building MorphProtocol Demo App...

cd /d %~dp0

echo Step 1: Building web app...
call npm run build
if errorlevel 1 goto error

echo Step 2: Syncing Capacitor...
call npx cap sync
if errorlevel 1 goto error

echo Step 3: Building APK...
cd android
call gradlew.bat assembleDebug
if errorlevel 1 goto error

echo Step 4: Installing on device...
cd ..
adb install -r android\app\build\outputs\apk\debug\app-debug.apk
if errorlevel 1 goto error

echo.
echo ✅ Success! App installed on device.
goto end

:error
echo.
echo ❌ Build failed!
exit /b 1

:end
```

**Linux/Mac (build-and-install.sh):**
```bash
#!/bin/bash
set -e

echo "Building MorphProtocol Demo App..."

cd "$(dirname "$0")"

echo "Step 1: Building web app..."
npm run build

echo "Step 2: Syncing Capacitor..."
npx cap sync

echo "Step 3: Building APK..."
cd android
./gradlew assembleDebug

echo "Step 4: Installing on device..."
cd ..
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

echo ""
echo "✅ Success! App installed on device."
```

Make executable (Linux/Mac):
```bash
chmod +x build-and-install.sh
```

Run:
```bash
# Windows
build-and-install.bat

# Linux/Mac
./build-and-install.sh
```

---

## Quick Reference

### Build Commands

| Task | Command |
|------|---------|
| Build web app | `npm run build` |
| Add Android | `npx cap add android` |
| Sync changes | `npx cap sync` |
| Build debug APK | `cd android && gradlew assembleDebug` |
| Build release APK | `cd android && gradlew assembleRelease` |
| Install via USB | `adb install path/to/app.apk` |
| Uninstall | `adb uninstall com.morphprotocol.demo` |

### APK Locations

- **Debug:** `android/app/build/outputs/apk/debug/app-debug.apk`
- **Release:** `android/app/build/outputs/apk/release/app-release.apk`

### Common Issues

**"adb not found"**
- Add Android SDK platform-tools to PATH
- Or use full path: `C:\Android\Sdk\platform-tools\adb.exe`

**"No devices found"**
- Enable USB debugging on phone
- Check connection: `adb devices`
- Try different USB cable/port

**"Gradle not found"**
- Run `npx cap add android` first
- Check JAVA_HOME is set

**"Build failed"**
- Check Java version: `java -version` (need 11+)
- Clean build: `cd android && gradlew clean`
- Check ANDROID_HOME is set

---

## Advantages of Command Line Build

✅ **Faster** - No need to wait for Android Studio to load
✅ **Scriptable** - Automate builds with scripts
✅ **CI/CD Ready** - Easy to integrate with build pipelines
✅ **Lightweight** - Don't need full Android Studio installed
✅ **Portable** - Works on any machine with Java + Android SDK

---

## Next Steps

After installing the app:

1. Open the app on your phone
2. Enter your MorphProtocol server details
3. Click "Connect"
4. Monitor connection status

For development:
- Make changes to `src/App.vue`
- Run `npm run build && npx cap sync`
- Rebuild and reinstall APK
- Test on device

---

## Resources

- [Capacitor CLI Documentation](https://capacitorjs.com/docs/cli)
- [Android Command Line Tools](https://developer.android.com/studio/command-line)
- [Gradle Build Guide](https://developer.android.com/studio/build/building-cmdline)
