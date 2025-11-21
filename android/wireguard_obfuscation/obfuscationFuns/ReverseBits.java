package com.morph_vpn.plugin.wireguard_obfuscation.obfuscationFuns;
import java.util.Arrays;

public class ReverseBits {
    public static byte[] reverseBits(byte[] input, byte[] keyArray, Object initor) {
        byte[] reversed = new byte[input.length];

        for (int i = 0; i < input.length; i++) {
            byte value = input[i];
            byte reversedByte = 0;

            for (int j = 0; j < 8; j++) {
                reversedByte <<= 1;
                reversedByte |= value & 1;
                value >>= 1;
            }

            reversed[i] = reversedByte;
        }

        return reversed;
    }

    public static byte[] de_reverseBits(byte[] input, byte[] keyArray, Object initor) {
        byte[] deobfuscated = new byte[input.length];

        for (int i = 0; i < input.length; i++) {
            byte value = input[i];
            byte result = 0;

            for (int j = 0; j < 8; j++) {
                result = (byte) ((result << 1) | (value & 1));
                value >>= 1;
            }

            deobfuscated[i] = result;
        }

        return deobfuscated;
    }

    public static void main(String[] args) {
        byte[] input = new byte[]{/* initialize input byte array */};
        byte[] keyArray = new byte[]{/* initialize keyArray byte array */};
        Object initor = null;

        byte[] reversed = reverseBits(input, keyArray, initor);
        byte[] deobfuscated = de_reverseBits(reversed, keyArray, initor);

        System.out.println("Input: " + Arrays.toString(input));
        System.out.println("Reversed: " + Arrays.toString(reversed));
        System.out.println("Deobfuscated: " + Arrays.toString(deobfuscated));
    }
}
