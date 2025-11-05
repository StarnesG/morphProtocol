import substitution from './obfuscationFuns/substitution'
import addRandomValue from './obfuscationFuns/addRandomValue'

export function fnInitor () {
    return {
        substitutionTable: substitution.initorFn(),
        randomValue: addRandomValue.initorFn(),
    }
}