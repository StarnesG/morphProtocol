"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fnInitor = fnInitor;
const substitution_1 = __importDefault(require("./obfuscationFuns/substitution"));
const addRandomValue_1 = __importDefault(require("./obfuscationFuns/addRandomValue"));
function fnInitor() {
    return {
        substitutionTable: substitution_1.default.initorFn(),
        randomValue: addRandomValue_1.default.initorFn(),
    };
}
