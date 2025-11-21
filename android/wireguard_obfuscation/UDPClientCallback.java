package com.morph_vpn.plugin.wireguard_obfuscation;
public interface UDPClientCallback {
    void onUDPClientStarted(int[] portCombo);
    void onUDPClientError();
}