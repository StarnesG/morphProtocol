function divideAndSwap(input: Uint8Array, _keyArray: Uint8Array, _initor:any): Uint8Array {
    if (input.length === 0) return input;
    
    const length = input.length;
    const mid = Math.floor(length / 2);
    const swapped = new Uint8Array(length);
    
    // Copy second half to first (matching Android implementation)
    swapped.set(input.slice(mid), 0);
    // Copy first half to second
    swapped.set(input.slice(0, mid), length - mid);
    
    return swapped;
}

let funPair = {
    obfuscation: divideAndSwap,
    deobfuscation: divideAndSwap
}

export default funPair;