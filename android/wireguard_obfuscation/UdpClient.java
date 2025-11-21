package com.morph_vpn.plugin.wireguard_obfuscation;

import java.net.DatagramPacket;
import java.net.InetAddress;
import java.net.SocketException;
import java.util.Random;
import java.util.Timer;
import java.util.TimerTask;
import java.net.DatagramSocket;
import java.util.Arrays;
import java.util.concurrent.CompletableFuture;

public class UdpClient {
    private DatagramSocket client;
    private Timer handshakeInterval;
    private Timer heartBeatInterval;
    private boolean clientOpenStatus = false;
    private String handshakeServerAddress;
    private String userId;
    private String LOCALWG_ADDRESS = "192.168.50.42";
    private int handshakeServerPort;
    private int newServerPort;
    private static final int LOCALWG_PORT = 51820;
    private static final int MAX_RETRIES = 5;
    private static final int HEARTBEAT_INTERVAL = 12000;
    private static final byte[] HEARTBEAT_DATA = new byte[] { 0x01 };
    private Obfuscator obfuscator;
    private HandshakeData handshakeData;
    private Encryptor encryptor;

    private boolean shouldStop = false; // Flag to control the loop
    private String simpleString;

    public UdpClient() throws SocketException {
        client = new DatagramSocket();
        encryptor = new Encryptor("ULTzUl/OIfjDtbmr1q");
    }

    public void startUdpClient(String rAddress, String simpleStr, UDPClientCallback callback) {
        String[] addressSplit = rAddress.split(":");
        handshakeServerAddress = addressSplit[0];
        handshakeServerPort = Integer.parseInt(addressSplit[1]);
        userId = addressSplit[2];
        LOCALWG_ADDRESS = "127.0.0.1";
        simpleString = simpleStr;
        encryptor.setSimple(simpleString);
      

        handshakeData = new HandshakeData(3, 8, userId, "not implemented yet");

        obfuscator = new Obfuscator(
                handshakeData.key,
                handshakeData.obfuscationLayer,
                handshakeData.randomPadding,
                handshakeData.fnInitor);

        if (handshakeInterval != null) {
            handshakeInterval.cancel();
            handshakeInterval = null;
        }
        if (heartBeatInterval != null) {
            heartBeatInterval.cancel();
            heartBeatInterval = null;
        }
        if (clientOpenStatus) {
            sendCloseMessage();
            client.close();
            clientOpenStatus = false;
        }

        try {
            client = new DatagramSocket();
            int clientPort = client.getLocalPort();
            System.out.println("Client socket bound to port " + clientPort);

            handshakeInterval = new Timer();
            handshakeInterval.schedule(new TimerTask() {
                int retryCount = 0;

                @Override
                public void run() {
                    sendHandshakeData();
                    retryCount++;
                    if (retryCount >= MAX_RETRIES) {
                        handshakeInterval.cancel();
                        sendCloseMessage();
                        client.close();
                        clientOpenStatus = false;
                    }
                }
            }, 0, 5000);

            clientOpenStatus = true;

            // client.setSoTimeout(HEARTBEAT_INTERVAL);
            byte[] receiveBuffer = new byte[65535];
            DatagramPacket receivePacket = new DatagramPacket(receiveBuffer, receiveBuffer.length);

            while (!shouldStop && !client.isClosed()) {
                client.receive(receivePacket);
                InetAddress remoteAddress = receivePacket.getAddress();
                int remotePort = receivePacket.getPort();

                if (remotePort == handshakeServerPort) {
                    String encryptedMessage = new String(receivePacket.getData(), 0, receivePacket.getLength());
                    String message = encryptor.simpleDecrypt(encryptedMessage);
                    if (message.equals("inactivity") || message.equals("server_full")) {
                        if (handshakeInterval != null) {
                            handshakeInterval.cancel();
                            handshakeInterval = null;
                        }
                        if (heartBeatInterval != null) {
                            heartBeatInterval.cancel();
                            heartBeatInterval = null;
                        }
                        if (clientOpenStatus) {
                            sendCloseMessage();
                            client.close();
                            clientOpenStatus = false;
                        }
                        break;
                    } else if (isNumeric(message)) {
                        newServerPort = Integer.parseInt(message);
                        System.out.println("Received new server port from handshake server: " + newServerPort);

                        if (handshakeInterval != null) {
                            handshakeInterval.cancel();
                            handshakeInterval = null;
                        }
                        heartBeatInterval = new Timer();
                        heartBeatInterval.schedule(new TimerTask() {
                            @Override
                            public void run() {
                                sendHeartbeatData(newServerPort);
                            }
                        }, 0, HEARTBEAT_INTERVAL);
                        int[] resArr = { clientPort, newServerPort };
                        callback.onUDPClientStarted(resArr);
                    } else {
                        System.out.println("Invalid new server port received: " + message);
                    }
                } else if (remotePort == LOCALWG_PORT) {
                    System.out.println("Local WG sent to NewServer");
                    byte[] receivedData = new byte[receivePacket.getLength()]; // Create a new byte[] array with the
                                                                               // correct length
                    System.arraycopy(receivePacket.getData(), receivePacket.getOffset(), receivedData, 0,
                            receivePacket.getLength()); // Copy the data from the receive buffer
                    sendToNewServer(receivedData);
                } else if (remotePort == newServerPort) {
                    System.out.println("NewServer sent to Local WG");
                    byte[] receivedData = new byte[receivePacket.getLength()]; // Create a new byte[] array with the
                                                                               // correct length
                    System.arraycopy(receivePacket.getData(), receivePacket.getOffset(), receivedData, 0,
                            receivePacket.getLength()); // Copy the data from the receive buffer
                    sendToLocalWG(receivedData);
                } else {
                    System.out.println("Received data from unknown server: "
                            + new String(receivePacket.getData(), 0, receivePacket.getLength()));
                    // Process the received data from the new server
                    // ...
                }

                // Check if the flag is set to true and break the loop
                if (shouldStop) {
                    break;
                }
            }
        } catch (Exception e) {
            System.out.println(e);
            callback.onUDPClientError();
            e.printStackTrace();
        }
    }

