package com.morph_vpn.plugin.wireguard_obfuscation.obfuscationFuns;
import java.util.Arrays;

public class ShiftBits {
    public static byte[] shiftBits(byte[] input, byte[] keyArray, Object initor) {
        byte[] obfuscated = new byte[input.length];

        for (int i = 0; i < input.length; i++) {
            int value = input[i] & 0xFF;
            obfuscated[i] = (byte) ((value << 2) | (value >>> 6));
        }

        return obfuscated;
    }

    public static byte[] de_shiftBits(byte[] obfuscated, byte[] keyArray, Object initor) {
        byte[] deobfuscated = new byte[obfuscated.length];

        for (int i = 0; i < obfuscated.length; i++) {
            int value = obfuscated[i] & 0xFF;
            byte shiftedValue = (byte) ((value >>> 2) | (value << 6));
            deobfuscated[i] = shiftedValue;
        }

        return deobfuscated;
    }

    public static void main(String[] args) {
        byte[] input = new byte[]{/* initialize input byte array */};
        byte[] keyArray = new byte[]{/* initialize keyArray byte array */};
        Object initor = null;

        byte[] obfuscated = shiftBits(input, keyArray, initor);
        byte[] deobfuscated = de_shiftBits(obfuscated, null, null);

        System.out.println("Input: " + Arrays.toString(input));
        System.out.println("Obfuscated: " + Arrays.toString(obfuscated));
        System.out.println("Deobfuscated: " + Arrays.toString(deobfuscated));
    }
}
