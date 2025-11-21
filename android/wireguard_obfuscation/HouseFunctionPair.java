package com.morph_vpn.plugin.wireguard_obfuscation;
public class HouseFunctionPair {
    public HouseFunction obfuscation;
    public HouseFunction deobfuscation;
    public Object initor;
    public int index;
    public String name;

    HouseFunctionPair(HouseFunction obfuscation, HouseFunction deobfuscation, Object initor, String name, int index) {
        this.obfuscation = obfuscation;
        this.deobfuscation = deobfuscation;
        this.index = index;
        this.name = name;
        this.initor = initor;
    }
}