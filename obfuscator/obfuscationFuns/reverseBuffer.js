"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function reverseBuffer(input, keyArray, initor) {
    const length = input.length;
    const reversed = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
        reversed[i] = input[length - 1 - i];
    }
    return reversed;
}
let funPair = {
    obfuscation: reverseBuffer,
    deobfuscation: reverseBuffer
};
exports.default = funPair;
