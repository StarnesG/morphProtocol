package com.morph_vpn.plugin.wireguard_obfuscation;

import android.app.Service;
import android.content.Intent;
import android.os.IBinder;
import android.os.Message;
import android.os.Messenger;
import android.os.RemoteException;
import android.util.Log;

import android.os.Handler;
import java.lang.ref.WeakReference;
import org.json.JSONException;

import java.util.Timer;
import java.util.TimerTask;
import android.os.Bundle;

public class Wireguard_obfuscationService extends Service {
    private static final String TAG = "Wireguard_obfuscationService";

    // Define the missing static variables here
    public static final int START_UDP_CLIENT = 1;
    public static final int START_UDP_CLIENT_SUCCESS = 2;
    public static final int START_UDP_CLIENT_ERROR = 3;
    public static final int STOP_UDP_CLIENT = 4;
    public static final int STOP_UDP_CLIENT_SUCCESS = 5;
    public static final int STOP_UDP_CLIENT_ERROR = 6;

    public static final int START_TCP_CLIENT = 7;
    public static final int START_TCP_CLIENT_SUCCESS = 8;
    public static final int START_TCP_CLIENT_ERROR = 9;
    public static final int STOP_TCP_CLIENT = 10;
    public static final int STOP_TCP_CLIENT_SUCCESS = 11;
    public static final int STOP_TCP_CLIENT_ERROR = 12;

    private Messenger messenger;

    private UdpClient udpClient;
    private Thread udpThread;

    private TCPClient tcpClient;
    private Thread tcpThread;

    private boolean isUDPClientStarted;
    private boolean isTCPClientStarted;

    
    private Timer timer;
 
    private TimerTask timerTask;

    private int count = 0;

    @Override
    public void onCreate() {
        super.onCreate();
        messenger = new Messenger(new MyHandler(this));
        Log.d(TAG, "Service created");
        // 
        // timer = new Timer();
        // 
        // timerTask = new TimerTask() {
        //     @Override
        //     public void run() {
        //         
        //         count++;
        //         Log.d("MyService", "count:" + count);
        //     }
        // };
        // 
        // timer.schedule(timerTask, 0, 1000);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "Service started");
        return START_NOT_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        Log.d(TAG, "Service binded");
        return messenger.getBinder();
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        stopUDPClient();
        stopTCPClient();
        Log.d(TAG, "Service destroyed");
        
        // timer.cancel();
       
        // timerTask.cancel();
    }

    private void startUDPClient(String remoteAddress, String rpk, Messenger callbackMessenger) {
        try {
            udpClient = new UdpClient();
            udpThread = new Thread(() -> {
                udpClient.startUdpClient(remoteAddress, rpk, new UDPClientCallback() {
                    @Override
                    public void onUDPClientStarted(int[] portCombo) {
                        isUDPClientStarted = true;
                        String message = Integer.toString(portCombo[0]);
                        sendMessageToPlugin(callbackMessenger, Wireguard_obfuscationService.START_UDP_CLIENT_SUCCESS, message);
                    }

                    @Override
                    public void onUDPClientError() {
                        sendMessageToPlugin(callbackMessenger, Wireguard_obfuscationService.START_UDP_CLIENT_ERROR, "UDPClient error");
                    }
                });
            });
            udpThread.start();
        } catch (Exception e) {
            Log.e(TAG, "exception in startUDPClient: " + e.getMessage());
            e.printStackTrace();
            sendMessageToPlugin(callbackMessenger, Wireguard_obfuscationService.START_UDP_CLIENT_ERROR, "UDPClient error");
        }
    }

