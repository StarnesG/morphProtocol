"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Obfuscator_1 = require("../Obfuscator");
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
function testObfuscator() {
    // Create an instance of the Obfuscator class
    const obfuscator = new Obfuscator_1.Obfuscator(1234, 4, 2, {
        substitutionTable: generateSubstitutionTable(),
        randomValue: 42,
    });
    // Generate random ArrayBuffer data
    function generateRandomData(length) {
        const buffer = new ArrayBuffer(length);
        const view = new Uint8Array(buffer);
        for (let i = 0; i < length; i++) {
            view[i] = Math.floor(Math.random() * 256);
        }
        return buffer;
    }
    // Test the obfuscation and deobfuscation process
    function testObfuscation(data) {
        // Obfuscate the data
        const obfuscatedData = obfuscator.obfuscation(data);
        // Deobfuscate the obfuscated data
        const deobfuscatedData = obfuscator.deobfuscation(obfuscatedData);
        // Compare the deobfuscated data with the original data
        const originalData = new Uint8Array(data);
        const deobfuscatedArray = new Uint8Array(deobfuscatedData);
        const isSame = originalData.every((byte, index) => byte === deobfuscatedArray[index]);
        // Print the result
        console.log('Original Data:', originalData);
        console.log('Deobfuscated Data:', deobfuscatedArray);
        console.log('Data is same:', isSame);
        console.log('----------------------------------');
    }
    // Generate and test multiple random data
    for (let i = 0; i < 1; i++) {
        const length = Math.floor(Math.random() * 30) + 5; // Random length between 5 and 35
        const data = generateRandomData(length);
        testObfuscation(data);
    }
}
// Run the test
testObfuscator();
