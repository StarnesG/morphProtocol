# MorphProtocol Test Suite

Comprehensive unit tests for the morphProtocol VPN obfuscation system.

## Test Structure

```
tests/
├── setup.ts                    # Global test configuration
├── helpers/
│   ├── test-utils.ts          # Test utilities and helpers
│   └── mocks.ts               # Mock implementations
└── unit/
    ├── core/
    │   ├── functions/         # Obfuscation function tests
    │   │   ├── addRandomValue.test.ts
    │   │   ├── xorWithKey.test.ts
    │   │   ├── bitwiseNOT.test.ts
    │   │   └── reverseBuffer.test.ts
    │   ├── obfuscator.test.ts # Obfuscator class tests
    │   ├── rate-limiter.test.ts
    │   └── protocol-templates/
    │       └── quic-template.test.ts
    └── crypto/
        └── encryptor.test.ts  # Encryption tests
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests with verbose output
npm run test:verbose

# Run specific test file
npm test -- tests/unit/core/obfuscator.test.ts
```

## Test Coverage

### Core Components

#### Obfuscation Functions (11 functions)
- ✅ `addRandomValue` - Addition with modulo
- ✅ `xorWithKey` - XOR with key array
- ✅ `bitwiseNOT` - Bitwise NOT operation
- ✅ `reverseBuffer` - Buffer reversal
- ⏳ `bitwiseRotationAndXOR` - Rotation + XOR
- ⏳ `circularShiftObfuscation` - Circular bit shift
- ⏳ `divideAndSwap` - Divide and swap bytes
- ⏳ `reverseBits` - Reverse bits in each byte
- ⏳ `shiftBits` - Bit shifting
- ⏳ `substitution` - Substitution cipher
- ⏳ `swapNeighboringBytes` - Swap adjacent bytes

#### Obfuscator Class
- ✅ Constructor and initialization
- ✅ Obfuscation/deobfuscation cycle
- ✅ Multiple obfuscation layers (1-4)
- ✅ Header and padding structure
- ✅ Different keys produce different results
- ✅ Randomness in headers
- ✅ Empty, small, medium, large data handling

#### Protocol Templates
- ✅ QUIC Template
  - Encapsulation/decapsulation
  - Header ID extraction
  - Packet number management
  - Header structure validation
- ⏳ KCP Template
- ⏳ Generic Gaming Template
- ⏳ Template Factory
- ⏳ Template Selector

#### Encryption
- ✅ Encryptor class
  - AES-256-CBC encryption/decryption
  - Key and IV generation
  - Custom key/IV setting
  - Unicode and special character handling
  - Error handling for invalid data

#### Rate Limiting
- ✅ Rate limiter
  - Request limiting
  - Time window management
  - Multiple key tracking
  - Sliding window behavior
  - Memory cleanup

### Utilities
- ✅ Test utilities (test-utils.ts)
- ✅ Mock implementations (mocks.ts)

## Test Patterns

### Reversibility Tests
All obfuscation functions must be reversible:
```typescript
const obfuscated = func.obfuscation(input, keyArray, initor);
const deobfuscated = func.deobfuscation(obfuscated, keyArray, initor);
expect(deobfuscated).toEqual(input);
```

### Edge Cases
Tests cover:
- Empty data
- Single byte
- Small data (16 bytes)
- Medium data (256 bytes)
- Large data (1500 bytes - MTU size)
- Jumbo data (9000 bytes)

### Special Patterns
- All zeros
- All ones (0xFF)
- Sequential (0, 1, 2, ...)
- Alternating (0xAA, 0x55, ...)

## Writing New Tests

### Test File Template
```typescript
import { ComponentName } from '../../../src/path/to/component';
import { testUtils } from '../../helpers/test-utils';

describe('ComponentName', () => {
  describe('feature', () => {
    it('should do something', () => {
      // Arrange
      const input = ...;
      
      // Act
      const result = ...;
      
      // Assert
      expect(result).toBe(...);
    });
  });
});
```

### Best Practices
1. **Descriptive test names** - Use "should" statements
2. **Arrange-Act-Assert** - Clear test structure
3. **One assertion per test** - Keep tests focused
4. **Test edge cases** - Empty, null, boundary values
5. **Test error conditions** - Invalid inputs, exceptions
6. **Use test utilities** - Reuse common test data and helpers

## Coverage Goals

- **Unit Tests**: 80%+ coverage for core logic
- **Integration Tests**: Critical paths (handshake, data flow)
- **Edge Cases**: All boundary conditions
- **Error Handling**: All error paths

## Continuous Integration

Tests run automatically on:
- Every commit
- Pull requests
- Before deployment

## Troubleshooting

### Tests Timeout
Increase timeout in jest.config.js or individual tests:
```typescript
jest.setTimeout(30000); // 30 seconds
```

### Type Errors
Ensure TypeScript types are correct:
```typescript
// Use toArrayBuffer helper for Buffer → ArrayBuffer conversion
const ab = toArrayBuffer(buffer);
```

### Mock Issues
Reset mocks between tests:
```typescript
beforeEach(() => {
  jest.clearAllMocks();
});
```

## Future Test Coverage

### High Priority
- [ ] Complete all obfuscation function tests
- [ ] KCP and Gaming protocol template tests
- [ ] Function registry and initializer tests
- [ ] Packet security tests (HMAC, replay protection)

### Medium Priority
- [ ] Configuration loading tests
- [ ] Logger tests
- [ ] API client tests (with mocked axios)

### Low Priority (Integration Tests)
- [ ] UDP server/client integration
- [ ] End-to-end obfuscation flow
- [ ] IP migration scenarios
- [ ] Reconnection handling

## Contributing

When adding new features:
1. Write tests first (TDD)
2. Ensure all tests pass
3. Maintain or improve coverage
4. Update this README if needed
