export type HouseFunction = (
  input: Uint8Array,
  keyArray: Uint8Array,
  initor: any
) => Uint8Array;

export interface HouseFunctionPair {
  obfuscation: HouseFunction;
  deobfuscation: HouseFunction;
  initor: any;
  index: number;
}

export interface HandshakeData {
  key: number;
  obfuscationLayer: number;
  randomPadding: number;
  fnInitor: FunctionInitializers;
  userId: string;
}

export interface FunctionInitializers {
  substitutionTable: number[];
  randomValue: number;
}

export interface UserInfo {
  userId: string | undefined;
  traffic: number;
}

export interface EncryptedData {
  d: string; // encrypted data
  k: string; // encrypted key
  i: string; // initialization vector
}
