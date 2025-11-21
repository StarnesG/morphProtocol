package com.morph_vpn.plugin.wireguard_obfuscation;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.List;
import java.util.ArrayList;

public class Obfuscator {
    private int key;
    private int paddingLength;
    private ObfuscationFunctionHouse obfuscationHouse;
    private int obFunCombosLength;
    private boolean DEBUG = false;
   
    public Obfuscator(int key, int obfuscationLayer, int paddingLength, FnInitor fnInitor) {
        this.key = key;
        this.paddingLength = paddingLength;
        this.obfuscationHouse = new ObfuscationFunctionHouse(obfuscationLayer, fnInitor);
        this.obFunCombosLength = this.obfuscationHouse.getFunctionPairsIndexCombos().size();
    }

    public void setKey(int newKey) {
        this.key = newKey;
    }

    private byte[] generateKeyArray(int length) {
        byte[] keyArray = new byte[length];

        for (int i = 0; i < length; i++) {
            keyArray[i] = (byte) ((this.key + i * 37) % 256);
        }

        return keyArray;
    }

    private byte[] randomPadding(int length) {
        byte[] padding = new byte[length];
        new SecureRandom().nextBytes(padding);
        return padding;
    }

    private byte[] concatenateByteArrays(byte[][] arrays) {
        int totalLength = Arrays.stream(arrays).mapToInt(arr -> arr.length).sum();
        byte[] result = new byte[totalLength];

        int offset = 0;
        for (byte[] array : arrays) {
            System.arraycopy(array, 0, result, offset, array.length);
            offset += array.length;
        }

        return result;
    }

    private byte[][] extractHeaderAndBody(byte[] input) {
        byte[] header = Arrays.copyOfRange(input, 0, 3);
        int paddingLength = input[2] & 0xFF;
        byte[] body = Arrays.copyOfRange(input, 3, input.length - paddingLength);
        return new byte[][] { header, body };
    }

    private byte[] preObfuscation(byte[] buffer, List<HouseFunctionPair> functions) {
        byte[] obfuscatedData = buffer.clone();
        byte[] keyArray = generateKeyArray(obfuscatedData.length);

        if (this.DEBUG) {
            System.out.println("\n\n\n");
        }

        for (HouseFunctionPair func : functions) {
            if (this.DEBUG) {
                System.out.println("Original Data: " + Arrays.toString(obfuscatedData));
            }

            obfuscatedData = func.obfuscation.apply(obfuscatedData, keyArray, func.initor);
            //System.out.println("function: " + func.name);

            if (this.DEBUG) {
                System.out.println("Obfuscated Data: " + Arrays.toString(obfuscatedData));
                System.out.println("Function is: " + func.obfuscation.getClass().getSimpleName());
                System.out.println("----------------------------------");
            }
        }

        return obfuscatedData;
    }

    private byte[] preDeobfuscation(byte[] obfuscated, List<HouseFunctionPair> functions) {
        byte[] deobfuscatedData = obfuscated.clone();
        byte[] keyArray = generateKeyArray(deobfuscatedData.length);

        if (this.DEBUG) {
            System.out.println("\n\n\n");
        }

        for (int i = functions.size() - 1; i >= 0; i--) {
            if (this.DEBUG) {
                System.out.println("Original Data: " + Arrays.toString(deobfuscatedData));
            }

            deobfuscatedData = functions.get(i).deobfuscation.apply(deobfuscatedData, keyArray, functions.get(i).initor);
            //System.out.println("function: " + functions.get(i).name);

            if (this.DEBUG) {
                System.out.println("Obfuscated Data: " + Arrays.toString(deobfuscatedData));
                System.out.println("Function is: " + functions.get(i).deobfuscation.getClass().getSimpleName());
                System.out.println("----------------------------------");
            }
        }

        return deobfuscatedData;
    }

    public byte[] obfuscation(byte[] data) {
        List<int[]> fnCombo = this.obfuscationHouse.getFunctionPairsIndexCombos();
        byte[] header = new byte[3];
        new SecureRandom().nextBytes(header);
        int fnComboIndex = ((header[0] & 0xFF) * (header[1] & 0xFF)) % this.obFunCombosLength;
        List<HouseFunctionPair> functions = new ArrayList<>();
        int[] functionIndices = fnCombo.get(fnComboIndex);
        for (int it : functionIndices) {
            functions.add(this.obfuscationHouse.functionPairs.get(it));
        }

        // Generate a random integer between 1 and this.paddingLength and store it in header[2]
        int randomPaddingLength = new SecureRandom().nextInt(paddingLength) + 1;
        header[2] = (byte) randomPaddingLength;
        byte[] obfuscatedData = preObfuscation(data, functions);
        byte[] randomPadding = randomPadding(randomPaddingLength);
        byte[] result = concatenateByteArrays(new byte[][] { header, obfuscatedData, randomPadding });

        return result;
    }

    public byte[] deobfuscation(byte[] data) {
        List<int[]> fnCombo = this.obfuscationHouse.getFunctionPairsIndexCombos();
        byte[][] extracted = extractHeaderAndBody(data);
        byte[] header = extracted[0];
        byte[] body = extracted[1];
        int fnComboIndex = ((header[0] & 0xFF) * (header[1] & 0xFF)) % this.obFunCombosLength;
        List<HouseFunctionPair> functions = new ArrayList<>();
        int[] functionIndices = fnCombo.get(fnComboIndex);
        for (int it : functionIndices) {
            functions.add(this.obfuscationHouse.functionPairs.get(it));
        }
        byte[] deobfuscatedData = preDeobfuscation(body, functions);

        return deobfuscatedData;
    }
}
