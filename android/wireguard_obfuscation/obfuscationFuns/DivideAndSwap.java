package com.morph_vpn.plugin.wireguard_obfuscation.obfuscationFuns;
import java.util.Arrays;

public class DivideAndSwap {
    public static byte[] divideAndSwap(byte[] input, byte[] keyArray, Object initor) {
        int length = input.length;

        // Calculate the midpoint
        int midpoint = length / 2;

        // Create a new array to store the swapped data
        byte[] swapped = new byte[length];

        // If the length is odd, copy the middle index as is
        if (length % 2 != 0) {
            // Swap the two equal parts
            for (int i = 0; i < midpoint; i++) {
                swapped[i] = input[i + midpoint + 1]; // Copy the second half to the first half of the swapped array
                swapped[i + midpoint + 1] = input[i]; // Copy the first half to the second half of the swapped array
            }
            swapped[midpoint] = input[midpoint];
        } else {
            for (int i = 0; i < midpoint; i++) {
                swapped[i] = input[i + midpoint]; // Copy the second half to the first half of the swapped array
                swapped[i + midpoint] = input[i]; // Copy the first half to the second half of the swapped array
            }
        }

        return swapped;
    }

    public static void main(String[] args) {
        byte[] input = new byte[]{/* initialize input byte array */};
        byte[] keyArray = new byte[]{/* initialize keyArray byte array */};
        Object initor = null;

        byte[] swapped = divideAndSwap(input, keyArray, initor);

        System.out.println("Input: " + Arrays.toString(input));
        System.out.println("Swapped: " + Arrays.toString(swapped));
    }
}
