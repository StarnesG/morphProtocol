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
const ObfuscationFunctionHouse_1 = require("../ObfuscationFunctionHouse");
const crypto = __importStar(require("crypto"));
function generateSubstitutionTable() {
    const tableLength = 256;
    let substitutionTable = new Uint8Array(256);
    // Initialize the table with sequential values from 0 to 255
    for (let i = 0; i < tableLength; i++) {
        substitutionTable[i] = i;
    }
    // Shuffle the table using Fisher-Yates algorithm
    for (let i = tableLength - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = substitutionTable[i];
        substitutionTable[i] = substitutionTable[j];
        substitutionTable[j] = temp;
    }
    return substitutionTable;
}
const obfuscationHouse = new ObfuscationFunctionHouse_1.ObfuscationFunctionHouse(4, {
    substitutionTable: generateSubstitutionTable(),
    randomValue: Math.floor(Math.random() * 256)
});
// Test all function pairs
for (let i = 0; i < obfuscationHouse.functionPairs.length; i++) {
    let pair = obfuscationHouse.functionPairs[i];
    let index = i;
    console.log(`Test Function Pair ${index + 1}:`);
    // Generate random input data
    const inputData = new Uint8Array(crypto.randomBytes(30).buffer);
    // Generate random key array
    const keyArray = new Uint8Array(crypto.randomBytes(30).buffer);
    // Print original data
    console.log("Original Data:");
    console.log(inputData);
    // Obfuscate the data
    const obfuscatedData = pair.obfuscation(inputData, keyArray, pair.initor);
    // Print obfuscated data
    console.log("Obfuscated Data:");
    console.log(obfuscatedData);
    // Deobfuscate the data
    const deobfuscatedData = pair.deobfuscation(obfuscatedData, keyArray, pair.initor);
    // Print deobfuscated data
    console.log("Deobfuscated Data:");
    console.log(deobfuscatedData);
    // Check if original data matches deobfuscated data
    const isMatch = compareArrays(inputData, deobfuscatedData);
    console.log(`${pair.obfuscation.name}：Original Data matches Deobfuscated Data: ${isMatch}`);
    console.log("----------------------");
}
;
function compareArrays(array1, array2) {
    if (array1.length !== array2.length) {
        return false;
    }
    for (let i = 0; i < array1.length; i++) {
        if (array1[i] !== array2[i]) {
            return false;
        }
    }
    return true;
}
