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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const net = __importStar(require("net"));
const dgram = __importStar(require("dgram"));
const Obfuscator_1 = require("../../Obfuscator");
console.log(process.env.HANDSHAKE_PORT_TCP);
const PORT = Number(process.env.HANDSHAKE_PORT_TCP ? process.env.HANDSHAKE_PORT_TCP : 8080); // The port on which the initial UDP server listens
const TIMEOUT_DURATION = 1200000; // Time in milliseconds after which the new UDP server shuts down if no data is received
const LOCALWG_PORT = 51820;
const LOCALWG_ADDRESS = '0.0.0.0';
const MESSAGE_TYPE_HANDSHAKE = 0x01;
const MESSAGE_TYPE_HEARTBEAT = 0x02;
const MESSAGE_TYPE_WG = 0x03;
const MESSAGE_TYPE_INACTIVITY = 0x04;
const constantValue = 0x25748935; // Replace this with your desired constant value
const separatorBuffer = Buffer.alloc(4);
// Write the constant value into the Buffer
separatorBuffer.writeUInt32LE(constantValue, 0);
function sendBinaryInfoMessage(client, message) {
    const headerBuffer = Buffer.alloc(1);
    headerBuffer.writeUInt8(MESSAGE_TYPE_INACTIVITY);
    const messageBuffer = Buffer.from(message);
    const binaryMessage = Buffer.concat([headerBuffer, messageBuffer, separatorBuffer]);
    client.write(binaryMessage);
}
function sendBinaryHandshake(client) {
    const headerBuffer = Buffer.alloc(1);
    headerBuffer.writeUInt8(MESSAGE_TYPE_HANDSHAKE);
    const binaryMessage = Buffer.concat([headerBuffer, separatorBuffer]);
    client.write(binaryMessage);
}
function sendBinaryHeartbeat(client) {
    const headerBuffer = Buffer.alloc(1);
    headerBuffer.writeUInt8(MESSAGE_TYPE_HEARTBEAT);
    const binaryMessage = Buffer.concat([headerBuffer, separatorBuffer]);
    client.write(binaryMessage);
}
// Function to check if the new UDP server should shut down due to inactivity
function checkInactivityTimeout(clientID, client) {
    const lastMessageTimestamp = lastMessageTimestamps.get(clientID);
    if (lastMessageTimestamp) {
        const currentTime = Date.now();
        if (currentTime - lastMessageTimestamp >= TIMEOUT_DURATION) {
            console.log(`Shutting down UDP server for ${clientID} due to inactivity`);
            const newServer = activeServers.get(clientID);
            if (newServer) {
                sendBinaryInfoMessage(client, "inactivity");
                client.destroy();
                newServer.close();
                activeServers.delete(clientID);
                activeObfuscator.delete(clientID);
                activeClient.delete(clientID);
                lastMessageTimestamps.delete(clientID);
            }
        }
    }
}
// Create a map to store active UDP servers for each remote address
const activeServers = new Map();
const activeObfuscator = new Map();
const activeClient = new Map();
const activeMsgQueue = new Map();
// Map to store the last received message timestamp for each remote address
const lastMessageTimestamps = new Map();
const server = net.createServer();
server.listen(PORT, () => {
    console.log('TCP server listening on port', PORT);
});
server.on('connection', (socket) => __awaiter(void 0, void 0, void 0, function* () {
    const remote = { address: socket.remoteAddress, port: socket.remotePort };
    yield activeClient.set(`${remote.address}:${remote.port}`, socket);
    yield activeMsgQueue.set(`${remote.address}:${remote.port}`, null);
    let client = activeClient.get(`${remote.address}:${remote.port}`);
    //clientStatOperation(1)
    // Set a timer to check inactivity timeout
    const inactivityTimer = setInterval(() => {
        checkInactivityTimeout(`${remote.address}:${remote.port}`, client);
    }, TIMEOUT_DURATION);
    client.on('data', (data) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        console.log(`Received msg from ${remote.address}:${remote.port}`);
        let msgQueue = activeMsgQueue.get(`${remote.address}:${remote.port}`);
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
            lastMessageTimestamps.set(`${remote.address}:${remote.port}`, Date.now());
            switch (messageType) {
                case MESSAGE_TYPE_HEARTBEAT:
                    sendBinaryHeartbeat(client);
                    break;
                case MESSAGE_TYPE_HANDSHAKE:
                    console.log(`Handshake from ${remote.address}:${remote.port}: ${messageBody.toString()}`);
                    // Parse the handshake data from messageBody
                    const handshakeData = JSON.parse(messageBody.toString());
                    // Perform initialization work with the received data
                    const obfuscator = yield new Obfuscator_1.Obfuscator(handshakeData.key, handshakeData.obfuscationLayer, handshakeData.randomPadding, handshakeData.fnInitor);
                    // Store the obfuscator in the activeObfuscator map
                    yield activeObfuscator.set(`${remote.address}:${remote.port}`, obfuscator);
                    // Create a new UDP server and store it in the activeServers map
                    const newServer = yield dgram.createSocket('udp4');
                    yield activeServers.set(`${remote.address}:${remote.port}`, newServer);
                    // Handle the new UDP server's events and logic here as needed
                    // Respond to the handshake with a binary message if necessary
                    newServer.on('message', (newMessage, newRemote) => {
                        var _a;
                        if (newRemote.port == LOCALWG_PORT) {
                            const data = (_a = activeObfuscator.get(`${remote.address}:${remote.port}`)) === null || _a === void 0 ? void 0 : _a.obfuscation(newMessage);
                            if (data) {
                                const headerBuffer = Buffer.alloc(1);
                                headerBuffer.writeUInt8(MESSAGE_TYPE_WG);
                                const messageBuffer = Buffer.from(data);
                                const binaryMessage = Buffer.concat([headerBuffer, messageBuffer, separatorBuffer]);
                                activeClient.get(`${remote.address}:${remote.port}`).write(binaryMessage);
                            }
                        }
                        else {
                            console.log(`Unknow data recieved from ${newRemote.address}:${newRemote.port}`);
                        }
                        // ...
                    });
                    // Cleanup the timer when the new server is closed
                    newServer.on('close', () => {
                        activeServers.delete(`${remote.address}:${remote.port}`);
                        activeObfuscator.delete(`${remote.address}:${remote.port}`);
                        activeClient.delete(`${remote.address}:${remote.port}`);
                        lastMessageTimestamps.delete(`${remote.address}:${remote.port}`);
                        clearInterval(inactivityTimer);
                        client.destroy();
                    });
                    // Bind the new UDP server
                    newServer.bind();
                    sendBinaryHandshake(client);
                    break;
                case MESSAGE_TYPE_WG:
                    const typedArray = new Uint8Array(messageBody);
                    const deobfuscatedData = (_a = activeObfuscator.get(`${remote.address}:${remote.port}`)) === null || _a === void 0 ? void 0 : _a.deobfuscation(typedArray.buffer);
                    if (deobfuscatedData) {
                        (_b = activeServers.get(`${remote.address}:${remote.port}`)) === null || _b === void 0 ? void 0 : _b.send(deobfuscatedData, 0, deobfuscatedData.length, LOCALWG_PORT, LOCALWG_ADDRESS, (error) => {
                            if (error) {
                                console.error(`Failed to send response to ${LOCALWG_ADDRESS}:${LOCALWG_PORT}`);
                            }
                            else {
                                console.log(`Data sent to ${LOCALWG_ADDRESS}:${LOCALWG_PORT}`);
                            }
                        });
                    }
                    break;
                default:
                    console.log(`Unknow msg recieved from ${remote.address}:${remote.port}`);
            }
        }
    }));
    client.on('close', () => {
        console.log('closing...');
        let udpServer = activeServers.get(`${remote.address}:${remote.port}`);
        if (udpServer) {
            udpServer.close();
        }
        activeServers.delete(`${remote.address}:${remote.port}`);
        activeObfuscator.delete(`${remote.address}:${remote.port}`);
        activeClient.delete(`${remote.address}:${remote.port}`);
        lastMessageTimestamps.delete(`${remote.address}:${remote.port}`);
        clearInterval(inactivityTimer);
        //clientStatOperation(-1)
    });
    client.on('error', (error) => {
        console.error('Socket error:', error);
        // Handle the error gracefully, e.g., close the socket
        client.destroy(); // Close the socket to prevent crashing
    });
}));
