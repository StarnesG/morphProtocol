package com.morph_vpn.plugin.wireguard_obfuscation;
public interface TCPClientCallback {
    void onTCPClientStarted();
    void onTCPClientError();
}