package com.morph_vpn.plugin.wireguard_obfuscation;

import java.util.Arrays;
import java.nio.charset.StandardCharsets;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.Socket;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;
import java.net.URISyntaxException;
import java.util.Timer;
import java.util.TimerTask;
import java.util.Iterator;

import java.net.SocketException;

public class TCPClient {
    private String userId;
    private String HANDSHAKE_SERVER_ADDRESS;
    private int HANDSHAKE_SERVER_PORT;
    private static final int LOCALUDP_PORT = 12301;
    private static final int MAX_RETRIES = 5;
    private static final int HEARTBEAT_INTERVAL = 30000;
    private static final String LOCALWG_ADDRESS = "127.0.0.1";
    private static final int LOCALWG_PORT = 51820;
    private TCPClientCallback callback;
    private byte[] MESSAGE_TYPE_HANDSHAKE = new byte[] { (byte) 0x01 };
    private byte[] MESSAGE_TYPE_HEARTBEAT = new byte[] { (byte) 0x02 };
    private byte[] MESSAGE_TYPE_WG = new byte[] { (byte) 0x03 };
    private byte[] MESSAGE_TYPE_INACTIVITY = new byte[] { (byte) 0x04 };

    private final int MESSAGE_TYPE_HANDSHAKE_INT = 0x01;
    private final int MESSAGE_TYPE_HEARTBEAT_INT = 0x02;
    private final int MESSAGE_TYPE_WG_INT = 0x03;
    private final int MESSAGE_TYPE_INACTIVITY_INT = 0x04;

    private byte[] separator = new byte[] { 
        (byte) 0x35, (byte) 0x89, 
        (byte) 0x74, (byte) 0x25 
    };  // Separator: 0x25748935
    private int SEPARATOR_CONSTANT = 0x25748935;

    private Socket socket;
    private DatagramSocket localUDP;
    private InputStream inputStream;
    private OutputStream outputStream;
    private Timer handshakeTimer;
    private Timer heartbeatTimer;
    private boolean clientOpenStatus;
    private boolean handshaked;
    private boolean localUDPOpenStatus;
    private HandshakeData handshakeData;
    private Obfuscator obfuscator;
    private Thread udpMessageListenerThread = null;
    private Thread socketMessageListenerThread = null;
    private Encryptor encryptor;

    private byte[] msgQueue = null;
    // ... (other member variables)

    public TCPClient(String remoteAddr, TCPClientCallback cb) {
        socket = null;
        localUDP = null;
        handshakeTimer = null;
        heartbeatTimer = null;
        clientOpenStatus = false;
        handshaked = false;
        localUDPOpenStatus = false;
        callback = cb;
        HANDSHAKE_SERVER_ADDRESS = remoteAddr;
        msgQueue = null;
        encryptor = new Encryptor("ULTzUl/OIfjDtbmr1q");
    }

    public void startTCPClient(String rAddress, String rpk) {
        try {
            String[] addressSplit = rAddress.split(":");
            userId = addressSplit[2];
            handshakeData = new HandshakeData(3, 8, userId, encryptor.convertPublicKeyToString());
            obfuscator = new Obfuscator(
                    handshakeData.key,
                    handshakeData.obfuscationLayer,
                    handshakeData.randomPadding,
                    handshakeData.fnInitor
            );
            // Connect to the server
            HANDSHAKE_SERVER_ADDRESS = addressSplit[0];
            HANDSHAKE_SERVER_PORT = Integer.parseInt(addressSplit[1]);
            socket = new Socket(HANDSHAKE_SERVER_ADDRESS, HANDSHAKE_SERVER_PORT);
            inputStream = socket.getInputStream();
            outputStream = socket.getOutputStream();
            clientOpenStatus = true;
            System.out.println("Connected to server.");

            initializeSocketListener();
            initializeUDPMessageListener();
            initializeHandshake();
            initializeHeartbeat();
            // Your code for sending and receiving data goes here
            
        } catch (IOException e) {
            clientOpenStatus = false;
            handshaked = false;
            if(callback != null) {
                callback.onTCPClientError();
            }
            e.printStackTrace();
        }
    }

