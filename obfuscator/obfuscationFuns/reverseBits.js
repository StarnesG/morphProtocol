"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function reverseBits(input, keyArray, initor) {
    const reversed = new Uint8Array(input.length);
    for (let i = 0; i < input.length; i++) {
        let byte = input[i];
        let reversedByte = 0;
        for (let j = 0; j < 8; j++) {
            reversedByte <<= 1;
            reversedByte |= byte & 1;
            byte >>= 1;
        }
        reversed[i] = reversedByte;
    }
    return reversed;
}
function de_reverseBits(input, keyArray, initor) {
    const length = input.length;
    const deobfuscated = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
        let value = input[i];
        let result = 0;
        for (let j = 0; j < 8; j++) {
            result = (result << 1) | (value & 1);
            value >>= 1;
        }
        deobfuscated[i] = result;
    }
    return deobfuscated;
}
let funPair = {
    obfuscation: reverseBits,
    deobfuscation: de_reverseBits
};
exports.default = funPair;
