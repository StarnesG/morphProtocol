import {
  bitwiseNOT,
  bitwiseRotationAndXOR,
  swapNeighboringBytes,
  reverseBuffer,
  divideAndSwap,
  circularShiftObfuscation,
  xorWithKey,
  reverseBits,
  shiftBits,
  substitution,
  addRandomValue,
} from './functions';
import { HouseFunction, HouseFunctionPair } from '../types';
import { MAX_OBFUSCATION_FUNCTIONS, MAX_OBFUSCATION_LAYERS } from '../utils/constants';

export { HouseFunctionPair };

export class FunctionRegistry {
    public functionPairs: HouseFunctionPair[] = [];

    public obfuscationLayer: number = 4;

    public setObfuscationLayer(num: number) {
        if (num > MAX_OBFUSCATION_LAYERS) {
            throw new Error(`Support max layer ${MAX_OBFUSCATION_LAYERS}.`)
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
        if (index >= MAX_OBFUSCATION_FUNCTIONS) {
            throw new Error(`FunctionRegistry can only hold ${MAX_OBFUSCATION_FUNCTIONS} functions maximum.`)
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
