# Migration Guide: Old Structure → New Structure

## Overview

The morphProtocol project has been restructured for better organization, maintainability, and scalability.

## Key Changes

### Directory Structure

**Before:**
```
morphProtocol/
└── obfuscator/
    ├── Obfuscator.ts
    ├── ObfuscationFunctionHouse.ts
    ├── fnInitor.ts
    ├── index.ts (UDP client)
    ├── obfuscationFuns/
    ├── tunnel/
    │   ├── encryptor.ts
    │   ├── updateDB.ts
    │   └── udp/
    └── test/
```

**After:**
```
morphProtocol/
├── src/
│   ├── core/              # Obfuscation engine
│   ├── crypto/            # Encryption
│   ├── transport/udp/     # UDP protocol
│   ├── api/               # Backend integration
│   ├── config/            # Configuration
│   ├── utils/             # Utilities
│   ├── types/             # TypeScript types
│   ├── client.ts          # Client entry point
│   └── server.ts          # Server entry point
├── tests/
├── scripts/
├── docs/
├── README.md
├── package.json
└── tsconfig.json
```

### File Renames

| Old Path | New Path | Reason |
|----------|----------|--------|
| `obfuscator/Obfuscator.ts` | `src/core/obfuscator.ts` | Lowercase, better location |
| `obfuscator/ObfuscationFunctionHouse.ts` | `src/core/function-registry.ts` | Clearer name |
| `obfuscator/fnInitor.ts` | `src/core/function-initializer.ts` | Descriptive name |
| `obfuscator/obfuscationFuns/*.ts` | `src/core/functions/*.ts` | Organized location |
| `obfuscator/tunnel/encryptor.ts` | `src/crypto/encryptor.ts` | Separate concern |
| `obfuscator/tunnel/updateDB.ts` | `src/api/client.ts` | Clearer purpose |
| `obfuscator/tunnel/udp/client.ts` | `src/transport/udp/client.ts` | Better organization |
| `obfuscator/tunnel/udp/handshakeServer.ts` | `src/transport/udp/server.ts` | Clearer name |
| `obfuscator/index.ts` | `src/client.ts` | Explicit entry point |

### Class Renames

| Old Name | New Name | Reason |
|----------|----------|--------|
| `ObfuscationFunctionHouse` | `FunctionRegistry` | More concise |

### New Features

1. **Centralized Configuration** (`src/config/`)
   - Environment variable management
   - Type-safe configuration
   - Separate client/server configs

2. **Structured Logging** (`src/utils/logger.ts`)
   - Log levels (DEBUG, INFO, WARN, ERROR)
   - Consistent formatting
   - Configurable via environment

3. **Constants Management** (`src/utils/constants.ts`)
   - Centralized magic numbers
   - Easy to modify
   - Self-documenting

4. **Type Definitions** (`src/types/`)
   - Shared TypeScript types
   - Better IDE support
   - Type safety

5. **Documentation**
   - README.md with usage instructions
   - Architecture documentation
   - Migration guide (this file)

6. **Build System**
   - Proper TypeScript configuration
   - Build scripts
   - Development scripts

### Import Changes

**Before:**
```typescript
import { Obfuscator } from './Obfuscator';
import { ObfuscationFunctionHouse } from './ObfuscationFunctionHouse';
import { fnInitor } from './fnInitor';
```

**After:**
```typescript
import { Obfuscator } from './core/obfuscator';
import { FunctionRegistry } from './core/function-registry';
import { fnInitor } from './core/function-initializer';
import { getServerConfig } from './config';
import { logger } from './utils/logger';
```

### Configuration Changes

**Before:**
```typescript
const PORT = Number(process.env.HANDSHAKE_PORT_UDP || 12301);
const PASSWORD = process.env.PASSWORD || 'bumoyu123';
```

**After:**
```typescript
import { getServerConfig } from './config';
const config = getServerConfig();
const PORT = config.handshakePortUdp;
const PASSWORD = config.password;
```

### Logging Changes

**Before:**
```typescript
console.log('Server started');
console.error('Error occurred:', error);
```

**After:**
```typescript
import { logger } from './utils/logger';
logger.info('Server started');
logger.error('Error occurred:', error);
```

## Migration Steps

### For Existing Deployments

1. **Backup Current Installation**
   ```bash
   cp -r morphProtocol morphProtocol.backup
   ```

2. **Pull New Structure**
   ```bash
   cd morphProtocol
   git pull origin main
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Create Environment File**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Build Project**
   ```bash
   npm run build
   ```

6. **Update Startup Scripts**
   
   **Old:**
   ```bash
   node obfuscator/tunnel/udp/handshakeServer.js
   node obfuscator/index.js 192.168.1.100:12301:user123
   ```
   
   **New:**
   ```bash
   npm run server          # or: node dist/server.js
   npm run client 192.168.1.100:12301:user123
   ```

7. **Test Functionality**
   ```bash
   # Start server
   npm run server
   
   # In another terminal, start client
   npm run client <server_ip>:<port>:<user_id>
   ```

### For New Deployments

1. **Clone Repository**
   ```bash
   git clone https://github.com/LennoxSears/morphProtocol.git
   cd morphProtocol
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   nano .env  # Edit configuration
   ```

4. **Build**
   ```bash
   npm run build
   ```

5. **Run**
   ```bash
   # Server
   npm run server

   # Client
   npm run client <server_ip>:<port>:<user_id>
   ```

## Breaking Changes

1. **Entry Points Changed**
   - Old: `node obfuscator/index.js`
   - New: `npm run client` or `node dist/client.js`

2. **Environment Variables**
   - Now loaded via dotenv from `.env` file
   - Must create `.env` file (use `.env.example` as template)

3. **Import Paths**
   - All imports updated to new structure
   - Custom code must update imports

4. **Class Names**
   - `ObfuscationFunctionHouse` → `FunctionRegistry`

5. **Logging**
   - `console.*` → `logger.*`
   - Log level configurable via `LOG_LEVEL` env var

## Compatibility

- **Node.js**: Requires >= 18.0.0
- **TypeScript**: 5.7.2
- **Existing Clients**: Must update to new version
- **Protocol**: No changes to wire protocol (fully compatible)

## Rollback Procedure

If issues occur:

1. **Stop Services**
   ```bash
   pkill -f "node dist/server.js"
   pkill -f "node dist/client.js"
   ```

2. **Restore Backup**
   ```bash
   cd ..
   mv morphProtocol morphProtocol.new
   mv morphProtocol.backup morphProtocol
   cd morphProtocol
   ```

3. **Restart Old Version**
   ```bash
   node obfuscator/tunnel/udp/handshakeServer.js
   ```

## Benefits of New Structure

1. **Better Organization**: Clear separation of concerns
2. **Easier Maintenance**: Find code faster
3. **Scalability**: Easy to add new features
4. **Type Safety**: Better TypeScript support
5. **Configuration**: Centralized and validated
6. **Logging**: Structured and configurable
7. **Documentation**: Comprehensive guides
8. **Testing**: Organized test structure
9. **Build System**: Proper compilation pipeline
10. **Developer Experience**: Better IDE support

## Support

For issues during migration:
- Check logs: `LOG_LEVEL=0 npm run server` (debug mode)
- Review configuration: Ensure `.env` is properly set
- Verify build: `npm run clean && npm run build`
- Open GitHub issue with error details

## Next Steps

After successful migration:
1. Update deployment scripts
2. Update monitoring/alerting
3. Update documentation
4. Train team on new structure
5. Archive old backup after stability confirmed
