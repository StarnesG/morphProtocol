import NetworkExtension
import MorphProtocol

/// Network Extension provider for MorphProtocol VPN
/// This runs in a separate process and handles all VPN traffic
class PacketTunnelProvider: NEPacketTunnelProvider {
    
    private var morphClient: MorphClient?
    private var isConnected = false
    
    // MARK: - Tunnel Lifecycle
    
    override func startTunnel(options: [String : NSObject]?, completionHandler: @escaping (Error?) -> Void) {
        NSLog("MorphProtocol: Starting tunnel...")
        
        // Extract configuration from options or protocol configuration
        guard let config = extractConfiguration(from: options) else {
            NSLog("MorphProtocol: Failed to extract configuration")
            completionHandler(TunnelError.invalidConfiguration)
            return
        }
        
        // Configure tunnel network settings
        let tunnelNetworkSettings = createTunnelSettings()
        
        setTunnelNetworkSettings(tunnelNetworkSettings) { [weak self] error in
            if let error = error {
                NSLog("MorphProtocol: Failed to set tunnel settings: \(error)")
                completionHandler(error)
                return
            }
            
            // Start MorphProtocol client
            self?.startMorphClient(config: config, completionHandler: completionHandler)
        }
    }
    
    override func stopTunnel(with reason: NEProviderStopReason, completionHandler: @escaping () -> Void) {
        NSLog("MorphProtocol: Stopping tunnel, reason: \(reason)")
        
        morphClient?.stop()
        morphClient = nil
        isConnected = false
        
        completionHandler()
    }
    
    override func handleAppMessage(_ messageData: Data, completionHandler: ((Data?) -> Void)?) {
        // Handle messages from the main app
        NSLog("MorphProtocol: Received app message")
        
        guard let message = try? JSONDecoder().decode(AppMessage.self, from: messageData) else {
            completionHandler?(nil)
            return
        }
        
        switch message.type {
        case .getStatus:
            let status = StatusResponse(
                connected: isConnected,
                clientId: morphClient?.clientId,
                serverPort: morphClient?.serverPort
            )
            if let data = try? JSONEncoder().encode(status) {
                completionHandler?(data)
            } else {
                completionHandler?(nil)
            }
            
        case .reconnect:
            // Handle reconnection request
            NSLog("MorphProtocol: Reconnection requested")
            completionHandler?(nil)
        }
    }
    
    // MARK: - MorphProtocol Client
    
    private func startMorphClient(config: ClientConfig, completionHandler: @escaping (Error?) -> Void) {
        NSLog("MorphProtocol: Starting MorphClient...")
        
        morphClient = MorphClient(config: config)
        
        // Set up callbacks
        morphClient?.onConnected = { [weak self] result in
            NSLog("MorphProtocol: Connected successfully")
            NSLog("MorphProtocol: Server port: \(result.serverPort)")
            NSLog("MorphProtocol: Client ID: \(result.clientId)")
            
            self?.isConnected = true
            
            // Start packet forwarding
            self?.startPacketForwarding()
            
            completionHandler(nil)
        }
        
        morphClient?.onDisconnected = { [weak self] in
            NSLog("MorphProtocol: Disconnected")
            self?.isConnected = false
            self?.cancelTunnelWithError(TunnelError.connectionLost)
        }
        
        morphClient?.onError = { [weak self] error in
            NSLog("MorphProtocol: Error: \(error.localizedDescription)")
            self?.isConnected = false
            completionHandler(error)
        }
        
        // Start the client
        morphClient?.start()
    }
    
    // MARK: - Packet Forwarding
    
    private func startPacketForwarding() {
        NSLog("MorphProtocol: Starting packet forwarding...")
        
        // Read packets from the virtual interface
        packetFlow.readPackets { [weak self] packets, protocols in
            guard let self = self, self.isConnected else { return }
            
            // Forward packets through MorphProtocol
            for (index, packet) in packets.enumerated() {
                self.morphClient?.sendPacket(packet)
            }
            
            // Continue reading
            self.startPacketForwarding()
        }
        
        // Receive packets from MorphProtocol and write to virtual interface
        morphClient?.onPacketReceived = { [weak self] packet in
            guard let self = self else { return }
            
            // Determine protocol (IPv4 or IPv6)
            let protocolNumber: NSNumber
            if packet.count > 0 {
                let version = (packet[0] & 0xF0) >> 4
                protocolNumber = version == 4 ? AF_INET as NSNumber : AF_INET6 as NSNumber
            } else {
                protocolNumber = AF_INET as NSNumber
            }
            
            self.packetFlow.writePackets([packet], withProtocols: [protocolNumber])
        }
    }
    
