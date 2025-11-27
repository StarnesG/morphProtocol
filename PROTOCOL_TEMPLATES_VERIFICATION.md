# Protocol Templates Cross-Platform Verification

## Date: 2025-11-27

---

## Summary

Verified all protocol templates match exactly across TypeScript, Android, and iOS implementations.

**Bug Found**: iOS KCP template used big-endian instead of little-endian (FIXED)

---

## Template Comparison

### 1. QUIC Template (ID: 1)

**Header Format**: 11 bytes
- [1 byte flags][8 bytes connection ID][2 bytes packet number]

**Overhead**: 11 bytes

**Header ID**: 8-byte connection ID (bytes 1-8)

| Feature | TypeScript | Android | iOS | Status |
|---------|-----------|---------|-----|--------|
| Flags range | 0x40-0x4F | 0x40-0x4F | 0x40-0x4F | ✅ Match |
| Connection ID | First 8 bytes of clientID | First 8 bytes of clientID | First 8 bytes of clientID | ✅ Match |
| Packet number | 2 bytes, big-endian | 2 bytes, big-endian | 2 bytes, big-endian | ✅ Match |
| Header size | 11 bytes | 11 bytes | 11 bytes | ✅ Match |

---

### 2. KCP Template (ID: 2)

**Header Format**: 24 bytes
- [4 bytes conv][1 cmd][1 frg][2 wnd][4 ts][4 sn][4 una][4 len]

**Overhead**: 24 bytes

**Header ID**: 4-byte conv (bytes 0-3)

| Feature | TypeScript | Android | iOS (Before) | iOS (After) | Status |
|---------|-----------|---------|--------------|-------------|--------|
| Conv | First 4 bytes of clientID | First 4 bytes of clientID | First 4 bytes of clientID | First 4 bytes of clientID | ✅ Match |
| Cmd | 0x51 | 0x51 | 0x51 | 0x51 | ✅ Match |
| Frg | 0x00 | 0x00 | 0x00 | 0x00 | ✅ Match |
| Wnd | 256 (LE) | 256 (LE) | 256 (BE) ❌ | 256 (LE) ✅ | ✅ Fixed |
| Ts | 4 bytes (LE) | 4 bytes (LE) | 4 bytes (BE) ❌ | 4 bytes (LE) ✅ | ✅ Fixed |
| Sn | 4 bytes (LE) | 4 bytes (LE) | 4 bytes (BE) ❌ | 4 bytes (LE) ✅ | ✅ Fixed |
| Una | 4 bytes (LE) | 4 bytes (LE) | 4 bytes (BE) ❌ | 4 bytes (LE) ✅ | ✅ Fixed |
| Len | 4 bytes (LE) | 4 bytes (LE) | 4 bytes (BE) ❌ | 4 bytes (LE) ✅ | ✅ Fixed |
| Header size | 24 bytes | 24 bytes | 24 bytes | 24 bytes | ✅ Match |

**Bug Fixed**: iOS was using big-endian for all multi-byte fields. KCP protocol uses little-endian.

---

### 3. Generic Gaming Template (ID: 3)

**Header Format**: 12 bytes
- [4 bytes magic "GAME"][4 bytes session ID][2 seq][1 type][1 flags]

**Overhead**: 12 bytes

**Header ID**: 4-byte session ID (bytes 4-7)

| Feature | TypeScript | Android | iOS | Status |
|---------|-----------|---------|-----|--------|
| Magic | "GAME" | "GAME" | "GAME" | ✅ Match |
| Session ID | First 4 bytes of clientID | First 4 bytes of clientID | First 4 bytes of clientID | ✅ Match |
| Sequence | 2 bytes, big-endian | 2 bytes, big-endian | 2 bytes, big-endian | ✅ Match |
| Type | Random 0x01-0x05 | Random 0x01-0x05 | Random 0x01-0x05 | ✅ Match |
| Flags | Random 0x00-0xFF | Random 0x00-0xFF | Random 0x00-0xFF | ✅ Match |
| Header size | 12 bytes | 12 bytes | 12 bytes | ✅ Match |

---

## Template Selector

**Weighted Selection**: Total 100%

| Template | TypeScript | Android | iOS | Status |
|----------|-----------|---------|-----|--------|
| QUIC (ID: 1) | 40% | 40% | 40% | ✅ Match |
| KCP (ID: 2) | 35% | 35% | 35% | ✅ Match |
| Generic Gaming (ID: 3) | 25% | 25% | 25% | ✅ Match |

---

## State Management

### QUIC Template
- **Sequence**: Increments by 1 each packet
- **Range**: 0-65535 (wraps around)
- **Parameters**: `{ initialSeq: number }`

✅ All platforms match

### KCP Template
- **Sequence**: Increments by 1 each packet
- **Timestamp**: Current time in milliseconds
- **Parameters**: `{ initialSeq: number, initialTs: number }`

✅ All platforms match (after endianness fix)

### Generic Gaming Template
- **Sequence**: Increments by 1 each packet
- **Range**: 0-65535 (wraps around)
- **Parameters**: `{ initialSeq: number }`

✅ All platforms match

---

## Handshake Compatibility

All templates send their parameters in the handshake:

```json
{
  "templateId": 1,
  "templateParams": {
    "initialSeq": 12345
  }
}
```

✅ Format matches across all platforms

---

## Dual Indexing

All templates support dual indexing for O(1) client lookup:

| Template | Header ID | Size | Location |
|----------|-----------|------|----------|
| QUIC | Connection ID | 8 bytes | Bytes 1-8 |
| KCP | Conv | 4 bytes | Bytes 0-3 |
| Generic Gaming | Session ID | 4 bytes | Bytes 4-7 |

✅ All platforms implement `extractHeaderID()` correctly

---

## Verification Tests

### Packet Structure
- ✅ All templates produce correct header sizes
- ✅ All templates correctly encapsulate/decapsulate data
- ✅ All templates extract header IDs correctly

### Endianness
- ✅ QUIC: Big-endian for packet number (2 bytes)
- ✅ KCP: Little-endian for all multi-byte fields (FIXED in iOS)
- ✅ Generic Gaming: Big-endian for sequence (2 bytes)

### State Updates
- ✅ All templates increment sequences correctly
- ✅ KCP updates timestamp on each packet
- ✅ Sequence numbers wrap around correctly

---

## Conclusion

After fixing the iOS KCP endianness bug, all protocol templates now match exactly across TypeScript, Android, and iOS.

**Status**: ✅ 100% Compatible

All clients can now successfully handshake with the TypeScript server using any of the three protocol templates.
