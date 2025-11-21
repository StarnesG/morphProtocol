package com.morph_vpn.plugin.wireguard_obfuscation.obfuscationFuns;
import java.util.Arrays;
import java.util.Random;

public class Substitution {
    public static byte[] substitution(byte[] input, byte[] keyArray, Object initor) {
        byte[] obfuscated = new byte[input.length];
        if (initor instanceof Integer[]) {
            Integer[] integerArray = (Integer[]) initor;
            for (int i = 0; i < input.length; i++) {
                obfuscated[i] = (byte) integerArray[input[i] & 0xFF].intValue();
            }
            return obfuscated;
        }
        else {
            return input;
        }
    }

    public static byte[] de_substitution(byte[] input, byte[] keyArray, Object initor) {
        byte[] deobfuscated = new byte[input.length];
        if (initor instanceof Integer[]) {
            Integer[] integerArray = (Integer[]) initor;
            
            for (int i = 0; i < input.length; i++) {
                byte value = input[i];
                int index = findIndex(integerArray, value & 0xFF);

                if (index != -1) {
                    deobfuscated[i] = (byte) index;
                } else {
                    deobfuscated[i] = 0; // Fallback behavior: Set to 0 when value is not found
                }
            }

            return deobfuscated;
        }
        else {
            return input;
        }
    }

    public static int findIndex(Integer[] array, int value) {
        for (int i = 0; i < array.length; i++) {
            if (array[i].intValue() == value) {
                return i;
            }
        }
        return -1;
    }

    public static Integer[] generateSubstitutionTable() {
        int tableLength = 256;
        int[] substitutionTable = new int[tableLength];

        // Initialize the table with sequential values from 0 to 255
        for (int i = 0; i < tableLength; i++) {
            substitutionTable[i] = i;
        }

        // Shuffle the table using Fisher-Yates algorithm
        Random random = new Random();
        for (int i = tableLength - 1; i > 0; i--) {
            int j = random.nextInt(i + 1);
            int temp = substitutionTable[i];
            substitutionTable[i] = substitutionTable[j];
            substitutionTable[j] = temp;
        }
        Integer[] integerArray = new Integer[substitutionTable.length];

        for (int i = 0; i < substitutionTable.length; i++) {
            integerArray[i] = Integer.valueOf(substitutionTable[i]); // or simply integerArray[i] = intArray[i];
        }

        return integerArray;
    }

    public static void main(String[] args) {
        byte[] input = new byte[]{/* initialize input byte array */};
        byte[] keyArray = new byte[]{/* initialize keyArray byte array */};

        Integer[] genTable = generateSubstitutionTable();
        
        // Convert Integer[] to Object
        Object initor = genTable;

        byte[] obfuscated = substitution(input, keyArray, initor);
        byte[] deobfuscated = de_substitution(obfuscated, keyArray, initor);

        System.out.println("Input: " + Arrays.toString(input));
        System.out.println("Obfuscated: " + Arrays.toString(obfuscated));
        System.out.println("Deobfuscated: " + Arrays.toString(deobfuscated));
    }
}
