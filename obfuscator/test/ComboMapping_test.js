"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const ObfuscationFunctionHouse_1 = require("../ObfuscationFunctionHouse");
function generateSubstitutionTable() {
    const tableLength = 256;
    let substitutionTable = new Uint8Array(256);
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
(() => __awaiter(void 0, void 0, void 0, function* () {
    const obfuscationHouse = yield new ObfuscationFunctionHouse_1.ObfuscationFunctionHouse(4, {
        substitutionTable: generateSubstitutionTable(),
        randomValue: Math.floor(Math.random() * 256)
    });
    console.log(obfuscationHouse.getfunctionPairsIndexCombos());
}))();
