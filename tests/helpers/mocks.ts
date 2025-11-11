/**
 * Mock implementations for testing
 */

import * as dgram from 'dgram';
import { EventEmitter } from 'events';

/**
 * Mock UDP socket for testing
 */
export class MockUDPSocket extends EventEmitter {
  private _address: { address: string; port: number; family: string } | null = null;
  public sentMessages: Array<{ buffer: Buffer; port: number; address: string }> = [];
  public isClosed = false;

  bind(port?: number, address?: string, callback?: () => void): void {
    this._address = {
      address: address || '127.0.0.1',
      port: port || Math.floor(Math.random() * 10000) + 10000,
      family: 'IPv4',
    };
    if (callback) {
      setImmediate(callback);
    }
    this.emit('listening');
  }

  send(
    buffer: Buffer,
    offset: number,
    length: number,
    port: number,
    address: string,
    callback?: (error: Error | null) => void
  ): void {
    if (this.isClosed) {
      const error = new Error('Socket is closed');
      if (callback) callback(error);
      return;
    }

    this.sentMessages.push({
      buffer: buffer.slice(offset, offset + length),
      port,
      address,
    });

    if (callback) {
      setImmediate(() => callback(null));
    }
  }

  address(): { address: string; port: number; family: string } {
    if (!this._address) {
      throw new Error('Socket not bound');
    }
    return this._address;
  }

  close(callback?: () => void): void {
    this.isClosed = true;
    if (callback) {
      setImmediate(callback);
    }
    this.emit('close');
  }

  unref(): void {
    // Mock implementation
  }

  // Helper method to simulate receiving a message
  simulateMessage(message: Buffer, rinfo: { address: string; port: number }): void {
    this.emit('message', message, rinfo);
  }

  // Helper method to clear sent messages
  clearSentMessages(): void {
    this.sentMessages = [];
  }
}

/**
 * Mock axios for API testing
 */
export const mockAxios = {
  post: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};

/**
 * Create mock configuration
 */
export function createMockConfig() {
  return {
    hostName: 'test-server',
    hostIp: '127.0.0.1',
    handshakePortUdp: 12301,
    localWgAddress: '127.0.0.1',
    localWgPort: 51820,
    password: 'test-password',
    timeoutDuration: 60000,
    trafficInterval: 30000,
    heartbeatInterval: 10000,
    maxRetries: 3,
    obfuscation: {
      key: 123,
      layer: 3,
      paddingLength: 8,
    },
    api: {
      subTrafficUrl: 'http://test.com/traffic',
      addClientNumUrl: 'http://test.com/clients/add',
      subClientNumUrl: 'http://test.com/clients/sub',
      updateServerInfoUrl: 'http://test.com/servers/update',
      authToken: 'test-token',
    },
  };
}
