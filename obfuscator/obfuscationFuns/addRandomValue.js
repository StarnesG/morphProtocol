"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function addRandomValue(input, keyArray, initor) {
    const obfuscated = new Uint8Array(input.length);
    for (let i = 0; i < input.length; i++) {
        obfuscated[i] = (input[i] + initor) % 256; // Addition with modulus
    }
    return obfuscated;
}
function de_addRandomValue(input, keyArray, initor) {
    const deobfuscated = new Uint8Array(input.length);
    for (let i = 0; i < input.length; i++) {
        deobfuscated[i] = (input[i] - initor + 256) % 256; // Subtraction with modulus
    }
    return deobfuscated;
}
function generateRandomValue() {
    return Math.floor(Math.random() * 256);
}
let funPair = {
    obfuscation: addRandomValue,
    deobfuscation: de_addRandomValue,
    initorFn: generateRandomValue
};
exports.default = funPair;