    // MARK: - Configuration
    
    private func extractConfiguration(from options: [String: NSObject]?) -> ClientConfig? {
        // Try to get from options first (passed from app)
        if let options = options {
            return parseConfigFromOptions(options)
        }
        
        // Fall back to protocol configuration
        if let protocolConfig = protocolConfiguration as? NETunnelProviderProtocol,
           let providerConfig = protocolConfig.providerConfiguration {
            return parseConfigFromProviderConfig(providerConfig)
        }
        
        return nil
    }
    
    private func parseConfigFromOptions(_ options: [String: NSObject]) -> ClientConfig? {
        guard let remoteAddress = options["remoteAddress"] as? String,
              let remotePort = options["remotePort"] as? Int,
              let userId = options["userId"] as? String,
              let encryptionKey = options["encryptionKey"] as? String else {
            return nil
        }
        
        return ClientConfig(
            remoteAddress: remoteAddress,
            remotePort: UInt16(remotePort),
            userId: userId,
            encryptionKey: encryptionKey,
            localWgAddress: options["localWgAddress"] as? String ?? "127.0.0.1",
            localWgPort: UInt16((options["localWgPort"] as? Int) ?? 51820),
            obfuscationLayer: (options["obfuscationLayer"] as? Int) ?? 3,
            paddingLength: (options["paddingLength"] as? Int) ?? 8,
            heartbeatInterval: (options["heartbeatInterval"] as? Double) ?? 30.0,
            inactivityTimeout: (options["inactivityTimeout"] as? Double) ?? 180.0,
            maxRetries: (options["maxRetries"] as? Int) ?? 10,
            handshakeInterval: (options["handshakeInterval"] as? Double) ?? 5.0,
            password: options["password"] as? String ?? "bumoyu123"
        )
    }
    
    private func parseConfigFromProviderConfig(_ config: [String: Any]) -> ClientConfig? {
        guard let remoteAddress = config["remoteAddress"] as? String,
              let remotePort = config["remotePort"] as? Int,
              let userId = config["userId"] as? String,
              let encryptionKey = config["encryptionKey"] as? String else {
            return nil
        }
        
        return ClientConfig(
            remoteAddress: remoteAddress,
            remotePort: UInt16(remotePort),
            userId: userId,
            encryptionKey: encryptionKey,
            localWgAddress: config["localWgAddress"] as? String ?? "127.0.0.1",
            localWgPort: UInt16((config["localWgPort"] as? Int) ?? 51820),
            obfuscationLayer: (config["obfuscationLayer"] as? Int) ?? 3,
            paddingLength: (config["paddingLength"] as? Int) ?? 8,
            heartbeatInterval: (config["heartbeatInterval"] as? Double) ?? 30.0,
            inactivityTimeout: (config["inactivityTimeout"] as? Double) ?? 180.0,
            maxRetries: (config["maxRetries"] as? Int) ?? 10,
            handshakeInterval: (config["handshakeInterval"] as? Double) ?? 5.0,
            password: config["password"] as? String ?? "bumoyu123"
        )
    }
    
    private func createTunnelSettings() -> NEPacketTunnelNetworkSettings {
        let settings = NEPacketTunnelNetworkSettings(tunnelRemoteAddress: "10.0.0.1")
        
        // IPv4 settings
        let ipv4Settings = NEIPv4Settings(addresses: ["10.0.0.2"], subnetMasks: ["255.255.255.0"])
        ipv4Settings.includedRoutes = [NEIPv4Route.default()]
        settings.ipv4Settings = ipv4Settings
        
        // DNS settings (optional - use system DNS or custom)
        let dnsSettings = NEDNSSettings(servers: ["8.8.8.8", "8.8.4.4"])
        settings.dnsSettings = dnsSettings
        
        // MTU
        settings.mtu = 1400
        
        return settings
    }
    
    // MARK: - Error Handling
    
    enum TunnelError: Error {
        case invalidConfiguration
        case connectionFailed
        case connectionLost
        
        var localizedDescription: String {
            switch self {
            case .invalidConfiguration:
                return "Invalid VPN configuration"
            case .connectionFailed:
                return "Failed to connect to server"
            case .connectionLost:
                return "Connection to server lost"
            }
        }
    }
    
    // MARK: - App Communication
    
    struct AppMessage: Codable {
        enum MessageType: String, Codable {
            case getStatus
            case reconnect
        }
        
        let type: MessageType
    }
    
    struct StatusResponse: Codable {
        let connected: Bool
        let clientId: String?
        let serverPort: Int?
    }
}
