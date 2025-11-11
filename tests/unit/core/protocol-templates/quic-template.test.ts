import { QuicTemplate } from '../../../../src/core/protocol-templates/quic-template';
import { deterministicBuffer, buffersEqual } from '../../../helpers/test-utils';

describe('QuicTemplate', () => {
  let template: QuicTemplate;
  let clientID: Buffer;

  beforeEach(() => {
    template = new QuicTemplate();
    clientID = Buffer.alloc(16);
    for (let i = 0; i < 16; i++) {
      clientID[i] = i;
    }
  });

  describe('basic properties', () => {
    it('should have correct template ID', () => {
      expect(template.id).toBe(1);
    });

    it('should have correct template name', () => {
      expect(template.name).toBe('QUIC');
    });
  });

  describe('encapsulate and decapsulate', () => {
    it('should encapsulate data with QUIC header', () => {
      const data = deterministicBuffer(100);
      const packet = template.encapsulate(data, clientID);

      // QUIC header: 1 byte flags + 4 bytes version + 8 bytes connection ID + 1 byte packet number
      expect(packet.length).toBe(14 + data.length);
    });

    it('should correctly decapsulate packet', () => {
      const original = deterministicBuffer(100);
      const packet = template.encapsulate(original, clientID);
      const decapsulated = template.decapsulate(packet);

      expect(decapsulated).not.toBeNull();
      expect(buffersEqual(decapsulated!, original)).toBe(true);
    });

    it('should handle empty data', () => {
      const data = Buffer.alloc(0);
      const packet = template.encapsulate(data, clientID);
      const decapsulated = template.decapsulate(packet);

      expect(decapsulated).not.toBeNull();
      expect(decapsulated!.length).toBe(0);
    });

    it('should handle small data', () => {
      const data = deterministicBuffer(10);
      const packet = template.encapsulate(data, clientID);
      const decapsulated = template.decapsulate(packet);

      expect(decapsulated).not.toBeNull();
      expect(buffersEqual(decapsulated!, data)).toBe(true);
    });

    it('should handle large data (MTU size)', () => {
      const data = deterministicBuffer(1500);
      const packet = template.encapsulate(data, clientID);
      const decapsulated = template.decapsulate(packet);

      expect(decapsulated).not.toBeNull();
      expect(buffersEqual(decapsulated!, data)).toBe(true);
    });
  });

  describe('extractHeaderID', () => {
    it('should extract 8-byte connection ID from packet', () => {
      const data = deterministicBuffer(100);
      const packet = template.encapsulate(data, clientID);
      const headerID = template.extractHeaderID(packet);

      expect(headerID).not.toBeNull();
      expect(headerID!.length).toBe(8);
      // Should match first 8 bytes of clientID
      expect(buffersEqual(headerID!, clientID.slice(0, 8))).toBe(true);
    });

    it('should return null for invalid packet (too short)', () => {
      const invalidPacket = Buffer.alloc(10);
      const headerID = template.extractHeaderID(invalidPacket);

      expect(headerID).toBeNull();
    });

    it('should return null for packet with wrong flags', () => {
      const data = deterministicBuffer(100);
      const packet = template.encapsulate(data, clientID);
      
      // Corrupt the flags byte
      packet[0] = 0x00;
      
      const headerID = template.extractHeaderID(packet);
      expect(headerID).toBeNull();
    });
  });

  describe('updateState', () => {
    it('should increment packet number', () => {
      const data = deterministicBuffer(100);
      
      const packet1 = template.encapsulate(data, clientID);
      const packetNum1 = packet1[13]; // Packet number is at byte 13
      
      template.updateState();
      
      const packet2 = template.encapsulate(data, clientID);
      const packetNum2 = packet2[13];
      
      expect(packetNum2).toBe((packetNum1 + 1) % 256);
    });

    it('should wrap packet number at 256', () => {
      const data = deterministicBuffer(100);
      
      // Increment 256 times
      for (let i = 0; i < 256; i++) {
        template.updateState();
      }
      
      const packet = template.encapsulate(data, clientID);
      const packetNum = packet[13];
      
      // Should wrap back to 0
      expect(packetNum).toBe(0);
    });
  });

  describe('getParams', () => {
    it('should return empty params object', () => {
      const params = template.getParams();
      expect(params).toEqual({});
    });
  });

  describe('QUIC header structure', () => {
    it('should have correct flags byte (0xC0)', () => {
      const data = deterministicBuffer(100);
      const packet = template.encapsulate(data, clientID);

      expect(packet[0]).toBe(0xC0);
    });

    it('should have correct version (0x00000001)', () => {
      const data = deterministicBuffer(100);
      const packet = template.encapsulate(data, clientID);

      const version = packet.readUInt32BE(1);
      expect(version).toBe(0x00000001);
    });

    it('should embed connection ID from clientID', () => {
      const data = deterministicBuffer(100);
      const packet = template.encapsulate(data, clientID);

      const connectionID = packet.slice(5, 13);
      expect(buffersEqual(connectionID, clientID.slice(0, 8))).toBe(true);
    });
  });

  describe('multiple encapsulate/decapsulate cycles', () => {
    it('should handle multiple cycles correctly', () => {
      const original = deterministicBuffer(100);

      for (let i = 0; i < 10; i++) {
        const packet = template.encapsulate(original, clientID);
        const decapsulated = template.decapsulate(packet);

        expect(decapsulated).not.toBeNull();
        expect(buffersEqual(decapsulated!, original)).toBe(true);
        
        template.updateState();
      }
    });
  });
});
