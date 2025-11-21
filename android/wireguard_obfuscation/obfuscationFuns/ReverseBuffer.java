package com.morph_vpn.plugin.wireguard_obfuscation.obfuscationFuns;
import java.util.Arrays;

public class ReverseBuffer {
    public static byte[] reverseBuffer(byte[] input, byte[] keyArray, Object initor) {
        byte[] reversed = new byte[input.length];

        for (int i = 0; i < input.length; i++) {
            reversed[i] = input[input.length - 1 - i];
        }

        return reversed;
    }

    public static void main(String[] args) {
        byte[] input = new byte[]{/* initialize input byte array */};
        byte[] keyArray = new byte[]{/* initialize keyArray byte array */};
        Object initor = null;

        byte[] reversed = reverseBuffer(input, keyArray, initor);

        System.out.println("Input: " + Arrays.toString(input));
        System.out.println("Reversed: " + Arrays.toString(reversed));
    }
}
