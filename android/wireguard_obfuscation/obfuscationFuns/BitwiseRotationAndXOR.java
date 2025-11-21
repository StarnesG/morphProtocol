package com.morph_vpn.plugin.wireguard_obfuscation.obfuscationFuns;
import java.util.Arrays;

public class BitwiseRotationAndXOR {
    public static byte[] bitwiseRotationAndXOR(byte[] input, byte[] keyArray, Object initor) {
        int length = input.length;
        byte[] rotatedXOR = new byte[length];

        for (int i = 0; i < length; i++) {
            int value = input[i] & 0xFF;
            int shift = (i % 8) + 1;
            rotatedXOR[i] = (byte) (((value << shift) | (value >>> (8 - shift))) ^ (keyArray[(i + length - 1) % length] & 0xFF));
        }

        return rotatedXOR;
    }

    public static byte[] de_bitwiseRotationAndXOR(byte[] input, byte[] keyArray, Object initor) {
        int length = input.length;
        byte[] deRotatedXOR = new byte[length];

        for (int i = 0; i < length; i++) {
            int value = input[i] & 0xFF;
            int shift = (i % 8) + 1;
            deRotatedXOR[i] = (byte) (((value ^ (keyArray[(i + length - 1) % length] & 0xFF)) >>> shift) | ((value ^ (keyArray[(i + length - 1) % length] & 0xFF)) << (8 - shift)));
        }

        return deRotatedXOR;
    }

    public static void main(String[] args) {
        byte[] input = new byte[]{ 1, 2, 3, 4, 5 };
        byte[] keyArray = new byte[]{ 10, 20, 30, 40, 50 };
        Object initor = null;

        byte[] obfuscated = bitwiseRotationAndXOR(input, keyArray, initor);
        byte[] deobfuscated = de_bitwiseRotationAndXOR(obfuscated, keyArray, initor);

        System.out.println("Input: " + Arrays.toString(input));
        System.out.println("Obfuscated: " + Arrays.toString(obfuscated));
        System.out.println("Deobfuscated: " + Arrays.toString(deobfuscated));
    }
}