    private void stopUDPClient() {
        if (udpClient != null) {
            udpClient.stopUdpClient();
            isUDPClientStarted = false;
            if (udpThread != null && udpThread.isAlive()) {
                udpThread.interrupt();
                try {
                    udpThread.join();
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                udpThread = null;
            }
        }
    }

    private void startTCPClient(String remoteAddress, String rpk, Messenger callbackMessenger) {
        try {
             // Implement the WSClientCallback interface
            tcpClient = new TCPClient(remoteAddress, new TCPClientCallback() {
                @Override
                public void onTCPClientStarted() {
                    isTCPClientStarted = true;
                    System.out.println("Received tcp callback, sending to plugin...");
                    sendMessageToPlugin(callbackMessenger, Wireguard_obfuscationService.START_TCP_CLIENT_SUCCESS, "TCPClient started");
                }

                @Override
                public void onTCPClientError() {
                    sendMessageToPlugin(callbackMessenger, Wireguard_obfuscationService.START_TCP_CLIENT_ERROR, "TCPClient error");
                }
            });
            tcpThread = new Thread(() -> {
                tcpClient.startTCPClient(remoteAddress, rpk);
            });
            tcpThread.start();
        } catch (Exception e) {
            Log.e(TAG, "exception in startTCPClient: " + e.getMessage());
            e.printStackTrace();
            sendMessageToPlugin(callbackMessenger, Wireguard_obfuscationService.START_TCP_CLIENT_ERROR, "TCPClient error");
        }
    }

    private void stopTCPClient() {
        if (tcpClient != null) {
            tcpClient.stopTCPClient();
            isTCPClientStarted = false;
            if (tcpThread != null && tcpThread.isAlive()) {
                tcpThread.interrupt();
                try {
                    tcpThread.join();
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                tcpThread = null;
            }
        }
    }

    private void sendMessageToPlugin(Messenger callbackMessenger, int what, String messageText) {
        if (callbackMessenger == null) {
            return;
        }
        Message message = Message.obtain(null, what, messageText);
        try {
            callbackMessenger.send(message);
        } catch (RemoteException e) {
            e.printStackTrace();
        }
    }

    private static class MyHandler extends Handler {
        private final WeakReference<Wireguard_obfuscationService> serviceRef;

        public MyHandler(Wireguard_obfuscationService service) {
            serviceRef = new WeakReference<>(service);
        }

        @Override
        public void handleMessage(Message msg) {
            Wireguard_obfuscationService service = serviceRef.get();
            if (service == null) {
                return;
            }
            switch (msg.what) {
                case Wireguard_obfuscationService.START_UDP_CLIENT:
                    // Start the UDP client with the remoteAddress parameter
                    Bundle dataUDP = msg.getData();
                    if(dataUDP != null) {
                        String remoteAddressUDP = dataUDP.getString("remoteAddress");
                        String rpkUDP = dataUDP.getString("rpk");
                        Messenger callbackMessengerUDP = msg.replyTo;
                        if (!service.isUDPClientStarted) {
                            service.startUDPClient(remoteAddressUDP, rpkUDP, callbackMessengerUDP);
                        } else {
                            service.sendMessageToPlugin(callbackMessengerUDP, Wireguard_obfuscationService.START_UDP_CLIENT_ERROR, "UDPClient is already running");
                        }
                    }
                    break;
                case Wireguard_obfuscationService.STOP_UDP_CLIENT:
                    // Stop the UDP client
                    Messenger callbackMessengerUDPStop = msg.replyTo;
                    if (service.isUDPClientStarted) {
                        service.stopUDPClient();
                        service.sendMessageToPlugin(callbackMessengerUDPStop, Wireguard_obfuscationService.STOP_UDP_CLIENT_SUCCESS, "UDPClient stopped");
                    } else {
                        service.sendMessageToPlugin(callbackMessengerUDPStop, Wireguard_obfuscationService.STOP_UDP_CLIENT_ERROR, "UDPClient is not running");
                    }
                    break;
                case Wireguard_obfuscationService.START_TCP_CLIENT:
                    // Start the UDP client with the remoteAddress parameter
                    Bundle dataTCP = msg.getData();
                    if(dataTCP != null) {
                        String remoteAddressTCP = dataTCP.getString("remoteAddress");
                        String rpkTCP = dataTCP.getString("rpk");
                        Messenger callbackMessengerTCP = msg.replyTo;
                        if (!service.isTCPClientStarted) {
                            service.startTCPClient(remoteAddressTCP, rpkTCP, callbackMessengerTCP);
                        } else {
                            service.sendMessageToPlugin(callbackMessengerTCP, Wireguard_obfuscationService.START_TCP_CLIENT_ERROR, "TCPClient is already running");
                        }
                    }
                    break;
                case Wireguard_obfuscationService.STOP_TCP_CLIENT:
                    // Stop the UDP client
                    Messenger callbackMessengerTCPStop = msg.replyTo;
                    if (service.isTCPClientStarted) {
                        service.stopTCPClient();
                        service.sendMessageToPlugin(callbackMessengerTCPStop, Wireguard_obfuscationService.STOP_TCP_CLIENT_SUCCESS, "TCPClient stopped");
                    } else {
                        service.sendMessageToPlugin(callbackMessengerTCPStop, Wireguard_obfuscationService.STOP_TCP_CLIENT_ERROR, "TCPClient is not running");
                    }
                    break;
                default:
                    super.handleMessage(msg);
            }
        }
    }
}