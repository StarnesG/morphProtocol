package com.morph_vpn.plugin.wireguard_obfuscation;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Message;
import android.os.Messenger;

import org.json.JSONArray;
import org.json.JSONException;

import java.lang.ref.WeakReference;
import android.util.Log;

@CapacitorPlugin(name = "Wireguard_obfuscationPlugin")
public class Wireguard_obfuscationPlugin extends Plugin {
    private Messenger serviceMessenger;
    private ServiceConnection serviceConnection;

    @Override
    public void load() {
        super.load();
        serviceConnection = new ServiceConnection() {
            @Override
            public void onServiceConnected(ComponentName name, IBinder service) {
                System.out.println("connected to service.");
                serviceMessenger = new Messenger(service);
            }
    
            @Override
            public void onServiceDisconnected(ComponentName name) {
                System.out.println("disconnected to service.");
                serviceMessenger = null;
            }
        };
    }

    @PluginMethod()
    public void startUDPClient(PluginCall call) {
        String remoteAddress = call.getString("remoteAddress");
        String rpk = call.getString("rpk");
        JSObject ret = new JSObject();
        Message message = Message.obtain(null, Wireguard_obfuscationService.START_UDP_CLIENT);
        Bundle data = new Bundle();
        data.putString("remoteAddress", remoteAddress);
        data.putString("rpk", rpk);
        message.setData(data); // Set the data in the message
        message.replyTo = new Messenger(new Handler() {
            @Override
            public void handleMessage(Message msg) {
                switch (msg.what) {
                    case Wireguard_obfuscationService.START_UDP_CLIENT_SUCCESS:
                        String udpClientPort = (String) msg.obj;
                        ret.put("msg", udpClientPort);
                        call.resolve(ret);
                        break;
                    case Wireguard_obfuscationService.START_UDP_CLIENT_ERROR:
                        call.reject("Failed to start UDP client");
                        break;
                }
            }
        });
        try {
            serviceMessenger.send(message);
        } catch (Exception e) {
            e.printStackTrace();
            call.reject("Failed to start UDP client: " + e.getMessage());
        }
    }

    @PluginMethod()
    public void stopUDPClient(PluginCall call) {
        JSObject ret = new JSObject();
        Message message = Message.obtain(null, Wireguard_obfuscationService.STOP_UDP_CLIENT);
        message.replyTo = new Messenger(new Handler() {
            @Override
            public void handleMessage(Message msg) {
                switch (msg.what) {
                    case Wireguard_obfuscationService.STOP_UDP_CLIENT_SUCCESS:
                        ret.put("msg", "UDP client stopped successfully");
                        call.resolve(ret);
                        break;
                    case Wireguard_obfuscationService.STOP_UDP_CLIENT_ERROR:
                    call.reject("Failed to stop UDP client");
                        break;
                }
            }
        });
        try {
            serviceMessenger.send(message);
        } catch (Exception e) {
            e.printStackTrace();
            call.reject("Failed to stop UDP client: " + e.getMessage());
        }
    }

    @PluginMethod()
    public void startTCPClient(PluginCall call) {
        String remoteAddress = call.getString("remoteAddress");
        String rpk = call.getString("rpk");
        JSObject ret = new JSObject();
        Message message = Message.obtain(null, Wireguard_obfuscationService.START_TCP_CLIENT);
        Bundle data = new Bundle();
        data.putString("remoteAddress", remoteAddress);
        data.putString("rpk", rpk);
        message.setData(data); // Set the data in the message
        message.replyTo = new Messenger(new Handler() {
            @Override
            public void handleMessage(Message msg) {
                switch (msg.what) {
                    case Wireguard_obfuscationService.START_TCP_CLIENT_SUCCESS:
                        ret.put("msg", "TCP client started");
                        call.resolve(ret);
                        break;
                    case Wireguard_obfuscationService.START_TCP_CLIENT_ERROR:
                        call.reject("Failed to start TCP client");
                        break;
                }
            }
        });
        try {
            serviceMessenger.send(message);
        } catch (Exception e) {
            e.printStackTrace();
            call.reject("Failed to start TCP client: " + e.getMessage());
        }
    }

    @PluginMethod()
    public void stopTCPClient(PluginCall call) {
        JSObject ret = new JSObject();
        Message message = Message.obtain(null, Wireguard_obfuscationService.STOP_TCP_CLIENT);
        message.replyTo = new Messenger(new Handler() {
            @Override
            public void handleMessage(Message msg) {
                switch (msg.what) {
                    case Wireguard_obfuscationService.STOP_TCP_CLIENT_SUCCESS:
                        ret.put("msg", "TCP client stopped successfully");
                        call.resolve(ret);
                        break;
                    case Wireguard_obfuscationService.STOP_TCP_CLIENT_ERROR:
                        call.reject("Failed to stop TCP client");
                        break;
                }
            }
        });
        try {
            serviceMessenger.send(message);
        } catch (Exception e) {
            e.printStackTrace();
            call.reject("Failed to stop TCP client: " + e.getMessage());
        }
    }

    @PluginMethod()
    public void startService(PluginCall call) {
        JSObject ret = new JSObject();
        try {
            Context ctx = this.getActivity().getApplicationContext();
            serviceMessenger = null;
            Intent intent = new Intent(ctx,
                    Wireguard_obfuscationService.class);
                    ctx.startService(intent);
                    ctx.bindService(intent, serviceConnection,
                    Context.BIND_AUTO_CREATE);
            ret.put("msg", "service started successfully");
            call.resolve(ret);
        } catch (Exception e) {
            e.printStackTrace();
            call.reject("Failed to start service: " + e.getMessage());
        }

    }

    @PluginMethod()
    public void stopService(PluginCall call) {
        JSObject ret = new JSObject();
        try {
            Context ctx = this.getActivity().getApplicationContext();
            if (serviceMessenger != null) {
                ctx.unbindService(serviceConnection);
                Intent intent = new Intent(ctx,
                        Wireguard_obfuscationService.class);
                        ctx.stopService(intent);
                serviceMessenger = null;
            }
            ret.put("msg", "service stop successfully");
            call.resolve(ret);
        } catch (Exception e) {
            e.printStackTrace();
            call.reject("Failed to stop service: " + e.getMessage());
        }

    }
}