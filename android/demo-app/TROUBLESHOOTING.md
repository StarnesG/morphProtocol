# Troubleshooting Guide

## Java Version Issues

### Error: "Unsupported class file major version 65"

**Problem:** You have Java 21 installed, but Gradle 8.0.2 doesn't fully support it.

**Solution 1: Update Gradle (Recommended)**

Run the setup script:
```bash
setup-android.bat
```

Or manually update:
```bash
cd android\gradle\wrapper
echo distributionUrl=https\://services.gradle.org/distributions/gradle-8.5-all.zip > gradle-wrapper.properties
cd ..\..\..
```

**Solution 2: Use Java 17**

Download and install Java 17:
- https://adoptium.net/temurin/releases/?version=17

Set JAVA_HOME:
```bash
set JAVA_HOME=C:\Program Files\Java\jdk-17
set PATH=%JAVA_HOME%\bin;%PATH%
```

### Check Your Java Version

```bash
java -version
```

**Compatible versions:**
- ✅ Java 17 (LTS) - Recommended
- ✅ Java 21 (LTS) - Requires Gradle 8.5+
- ❌ Java 11 - Too old for Gradle 8.x
- ❌ Java 8 - Too old

---

## Gradle Issues

### Error: "Could not open settings generic class cache"

**Cause:** Gradle cache corruption or Java version mismatch

**Solution:**
```bash
# Clear Gradle cache
rmdir /s /q %USERPROFILE%\.gradle\caches

# Rebuild
cd android
gradlew.bat clean
gradlew.bat assembleDebug
```

### Error: "Gradle daemon disappeared unexpectedly"

**Solution:**
```bash
# Stop all Gradle daemons
cd android
gradlew.bat --stop

# Rebuild
gradlew.bat assembleDebug
```

---

## Android Platform Issues

### Error: "android platform has not been added yet"

**Solution:**
```bash
npx cap add android
```

### Error: "Could not find or load main class org.gradle.wrapper.GradleWrapperMain"

**Cause:** Gradle wrapper not properly initialized

**Solution:**
```bash
# Remove and re-add Android platform
rmdir /s /q android
npx cap add android
```

---

## ADB Issues

### Error: "adb: command not found"

**Solution:**

Add Android SDK platform-tools to PATH:

**Windows:**
```bash
set PATH=%PATH%;C:\Users\%USERNAME%\AppData\Local\Android\Sdk\platform-tools
```

Or permanently:
1. System Properties → Environment Variables
2. Edit PATH
3. Add: `C:\Users\YourName\AppData\Local\Android\Sdk\platform-tools`

### Error: "no devices/emulators found"

**Checklist:**
1. ✅ USB debugging enabled on phone
2. ✅ Phone connected via USB
3. ✅ USB drivers installed (Windows)
4. ✅ Authorized computer on phone

**Verify connection:**
```bash
adb devices
```

Should show:
```
List of devices attached
ABC123XYZ    device
```

**If shows "unauthorized":**
- Disconnect and reconnect USB
- Check phone for authorization prompt
- Accept the prompt

**If shows nothing:**
- Try different USB cable
- Try different USB port
- Restart adb: `adb kill-server && adb start-server`

---

## Build Issues

### Error: "npm ERR! missing script: build"

**Solution:**
```bash
# Make sure you're in the demo-app directory
cd H:\morphProtocol\android\demo-app

# Install dependencies
npm install

# Try again
npm run build
```

### Error: "Cannot find module '@morphprotocol/capacitor-plugin'"

**Solution:**
```bash
# Build the plugin first
cd ..\plugin
npm install
npm run build

# Return to demo-app
cd ..\demo-app
npm install
```

### Error: "vite: command not found"

**Solution:**
```bash
npm install
```

---

## Capacitor Issues

### Error: "Capacitor could not find the web assets directory"

**Solution:**
```bash
# Build the web app first
npm run build

# Then sync
npx cap sync
```

### Error: "Plugin not found"

