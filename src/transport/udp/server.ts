import * as dgram from 'dgram';
import { Obfuscator } from '../../core/obfuscator';
import { subTraffic, subClientNum, addClientNum, updateServerInfo } from '../../api/client';
import { Encryptor } from '../../crypto/encryptor';
import { getServerConfig } from '../../config';
import { logger } from '../../utils/logger';
import { UserInfo } from '../../types';

// //function to record concurrency client and max client
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

const config = getServerConfig();
const HOST_NAME = config.hostName;
const HOST_IP = config.hostIp;
const PORT = config.handshakePortUdp;
const TIMEOUT_DURATION = config.timeoutDuration;
const LOCALWG_PORT = config.localWgPort;
const LOCALWG_ADDRESS = config.localWgAddress;
const TRAFFIC_INTERVAL = config.trafficInterval;
const PASSWORD = config.password;

logger.info(`Starting UDP server on port ${PORT}`);

const server = dgram.createSocket('udp4');
const encryptor = new Encryptor(PASSWORD);
const encryptionInfo = `${encryptor.simpleKey.toString('base64')}:${encryptor.simpleVi.toString('base64')}`;
logger.info(`Encryption info: ${encryptionInfo}`);
updateServerInfo(HOST_NAME, HOST_IP, PORT, encryptionInfo);

// Map to store the last received message timestamp for each remote address
const lastMessageTimestamps: Map<string, number> = new Map();

// Function to check if the new UDP server should shut down due to inactivity
function checkInactivityTimeout(udpID: string) {
  const lastMessageTimestamp = lastMessageTimestamps.get(udpID);
  if (lastMessageTimestamp) {
    const currentTime = Date.now();
    if (currentTime - lastMessageTimestamp >= TIMEOUT_DURATION) {
      logger.info(`Shutting down UDP server for ${udpID} due to inactivity`);
      const newServer = activeServers.get(udpID);
      if (newServer) {
        let remotePublicKey = activeUserPublicKey.get(udpID)
        if (!remotePublicKey) {
          logger.error(`Failed to get public key for ${udpID}`);
          return -1
        }
        let msg = encryptor.simpleEncrypt("inactivity")
        server.send(msg, 0, msg.length, Number(udpID.split(":")[1]), udpID.split(":")[0], (error) => {
          if (error) {
            logger.info(`Failed to send response to ${udpID}`);
          }
          else {
            logger.info(`inactivity sent to ${udpID}`)
          }
        });
        let userId_temp = activeUserInfo.get(udpID)?.userId
        subTraffic(activeUserInfo.get(udpID)?.userId, activeUserInfo.get(udpID)?.traffic)
        activeUserInfo.set(udpID, { userId: userId_temp, traffic: 0 })
        newServer.close();
        activeServers.delete(udpID);
        activeObfuscator.delete(udpID);
        activeUserInfo.delete(udpID);
        activeUserPublicKey.delete(udpID)
        subClientNum(HOST_NAME)
      }
    }
  }
}

