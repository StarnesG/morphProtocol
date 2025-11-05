"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Obfuscator = void 0;
const ObfuscationFunctionHouse_1 = require("./ObfuscationFunctionHouse");
const crypto = __importStar(require("crypto"));
const DEBUG = false;
class Obfuscator {
    constructor(key, obfuscationLayer, paddingLength, funInitor) {
        this.key = key;
        this.paddingLength = paddingLength;
        this.obfuscationHouse = new ObfuscationFunctionHouse_1.ObfuscationFunctionHouse(obfuscationLayer, funInitor);
        this.obFunCombosLength = this.obfuscationHouse.getfunctionPairsIndexCombos().length;
    }
    setKey(newKey) {
        this.key = newKey;
    }
    generateKeyArray(length) {
        const keyArray = new Uint8Array(length);
        for (let i = 0; i < length; i++) {
            keyArray[i] = (this.key + i * 37) % 256;
        }
        return keyArray;
    }
    randomPadding(length) {
        return new Uint8Array(crypto.randomBytes(length).buffer);
    }
    concatenateUint8Arrays(arrays) {
        const totalLength = arrays.reduce((acc, array) => acc + array.length, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;
        for (const array of arrays) {
            result.set(array, offset);
            offset += array.length;
        }
        return result;
    }
    extractHeaderAndBody(input) {
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
    preObfuscation(buffer, functions) {
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
    preDeobfuscation(obfuscated, functions) {
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
    obfuscation(data) {
        let that = this;
        let header = new Uint8Array(crypto.randomBytes(3).buffer);
        let fnComboIndex = (header[0] * header[1]) % this.obFunCombosLength;
        let fnCombo = this.obfuscationHouse.getfunctionPairsIndexCombos();
        let obfuscatedData = this.preObfuscation(data, fnCombo[fnComboIndex].map((it, idx) => {
            return that.obfuscationHouse.functionPairs[it];
        }));
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
    deobfuscation(data) {
        let that = this;
        const input = new Uint8Array(data);
        const { header, body } = this.extractHeaderAndBody(input);
        let fnComboIndex = (header[0] * header[1]) % this.obFunCombosLength;
        let fnCombo = this.obfuscationHouse.getfunctionPairsIndexCombos();
        let deObfuscatedData = this.preDeobfuscation(body.buffer, fnCombo[fnComboIndex].map((it, idx) => {
            return that.obfuscationHouse.functionPairs[it];
        }));
        return deObfuscatedData;
    }
}
exports.Obfuscator = Obfuscator;
