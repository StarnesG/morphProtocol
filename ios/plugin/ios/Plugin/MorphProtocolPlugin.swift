import Foundation
import Capacitor
import NetworkExtension

@objc(MorphProtocolPlugin)
public class MorphProtocolPlugin: CAPPlugin {
    private var vpnManager: NETunnelProviderManager?
    private var isConnected = false
    private var clientId: String?
    private var serverPort: Int?
    
    @objc func connect(_ call: CAPPluginCall) {
        if isConnected {
            call.reject("Already connected")
            return
        }
        
        guard let remoteAddress = call.getString("remoteAddress") else {
            call.reject("remoteAddress is required")
            return
        }
        
        guard let remotePort = call.getInt("remotePort") else {
            call.reject("remotePort is required")
            return
        }
        
        guard let userId = call.getString("userId") else {
            call.reject("userId is required")
            return
        }
        
        guard let encryptionKey = call.getString("encryptionKey") else {
            call.reject("encryptionKey is required")
            return
        }
        
        // Optional parameters with defaults
        let localWgAddress = call.getString("localWgAddress") ?? "127.0.0.1"
        let localWgPort = call.getInt("localWgPort") ?? 51820
        let obfuscationLayer = call.getInt("obfuscationLayer") ?? 3
        let paddingLength = call.getInt("paddingLength") ?? 8
        let heartbeatInterval = call.getDouble("heartbeatInterval") ?? 30.0
        let inactivityTimeout = call.getDouble("inactivityTimeout") ?? 180.0
        let maxRetries = call.getInt("maxRetries") ?? 10
        let handshakeInterval = call.getDouble("handshakeInterval") ?? 5.0
        let password = call.getString("password") ?? "bumoyu123"
        
        // Create provider configuration
        let providerConfig: [String: Any] = [
            "remoteAddress": remoteAddress,
            "remotePort": remotePort,
            "userId": userId,
            "encryptionKey": encryptionKey,
            "localWgAddress": localWgAddress,
            "localWgPort": localWgPort,
            "obfuscationLayer": obfuscationLayer,
            "paddingLength": paddingLength,
            "heartbeatInterval": heartbeatInterval,
            "inactivityTimeout": inactivityTimeout,
            "maxRetries": maxRetries,
            "handshakeInterval": handshakeInterval,
            "password": password
        ]
        
        // Load or create VPN manager
        loadVPNManager { [weak self] manager, error in
            guard let self = self else { return }
            
            if let error = error {
                call.reject("Failed to load VPN manager: \(error.localizedDescription)")
                return
            }
            
            guard let manager = manager else {
                call.reject("Failed to create VPN manager")
                return
            }
            
            self.vpnManager = manager
            
            // Configure the tunnel
            let protocolConfig = NETunnelProviderProtocol()
            protocolConfig.providerBundleIdentifier = "YOUR_BUNDLE_ID.MorphTunnelExtension" // TODO: Replace with actual bundle ID
            protocolConfig.serverAddress = remoteAddress
            protocolConfig.providerConfiguration = providerConfig
            
            manager.protocolConfiguration = protocolConfig
            manager.localizedDescription = "MorphProtocol VPN"
            manager.isEnabled = true
            
            // Save configuration
            manager.saveToPreferences { error in
                if let error = error {
                    call.reject("Failed to save VPN configuration: \(error.localizedDescription)")
                    return
                }
                
                // Start the tunnel
                self.startTunnel(manager: manager, call: call)
            }
        }
    }
    
    private func loadVPNManager(completion: @escaping (NETunnelProviderManager?, Error?) -> Void) {
        NETunnelProviderManager.loadAllFromPreferences { managers, error in
            if let error = error {
                completion(nil, error)
                return
            }
            
            // Use existing manager or create new one
            let manager = managers?.first ?? NETunnelProviderManager()
            completion(manager, nil)
        }
    }
    
