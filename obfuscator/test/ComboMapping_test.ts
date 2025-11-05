import { ObfuscationFunctionHouse } from '../ObfuscationFunctionHouse';


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

(async () => {
    const obfuscationHouse = await new ObfuscationFunctionHouse(
        4,
        {
            substitutionTable: generateSubstitutionTable(),
            randomValue: Math.floor(Math.random() * 256)
        }
    );
    console.log(obfuscationHouse.getfunctionPairsIndexCombos())
})()


