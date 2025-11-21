package com.morph_vpn.plugin.wireguard_obfuscation.obfuscationFuns;
import java.util.Arrays;

public class XorWithKey {
    public static byte[] xorWithKey(byte[] input, byte[] keyArray, Object initor) {
        int length = input.length;
        byte[] obfuscated = new byte[length];

        for (int i = 0; i < length; i++) {
            obfuscated[i] = (byte) (input[i] ^ keyArray[i]);
        }

        return obfuscated;
    }

    public static void main(String[] args) {
        byte[] input = new byte[]{/* initialize input byte array */};
        byte[] keyArray = new byte[]{/* initialize keyArray byte array */};
        Object initor = null;/* initialize initor value */;

        byte[] obfuscated = xorWithKey(input, keyArray, initor);
        byte[] deobfuscated = xorWithKey(obfuscated, keyArray, initor);

        System.out.println("Input: " + Arrays.toString(input));
        System.out.println("Obfuscated: " + Arrays.toString(obfuscated));
        System.out.println("Deobfuscated: " + Arrays.toString(deobfuscated));
    }
}