    private func startTunnel(manager: NETunnelProviderManager, call: CAPPluginCall) {
        do {
            try manager.connection.startVPNTunnel()
            
            // Monitor connection status
            NotificationCenter.default.addObserver(
                self,
                selector: #selector(vpnStatusDidChange),
                name: .NEVPNStatusDidChange,
                object: manager.connection
            )
            
            // Wait a bit for connection to establish
            DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) { [weak self] in
                guard let self = self else { return }
                
                let status = manager.connection.status
                
                if status == .connected {
                    self.isConnected = true
                    
                    // Get status from extension
                    self.getStatusFromExtension { clientId, serverPort in
                        self.clientId = clientId
                        self.serverPort = serverPort
                        
                        self.notifyListeners("connected", data: [
                            "type": "connected",
                            "message": "Connected to MorphProtocol server"
                        ])
                        
                        call.resolve([
                            "success": true,
                            "message": "Connected successfully",
                            "clientId": clientId as Any,
                            "serverPort": serverPort as Any
                        ])
                    }
                } else if status == .connecting {
                    // Still connecting, return success but note it's in progress
                    call.resolve([
                        "success": true,
                        "message": "Connection in progress",
                        "status": "connecting"
                    ])
                } else {
                    call.reject("Failed to connect: \(status.description)")
                }
            }
        } catch {
            call.reject("Failed to start tunnel: \(error.localizedDescription)")
        }
    }
    
    @objc private func vpnStatusDidChange(_ notification: Notification) {
        guard let connection = notification.object as? NEVPNConnection else { return }
        
        let status = connection.status
        NSLog("MorphProtocol: VPN status changed to \(status.description)")
        
        switch status {
        case .connected:
            isConnected = true
            notifyListeners("connected", data: [
                "type": "connected",
                "message": "Connected to MorphProtocol server"
            ])
            
        case .disconnected:
            isConnected = false
            clientId = nil
            serverPort = nil
            notifyListeners("disconnected", data: [
                "type": "disconnected",
                "message": "Disconnected from MorphProtocol server"
            ])
            
        case .invalid, .disconnecting:
            isConnected = false
            
        default:
            break
        }
    }
    
    private func getStatusFromExtension(completion: @escaping (String?, Int?) -> Void) {
        guard let session = vpnManager?.connection as? NETunnelProviderSession else {
            completion(nil, nil)
            return
        }
        
        let message = ["type": "getStatus"]
        guard let messageData = try? JSONSerialization.data(withJSONObject: message) else {
            completion(nil, nil)
            return
        }
        
        do {
            try session.sendProviderMessage(messageData) { responseData in
                guard let data = responseData,
                      let response = try? JSONDecoder().decode(StatusResponse.self, from: data) else {
                    completion(nil, nil)
                    return
                }
                
                completion(response.clientId, response.serverPort)
            }
        } catch {
            NSLog("MorphProtocol: Failed to send message to extension: \(error)")
            completion(nil, nil)
        }
    }
    
    struct StatusResponse: Codable {
        let connected: Bool
        let clientId: String?
        let serverPort: Int?
    }
    
    @objc func disconnect(_ call: CAPPluginCall) {
        guard let manager = vpnManager else {
            call.reject("VPN manager not initialized")
            return
        }
        
        guard isConnected else {
            call.reject("Not connected")
            return
        }
        
        manager.connection.stopVPNTunnel()
        
        // Wait a bit for disconnection
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) { [weak self] in
            self?.isConnected = false
            self?.clientId = nil
            self?.serverPort = nil
            
            call.resolve([
                "success": true,
                "message": "Disconnected successfully"
            ])
        }
    }
    
    @objc func getStatus(_ call: CAPPluginCall) {
        var result: [String: Any] = [
            "connected": isConnected,
            "status": isConnected ? "Connected" : "Disconnected"
        ]
        
        if isConnected {
            if let clientId = clientId {
                result["clientId"] = clientId
            }
            if let serverPort = serverPort {
                result["serverPort"] = serverPort
            }
        }
        
        call.resolve(result)
    }
    
    deinit {
        NotificationCenter.default.removeObserver(self)
        vpnManager?.connection.stopVPNTunnel()
    }
}

// MARK: - NEVPNStatus Extension

extension NEVPNStatus {
    var description: String {
        switch self {
        case .invalid:
            return "Invalid"
        case .disconnected:
            return "Disconnected"
        case .connecting:
            return "Connecting"
        case .connected:
            return "Connected"
        case .reasserting:
            return "Reasserting"
        case .disconnecting:
            return "Disconnecting"
        @unknown default:
            return "Unknown"
        }
    }
}
