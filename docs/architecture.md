# morphProtocol Architecture

## Overview

morphProtocol is a multi-layer network traffic obfuscation system designed to make VPN traffic undetectable by deep packet inspection (DPI) systems.

## System Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  WireGuard  │ ◄─────► │    Client    │ ◄─────► │   Server    │
│  (51820)    │         │  Obfuscator  │         │ Obfuscator  │
└─────────────┘         └──────────────┘         └─────────────┘
                               │                         │
                               │   Encrypted Tunnel      │
                               │   (UDP/TCP/WebSocket)   │
                               └─────────────────────────┘
```

## Core Components

### 1. Obfuscation Engine (`src/core/`)

The heart of the system, responsible for transforming packets.

**Components:**
- `obfuscator.ts`: Main orchestrator
- `function-registry.ts`: Manages available transformation functions
- `function-initializer.ts`: Generates function-specific parameters
- `functions/`: 11 reversible transformation functions

**Obfuscation Process:**
1. Generate key array from shared secret
2. Select N functions based on header
3. Apply transformations sequentially
4. Add random padding (1-8 bytes)
5. Prepend 3-byte header

**Header Structure:**
```
Byte 0: Random value (used for function selection)
Byte 1: Random value (used for function selection)
Byte 2: Padding length
```

**Function Selection:**
```
combo_index = (header[0] * header[1]) % total_combinations
```

### 2. Encryption Layer (`src/crypto/`)

Provides cryptographic security on top of obfuscation.

**Features:**
- RSA-2048 key pair generation
- AES-256-CBC encryption
- Hybrid encryption (RSA for key exchange, AES for data)
- Pre-shared key mode for control messages

### 3. Transport Layer (`src/transport/udp/`)

Implements UDP transport protocol for low-latency packet forwarding.

**UDP Protocol:**
- Low latency, ideal for VPN traffic
- Connectionless, minimal overhead
- Best performance for real-time applications

**Client Responsibilities:**
- Handshake with server
- Forward WireGuard packets
- Heartbeat mechanism
- Auto-reconnection

**Server Responsibilities:**
- Accept handshakes
- Create per-client tunnel instances
- Forward to local WireGuard
- Track traffic and timeouts
- Report to backend API

### 4. API Integration (`src/api/`)

Backend communication for user management and analytics.

**Endpoints:**
- `subTraffic`: Report bandwidth usage
- `addClientNum`: Increment active connections
- `subClientNum`: Decrement active connections
- `updateServerInfo`: Register server status

### 5. Configuration (`src/config/`)

Centralized configuration management with environment variable support.

**Server Config:**
- Network settings (ports, addresses)
- Timeout values
- API endpoints
- Security parameters

**Client Config:**
- Remote server details
- Obfuscation parameters
- Retry logic
- Local WireGuard settings

## Data Flow

### Outbound (Client → Server)

```
1. WireGuard packet arrives at 127.0.0.1:51820
2. Client reads packet
3. Obfuscator.obfuscation(packet):
   a. Generate random header[0], header[1]
   b. Calculate function combo index
   c. Apply N transformation functions
   d. Add random padding
   e. Prepend header
4. Send through tunnel
5. Server receives obfuscated packet
6. Obfuscator.deobfuscation(packet):
   a. Extract header
   b. Calculate function combo index
   c. Apply reverse transformations
   d. Remove padding
7. Forward to local WireGuard at 127.0.0.1:51820
```

### Inbound (Server → Client)

Same process in reverse direction.

## Security Model

### Threat Model

**Protects Against:**
- Deep packet inspection (DPI)
- Traffic pattern analysis
- Protocol fingerprinting
- Packet size analysis
- Timing attacks (partially)

**Does NOT Protect Against:**
- Endpoint compromise
- Man-in-the-middle with key access
- Traffic correlation at scale
- Quantum computing attacks

### Security Layers

1. **Obfuscation**: Makes traffic appear random
2. **Encryption**: AES-256-CBC for confidentiality
3. **Authentication**: RSA key exchange
4. **Integrity**: Implicit via encryption

## Performance Considerations

### Latency

- Obfuscation adds ~1-2ms per packet
- Function selection is O(1)
- Transformation functions are O(n) where n = packet size

### Throughput

- Minimal impact on throughput
- CPU-bound (transformation operations)
- Scales linearly with packet size

### Memory

- Per-client overhead: ~10KB
- Function registry: ~5KB
- Obfuscator instance: ~2KB

## Scalability

### Horizontal Scaling

- Stateless server design (per-client state only)
- Can run multiple server instances
- Load balancer distributes clients

### Vertical Scaling

- Multi-core friendly (one client per core)
- Memory efficient
- CPU-bound workload

## Extension Points

### Adding New Obfuscation Functions

1. Create function in `src/core/functions/`
2. Export from `src/core/functions/index.ts`
3. Register in `function-registry.ts`
4. Maximum 17 functions total

### Custom Backend Integration

1. Modify `src/api/client.ts`
2. Add new endpoints as needed
3. Update types in `src/api/types.ts`

## Deployment Architecture

### Single Server

```
Internet → Server (UDP/TCP/WS) → WireGuard → Internal Network
```

### Multi-Server with Load Balancer

```
                    ┌─ Server 1 ─┐
Internet → LB ──────┼─ Server 2 ─┼─→ WireGuard
                    └─ Server 3 ─┘
```

### High Availability

```
                    ┌─ Server 1 (Primary) ─┐
Internet → DNS ─────┤                       ├─→ WireGuard
                    └─ Server 2 (Backup)  ─┘
```

## Monitoring and Observability

### Metrics to Track

- Active connections
- Bandwidth per user
- Packet loss rate
- Obfuscation overhead
- Server CPU/memory usage

### Logging

- Structured logging via `src/utils/logger.ts`
- Log levels: DEBUG, INFO, WARN, ERROR
- Configurable via `LOG_LEVEL` environment variable

## Future Enhancements

1. **Machine Learning Resistance**: Adaptive function selection
2. **Quantum Resistance**: Post-quantum cryptography
3. **Traffic Shaping**: Mimic legitimate protocols
4. **Multi-hop**: Chain multiple servers
5. **Steganography**: Hide in legitimate traffic
6. **Additional Transports**: TCP and WebSocket support for restrictive networks
