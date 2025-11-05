"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function shiftBits(input, keyArray, initor) {
    const length = input.length;
    const obfuscated = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
        obfuscated[i] = (input[i] << 2) | (input[i] >> 6);
    }
    return obfuscated;
}
function de_shiftBits(obfuscated) {
    const length = obfuscated.length;
    const deobfuscated = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
        const shiftedValue = (obfuscated[i] >> 2) | (obfuscated[i] << 6);
        deobfuscated[i] = shiftedValue;
    }
    return deobfuscated;
}
let funPair = {
    obfuscation: shiftBits,
    deobfuscation: de_shiftBits
};
exports.default = funPair;