const activeServers: Map<string, dgram.Socket> = new Map();
const activeObfuscator: Map<string, Obfuscator> = new Map();
const activeUserInfo: Map<string, UserInfo> = new Map();
const activeUserPublicKey: Map<string, string> = new Map();
const trafficInterval = setInterval(() => {
  logger.info('Updating traffic for all active users');
  activeUserInfo.forEach((value, key) => {
    subTraffic(value.userId, value.traffic);
    value.traffic = 0;
  });
}, TRAFFIC_INTERVAL);
// Handle incoming messages
server.on('message', async (message, remote) => {
  try {
    logger.info(message.toString())
    message = await Buffer.from(encryptor.simpleDecrypt(message.toString()))
    logger.info(message.toString())
    if (message.toString() === 'close') {
      let userId_temp = activeUserInfo.get(`${remote.address}:${remote.port}`)?.userId
      subTraffic(activeUserInfo.get(`${remote.address}:${remote.port}`)?.userId, activeUserInfo.get(`${remote.address}:${remote.port}`)?.traffic)
      activeUserInfo.set(`${remote.address}:${remote.port}`, { userId: userId_temp, traffic: 0 })
      activeServers.get(`${remote.address}:${remote.port}`)?.close()
      activeServers.delete(`${remote.address}:${remote.port}`);
      activeObfuscator.delete(`${remote.address}:${remote.port}`);
      activeUserInfo.delete(`${remote.address}:${remote.port}`)
      activeUserPublicKey.delete(`${remote.address}:${remote.port}`)
      subClientNum(HOST_NAME)
      return
    }
    logger.info(`Received handshake data from ${remote.address}:${remote.port}`);
    if (activeServers.get(`${remote.address}:${remote.port}`)) {
      let remotePublicKey = activeUserPublicKey.get(`${remote.address}:${remote.port}`)
      let responsePort = activeServers.get(`${remote.address}:${remote.port}`)?.address().port
      if (!remotePublicKey || !responsePort) {
        logger.error(`Failed to get public key or port for ${remote.address}:${remote.port}`);
        return -1
      }
      let response = encryptor.simpleEncrypt(`${responsePort}`)
      if (response && response.toString()) {
        server.send(response.toString(), 0, response.toString().length, remote.port, remote.address, (error) => {
          if (error) {
            logger.error(`Failed to send response to ${remote.address}:${remote.port}`);
          } else {
            logger.info(`Response sent to ${remote.address}:${remote.port}`);
          }
        });
      }
      return
    }
    // let cStat = await clientStatOperation(0)
    // if (cStat.current >= cStat.max) {
    //   let msg = "server_full"
    //   server.send(msg, 0, msg.length, remote.port, remote.address, (error) => {
    //     if (error) {
    //       logger.error(`Failed to send response to ${remote.address}:${remote.port}`);
    //     } else {
    //       logger.info(`server_full sent to ${remote.address}:${remote.port}`);
    //     }
    //   });
    //   return
    // }
    // Parse the incoming message as JSON
    const handshakeData = JSON.parse(message.toString());
    logger.info("userId: " + handshakeData.userId)
    // Perform initialization work with the received data
    // Create an instance of the Obfuscator class
    const obfuscator = new Obfuscator(
      handshakeData.key,
      handshakeData.obfuscationLayer,
      handshakeData.randomPadding,
      handshakeData.fnInitor
    );
    // Add the new server to the active servers map
    activeObfuscator.set(`${remote.address}:${remote.port}`, obfuscator);
    activeUserInfo.set(`${remote.address}:${remote.port}`, { userId: handshakeData.userId, traffic: 0 })
    activeUserPublicKey.set(`${remote.address}:${remote.port}`, Buffer.from(handshakeData.publicKey, 'base64').toString())
    // Create a new UDP server
    const newServer = dgram.createSocket('udp4');

    // Add the new server to the active servers map
    activeServers.set(`${remote.address}:${remote.port}`, newServer);
    addClientNum(HOST_NAME)
    lastMessageTimestamps.set(`${remote.address}:${remote.port}`, Date.now());
    // Handle messages on the new server
    let newPort: number
    let newAddr: string
    newServer.on('message', (newMessage, newRemote) => {
      if (newRemote.address == LOCALWG_ADDRESS) {
        const data = activeObfuscator.get(`${remote.address}:${remote.port}`)?.obfuscation(newMessage)
        if (data) {
          newServer.send(data, 0, data.length, newPort, newAddr, (error) => {
            if (error) {
              logger.error(`Failed to send response to ${remote.address}:${remote.port}`);
            } else {
              //logger.info(`Data sent to ${remote.address}:${remote.port}`);
            }
          });
          let userInfo = activeUserInfo.get(`${remote.address}:${remote.port}`);
          if (userInfo) {
            userInfo.traffic += data.length;
          }
        }
      }
      else {
        newPort = newRemote.port
        newAddr = newRemote.address
        const isHeartbeat = newMessage.length === 1 && newMessage[0] === 0x01;
        // Update the last received message timestamp for the remote address
        lastMessageTimestamps.set(`${remote.address}:${remote.port}`, Date.now());
        if (!isHeartbeat) {
          //logger.info("obfuscated recieved: " + new Uint8Array(newMessage) + "\n")
          const data = activeObfuscator.get(`${remote.address}:${remote.port}`)?.deobfuscation(newMessage)
          //logger.info("deobfuscated recieved: " + data)
          if (data) {
            newServer.send(data, 0, data.length, LOCALWG_PORT, LOCALWG_ADDRESS, (error) => {
              if (error) {
                logger.error(`Failed to send response to ${LOCALWG_ADDRESS}:${LOCALWG_PORT}`);
              } else {
                //logger.info(`Data sent to ${LOCALWG_ADDRESS}:${LOCALWG_PORT}`);
              }
            });
          }
        }
      }
      // ...
    });

    // Bind the new server to a random available port
    newServer.bind(() => {
      const newPort = newServer.address().port;
      logger.info(`New UDP server listening on port ${newPort}`);

      // Send the new port back to the remote client
      let remotePublicKey = activeUserPublicKey.get(`${remote.address}:${remote.port}`)
      if (!remotePublicKey) {
        logger.error(`Failed to get public key for ${remote.address}:${remote.port}`);
        return -1
      }
      const responseStr = encryptor.simpleEncrypt(`${newPort}`);
      const response = Buffer.from(responseStr);
      server.send(response, 0, response.length, remote.port, remote.address, (error) => {
        if (error) {
          logger.error(`Failed to send response to ${remote.address}:${remote.port}`);
        } else {
          logger.info(`Response sent to ${remote.address}:${remote.port}`);
        }
      });
    });

    // Set a timer to check inactivity timeout
    const inactivityTimer = setInterval(() => {
      checkInactivityTimeout(`${remote.address}:${remote.port}`);
    }, TIMEOUT_DURATION);

    // Cleanup the timer when the new server is closed
    newServer.on('close', () => {
      clearInterval(inactivityTimer);
      //clientStatOperation(-1)
    });
    //clientStatOperation(1)
  }
  catch (e) {
    logger.info('server error: ' + e)
  }
});

// Start the server
server.bind(PORT, () => {
  logger.info(`UDP server listening on port ${PORT}`);
});
