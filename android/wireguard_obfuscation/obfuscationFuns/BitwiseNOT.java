package com.morph_vpn.plugin.wireguard_obfuscation.obfuscationFuns;
import java.util.Arrays;

public class BitwiseNOT {
    public static byte[] bitwiseNOT(byte[] input, byte[] keyArray, Object initor) {
        byte[] obfuscated = new byte[input.length];

        for (int i = 0; i < input.length; i++) {
            obfuscated[i] = (byte) (~input[i]);
        }

        return obfuscated;
    }

    public static void main(String[] args) {
        byte[] input = new byte[]{/* initialize input byte array */};
        byte[] keyArray = new byte[]{/* initialize keyArray byte array */};
        Object initor = null;

        byte[] obfuscated = bitwiseNOT(input, keyArray, initor);
        byte[] deobfuscated = bitwiseNOT(obfuscated, keyArray, initor);

        System.out.println("Input: " + Arrays.toString(input));
        System.out.println("Obfuscated: " + Arrays.toString(obfuscated));
        System.out.println("Deobfuscated: " + Arrays.toString(deobfuscated));
    }
}
