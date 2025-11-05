import { ObfuscationFunctionHouse, HouseFunctionPair } from './ObfuscationFunctionHouse';
import * as crypto from 'crypto';

const DEBUG = false;

export class Obfuscator {
  private key: number;
  private paddingLength: number;
  private obfuscationHouse: ObfuscationFunctionHouse;
  private obFunCombosLength: number;

  constructor(
    key: number,
    obfuscationLayer: number,
    paddingLength: number,
    funInitor: any
  ) {
    this.key = key;
    this.paddingLength = paddingLength;
    this.obfuscationHouse = new ObfuscationFunctionHouse(obfuscationLayer, funInitor);
    this.obFunCombosLength = this.obfuscationHouse.getfunctionPairsIndexCombos().length;
  }

  public setKey(newKey: number): void {
    this.key = newKey;
  }

  private generateKeyArray(length: number): Uint8Array {
    const keyArray = new Uint8Array(length);

    for (let i = 0; i < length; i++) {
      keyArray[i] = (this.key + i * 37) % 256;
    }

    return keyArray;
  }

  private randomPadding(length: number): Uint8Array {
    return new Uint8Array(crypto.randomBytes(length).buffer);
  }

  private concatenateUint8Arrays(arrays: Uint8Array[]): Uint8Array {
    const totalLength = arrays.reduce((acc, array) => acc + array.length, 0);
    const result = new Uint8Array(totalLength);

    let offset = 0;
    for (const array of arrays) {
      result.set(array, offset);
      offset += array.length;
    }

    return result;
  }

  private extractHeaderAndBody(input: Uint8Array): { header: Uint8Array; body: Uint8Array } {
    const header = new Uint8Array(3);
    const body = new Uint8Array(input.length - 3 - input[2]);

    for (let i = 0; i < 3; i++) {
      header[i] = input[i];
    }

    for (let i = 0; i < body.length; i++) {
      body[i] = input[i + 3];
    }

    return { header, body };
  }

  private preObfuscation(
    buffer: ArrayBuffer,
    functions: HouseFunctionPair[]
  ): Uint8Array {
    let obfuscatedData = new Uint8Array(buffer);
    let keyArray = this.generateKeyArray(obfuscatedData.length);
    if (DEBUG) {
      console.log('\n\n\n');
    }
    for (const func of functions) {
      if (DEBUG) {
        console.log('Original Data:', obfuscatedData);
      }
      obfuscatedData = func.obfuscation(obfuscatedData, keyArray, func.initor);
      if (DEBUG) {
        console.log('Obfuscated Data:', obfuscatedData);
        console.log('Function is:', func.obfuscation.name);
        console.log('----------------------------------');
      }
    }

    return obfuscatedData;
  }

  private preDeobfuscation(
    obfuscated: ArrayBuffer,
    functions: HouseFunctionPair[]
  ): Uint8Array {
    let deobfuscatedData = new Uint8Array(obfuscated);
    let keyArray = this.generateKeyArray(deobfuscatedData.length);
    if (DEBUG) {
      console.log('\n\n\n');
    }
    for (let i = functions.length - 1; i >= 0; i--) {
      if (DEBUG) {
        console.log('Original Data:', deobfuscatedData);
      }
      deobfuscatedData = functions[i].deobfuscation(deobfuscatedData, keyArray, functions[i].initor);
      if (DEBUG) {
        console.log('Obfuscated Data:', deobfuscatedData);
        console.log('Function is:', functions[i].deobfuscation.name);
        console.log('----------------------------------');
      }
    }

    return deobfuscatedData;
  }

  public obfuscation(data: ArrayBuffer): Uint8Array {
    let that = this;
    let header = new Uint8Array(crypto.randomBytes(3).buffer);
    let fnComboIndex = (header[0] * header[1]) % this.obFunCombosLength;
    let fnCombo = this.obfuscationHouse.getfunctionPairsIndexCombos();
    let obfuscatedData = this.preObfuscation(
      data,
      fnCombo[fnComboIndex].map((it, idx) => {
        return that.obfuscationHouse.functionPairs[it];
      })
    );
    // Generate random padding length
    const paddingLength = Math.floor(Math.random() * this.paddingLength) + 1;

    // Store padding length in header
    header[2] = paddingLength;

    // Generate random padding
    const padding = this.randomPadding(paddingLength);

    // Concatenate with new padding  
    let result = this.concatenateUint8Arrays([
      header,
      obfuscatedData,
      padding
    ]);
    return result;
  }

  public deobfuscation(data: ArrayBuffer): Uint8Array {
    let that = this;
    const input = new Uint8Array(data);
    const { header, body } = this.extractHeaderAndBody(input);
    let fnComboIndex = (header[0] * header[1]) % this.obFunCombosLength;
    let fnCombo = this.obfuscationHouse.getfunctionPairsIndexCombos();
    let deObfuscatedData = this.preDeobfuscation(
      body.buffer,
      fnCombo[fnComboIndex].map((it, idx) => {
        return that.obfuscationHouse.functionPairs[it];
      })
    );
    return deObfuscatedData;
  }
}
