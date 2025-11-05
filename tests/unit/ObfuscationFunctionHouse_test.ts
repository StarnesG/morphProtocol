import { ObfuscationFunctionHouse } from '../ObfuscationFunctionHouse';
import * as crypto from 'crypto';


function generateSubstitutionTable(): Uint8Array {
  const tableLength = 256;
  let substitutionTable = new Uint8Array(256)
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

const obfuscationHouse = new ObfuscationFunctionHouse(
  4,
  {
    substitutionTable: generateSubstitutionTable(),
    randomValue: Math.floor(Math.random() * 256)
  }
);

// Test all function pairs
for(let i = 0; i < obfuscationHouse.functionPairs.length; i++) {
   let pair = obfuscationHouse.functionPairs[i]
   let index = i
  console.log(`Test Function Pair ${index + 1}:`);

  // Generate random input data
  const inputData = new Uint8Array(crypto.randomBytes(30).buffer)

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
};

function compareArrays(array1: Uint8Array, array2: Uint8Array): boolean {
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
