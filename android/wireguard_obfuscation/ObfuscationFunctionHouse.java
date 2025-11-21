package com.morph_vpn.plugin.wireguard_obfuscation;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.Arrays;
import com.morph_vpn.plugin.wireguard_obfuscation.obfuscationFuns.*;

public class ObfuscationFunctionHouse {
    public List<HouseFunctionPair> functionPairs = new ArrayList<>();
    public int obfuscationLayer = 4;
    private List<int[]> functionPairsIndexCombos_1 = new ArrayList<>();
    private List<int[]> functionPairsIndexCombos_2 = new ArrayList<>();
    private List<int[]> functionPairsIndexCombos_3 = new ArrayList<>();
    private List<int[]> functionPairsIndexCombos_4 = new ArrayList<>();

    public void setObfuscationLayer(int num) {
        if (num > 4) {
            throw new IllegalArgumentException("Support max layer 4.");
        }
        obfuscationLayer = num;
    }

    public List<int[]> getFunctionPairsIndexCombos() {
        switch (this.obfuscationLayer) {
            case 1:
                return this.functionPairsIndexCombos_1;
            case 2:
                return this.functionPairsIndexCombos_2;
            case 3:
                return this.functionPairsIndexCombos_3;
            case 4:
                return this.functionPairsIndexCombos_4;
            default:
                return new ArrayList<>();
        }
    }

    private List<int[]> calculatePermutations(int optionLength, int length) {
        List<int[]> permutations = new ArrayList<>();

        int[] options = new int[optionLength];
        for (int i = 0; i < optionLength; i++) {
            options[i] = i;
        }

        permute(permutations, new int[length], options, new boolean[optionLength], 0);

        return permutations;
    }

    private void permute(List<int[]> permutations, int[] current, int[] options, boolean[] used, int depth) {
        if (depth == current.length) {
            permutations.add(current.clone());
            return;
        }

        for (int i = 0; i < options.length; i++) {
            if (!used[i]) {
                used[i] = true;
                current[depth] = options[i];
                permute(permutations, current, options, used, depth + 1);
                used[i] = false;
            }
        }
    }

    public ObfuscationFunctionHouse(int obfuscationLayer, FnInitor fnInitor) {
        //Add your desired obfuscation function pairs here
        addFunctionPair(BitwiseRotationAndXOR::bitwiseRotationAndXOR, BitwiseRotationAndXOR::de_bitwiseRotationAndXOR, null, "BitwiseRotationAndXOR");
        addFunctionPair(SwapNeighboringBytes::swapNeighboringBytes, SwapNeighboringBytes::swapNeighboringBytes, null, "SwapNeighboringBytes");
        addFunctionPair(ReverseBuffer::reverseBuffer, ReverseBuffer::reverseBuffer, null, "ReverseBuffer");
        addFunctionPair(DivideAndSwap::divideAndSwap, DivideAndSwap::divideAndSwap, null, "DivideAndSwap");
        addFunctionPair(CircularShiftObfuscation::circularShiftObfuscation, CircularShiftObfuscation::de_circularShiftObfuscation, null, "CircularShiftObfuscation");
        addFunctionPair(XorWithKey::xorWithKey, XorWithKey::xorWithKey, null, "XorWithKey");
        addFunctionPair(BitwiseNOT::bitwiseNOT, BitwiseNOT::bitwiseNOT, null, "BitwiseNOT");
        addFunctionPair(ReverseBits::reverseBits, ReverseBits::reverseBits, null, "ReverseBits");
        addFunctionPair(ShiftBits::shiftBits, ShiftBits::de_shiftBits, null, "ShiftBits");
        addFunctionPair(Substitution::substitution, Substitution::de_substitution, fnInitor.substitutionTable, "Substitution");
        addFunctionPair(AddRandomValue::addRandomValue, AddRandomValue::de_addRandomValue, fnInitor.randomValue, "AddRandomValue");
        // Add more function pairs as needed
        setObfuscationLayer(obfuscationLayer);
        functionPairsIndexCombos_1 = calculatePermutations(functionPairs.size(), 1);
        functionPairsIndexCombos_2 = calculatePermutations(functionPairs.size(), 2);
        functionPairsIndexCombos_3 = calculatePermutations(functionPairs.size(), 3);
        functionPairsIndexCombos_4 = calculatePermutations(functionPairs.size(), 4);
    }

    // Get a random obfuscation function pair
    public HouseFunctionPair getRandomFunctionPair() {
        Random random = new Random();
        int index = random.nextInt(functionPairs.size());
        return functionPairs.get(index);
    }

    public void addFunctionPair(HouseFunction obfuscation, HouseFunction deobfuscation, Object initor, String name) {
        int index = functionPairs.size();
        // To keep the combination header as small as 2 bytes, we can only hold 17 functions at most.
        if (index >= 17) {
            throw new IllegalArgumentException("obfuscationFunctionHouse can only hold 17 functions at most.");
        }
        functionPairs.add(new HouseFunctionPair(obfuscation, deobfuscation, initor, name, index));
    }

    // Get n distinct random obfuscation function pairs
    public List<HouseFunctionPair> getRandomDistinctFunctionPairs(int n) {
        if (n > functionPairs.size()) {
            throw new IllegalArgumentException("Cannot retrieve " + n + " distinct function pairs from the available options.");
        }

        List<HouseFunctionPair> shuffledPairs = new ArrayList<>(functionPairs);
        Random random = new Random();
        for (int i = shuffledPairs.size() - 1; i > 0; i--) {
            int j = random.nextInt(i + 1);
            HouseFunctionPair temp = shuffledPairs.get(i);
            shuffledPairs.set(i, shuffledPairs.get(j));
            shuffledPairs.set(j, temp);
        }

        return shuffledPairs.subList(0, n);
    }
}
