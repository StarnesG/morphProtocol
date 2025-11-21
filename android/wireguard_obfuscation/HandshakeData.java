package com.morph_vpn.plugin.wireguard_obfuscation;
import java.util.Random;

public class HandshakeData {
    public int key;
    public int obfuscationLayer;
    public int randomPadding;
    public FnInitor fnInitor;
    public String userId;
    public String publicKey;

    public static Integer[] generateSubstitutionTable() {
        int tableLength = 256;
        int[] substitutionTable = new int[tableLength];

        // Initialize the table with sequential values from 0 to 255
        for (int i = 0; i < tableLength; i++) {
            substitutionTable[i] = i;
        }

        // Shuffle the table using Fisher-Yates algorithm
        Random random = new Random();
        for (int i = tableLength - 1; i > 0; i--) {
            int j = random.nextInt(i + 1);
            int temp = substitutionTable[i];
            substitutionTable[i] = substitutionTable[j];
            substitutionTable[j] = temp;
        }
        Integer[] integerArray = new Integer[substitutionTable.length];

        for (int i = 0; i < substitutionTable.length; i++) {
            integerArray[i] = Integer.valueOf(substitutionTable[i]); // or simply integerArray[i] = intArray[i];
        }

        return integerArray;
    }

    public HandshakeData(int obfuscationLayer, int randomPadding, String userId, String publicKey) {
       this.obfuscationLayer = obfuscationLayer;
       this.randomPadding = randomPadding;
       this.userId = userId;
       this.publicKey = publicKey;
       Random random = new Random();
       this.key = random.nextInt(256);
       Integer randomValue = Integer.valueOf((int) (Math.random() * 256));
       this.fnInitor = new FnInitor(randomValue, generateSubstitutionTable());
    }
}