    private int findSeparatorIndex() {
        int index = -1;
        for (int i = 0; i < msgQueue.length - 3; i++) {
            if (msgQueue[i] == (byte) (0x35) &&
                msgQueue[i + 1] == (byte) (0x89) &&
                msgQueue[i + 2] == (byte) (0x74) &&
                msgQueue[i + 3] == (byte) (0x25)) {
                index = i;
                break;
            }
        }
        return index;
    }

    private void initializeSocketListener() {
        socketMessageListenerThread = new Thread(() -> {
            byte[] receiveBuffer = new byte[1024]; // Adjust buffer size as needed
            try {
                while (true) {
                    if(socket.isClosed()) {
                        clientOpenStatus = false;
                        handshaked = false;
                        System.out.println("Connection closed.");
                        break;
                    }
                    int bytesRead = inputStream.read(receiveBuffer); 
                    if (bytesRead > 0) {
                        byte[] data = Arrays.copyOf(receiveBuffer, bytesRead);
                        if (msgQueue == null) {
                            msgQueue = Arrays.copyOf(data, data.length);
                        } else {
                            byte[] newQueue = new byte[msgQueue.length + data.length];
                            System.arraycopy(msgQueue, 0, newQueue, 0, msgQueue.length);
                            System.arraycopy(data, 0, newQueue, msgQueue.length, data.length);
                            msgQueue = newQueue;
                        }
                        while (true) {
                            // Find the position of the separator '$%&*'
                            int separatorIndex = findSeparatorIndex();

                            if (separatorIndex == -1) {
                                // If no separator is found, break and wait for more data
                                break;
                            }

                            // Extract the binary message up to the separator
                            byte[] messageBuffer = Arrays.copyOfRange(msgQueue, 0, separatorIndex);

                            // Remove the processed message and separator from msgQueue
                            byte[] newMsgQueue = new byte[msgQueue.length - messageBuffer.length - 4];
                            System.arraycopy(msgQueue, separatorIndex + 4, newMsgQueue, 0, newMsgQueue.length);
                            msgQueue = newMsgQueue;

                            // Parse the message type from the header
                            byte messageType = messageBuffer[0];

                            // Process the message based on its type
                            byte[] messageBody = Arrays.copyOfRange(messageBuffer, 1, messageBuffer.length);
                            
                            switch (messageType & 0xFF) {
                                case MESSAGE_TYPE_INACTIVITY_INT:
                                     try {
                                        if (handshakeTimer != null) {
                                        handshakeTimer.cancel();
                                        handshakeTimer.purge();
                                        }
                                        if (heartbeatTimer != null) {
                                            heartbeatTimer.cancel();
                                            heartbeatTimer.purge();
                                        }
                                        if (socket != null && !socket.isClosed()) {
                                            stopTCPClient();
                                        }
                                    }
                                    catch (Exception e) {
                                        e.printStackTrace();
                                    }
                                    if (localUDP != null) {
                                        localUDP.close();
                                        localUDPOpenStatus = false;
                                    }
                                    break;
                                case MESSAGE_TYPE_HANDSHAKE_INT:
                                    try {
                                        System.out.println("Received handshake");
                                        handshaked = true;
                                        if (handshakeTimer != null) {
                                            handshakeTimer.cancel();
                                            handshakeTimer.purge();
                                        }
                                        if (heartbeatTimer != null) {
                                            heartbeatTimer.cancel();
                                            heartbeatTimer.purge();
                                        }
                                        heartbeatTimer = new Timer();
                                        heartbeatTimer.schedule(new TimerTask() {
                                            @Override
                                            public void run() {
                                                sendHeartbeat();
                                            }
                                        }, HEARTBEAT_INTERVAL, HEARTBEAT_INTERVAL);
                                        if (callback != null) {
                                            callback.onTCPClientStarted();
                                        }
                                    }
                                    catch(Exception e) {
                                        e.printStackTrace();
                                    }
                                    break;
                                case MESSAGE_TYPE_WG_INT:
                                    sendToLocalWG(messageBody);
                                    break;
                                case MESSAGE_TYPE_HEARTBEAT_INT:
                                    System.out.println("Received heartbeat");
                                    break;
                            }
                        }
                    }
                }
            } 
            catch (IOException e) {
                // Socket closed or error, handle as needed
                clientOpenStatus = false;
                handshaked = false;
                if(callback != null) {
                    callback.onTCPClientError();
                }
                e.printStackTrace();
            }
            catch (Exception e) {
                e.printStackTrace();
            }
        });
        socketMessageListenerThread.start();
    }