**Solution:**
```bash
# Rebuild plugin
cd ..\plugin
npm run build

# Reinstall in demo-app
cd ..\demo-app
npm install
npx cap sync
```

---

## Installation Issues

### Error: "INSTALL_FAILED_UPDATE_INCOMPATIBLE"

**Cause:** App already installed with different signature

**Solution:**
```bash
# Uninstall old version
adb uninstall com.morphprotocol.demo

# Install new version
adb install -r android\app\build\outputs\apk\debug\app-debug.apk
```

### Error: "INSTALL_FAILED_INSUFFICIENT_STORAGE"

**Solution:**
- Free up space on your phone
- Uninstall unused apps
- Clear cache

### Error: "INSTALL_PARSE_FAILED_NO_CERTIFICATES"

**Cause:** APK not properly signed

**Solution:**
```bash
# Clean and rebuild
cd android
gradlew.bat clean
gradlew.bat assembleDebug
```

---

## Runtime Issues

### App crashes on startup

**Check logs:**
```bash
adb logcat | findstr MorphProtocol
```

**Common causes:**
1. Plugin not properly installed
2. Missing permissions
3. WireGuard not configured

### "Plugin not available" error

**Solution:**
```bash
# Rebuild and sync
cd ..\plugin
npm run build

cd ..\demo-app
npx cap sync

# Rebuild APK
cd android
gradlew.bat clean assembleDebug
```

---

## Performance Issues

### Build is very slow

**Solutions:**

1. **Enable Gradle daemon:**
   ```bash
   # Add to android/gradle.properties
   org.gradle.daemon=true
   org.gradle.parallel=true
   org.gradle.caching=true
   ```

2. **Increase Gradle memory:**
   ```bash
   # Add to android/gradle.properties
   org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=512m
   ```

3. **Use local Gradle distribution:**
   - Download Gradle 8.5 from https://gradle.org/releases/
   - Extract to a folder
   - Update `gradle-wrapper.properties`:
     ```
     distributionUrl=file:///C:/gradle-8.5-all.zip
     ```

---

## Clean Build

If all else fails, do a complete clean build:

```bash
# Clean everything
rmdir /s /q node_modules
rmdir /s /q android
rmdir /s /q dist
del package-lock.json

# Rebuild from scratch
npm install
npm run build
npx cap add android

# Update Gradle for Java 21
cd android
echo distributionUrl=https\://services.gradle.org/distributions/gradle-8.5-all.zip > gradle\wrapper\gradle-wrapper.properties
cd ..

# Sync and build
npx cap sync
cd android
gradlew.bat assembleDebug
```

---

## Getting Help

If you're still stuck:

1. **Check logs:**
   ```bash
   # Gradle logs
   cd android
   gradlew.bat assembleDebug --stacktrace --info
   
   # Android logs
   adb logcat
   ```

2. **Check versions:**
   ```bash
   java -version
   node --version
   npm --version
   adb version
   ```

3. **Open an issue:**
   - https://github.com/LennoxSears/morphProtocol/issues
   - Include error messages and versions

---

## Quick Reference

### Recommended Setup
- **Java:** 17 or 21 (LTS versions)
- **Node.js:** 18+
- **Gradle:** 8.5+ (for Java 21)
- **Android SDK:** API 22+

### Common Commands
```bash
# Build web app
npm run build

# Add Android platform
npx cap add android

# Sync Capacitor
npx cap sync

# Build APK
cd android && gradlew.bat assembleDebug

# Install APK
adb install -r android\app\build\outputs\apk\debug\app-debug.apk

# Check devices
adb devices

# View logs
adb logcat

# Clean build
cd android && gradlew.bat clean
```

### File Locations
- **APK:** `android\app\build\outputs\apk\debug\app-debug.apk`
- **Gradle wrapper:** `android\gradle\wrapper\gradle-wrapper.properties`
- **Gradle cache:** `%USERPROFILE%\.gradle\caches`
- **Android SDK:** `%LOCALAPPDATA%\Android\Sdk`