    public CompletableFuture<Void> stopUdpClient() {
        return CompletableFuture.runAsync(() -> {
            // Set the flag to true to stop the loop
            shouldStop = true;

            if (handshakeInterval != null) {
                handshakeInterval.cancel();
                handshakeInterval = null;
            }
            if (heartBeatInterval != null) {
                heartBeatInterval.cancel();
                heartBeatInterval = null;
            }

            if (clientOpenStatus) {
                sendCloseMessage().thenRun(() -> {
                    client.close();
                    clientOpenStatus = false;
                }).exceptionally(ex -> {
                    ex.printStackTrace(); // Handle any exceptions that occurred during sendCloseMessage
                    return null;
                });
            }
        });
    }

    public boolean udpClientStatus() {
        return clientOpenStatus;
    }

    private void sendHandshakeData() {
        System.out.println("Sending handshake data...");
        String handshakeDataStr = String.format(
                "{\"key\":%d,\"obfuscationLayer\":%d,\"randomPadding\":%d,\"fnInitor\":%s,\"userId\":\"%s\", \"publicKey\":\"%s\"}",
                handshakeData.key, handshakeData.obfuscationLayer, handshakeData.randomPadding,
                handshakeData.fnInitor.toString(),handshakeData.userId, handshakeData.publicKey);
        String handshakeDataStrEncrypted = encryptor.simpleEncrypt(handshakeDataStr);
        System.out.println(handshakeDataStrEncrypted);
        byte[] message = handshakeDataStrEncrypted.getBytes();
        DatagramPacket packet = new DatagramPacket(message, message.length);
        try {
            packet.setAddress(InetAddress.getByName(handshakeServerAddress));
            packet.setPort(handshakeServerPort);
            client.send(packet);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private CompletableFuture<Void> sendCloseMessage() {
        return CompletableFuture.runAsync(() -> {
            String closeMessageStr = encryptor.simpleEncrypt("close");
            byte[] message = closeMessageStr.getBytes();
            DatagramPacket packet = new DatagramPacket(message, message.length);
            try {
                packet.setAddress(InetAddress.getByName(handshakeServerAddress));
                packet.setPort(handshakeServerPort);
                client.send(packet);
            } catch (Exception e) {
                e.printStackTrace();
            }
        });
    }

    private void sendHeartbeatData(int newServerPort) {
        DatagramPacket packet = new DatagramPacket(HEARTBEAT_DATA, HEARTBEAT_DATA.length);
        try {
            packet.setAddress(InetAddress.getByName(handshakeServerAddress));
            packet.setPort(newServerPort);
            client.send(packet);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void sendToNewServer(byte[] receivedData) {
        if (heartBeatInterval != null) {
            // System.out.println("original data: " + Arrays.toString(receivedData) + "\n");
            byte[] obfuscatedData = obfuscator.obfuscation(receivedData);
            // System.out.println("obfuscated data: " + Arrays.toString(obfuscatedData));
            DatagramPacket packet = new DatagramPacket(obfuscatedData, obfuscatedData.length);
            try {
                packet.setAddress(InetAddress.getByName(handshakeServerAddress));
                packet.setPort(newServerPort);
                client.send(packet);
                System.out.println("packet sent to newServer " + handshakeServerAddress + ":" + newServerPort);
            } catch (Exception e) {
                e.printStackTrace();
            }
        } else {
            System.out.println("New server port is not available yet");
        }
    }

    private void sendToLocalWG(byte[] receivedData) {
        byte[] deobfuscatedData = obfuscator.deobfuscation(receivedData);
        DatagramPacket packet = new DatagramPacket(deobfuscatedData, deobfuscatedData.length);
        try {
            packet.setAddress(InetAddress.getByName(LOCALWG_ADDRESS));
            packet.setPort(LOCALWG_PORT);
            client.send(packet);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static boolean isNumeric(String str) {
        return str.matches("-?\\d+(\\.\\d+)?");
    }

    public static void main(String[] args) {
        try {
            UdpClient udpClient = new UdpClient();

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
