/**
 * ============================================================
 * LOGIN-SERVER.JS - DragonBall HTML5 Mock Login Server
 * ============================================================
 * 
 * Purpose: Mock backend untuk login-server Socket.IO
 * Intercept koneksi ke login-server dan berikan response palsu
 * 
 * Load Order: AFTER socket.io.min.js, BEFORE main.min.js
 * 
 * Author: Local SDK Bridge
 * Version: 1.2.0
 * ============================================================
 */

(function(window) {
    'use strict';

    // ========================================================
    // 1. STYLISH LOGGER
    // ========================================================
    var LOG = {
        prefix: '🖥️ [LOGIN-SERVER]',
        styles: {
            title: 'background: linear-gradient(90deg, #7c3aed 0%, #a855f7 100%); color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;',
            success: 'color: #22c55e; font-weight: bold;',
            info: 'color: #6b7280;',
            warn: 'color: #f59e0b; font-weight: bold;',
            error: 'color: #ef4444; font-weight: bold;',
            data: 'color: #8b5cf6;',
            separator: 'color: #6b7280;',
            call: 'color: #0ea5e9; font-weight: bold;',
            socket: 'color: #ec4899; font-weight: bold;'
        },
        
        _log: function(level, icon, message, data) {
            var timestamp = new Date().toISOString().substr(11, 12);
            var style = this.styles[level] || this.styles.info;
            var format = '%c' + this.prefix + ' %c[' + timestamp + '] ' + icon + ' ' + message;
            
            if (data !== undefined) {
                console.log(format + ' %o', this.styles.title, style, data);
            } else {
                console.log(format, this.styles.title, style);
            }
        },
        
        title: function(message) {
            var line = '══════════════════════════════════════════════════════';
            console.log('%c' + this.prefix + ' %c' + line, this.styles.title, this.styles.separator);
            console.log('%c' + this.prefix + ' %c' + message, this.styles.title, this.styles.title);
            console.log('%c' + this.prefix + ' %c' + line, this.styles.title, this.styles.separator);
        },
        
        success: function(message, data) { this._log('success', '✅', message, data); },
        info: function(message, data) { this._log('info', 'ℹ️', message, data); },
        warn: function(message, data) { this._log('warn', '⚠️', message, data); },
        error: function(message, data) { this._log('error', '❌', message, data); },
        data: function(message, data) { this._log('data', '📊', message, data); },
        call: function(message, data) { this._log('call', '📞', message, data); },
        socket: function(message, data) { this._log('socket', '🔌', message, data); }
    };


    // ========================================================
    // 2. CONFIGURATION
    // ========================================================
    var CONFIG = {
        // Main server URL (untuk GetServerList response)
        mainServerUrl: 'http://127.0.0.1:9998',
        
        // Chat server URL (placeholder)
        chatServerUrl: 'http://127.0.0.1:9997',
        
        // Dungeon server URL (placeholder)
        dungeonServerUrl: 'http://127.0.0.1:9996',
        
        // Server info
        serverId: 1,
        serverName: 'Local 1'
    };

    // ========================================================
    // 3. HELPER: Get Server Time
    // ========================================================
    function getServerTime() {
        return Date.now();
    }

    // ========================================================
    // 4. HELPER: Build Response
    // ========================================================
    function buildResponse(data, compress) {
        compress = compress || false;
        
        var response = {
            ret: 0,
            data: typeof data === 'string' ? data : JSON.stringify(data),
            compress: compress,
            serverTime: getServerTime(),
            server0Time: getServerTime()
        };
        
        LOG.data('Built Response:', response);
        
        return response;
    }

    // ========================================================
    // 5. REQUEST HANDLERS
    // ========================================================
    var RequestHandlers = {
        
        /**
         * ============================================================
         * Handler: User.loginGame
         * ============================================================
         * 
         * Request:
         *   { type: "User", action: "loginGame", userId, password, fromChannel,
         *     channelName, headImageUrl, nickName, subChannel, version: "1.0" }
         * 
         * Response:
         *   { loginToken, userId, channelCode, sdk, nickName }
         */
        loginGame: function(request) {
            LOG.title('HANDLING: loginGame');
            LOG.data('Request:', request);
            
            // Get user info from SDK
            var sdkUser = window.LOCAL_SDK ? window.LOCAL_SDK.user : null;
            var sdkConfig = window.LOCAL_SDK ? window.LOCAL_SDK.config : null;
            
            var userId = request.userId || (sdkUser ? sdkUser.userId : 'local_user_001');
            var password = request.password || '';
            var fromChannel = request.fromChannel || 'local';
            
            // Build response data
            var responseData = {
                loginToken: sdkUser ? sdkUser.token : 'local_token_' + Date.now(),
                userId: userId,
                channelCode: 'en',
                sdk: 'local',
                nickName: sdkUser ? sdkUser.nickname : 'Player'
            };
            
            LOG.success('Login successful for user:', userId);
            LOG.data('Response Data:', responseData);
            
            return buildResponse(responseData);
        },
        
        /**
         * ============================================================
         * Handler: User.GetServerList
         * ============================================================
         * 
         * Request:
         *   { type: "User", action: "GetServerList", userId, subChannel, channel }
         * 
         * Response:
         *   {
         *     serverList: [{ serverId, name, url, online, hot, new }, ...],
         *     history: [serverId, ...],
         *     offlineReason: ""
         *   }
         */
        GetServerList: function(request) {
            LOG.title('HANDLING: GetServerList');
            LOG.data('Request:', request);
            
            // Build server list
            var serverList = [{
                serverId: CONFIG.serverId,
                name: CONFIG.serverName,
                url: CONFIG.mainServerUrl,
                online: true,
                hot: false,
                new: true
            }];
            
            // Build response
            var responseData = {
                serverList: serverList,
                history: [],
                offlineReason: ''
            };
            
            LOG.success('Returning server list');
            LOG.data('Response Data:', responseData);
            
            return buildResponse(responseData);
        },
        
        /**
         * ============================================================
         * Handler: User.SaveHistory
         * ============================================================
         * 
         * Request:
         *   { type: "User", action: "SaveHistory", accountToken, channelCode,
         *     serverId, securityCode, subChannel, version: "1.0" }
         * 
         * Response:
         *   { loginToken, todayLoginCount }
         */
        SaveHistory: function(request) {
            LOG.title('HANDLING: SaveHistory');
            LOG.data('Request:', request);
            
            var responseData = {
                loginToken: window.LOCAL_SDK ? window.LOCAL_SDK.user.token : 'local_token',
                todayLoginCount: 1
            };
            
            LOG.success('History saved (mocked)');
            LOG.data('Response Data:', responseData);
            
            return buildResponse(responseData);
        },
        
        /**
         * ============================================================
         * Handler: User.SaveLanguage
         * ============================================================
         * 
         * Request:
         *   { type: "User", action: "SaveLanguage", userid, sdk, appid, language }
         * 
         * Response:
         *   { errorCode: 0 }
         * 
         * Note: Request field is "userid" (lowercase), NOT "userId"!
         */
        SaveLanguage: function(request) {
            LOG.title('HANDLING: SaveLanguage');
            LOG.data('Request:', request);
            
            var responseData = {
                errorCode: 0
            };
            
            LOG.success('Language saved:', request.language);
            LOG.data('Response Data:', responseData);
            
            return buildResponse(responseData);
        },
        
        /**
         * ============================================================
         * Handler: User.SaveUserEnterInfo
         * ============================================================
         * 
         * Request:
         *   { type: "User", action: "SaveUserEnterInfo", accountToken, channelCode,
         *     subChannel, createTime, userLevel, version: "1.0" }
         * 
         * Response:
         *   { errorCode: 0 }
         */
        SaveUserEnterInfo: function(request) {
            LOG.title('HANDLING: SaveUserEnterInfo');
            LOG.data('Request:', request);
            
            var responseData = {
                errorCode: 0
            };
            
            LOG.success('User enter info saved (mocked)');
            LOG.data('Response Data:', responseData);
            
            return buildResponse(responseData);
        },

        /**
         * ============================================================
         * Handler: User.LoginAnnounce
         * ============================================================
         * 
         * Request:
         *   { type: "User", action: "LoginAnnounce" }
         * 
         * Response:
         *   {
         *     data: {
         *       [id]: {
         *         text: { en: "...", cn: "...", ... },
         *         title: { en: "...", cn: "...", ... },
         *         version: number,
         *         orderNo: number,
         *         alwaysPopup: boolean (optional)
         *       }
         *     }
         *   }
         * 
         * Usage in main.min.js:
         *   t.data[id].text[language]
         *   t.data[id].title[language]
         *   t.data[id].version
         *   t.data[id].orderNo
         */
        LoginAnnounce: function(request) {
            LOG.title('HANDLING: LoginAnnounce');
            LOG.data('Request:', request);
            
            // Return empty announcements (can be populated later if needed)
            var responseData = {
                data: {}
            };
            
            LOG.success('Returning empty announcements');
            LOG.data('Response Data:', responseData);
            
            return buildResponse(responseData);
        }
    };

    // ========================================================
    // 6. MOCK SOCKET CLASS
    // ========================================================
    function MockSocket(serverUrl) {
        var self = this;
        
        self.url = serverUrl;
        self.connected = true;
        self.eventListeners = {};
        self.id = 'mock_socket_' + Date.now();
        
        LOG.socket('─────────────────────────────────────────');
        LOG.socket('MockSocket created');
        LOG.socket('URL:', serverUrl);
        LOG.socket('Socket ID:', self.id);
        LOG.socket('─────────────────────────────────────────');
        
        // Auto-trigger connect event after short delay
        setTimeout(function() {
            self._trigger('connect');
        }, 10);
    }
    
    MockSocket.prototype = {
        
        on: function(event, callback) {
            LOG.socket('ON() Event: ' + event);
            
            if (!this.eventListeners[event]) {
                this.eventListeners[event] = [];
            }
            this.eventListeners[event].push(callback);
            
            // If connect event and already "connected", trigger immediately
            if (event === 'connect' && this.connected) {
                var self = this;
                setTimeout(function() {
                    LOG.socket('Auto-triggering connect event');
                    callback();
                }, 5);
            }
        },
        
        off: function(event) {
            LOG.socket('OFF() Event: ' + event);
            this.eventListeners[event] = [];
        },
        
        emit: function(event, data, callback) {
            var self = this;
            
            LOG.socket('─────────────────────────────────────────');
            LOG.socket('EMIT() Event: ' + event);
            
            if (event === 'handler.process') {
                LOG.data('Request Data:', data);
                self._handleRequest(data, callback);
            } else if (event === 'verify') {
                LOG.socket('Verify event - returning success');
                if (callback) {
                    callback({ ret: 0 });
                }
            } else {
                LOG.warn('Unknown emit event: ' + event);
                if (callback) {
                    callback({ ret: 0 });
                }
            }
        },
        
        _handleRequest: function(request, callback) {
            var self = this;
            
            LOG.info('─────────────────────────────────────────');
            LOG.info('Processing request...');
            LOG.data('Type:', request.type);
            LOG.data('Action:', request.action);
            
            // Get handler based on action
            var handler = RequestHandlers[request.action];
            
            if (handler) {
                var response = handler(request);
                
                LOG.success('Handler executed: ' + request.action);
                
                if (callback) {
                    setTimeout(function() {
                        LOG.socket('Calling callback with response');
                        callback(response);
                    }, 10);
                }
            } else {
                LOG.warn('No handler for action: ' + request.action);
                LOG.data('Full request:', request);
                
                if (callback) {
                    callback(buildResponse({ success: true }));
                }
            }
        },
        
        _trigger: function(event, data) {
            LOG.socket('TRIGGER() Event: ' + event);
            
            var listeners = this.eventListeners[event];
            if (listeners) {
                for (var i = 0; i < listeners.length; i++) {
                    try {
                        listeners[i](data);
                    } catch (e) {
                        LOG.error('Error in listener: ' + e.message);
                    }
                }
            }
        },
        
        destroy: function() {
            LOG.socket('Socket destroyed: ' + this.id);
            this.connected = false;
            this.eventListeners = {};
        },
        
        connect: function() {
            LOG.socket('Socket connect() called');
            this.connected = true;
            this._trigger('connect');
        },
        
        disconnect: function() {
            LOG.socket('Socket disconnect() called');
            this.connected = false;
            this._trigger('disconnect');
        }
    };

    // ========================================================
    // 7. INTERCEPT io.connect()
    // ========================================================
    function interceptSocketIO() {
        if (typeof window.io === 'undefined') {
            LOG.error('Socket.IO not found! Make sure socket.io.min.js is loaded before login-server.js');
            return;
        }
        
        var originalConnect = window.io.connect;
        
        if (!originalConnect) {
            LOG.error('io.connect not found!');
            return;
        }
        
        LOG.title('Intercepting io.connect()');
        
        window.io.connect = function(url, options) {
            LOG.socket('═══════════════════════════════════════════════════════════');
            LOG.socket('io.connect() called');
            LOG.socket('URL:', url);
            LOG.socket('Options:', options);
            
            // Check if this is login-server URL
            var isLoginServer = false;
            
            // Check from SDK config
            var loginServerUrl = window.LOCAL_SDK ? window.LOCAL_SDK.config.loginServer : null;
            
            if (loginServerUrl && url.indexOf(loginServerUrl) !== -1) {
                isLoginServer = true;
            }
            
            // Also check by port
            if (url.indexOf('9999') !== -1 || 
                url.indexOf('login') !== -1 ||
                url.indexOf('127.0.0.1:9999') !== -1 ||
                url.indexOf('localhost:9999') !== -1) {
                isLoginServer = true;
            }
            
            if (isLoginServer) {
                LOG.success('✅ LOGIN-SERVER DETECTED - Using MockSocket');
                LOG.socket('═══════════════════════════════════════════════════════════');
                return new MockSocket(url);
            } else {
                LOG.info('⏩ Not login-server, using original io.connect');
                LOG.socket('═══════════════════════════════════════════════════════════');
                return originalConnect.call(window.io, url, options);
            }
        };
        
        LOG.success('io.connect() intercepted successfully!');
    }

    // ========================================================
    // 8. INITIALIZE
    // ========================================================
    function init() {
        LOG.title('Login-Server Mock v1.2.0 Initialized');
        LOG.info('Main Server URL:', CONFIG.mainServerUrl);
        LOG.info('Server ID:', CONFIG.serverId);
        LOG.info('Server Name:', CONFIG.serverName);
        LOG.info('');
        LOG.info('💡 Supported handlers:');
        LOG.info('   - User.loginGame');
        LOG.info('   - User.GetServerList');
        LOG.info('   - User.SaveHistory');
        LOG.info('   - User.SaveLanguage');
        LOG.info('   - User.SaveUserEnterInfo');
        LOG.info('   - User.LoginAnnounce');
        
        interceptSocketIO();
    }

    // ========================================================
    // 9. EXPORT FOR DEBUGGING
    // ========================================================
    window.LOGIN_SERVER_MOCK = {
        config: CONFIG,
        handlers: RequestHandlers,
        MockSocket: MockSocket,
        
        showConfig: function() {
            LOG.title('Login-Server Config');
            LOG.data('mainServerUrl:', CONFIG.mainServerUrl);
            LOG.data('serverId:', CONFIG.serverId);
            LOG.data('serverName:', CONFIG.serverName);
        }
    };

    // ========================================================
    // 10. START
    // ========================================================
    if (typeof window.io !== 'undefined') {
        init();
    } else {
        var checkInterval = setInterval(function() {
            if (typeof window.io !== 'undefined') {
                clearInterval(checkInterval);
                init();
            }
        }, 50);
        
        setTimeout(function() {
            clearInterval(checkInterval);
            if (typeof window.io === 'undefined') {
                LOG.error('Timeout waiting for Socket.IO to load!');
            }
        }, 5000);
    }

})(window);