    private void initializeHandshake() {
        TimerTask handshakeTask = new TimerTask() {
            int retries = 0;

            @Override
            public void run() {
                try {
                    sendHandshakeData();
                }
                catch (JSONException e) {
                    e.printStackTrace();
                } 
                catch (IOException e) {
                    e.printStackTrace();
                }
                retries++;
                if (retries >= MAX_RETRIES) {
                    cancel();
                    try {
                        if(socket != null) {
                           stopTCPClient();
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            }
        };
        handshakeTimer = new Timer();
        handshakeTimer.schedule(handshakeTask, 0, 5000);
    }

    private void initializeHeartbeat() {
        TimerTask heartbeatTask = new TimerTask() {
            @Override
            public void run() {
                sendHeartbeat();
            }
        };
        heartbeatTimer = new Timer();
        heartbeatTimer.schedule(heartbeatTask, HEARTBEAT_INTERVAL, HEARTBEAT_INTERVAL);
    }

    public boolean getTCPClientStatus() {
        return this.handshaked;
    }

    private void initializeUDPMessageListener() throws SocketException {
        localUDP = new DatagramSocket(LOCALUDP_PORT);
        localUDPOpenStatus = true;

        //initialize UDP
        udpMessageListenerThread = new Thread(() -> {
            byte[] receiveUdpBuffer = new byte[65535];
            DatagramPacket receiveUdpPacket = new DatagramPacket(receiveUdpBuffer, receiveUdpBuffer.length);
            try {
                while (true) {
                    localUDP.receive(receiveUdpPacket);
                    InetAddress remoteUdpAddress = receiveUdpPacket.getAddress();
                    int remoteUdpPort = receiveUdpPacket.getPort();
                    if (remoteUdpPort == LOCALWG_PORT) {
                        byte[] receivedUdpData = new byte[receiveUdpPacket.getLength()];
                        System.arraycopy(receiveUdpPacket.getData(), receiveUdpPacket.getOffset(), receivedUdpData, 0, receiveUdpPacket.getLength());
                        sendWGToServer(receivedUdpData);
                    } else {
                        System.out.println("Unknown UDP message from: " + remoteUdpAddress.getHostAddress() + ":" + remoteUdpPort);
                    }
                }
            } catch (IOException e) {
                // Socket closed, do nothing
                e.printStackTrace();
            } catch (Exception e) {
                e.printStackTrace();
            }
        });
        udpMessageListenerThread.start();
    }

    private void sendHandshakeData() throws JSONException, IOException {
        if (socket != null && !socket.isClosed()) {
            // Send the handshake data to the handshake server
            try {
                 StringBuilder arrayString = new StringBuilder();
                for (Integer value : handshakeData.fnInitor.substitutionTable) {
                    arrayString.append(value).append(", ");
                }

                // Remove the trailing comma and space
                if (arrayString.length() > 0) {
                    arrayString.delete(arrayString.length() - 2, arrayString.length());
                }
                 String handshakeStr = String.format(
                    "{\"randomPadding\":%d,\"obfuscationLayer\":%d,\"fnInitor\":{\"randomValue\":%d,\"substitutionTable\":[%s]},\"key\":%d,\"userId\":%s}", 
                    handshakeData.randomPadding, 
                    handshakeData.obfuscationLayer,
                    handshakeData.fnInitor.randomValue,
                    arrayString.toString(),
                    handshakeData.key,
                    handshakeData.userId
                );
                // Add a header and separator to the handshake data
                byte[] strData = handshakeStr.getBytes();

                // Combine the header, handshake data, and separator
                byte[] data = new byte[MESSAGE_TYPE_HANDSHAKE.length + strData.length + separator.length];
                System.arraycopy(MESSAGE_TYPE_HANDSHAKE, 0, data, 0, MESSAGE_TYPE_HANDSHAKE.length);
                System.arraycopy(strData, 0, data, MESSAGE_TYPE_HANDSHAKE.length, strData.length);
                System.arraycopy(separator, 0, data, MESSAGE_TYPE_HANDSHAKE.length + strData.length, separator.length);
                outputStream.write(data);
                outputStream.flush();
            } catch (IOException e) {
                clientOpenStatus = false;
                handshaked = false;
                if(callback != null) {
                    callback.onTCPClientError();
                }
                e.printStackTrace();
            }
        }
    }

    private void sendHeartbeat() {
        if (clientOpenStatus && socket != null && !socket.isClosed()) {
            try {
                // Combine the header, handshake data, and separator
                byte[] data = new byte[MESSAGE_TYPE_HEARTBEAT.length + separator.length];
                System.arraycopy(MESSAGE_TYPE_HEARTBEAT, 0, data, 0, MESSAGE_TYPE_HEARTBEAT.length);
                System.arraycopy(separator, 0, data, MESSAGE_TYPE_HEARTBEAT.length, separator.length);
                outputStream.write(data);
                outputStream.flush();
                // Send heartbeat message
            } catch (IOException e) {
                clientOpenStatus = false;
                handshaked = false;
                if(callback != null) {
                    callback.onTCPClientError();
                }
                e.printStackTrace();
            }
        }
    }

    // Other methods (sendWGToServer, sendToLocalWG, etc.) go here
    private void sendWGToServer(byte[] message) throws JSONException {
        if (this.handshaked && socket != null && !socket.isClosed()) {
            // Obfuscate the data if necessary
            byte[] obfuscatedData = obfuscator.obfuscation(message);
            // Send the obfuscated data to the new UDP server
            try {
                byte[] data = new byte[MESSAGE_TYPE_WG.length + obfuscatedData.length + separator.length];
                System.arraycopy(MESSAGE_TYPE_WG, 0, data, 0, MESSAGE_TYPE_WG.length);
                System.arraycopy(obfuscatedData, 0, data, MESSAGE_TYPE_WG.length, obfuscatedData.length);
                System.arraycopy(separator, 0, data, MESSAGE_TYPE_WG.length + obfuscatedData.length, separator.length);
                outputStream.write(data);
                outputStream.flush();
            } catch (IOException e) {
                clientOpenStatus = false;
                handshaked = false;
                if(callback != null) {
                    callback.onTCPClientError();
                }
                e.printStackTrace();
            }
        } else {
            System.err.println("Server is not available yet");
        }
    }

    private void sendToLocalWG(byte[] message) {
        if (localUDPOpenStatus) {
            // Deobfuscate the data if necessary
            byte[] deobfuscatedData = obfuscator.deobfuscation(message);

            try {
                DatagramPacket packet = new DatagramPacket(deobfuscatedData, deobfuscatedData.length, InetAddress.getByName(LOCALWG_ADDRESS), LOCALWG_PORT);
                localUDP.send(packet);
            } catch (IOException e) {
                // Socket closed, do nothing
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }


    public void stopTCPClient() {
        System.out.println("Stopping...");
        if (handshakeTimer != null) {
            handshakeTimer.cancel();
            handshakeTimer.purge();
        }
        if (heartbeatTimer != null) {
            heartbeatTimer.cancel();
            heartbeatTimer.purge();
        }
        try {
            if (socket != null) {
                clientOpenStatus = false;
                handshaked = false;
                socket.close();
            }
        } catch (IOException e) {
            clientOpenStatus = false;
            handshaked = false;
            e.printStackTrace();
        }
        if (localUDP != null) {
            localUDP.close();
            localUDPOpenStatus = false;
        }
        if (udpMessageListenerThread != null && udpMessageListenerThread.isAlive()) {
            udpMessageListenerThread.interrupt();
            try {
                udpMessageListenerThread.join();
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            udpMessageListenerThread = null;
        }
        if (socketMessageListenerThread != null && socketMessageListenerThread.isAlive()) {
            socketMessageListenerThread.interrupt();
            try {
                socketMessageListenerThread.join();
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            socketMessageListenerThread = null;
        }
    }
}
