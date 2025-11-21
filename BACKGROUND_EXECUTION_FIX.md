# Background Execution Fix

## Problem
When the app was backgrounded, heartbeats and all UDP traffic were being queued instead of executing immediately. Only one heartbeat would send, then everything would queue until the app was foregrounded again.

## Root Cause
The implementation used **Kotlin coroutines** (`Dispatchers.IO`, `launch`, `delay`) which are **suspended by Android Doze mode** when the app is backgrounded.

## Solution
Switched to **native Java threads** like the old plugin, which are **NOT affected by Doze mode**.

## Changes Made

### 1. MorphUdpClient.kt - Replaced Coroutines with Native Threads

**Before:**
```kotlin
private var handshakeJob: Job? = null
private var receiveJob: Job? = null
private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

// Start receiving
receiveJob = scope.launch {
    receivePackets()
}

private suspend fun receivePackets() = withContext(Dispatchers.IO) {
    while (isRunning) {
        socket?.receive(packet)  // Gets suspended during Doze
        // ...
    }
}
```

**After:**
```kotlin
private var receiveThread: Thread? = null
private var handshakeThread: Thread? = null

// Start receiving in native thread
receiveThread = Thread {
    receivePackets()
}.apply {
    name = "MorphUDP-Receive"
    start()
}

private fun receivePackets() {
    while (isRunning && socket != null && !socket!!.isClosed) {
        socket?.receive(packet)  // Works during Doze in native thread
        // ...
    }
}
```

**Key Changes:**
- `Job` → `Thread`
- `scope.launch` → `Thread { }.start()`
- `suspend fun` → `fun` (no suspend)
- `delay()` → `Thread.sleep()`
- Blocking `socket.receive()` now works properly during Doze

### 2. MorphProtocolService.kt - Removed Unnecessary Features

**Removed:**
- ❌ Foreground service (`startForeground()`)
- ❌ Wake lock (`PowerManager.WakeLock`)
- ❌ Notification channel and notifications
- ❌ Battery optimization checks

**Changed:**
- `START_STICKY` → `START_NOT_STICKY` (matches old plugin)

**Why:** The old plugin worked perfectly without these features. Native Java threads are sufficient for background execution.

### 3. AndroidManifest.xml - Simplified Permissions

**Removed:**
```xml
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
```

**Kept:**
```xml
<uses-permission android:name="android.permission.INTERNET" />
```

**Service Declaration:**
```xml
<service
    android:name=".MorphProtocolService"
    android:enabled="true"
    android:exported="false" />
```

## Why This Works

### Native Java Threads vs Kotlin Coroutines

| Feature | Kotlin Coroutines | Native Java Threads |
|---------|------------------|---------------------|
| Doze Mode | ❌ Suspended | ✅ Continue running |
| `delay()` | ❌ Queued | N/A |
| `Thread.sleep()` | N/A | ✅ Works normally |
| `socket.receive()` | ❌ Blocked | ✅ Works normally |
| Background execution | ❌ Paused | ✅ Active |

### How Android Doze Mode Works

1. **App backgrounded** → Device enters Doze mode after ~1 hour
2. **Coroutines suspended** → All `delay()` calls queued, network restricted
3. **Native threads continue** → `Thread.sleep()` works, `socket.receive()` works
4. **Timer threads continue** → `java.util.Timer` creates its own thread

### Old Plugin Architecture (Working)

```
Service (START_NOT_STICKY)
  └─> Native Thread (UDP receive loop)
       └─> socket.receive() [blocking, works in Doze]
  └─> java.util.Timer (heartbeat)
       └─> Timer thread [continues in Doze]
```

### New Plugin Architecture (Now Fixed)

```
Service (START_NOT_STICKY)
  └─> Native Thread (UDP receive loop)
       └─> socket.receive() [blocking, works in Doze]
  └─> Native Thread (handshake)
       └─> Thread.sleep() [works in Doze]
  └─> java.util.Timer (heartbeat)
       └─> Timer thread [continues in Doze]
  └─> java.util.Timer (inactivity check)
       └─> Timer thread [continues in Doze]
```

## Testing

1. Build and install the plugin
2. Connect to the server
3. Background the app
4. Monitor logs - heartbeats should continue every 30 seconds
5. Send/receive UDP traffic - should work normally
6. Wait for Doze mode (~1 hour) - everything should still work

## Key Takeaways

1. **Native Java threads are Doze-resistant** - they continue running in background
2. **Kotlin coroutines are NOT Doze-resistant** - they get suspended
3. **Foreground service is NOT required** - native threads are sufficient
4. **Wake lock is NOT required** - native threads keep running
5. **Keep it simple** - match the working old plugin architecture

## Files Modified

- `android/plugin/android/src/main/java/com/morphprotocol/client/network/MorphUdpClient.kt`
- `android/plugin/android/src/main/java/com/morphprotocol/capacitor/MorphProtocolService.kt`
- `android/plugin/android/src/main/AndroidManifest.xml`

## Files Deleted

- `android/plugin/android/src/main/java/com/morphprotocol/capacitor/MorphVpnService.kt` (not needed)
