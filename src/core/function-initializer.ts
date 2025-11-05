import { substitution, addRandomValue } from './functions';

export function fnInitor () {
    return {
        substitutionTable: substitution.initorFn(),
        randomValue: addRandomValue.initorFn(),
    }
}