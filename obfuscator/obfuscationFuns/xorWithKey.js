"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Reversible obfuscation function: Bitwise XOR with a rolling key
function xorWithKey(input, keyArray, initor) {
    const length = input.length;
    const obfuscated = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
        obfuscated[i] = input[i] ^ keyArray[i];
    }
    return obfuscated;
}
let funPair = {
    obfuscation: xorWithKey,
    deobfuscation: xorWithKey
};
exports.default = funPair;
