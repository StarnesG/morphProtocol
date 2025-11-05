import * as dgram from 'dgram';
import { Obfuscator } from '../../Obfuscator';
import * as fs from 'fs';
const WebSocket = require('ws');

//function to record concurrency client and max client
// let clientStatOperation = function(ins:number) {
//   let rawdata = fs.readFileSync('../clientStat.json', { encoding: 'utf8' });
//   let clientStat = JSON.parse(rawdata);
//   clientStat.current = clientStat.current + ins;
//   if(clientStat.current < 0) {
//     clientStat.current = 0
//   }
//   fs.writeFileSync('../clientStat.json', JSON.stringify(clientStat));
//   return clientStat;
// }

const PORT = 8080; // The port on which the initial UDP server listens
const TIMEOUT_DURATION = 180000; // Time in milliseconds after which the new UDP server shuts down if no data is received
const LOCALWG_PORT = 51820;
const LOCALWG_ADDRESS = '0.0.0.0';


// Create a UDP server
const server = new WebSocket.Server({
  port: PORT
});




// Function to check if the new UDP server should shut down due to inactivity
function checkInactivityTimeout(clientID: string, client: any) {
  const lastMessageTimestamp = lastMessageTimestamps.get(clientID);
  if (lastMessageTimestamp) {
    const currentTime = Date.now();
    if (currentTime - lastMessageTimestamp >= TIMEOUT_DURATION) {
      console.log(`Shutting down UDP server for ${clientID} due to inactivity`);
      const newServer = activeServers.get(clientID);
      if (newServer) {
        let msg = "inactivity"
        client.send(JSON.stringify({
          type: 'info',
          data: msg
        }));
        client.close();
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
const activeServers: Map<string, dgram.Socket> = new Map();
const activeObfuscator: Map<string, Obfuscator> = new Map();
const activeClient: Map<string, any> = new Map();
// Map to store the last received message timestamp for each remote address
const lastMessageTimestamps: Map<string, number> = new Map();

// Handle incoming messages
server.on('connection', async (ws: any, req: any) => {
  const remote = { address: req.socket.remoteAddress, port: req.socket.remotePort }
  await activeClient.set(`${remote.address}:${remote.port}`, ws);
  let client = activeClient.get(`${remote.address}:${remote.port}`)
  //clientStatOperation(1)
  // Set a timer to check inactivity timeout
  const inactivityTimer = setInterval(() => {
    checkInactivityTimeout(`${remote.address}:${remote.port}`, client);
  }, TIMEOUT_DURATION);

  client.on('message', async (message: any) => {
    console.log(`Received msg from ${remote.address}:${remote.port}`);
    //console.log(`msg: ` + message)
    // Update the last received message timestamp for the remote address
    lastMessageTimestamps.set(`${remote.address}:${remote.port}`, Date.now());
    if (JSON.parse(message.toString()).type === "heartbeat") {
      client.send(JSON.stringify({
        type: "heartbeat",
        data: null
      }))
    }
    else if (JSON.parse(message.toString()).type === "handshake") {
      // let cStat = await clientStatOperation(0)
      // if (cStat.current >= cStat.max) {
      //   let msg = "server_full"
      //   client.send(JSON.stringify({
      //     type: 'info',
      //     data: msg
      //   }));
      //   return
      // }
      // Parse the incoming message as JSON
      const handshakeData = await JSON.parse(message.toString()).data;
      // Perform initialization work with the received data
      // Create an instance of the Obfuscator class
      const obfuscator = await new Obfuscator(
        handshakeData.key,
        handshakeData.obfuscationLayer,
        handshakeData.randomPadding,
        handshakeData.fnInitor
      );
      // Add the new server to the active servers map
      await activeObfuscator.set(`${remote.address}:${remote.port}`, obfuscator);
      // Create a new UDP server
      const newServer = await dgram.createSocket('udp4');

      // Add the new server to the active servers map
      await activeServers.set(`${remote.address}:${remote.port}`, newServer);
      newServer.on('message', (newMessage, newRemote) => {
        if (newRemote.port == LOCALWG_PORT) {
          const data = activeObfuscator.get(`${remote.address}:${remote.port}`)?.obfuscation(newMessage)
          if (data) {
            activeClient.get(`${remote.address}:${remote.port}`).send(JSON.stringify({
              type: 'wg',
              data: data
            }))
          }
        }
        else {
          console.log(`Unknow data recieved from ${newRemote.address}:${newRemote.port}`)
        }
        // ...
      });
      // Cleanup the timer when the new server is closed
      newServer.on('close', () => {
        activeServers.delete(`${remote.address}:${remote.port}`);
        activeObfuscator.delete(`${remote.address}:${remote.port}`);
        activeClient.delete(`${remote.address}:${remote.port}`)
        lastMessageTimestamps.delete(`${remote.address}:${remote.port}`);
        clearInterval(inactivityTimer);
        client.close();
      });
      await newServer.bind()

      client.send(JSON.stringify({
        type: 'handshake',
        data: null
      }))
    }
    else if (JSON.parse(message.toString()).type === "wg") {
      const data = JSON.parse(message.toString()).data
      const keys = Object.keys(data);
      const values = keys.map(key => data[key]);
      const typedArray = new Uint8Array(values);
      const deobfuscatedData = activeObfuscator.get(`${remote.address}:${remote.port}`)?.deobfuscation(typedArray.buffer)
      if (deobfuscatedData) {
        activeServers.get(`${remote.address}:${remote.port}`)?.send(deobfuscatedData, 0, deobfuscatedData.length, LOCALWG_PORT, LOCALWG_ADDRESS, (error) => {
          if (error) {
            console.error(`Failed to send response to ${LOCALWG_ADDRESS}:${LOCALWG_PORT}`);
          } else {
            console.log(`Data sent to ${LOCALWG_ADDRESS}:${LOCALWG_PORT}`);
          }
        });
      }
    }
    else {
      console.log(`Unknow msg recieved from ${remote.address}:${remote.port}`)
    }
  });
  client.on('close', () => {
    let udpServer = activeServers.get(`${remote.address}:${remote.port}`)
    if (udpServer) {
      udpServer.close()
    }
    activeServers.delete(`${remote.address}:${remote.port}`);
    activeObfuscator.delete(`${remote.address}:${remote.port}`);
    activeClient.delete(`${remote.address}:${remote.port}`)
    lastMessageTimestamps.delete(`${remote.address}:${remote.port}`);
    clearInterval(inactivityTimer);
    //clientStatOperation(-1)
  })
})

// Start the server
console.log(`WebSocket server listening on port ${PORT}`);

