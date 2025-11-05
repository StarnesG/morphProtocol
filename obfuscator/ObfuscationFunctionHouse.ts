
import  bitwiseNOT from './obfuscationFuns/bitwiseNOT'
import bitwiseRotationAndXOR from './obfuscationFuns/bitwiseRotationAndXOR'
import swapNeighboringBytes from './obfuscationFuns/swapNeighboringBytes'
import reverseBuffer from './obfuscationFuns/reverseBuffer'
import divideAndSwap from './obfuscationFuns/divideAndSwap'
import circularShiftObfuscation from './obfuscationFuns/circularShiftObfuscation'
import xorWithKey from './obfuscationFuns/xorWithKey'
import reverseBits from './obfuscationFuns/reverseBits'
import shiftBits from './obfuscationFuns/shiftBits'
import substitution from './obfuscationFuns/substitution'
import addRandomValue from './obfuscationFuns/addRandomValue'

export type HouseFunction = 
((input: Uint8Array, keyArray: Uint8Array, initor: any) => Uint8Array)

export interface HouseFunctionPair {
    obfuscation: HouseFunction;
    deobfuscation: HouseFunction;
    initor:any,
    index: number;
}

export class ObfuscationFunctionHouse {
    public functionPairs: HouseFunctionPair[] = [];

    public obfuscationLayer: number = 4;

    public setObfuscationLayer(num: number) {
        if (num > 4) {
            throw new Error("Support max layer 4.")
        }
        this.obfuscationLayer = num;
    }
    public getfunctionPairsIndexCombos() {
        switch (this.obfuscationLayer) {
            case 1: return this.functionPairsIndexCombos_1
                break;
            case 2: return this.functionPairsIndexCombos_2
                break;
            case 3: return this.functionPairsIndexCombos_3
                break;
            case 4: return this.functionPairsIndexCombos_4
                break;
            default: return []
        }
    }

    private functionPairsIndexCombos_1: number[][] = [];
    private functionPairsIndexCombos_2: number[][] = [];
    private functionPairsIndexCombos_3: number[][] = [];
    private functionPairsIndexCombos_4: number[][] = [];

    private calculatePermutations(optionLength: number, length: number): number[][] {
        const options = Array.from({ length: optionLength }, (_, i) => i)
        const permutations: number[][] = [];

        function permute(current: number[], remaining: number[]): void {
            if (current.length === length) {
                permutations.push(current);
                return;
            }

            for (let i = 0; i < remaining.length; i++) {
                const next = current.concat(remaining[i]);
                const rest = remaining.filter((_, index) => index !== i);
                permute(next, rest);
            }
        }

        permute([], options);
        return permutations;
    }

    constructor(
        obsfucationLayer: number,
        fnInitor: any
    ) {
        // Add your desired obfuscation function pairs here
        this.addFunctionPair(bitwiseRotationAndXOR.obfuscation, bitwiseRotationAndXOR.deobfuscation);
        this.addFunctionPair(swapNeighboringBytes.obfuscation, swapNeighboringBytes.deobfuscation);
        this.addFunctionPair(reverseBuffer.obfuscation, reverseBuffer.deobfuscation);
        this.addFunctionPair(divideAndSwap.obfuscation, divideAndSwap.deobfuscation);
        this.addFunctionPair(circularShiftObfuscation.obfuscation, circularShiftObfuscation.deobfuscation);
        this.addFunctionPair(xorWithKey.obfuscation, xorWithKey.deobfuscation);
        this.addFunctionPair(bitwiseNOT.obfuscation, bitwiseNOT.deobfuscation);
        this.addFunctionPair(reverseBits.obfuscation, reverseBits.deobfuscation);
        this.addFunctionPair(shiftBits.obfuscation, shiftBits.deobfuscation);
        this.addFunctionPair(substitution.obfuscation, substitution.deobfuscation, fnInitor.substitutionTable);
        this.addFunctionPair(addRandomValue.obfuscation, addRandomValue.deobfuscation, fnInitor.randomValue);
        // Add more function pairs as needed
        this.setObfuscationLayer(obsfucationLayer)
        this.functionPairsIndexCombos_1 = this.calculatePermutations(this.functionPairs.length, 1)
        this.functionPairsIndexCombos_2 = this.calculatePermutations(this.functionPairs.length, 2)
        this.functionPairsIndexCombos_3 = this.calculatePermutations(this.functionPairs.length, 3)
        this.functionPairsIndexCombos_4 = this.calculatePermutations(this.functionPairs.length, 4)
    }

    // Get a random obfuscation function pair
    public getRandomFunctionPair(): HouseFunctionPair {
        const index = Math.floor(Math.random() * this.functionPairs.length);
        return this.functionPairs[index];
    }

    public addFunctionPair(obfuscation: HouseFunction, deobfuscation: HouseFunction, initor?:any) {
        let index = this.functionPairs.length
        //To keep combination header as small as 2 bytes, we can only hold 17 functions most.
        if (index >= 17) {
            throw new Error("obfuscationFunctionHouse can only hold 17 functions most.")
        }
        this.functionPairs.push({ obfuscation, deobfuscation, initor, index });
    }

    // Get n distinct random obfuscation function pairs
    public getRandomDistinctFunctionPairs(n: number): HouseFunctionPair[] {
        if (n > this.functionPairs.length) {
            throw new Error(`Cannot retrieve ${n} distinct function pairs from the available options.`);
        }

        const shuffledPairs = this.functionPairs.slice();
        for (let i = shuffledPairs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledPairs[i], shuffledPairs[j]] = [shuffledPairs[j], shuffledPairs[i]];
        }

        return shuffledPairs.slice(0, n);
    }
}
