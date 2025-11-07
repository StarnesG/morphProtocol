/**
 * Base interface for protocol templates
 * Templates wrap obfuscated data to mimic legitimate protocols
 * 
 * DUAL INDEXING APPROACH:
 * - Templates use protocol-native header fields as identifiers (4-8 bytes)
 * - Server maintains two indexes:
 *   1. ipIndex: Map<"ip:port:headerID", fullClientID> for O(1) lookup
 *   2. sessions: Map<fullClientID, Session> for IP migration support
 * - Zero packet overhead (use existing header fields)
 */

export interface TemplateParams {
  [key: string]: any;
}

export interface ProtocolTemplate {
  readonly id: number;
  readonly name: string;
  
  /**
   * Extract header ID from packet for dual indexing
   * This is the protocol-native identifier (QUIC connID, KCP conv, etc.)
   * @param packet - Complete packet with protocol header
   * @returns Header ID buffer (4-8 bytes depending on protocol)
   */
  extractHeaderID(packet: Buffer): Buffer | null;
  
  /**
   * Encapsulate obfuscated data with protocol header
   * @param data - Obfuscated payload
   * @param clientID - 16-byte client identifier (used to derive header fields)
   * @returns Complete packet: [protocol header][data]
   */
  encapsulate(data: Buffer, clientID: Buffer): Buffer;
  
  /**
   * Decapsulate protocol packet to extract obfuscated data
   * @param packet - Complete packet with protocol header
   * @returns Obfuscated payload (without protocol headers)
   */
  decapsulate(packet: Buffer): Buffer | null;
  
  /**
   * Get current template parameters (for handshake)
   */
  getParams(): TemplateParams;
  
  /**
   * Update internal state (sequence numbers, timestamps, etc.)
   */
  updateState(): void;
}

export abstract class BaseTemplate implements ProtocolTemplate {
  abstract readonly id: number;
  abstract readonly name: string;
  
  protected sequenceNumber: number;
  
  constructor(params?: TemplateParams) {
    // Initialize with random sequence number
    this.sequenceNumber = params?.initialSeq ?? Math.floor(Math.random() * 65536);
  }
  
  abstract extractHeaderID(packet: Buffer): Buffer | null;
  abstract encapsulate(data: Buffer, clientID: Buffer): Buffer;
  abstract decapsulate(packet: Buffer): Buffer | null;
  
  getParams(): TemplateParams {
    return {
      initialSeq: this.sequenceNumber
    };
  }
  
  updateState(): void {
    // Increment sequence number (wrap at 65536 for 2-byte sequences)
    this.sequenceNumber = (this.sequenceNumber + 1) % 65536;
  }
}

/**
 * Static helper to extract headerID from packet without creating template instance
 * Tries all template types and returns first match
 * @returns { headerID: Buffer, templateId: number } or null
 */
export function extractHeaderIDFromPacket(packet: Buffer): { headerID: Buffer; templateId: number } | null {
  if (packet.length < 4) {
    return null;
  }
  
  // Try Generic Gaming (ID: 3) first - has magic "GAME" signature
  if (packet.length >= 8 && packet.toString('ascii', 0, 4) === 'GAME') {
    const gamingHeaderID = packet.slice(4, 8);
    return { headerID: gamingHeaderID, templateId: 3 };
  }
  
  // Try QUIC (ID: 1) - flags byte 0x40-0x4f, Connection ID at bytes 1-8
  if (packet.length >= 9) {
    const flags = packet[0];
    if ((flags & 0xf0) === 0x40) { // QUIC short header
      const quicHeaderID = packet.slice(1, 9);
      return { headerID: quicHeaderID, templateId: 1 };
    }
  }
  
  // Try KCP (ID: 2) - Conv at bytes 0-3, Cmd byte at 4 should be 0x51
  if (packet.length >= 5) {
    const cmd = packet[4];
    if (cmd === 0x51) { // KCP data packet
      const kcpHeaderID = packet.slice(0, 4);
      return { headerID: kcpHeaderID, templateId: 2 };
    }
  }
  
  // Fallback: If no signature matches, try KCP (most lenient)
  if (packet.length >= 4) {
    const kcpHeaderID = packet.slice(0, 4);
    return { headerID: kcpHeaderID, templateId: 2 };
  }
  
  return null;
}
