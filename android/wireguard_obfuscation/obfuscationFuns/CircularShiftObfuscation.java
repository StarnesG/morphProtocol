package com.morph_vpn.plugin.wireguard_obfuscation.obfuscationFuns;
import java.util.Arrays;

public class CircularShiftObfuscation {
    public static byte[] circularShiftObfuscation(byte[] input, byte[] keyArray, Object initor) {
        byte[] obfuscated = new byte[input.length];

        for (int i = 0; i < input.length; i++) {
            int value = input[i] & 0xFF;
            obfuscated[i] = (byte) ((value << 1) | (value >>> 7)); // Circular left shift by 1 bit
        }

        return obfuscated;
    }

    public static byte[] de_circularShiftObfuscation(byte[] input, byte[] keyArray, Object initor) {
        byte[] deobfuscated = new byte[input.length];

        for (int i = 0; i < input.length; i++) {
            int value = input[i] & 0xFF;
            deobfuscated[i] = (byte) ((value >>> 1) | (value << 7)); // Circular right shift by 1 bit
        }

        return deobfuscated;
    }

    public static void main(String[] args) {
        byte[] input = new byte[]{/* initialize input byte array */};
        byte[] keyArray = new byte[]{/* initialize keyArray byte array */};
        Object initor = null;

        byte[] obfuscated = circularShiftObfuscation(input, keyArray, initor);
        byte[] deobfuscated = de_circularShiftObfuscation(obfuscated, keyArray, initor);

        System.out.println("Input: " + Arrays.toString(input));
        System.out.println("Obfuscated: " + Arrays.toString(obfuscated));
        System.out.println("Deobfuscated: " + Arrays.toString(deobfuscated));
    }
}
