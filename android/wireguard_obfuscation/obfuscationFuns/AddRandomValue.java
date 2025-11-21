package com.morph_vpn.plugin.wireguard_obfuscation.obfuscationFuns;
import java.util.Arrays;
import java.util.Random;

public class AddRandomValue {
    public static byte[] addRandomValue(byte[] input, byte[] keyArray, Object initor) {
        byte[] obfuscated = new byte[input.length];

        for (int i = 0; i < input.length; i++) {
            obfuscated[i] = (byte) ((input[i] + ((Integer)initor).intValue()) % 256); // Addition with modulus
        }

        return obfuscated;
    }

    public static byte[] de_addRandomValue(byte[] input, byte[] keyArray, Object initor) {
        byte[] deobfuscated = new byte[input.length];

        for (int i = 0; i < input.length; i++) {
            deobfuscated[i] = (byte) ((input[i] - ((Integer)initor).intValue() + 256) % 256); // Subtraction with modulus
        }

        return deobfuscated;
    }

    public static int generateRandomValue() {
        Random random = new Random();
        return random.nextInt(256);
    }

    public static void main(String[] args) {
        byte[] input = new byte[]{/* initialize input byte array */};
        byte[] keyArray = new byte[]{/* initialize keyArray byte array */};

        Object initor = generateRandomValue();

        byte[] obfuscated = addRandomValue(input, keyArray, initor);
        byte[] deobfuscated = de_addRandomValue(obfuscated, keyArray, initor);

        System.out.println("Input: " + Arrays.toString(input));
        System.out.println("Obfuscated: " + Arrays.toString(obfuscated));
        System.out.println("Deobfuscated: " + Arrays.toString(deobfuscated));
    }
}
