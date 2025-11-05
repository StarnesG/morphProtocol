"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startWSClient = startWSClient;
exports.stopWSClient = stopWSClient;
exports.WSClientStatus = WSClientStatus;
const dgram = __importStar(require("dgram"));
const Obfuscator_1 = require("../../Obfuscator");
const fnInitor_1 = require("../../fnInitor");
const WebSocket = require('ws');
let client;
let localUDP;
let handshakeInterval; // Declare handshakeInterval variable
let heartBeatInterval; // Declare heartBeatInterval variable
let clientOpenStatus = false;
let handshaked = false;
let localUDPOpenStatus = false;
function startWSClient(remoteAddress) {
    return new Promise((resolve, reject) => {
        const HANDSHAKE_SERVER_ADDRESS = remoteAddress; // Handshake server address
        const HANDSHAKE_SERVER_PORT = 8080; // Handshake server port
        const LOCALWG_ADDRESS = '127.0.0.1';
        const LOCALWG_PORT = 51820;
        const MAX_RETRIES = 5;
        const HEARTBEAT_INTERVAL = 30000;
        const LOCALUDP_PORT = 12301;
        const handshakeData = {
            key: Math.floor(Math.random() * 256),
            obfuscationLayer: 3,
            randomPadding: 8,
            fnInitor: (0, fnInitor_1.fnInitor)()
        };
        // Create an instance of the Obfuscator class
        const obfuscator = new Obfuscator_1.Obfuscator(handshakeData.key, handshakeData.obfuscationLayer, handshakeData.randomPadding, handshakeData.fnInitor);
        if (handshakeInterval) {
            clearInterval(handshakeInterval);
        }
        if (heartBeatInterval) {
            clearInterval(heartBeatInterval);
        }
        if (client && clientOpenStatus) {
            client.close();
        }
        // Create a UDP client socket
        client = new WebSocket(`ws://${HANDSHAKE_SERVER_ADDRESS}:${HANDSHAKE_SERVER_PORT}`);
        let clientRetry = 0;
        localUDP = dgram.createSocket('udp4');
        localUDP.on('message', (msg, remote) => {
            if (remote.port == LOCALWG_PORT) {
                sendWGToServer(msg);
            }
            else {
                console.log(`unknown udp msg from: ${remote.address}:${remote.port}`);
            }
        });
        localUDP.on('close', () => {
            localUDPOpenStatus = false;
            if (handshakeInterval) {
                clearInterval(handshakeInterval);
            }
            if (heartBeatInterval) {
                clearInterval(heartBeatInterval);
            }
            if (client && clientOpenStatus) {
                client.close();
            }
        });
        localUDP.on('listening', () => {
            localUDPOpenStatus = true;
        });
        localUDP.bind(LOCALUDP_PORT);
        // Function to send handshake data to the handshake server
        function sendHandshakeData() {
            // Send the handshake data to the handshake server
            client.send(JSON.stringify({
                type: 'handshake',
                data: handshakeData
            }));
        }
        // Handle incoming messages from the handshake server and the new UDP server
        client.on('message', (message) => {
            // Message received from the handshake server
            if (JSON.parse(message.toString()).type === "info" && JSON.parse(message.toString()).data === "inactivity") {
                // Stop sending handshake data and start communication with the new UDP server
                if (handshakeInterval) {
                    clearInterval(handshakeInterval);
                }
                if (heartBeatInterval) {
                    clearInterval(heartBeatInterval);
                }
                if (client && clientOpenStatus) {
                    client.close();
                }
                if (localUDP && localUDPOpenStatus) {
                    localUDP.close();
                }
            }
            else if (JSON.parse(message.toString()).type === "info" && JSON.parse(message.toString()).data === "server_full") {
                // Stop sending handshake data and start communication with the new UDP server
                if (handshakeInterval) {
                    clearInterval(handshakeInterval);
                }
                if (heartBeatInterval) {
                    clearInterval(heartBeatInterval);
                }
                if (client && clientOpenStatus) {
                    client.close();
                }
                if (localUDP && localUDPOpenStatus) {
                    localUDP.close();
                }
                reject("server_full");
            }
            else if (JSON.parse(message.toString()).type === "handshake") {
                console.log(`Received handshake`);
                // Stop sending handshake data and start communication with the new UDP server
                if (handshakeInterval) {
                    clearInterval(handshakeInterval);
                }
                heartBeatInterval = setInterval(() => {
                    client.send(JSON.stringify({
                        type: 'heartbeat',
                        data: null
                    }));
                }, HEARTBEAT_INTERVAL);
                handshaked = true;
                // Resolve the promise with the client port once everything is set up
                resolve();
            }
            else if (JSON.parse(message.toString()).type === "wg") {
                const data = JSON.parse(message.toString()).data;
                const keys = Object.keys(data);
                const values = keys.map(key => data[key]);
                const typedArray = new Uint8Array(values);
                sendToLocalWG(typedArray.buffer);
            }
            else if (JSON.parse(message.toString()).type === "heartbeat") {
                console.log("heartbeat msg received");
            }
            else {
                console.error('Invalid new server port received:', message.toString());
            }
        });
        // Function to send data to the new UDP server
        function sendWGToServer(message) {
            if (handshaked) {
                const obfuscatedData = obfuscator.obfuscation(message);
                client.send(JSON.stringify({
                    type: 'wg',
                    data: obfuscatedData
                }));
                console.log('Data sent to server');
            }
            else {
                console.error('server is not available yet');
            }
        }
        // Function to send data to the new UDP server
        function sendToLocalWG(message) {
            if (localUDPOpenStatus) {
                const deobfuscatedData = obfuscator.deobfuscation(message);
                localUDP.send(deobfuscatedData, 0, deobfuscatedData.length, LOCALWG_PORT, LOCALWG_ADDRESS, (error) => {
                    if (error) {
                        console.error('Failed to send data to local-wg server:', error);
                    }
                    else {
                        console.log('Data sent to local-wg server');
                    }
                });
            }
        }
        client.on('open', () => {
            clientOpenStatus = true;
            // Send handshake data initially
            sendHandshakeData();
            // Set an interval to send handshake data periodically
            handshakeInterval = setInterval(() => {
                sendHandshakeData();
                clientRetry++;
                if (clientRetry >= MAX_RETRIES) {
                    clearInterval(handshakeInterval);
                    client.close();
                    reject("max_retries");
                }
            }, 5000);
        });
        client.on('close', () => {
            handshaked = false;
            clientOpenStatus = false;
            if (handshakeInterval) {
                clearInterval(handshakeInterval);
            }
            if (heartBeatInterval) {
                clearInterval(heartBeatInterval);
            }
            if (localUDP && localUDPOpenStatus) {
                localUDP.close();
                localUDPOpenStatus = false;
            }
        });
    });
}
function stopWSClient() {
    return new Promise((resolve, reject) => {
        // Stop sending handshake data and heartbeats
        if (handshakeInterval) {
            clearInterval(handshakeInterval);
        }
        if (heartBeatInterval) {
            clearInterval(heartBeatInterval);
        }
        if (localUDP && localUDPOpenStatus) {
            localUDP.close(() => {
                // Unreference the socket to allow the application to exit even if the socket is still open
                localUDP.unref();
                // Resolve the promise to indicate that the socket has been closed and destroyed
            });
            localUDPOpenStatus = false;
        }
        if (client && clientOpenStatus) {
            // Close the UDP socket
            client.close();
            resolve();
        }
        else {
            // If the client variable is not defined, assume that the socket is already closed
            resolve();
        }
    });
}
function WSClientStatus() {
    return handshaked;
}
//startWSClient("127.0.0.1")
