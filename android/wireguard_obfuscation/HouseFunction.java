package com.morph_vpn.plugin.wireguard_obfuscation;
public interface HouseFunction {
    byte[] apply(byte[] input, byte[] keyArray, Object initor);
}