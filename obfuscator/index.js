"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("./tunnel/udp/client");
const process = require('process');
if (!process.argv[2]) {
    console.log("Destination miss");
}
else {
    (0, client_1.startUdpClient)(process.argv[2])
        .then((clientPort) => {
        console.log(`UDP client started. Client port: ${clientPort}`);
        // Use the client port for further operations or logic
    })
        .catch((error) => {
        console.error('Error starting UDP client:', error);
    });
}
