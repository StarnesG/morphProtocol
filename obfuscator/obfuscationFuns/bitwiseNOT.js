"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Reversible obfuscation function: Bitwise NOT
function bitwiseNOT(input, keyArray, initor) {
    const obfuscated = new Uint8Array(input.length);
    for (let i = 0; i < input.length; i++) {
        obfuscated[i] = ~input[i];
    }
    return obfuscated;
}
let funPair = {
    obfuscation: bitwiseNOT,
    deobfuscation: bitwiseNOT
};
exports.default = funPair;
