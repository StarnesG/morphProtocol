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
exports.startTCPClient = startTCPClient;
exports.stopTCPClient = stopTCPClient;
exports.TCPClientStatus = TCPClientStatus;
const net = __importStar(require("net"));
const dgram = __importStar(require("dgram"));
const Obfuscator_1 = require("../../Obfuscator");
const fnInitor_1 = require("../../fnInitor");
let client;
let localUDP;
let handshakeInterval; // Declare handshakeInterval variable
let heartBeatInterval; // Declare heartBeatInterval variable
let clientOpenStatus = false;
let handshaked = false;
let localUDPOpenStatus = false;
const MESSAGE_TYPE_HANDSHAKE = 0x01;
const MESSAGE_TYPE_HEARTBEAT = 0x02;
const MESSAGE_TYPE_WG = 0x03;
const MESSAGE_TYPE_INACTIVITY = 0x04;
const constantValue = 0x25748935; // Replace this with your desired constant value
const separatorBuffer = Buffer.alloc(4);
// Write the constant value into the Buffer
separatorBuffer.writeUInt32LE(constantValue, 0);
function startTCPClient(remoteAddress) {
    return new Promise((resolve, reject) => {
        const HANDSHAKE_SERVER_ADDRESS = remoteAddress; // Handshake server address
        const HANDSHAKE_SERVER_PORT = 8080; // Handshake server port
        const LOCALWG_ADDRESS = '192.168.50.239';
        const LOCALWG_PORT = 51820;
        const MAX_RETRIES = 5;
        const HEARTBEAT_INTERVAL = 30000;
        const LOCALUDP_PORT = 12301;
        let msgQueue = null;
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
            client.destroy();
        }
        // Create a UDP client socket
        client = new net.Socket();
        client.connect(HANDSHAKE_SERVER_PORT, HANDSHAKE_SERVER_ADDRESS);
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
                client.destroy();
            }
        });
        localUDP.on('listening', () => {
            localUDPOpenStatus = true;
        });
        localUDP.bind(LOCALUDP_PORT);
        // Function to send handshake data to the handshake server
        function sendHandshakeData() {
            // Send the handshake data to the handshake server
            // Create a binary buffer with a header for handshake and the handshakeData as the body
            const headerBuffer = Buffer.alloc(1);
            headerBuffer.writeUInt8(MESSAGE_TYPE_HANDSHAKE);
            const handshakeDataBuffer = Buffer.from(JSON.stringify(handshakeData));
            // Concatenate the header, body, and separator
            const messageBuffer = Buffer.concat([headerBuffer, handshakeDataBuffer, separatorBuffer]);
            // Send the binary message
            client.write(messageBuffer);
        }
        // Handle incoming messages from the handshake server and the new UDP server
        client.on('data', (data) => {
            //console.log(data);
            if (msgQueue === undefined) {
                return -1;
            }
            if (msgQueue === null) {
                msgQueue = Buffer.from(data);
            }
            else {
                msgQueue = Buffer.concat([msgQueue, Buffer.from(data)]);
            }
            while (true) {
                // Find the position of the separator '$%&*'
                const separatorIndex = msgQueue.indexOf(separatorBuffer);
                if (separatorIndex === -1) {
                    // If no separator is found, break and wait for more data
                    break;
                }
                // Extract the binary message up to the separator
                const messageBuffer = msgQueue.subarray(0, separatorIndex);
                // Remove the processed message and separator from msgQueue
                msgQueue = msgQueue.subarray(separatorIndex + 4);
                // Parse the message type from the header
                const messageType = messageBuffer.readUInt8(0);
                // Process the message based on its type
                const messageBody = messageBuffer.subarray(1);
                switch (messageType) {
                    case MESSAGE_TYPE_HANDSHAKE:
                        // Handle handshake message
                        console.log(`Received handshake`);
                        // Stop sending handshake data and start communication with the new UDP server
                        if (handshakeInterval) {
                            clearInterval(handshakeInterval);
                        }
                        heartBeatInterval = setInterval(() => {
                            // Create a binary buffer with a header for heartbeat and no body
                            const headerBuffer = Buffer.alloc(1);
                            headerBuffer.writeUInt8(MESSAGE_TYPE_HEARTBEAT);
                            // Concatenate the header and separator
                            const messageBuffer = Buffer.concat([headerBuffer, separatorBuffer]);
                            // Send the binary message
                            client.write(messageBuffer);
                        }, HEARTBEAT_INTERVAL);
                        handshaked = true;
                        // Resolve the promise with the client port once everything is set up
                        resolve();
                        // ...
                        break;
                    case MESSAGE_TYPE_WG:
                        // Handle wg message
                        const typedArray = new Uint8Array(messageBody);
                        sendToLocalWG(typedArray.buffer);
                        // messageBody contains obfuscated data
                        // ...
                        break;
                    case MESSAGE_TYPE_HEARTBEAT:
                        // Handle heartbeat message
                        console.log("heartbeat msg received");
                        break;
                    case MESSAGE_TYPE_INACTIVITY:
                        // Stop sending handshake data and start communication with the new UDP server
                        if (handshakeInterval) {
                            clearInterval(handshakeInterval);
                        }
                        if (heartBeatInterval) {
                            clearInterval(heartBeatInterval);
                        }
                        if (client && clientOpenStatus) {
                            client.destroy();
                        }
                        if (localUDP && localUDPOpenStatus) {
                            localUDP.close();
                        }
                        break;
                    default:
                        console.error('Invalid message type:', messageType);
                }
            }
        });
        // Function to send data to the new UDP server
        function sendWGToServer(message) {
            if (handshaked) {
                const obfuscatedData = obfuscator.obfuscation(message);
                // Create a binary buffer with a header for wg and the obfuscatedData as the body
                const headerBuffer = Buffer.alloc(1);
                headerBuffer.writeUInt8(MESSAGE_TYPE_WG);
                const obfuscatedDataBuffer = Buffer.from(obfuscatedData);
                // Concatenate the header, body, and separator
                const messageBuffer = Buffer.concat([headerBuffer, obfuscatedDataBuffer, separatorBuffer]);
                // Send the binary message
                client.write(messageBuffer);
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
        client.on('connect', () => {
            clientOpenStatus = true;
            // Send handshake data initially
            sendHandshakeData();
            // Set an interval to send handshake data periodically
            handshakeInterval = setInterval(() => {
                sendHandshakeData();
                clientRetry++;
                if (clientRetry >= MAX_RETRIES) {
                    clearInterval(handshakeInterval);
                    client.destroy();
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
        client.on('error', (error) => {
            console.error('Socket error:', error);
            // Handle the error gracefully, e.g., close the socket
            client.destroy(); // Close the socket to prevent crashing
        });
    });
}
function stopTCPClient() {
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
            client.destroy();
            resolve();
        }
        else {
            // If the client variable is not defined, assume that the socket is already closed
            resolve();
        }
    });
}
function TCPClientStatus() {
    return handshaked;
}
startTCPClient("127.0.0.1");
