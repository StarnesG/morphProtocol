"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function substitution(input, keyArray, initor) {
    const length = input.length;
    const obfuscated = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
        obfuscated[i] = initor[input[i]];
    }
    return obfuscated;
}
function de_substitution(input, keyArray, initor) {
    const length = input.length;
    const deobfuscated = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
        const value = input[i];
        // Find the index of the value in the table
        const index = initor.findIndex((item) => item === value);
        if (index !== -1) {
            deobfuscated[i] = index;
        }
        else {
            // Handle the case where the value is not found in the table
            // You can decide on an appropriate fallback behavior or error handling here
            // For example, you can set deobfuscated[i] = 0 or throw an error
            deobfuscated[i] = 0;
        }
    }
    return deobfuscated;
}
function generateSubstitutionTable() {
    const tableLength = 256;
    let substitutionTable = [];
    // Initialize the table with sequential values from 0 to 255
    for (let i = 0; i < tableLength; i++) {
        substitutionTable.push(i);
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
let funPair = {
    obfuscation: substitution,
    deobfuscation: de_substitution,
    initorFn: generateSubstitutionTable
};
exports.default = funPair;
