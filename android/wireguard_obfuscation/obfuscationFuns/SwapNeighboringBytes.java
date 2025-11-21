package com.morph_vpn.plugin.wireguard_obfuscation.obfuscationFuns;
import java.util.Arrays;

public class SwapNeighboringBytes {
    public static byte[] swapNeighboringBytes(byte[] input, byte[] keyArray, Object initor) {
        int length = input.length;
        byte[] swapped = new byte[length];

        for (int i = 0; i < length - 1; i += 2) {
            swapped[i] = input[i + 1];
            swapped[i + 1] = input[i];
        }

        if (length % 2 != 0) {
            swapped[length - 1] = input[length - 1];
        }

        return swapped;
    }

    public static void main(String[] args) {
        byte[] input = new byte[]{/* initialize input byte array */};
        byte[] keyArray = new byte[]{/* initialize keyArray byte array */};
        Object initor = null;/* initialize initor value */;

        byte[] obfuscated = swapNeighboringBytes(input, keyArray, initor);
        byte[] deobfuscated = swapNeighboringBytes(obfuscated, keyArray, initor);

        System.out.println("Input: " + Arrays.toString(input));
        System.out.println("Obfuscated: " + Arrays.toString(obfuscated));
        System.out.println("Deobfuscated: " + Arrays.toString(deobfuscated));
    }
}
