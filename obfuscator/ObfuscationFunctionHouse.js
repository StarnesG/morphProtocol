"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObfuscationFunctionHouse = void 0;
const bitwiseNOT_1 = __importDefault(require("./obfuscationFuns/bitwiseNOT"));
const bitwiseRotationAndXOR_1 = __importDefault(require("./obfuscationFuns/bitwiseRotationAndXOR"));
const swapNeighboringBytes_1 = __importDefault(require("./obfuscationFuns/swapNeighboringBytes"));
const reverseBuffer_1 = __importDefault(require("./obfuscationFuns/reverseBuffer"));
const divideAndSwap_1 = __importDefault(require("./obfuscationFuns/divideAndSwap"));
const circularShiftObfuscation_1 = __importDefault(require("./obfuscationFuns/circularShiftObfuscation"));
const xorWithKey_1 = __importDefault(require("./obfuscationFuns/xorWithKey"));
const reverseBits_1 = __importDefault(require("./obfuscationFuns/reverseBits"));
const shiftBits_1 = __importDefault(require("./obfuscationFuns/shiftBits"));
const substitution_1 = __importDefault(require("./obfuscationFuns/substitution"));
const addRandomValue_1 = __importDefault(require("./obfuscationFuns/addRandomValue"));
class ObfuscationFunctionHouse {
    setObfuscationLayer(num) {
        if (num > 4) {
            throw new Error("Support max layer 4.");
        }
        this.obfuscationLayer = num;
    }
    getfunctionPairsIndexCombos() {
        switch (this.obfuscationLayer) {
            case 1:
                return this.functionPairsIndexCombos_1;
                break;
            case 2:
                return this.functionPairsIndexCombos_2;
                break;
            case 3:
                return this.functionPairsIndexCombos_3;
                break;
            case 4:
                return this.functionPairsIndexCombos_4;
                break;
            default: return [];
        }
    }
    calculatePermutations(optionLength, length) {
        const options = Array.from({ length: optionLength }, (_, i) => i);
        const permutations = [];
        function permute(current, remaining) {
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
    constructor(obsfucationLayer, fnInitor) {
        this.functionPairs = [];
        this.obfuscationLayer = 4;
        this.functionPairsIndexCombos_1 = [];
        this.functionPairsIndexCombos_2 = [];
        this.functionPairsIndexCombos_3 = [];
        this.functionPairsIndexCombos_4 = [];
        // Add your desired obfuscation function pairs here
        this.addFunctionPair(bitwiseRotationAndXOR_1.default.obfuscation, bitwiseRotationAndXOR_1.default.deobfuscation);
        this.addFunctionPair(swapNeighboringBytes_1.default.obfuscation, swapNeighboringBytes_1.default.deobfuscation);
        this.addFunctionPair(reverseBuffer_1.default.obfuscation, reverseBuffer_1.default.deobfuscation);
        this.addFunctionPair(divideAndSwap_1.default.obfuscation, divideAndSwap_1.default.deobfuscation);
        this.addFunctionPair(circularShiftObfuscation_1.default.obfuscation, circularShiftObfuscation_1.default.deobfuscation);
        this.addFunctionPair(xorWithKey_1.default.obfuscation, xorWithKey_1.default.deobfuscation);
        this.addFunctionPair(bitwiseNOT_1.default.obfuscation, bitwiseNOT_1.default.deobfuscation);
        this.addFunctionPair(reverseBits_1.default.obfuscation, reverseBits_1.default.deobfuscation);
        this.addFunctionPair(shiftBits_1.default.obfuscation, shiftBits_1.default.deobfuscation);
        this.addFunctionPair(substitution_1.default.obfuscation, substitution_1.default.deobfuscation, fnInitor.substitutionTable);
        this.addFunctionPair(addRandomValue_1.default.obfuscation, addRandomValue_1.default.deobfuscation, fnInitor.randomValue);
        // Add more function pairs as needed
        this.setObfuscationLayer(obsfucationLayer);
        this.functionPairsIndexCombos_1 = this.calculatePermutations(this.functionPairs.length, 1);
        this.functionPairsIndexCombos_2 = this.calculatePermutations(this.functionPairs.length, 2);
        this.functionPairsIndexCombos_3 = this.calculatePermutations(this.functionPairs.length, 3);
        this.functionPairsIndexCombos_4 = this.calculatePermutations(this.functionPairs.length, 4);
    }
    // Get a random obfuscation function pair
    getRandomFunctionPair() {
        const index = Math.floor(Math.random() * this.functionPairs.length);
        return this.functionPairs[index];
    }
    addFunctionPair(obfuscation, deobfuscation, initor) {
        let index = this.functionPairs.length;
        //To keep combination header as small as 2 bytes, we can only hold 17 functions most.
        if (index >= 17) {
            throw new Error("obfuscationFunctionHouse can only hold 17 functions most.");
        }
        this.functionPairs.push({ obfuscation, deobfuscation, initor, index });
    }
    // Get n distinct random obfuscation function pairs
    getRandomDistinctFunctionPairs(n) {
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
exports.ObfuscationFunctionHouse = ObfuscationFunctionHouse;
