package com.morphprotocol.client.core

import com.morphprotocol.client.core.functions.*

/**
 * FunctionRegistry manages all obfuscation functions and calculates permutations.
 * Compatible with TypeScript server implementation.
 * Uses permutations WITHOUT replacement (no repeated functions in a combo).
 */
object FunctionRegistry {
    private val functions = listOf<ObfuscationFunction>(
        BitwiseRotationAndXOR(),
        SwapNeighboringBytes(),
        ReverseBuffer(),
        DivideAndSwap(),
        CircularShiftObfuscation(),
        XorWithKey(),
        BitwiseNOT(),
        ReverseBits(),
        ShiftBits(),
        Substitution(),
        AddRandomValue()
    )
    
    // Pre-calculated permutations for each layer (matching TypeScript)
    private val permutations1: List<IntArray> by lazy { calculatePermutations(1) }
    private val permutations2: List<IntArray> by lazy { calculatePermutations(2) }
    private val permutations3: List<IntArray> by lazy { calculatePermutations(3) }
    private val permutations4: List<IntArray> by lazy { calculatePermutations(4) }
    
    /**
     * Get total number of functions.
     */
    fun getFunctionCount(): Int = functions.size
    
    /**
     * Get function by index.
     */
    fun getFunction(index: Int): ObfuscationFunction {
        if (index < 0 || index >= functions.size) {
            throw IndexOutOfBoundsException("Function index $index out of range [0, ${functions.size})")
        }
        return functions[index]
    }
    
    /**
     * Calculate permutations without replacement (matching TypeScript logic).
     * For layer=2 with 11 functions: generates 110 permutations (11*10)
     * For layer=3 with 11 functions: generates 990 permutations (11*10*9)
     * For layer=4 with 11 functions: generates 7920 permutations (11*10*9*8)
     */
    private fun calculatePermutations(layer: Int): List<IntArray> {
        val options = (0 until functions.size).toList()
        val result = mutableListOf<IntArray>()
        
        fun permute(current: IntArray, remaining: List<Int>) {
            if (current.size == layer) {
                result.add(current)
                return
            }
            
            for (i in remaining.indices) {
                val next = current + remaining[i]
                val rest = remaining.filterIndexed { index, _ -> index != i }
                permute(next, rest)
            }
        }
        
        permute(intArrayOf(), options)
        return result
    }
    
    /**
     * Calculate total number of function combinations for given layer count.
     * Uses permutation formula: P(n,k) = n!/(n-k)! where n = function count, k = layer
     */
    fun calculateTotalCombinations(layer: Int): Int {
        if (layer < 1 || layer > 4) {
            throw IllegalArgumentException("Layer must be between 1 and 4")
        }
        
        return when (layer) {
            1 -> permutations1.size
            2 -> permutations2.size
            3 -> permutations3.size
            4 -> permutations4.size
            else -> 0
        }
    }
    
    /**
     * Get function indices for a given combo index and layer count.
     * Returns pre-calculated permutation (matching TypeScript).
     */
    fun getFunctionIndices(comboIndex: Int, layer: Int): IntArray {
        if (layer < 1 || layer > 4) {
            throw IllegalArgumentException("Layer must be between 1 and 4")
        }
        
        val permutations = when (layer) {
            1 -> permutations1
            2 -> permutations2
            3 -> permutations3
            4 -> permutations4
            else -> throw IllegalArgumentException("Invalid layer")
        }
        
        if (comboIndex < 0 || comboIndex >= permutations.size) {
            throw IllegalArgumentException("Combo index $comboIndex out of range [0, ${permutations.size})")
        }
        
        return permutations[comboIndex]
    }
}
