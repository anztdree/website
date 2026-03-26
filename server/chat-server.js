/**
 * ============================================================
 * CHAT-SERVER.JS - DragonBall HTML5 Mock Chat Server
 * ============================================================
 * 
 * Purpose: Mock backend untuk chat server Socket.IO (Port 9997)
 *          Menangani semua komunikasi chat: world, guild, team
 * 
 * Dipanggil dari: 
 *   - user.registChat (mengembalikan chatServerUrl)
 *   - clientStartChat() → connect ke port 9997
 * 
 * Load Order: AFTER socket.io.min.js, BEFORE main.min.js
 * 
 * Handlers:
 *   - chat.login       → Login ke chat server
 *   - chat.joinRoom    → Join ke room chat
 *   - chat.leaveRoom   → Leave dari room chat
 *   - chat.sendMsg     → Kirim pesan
 *   - chat.getRecord   → Ambil history chat
 * 
 * Message Data Structure (ChatDataBaseClass):
 *   {
 *     _id: string,           // User ID pengirim
 *     _name: string,         // Nama pengirim
 *     _content: string,      // Isi pesan
 *     _time: number,         // Timestamp
 *     _kind: number,         // Tipe chat (WORLD/GUILD/TEAM/WORLD_TEAM)
 *     _image: string,        // Head image URL
 *     _type: number,         // Message type
 *     _param: any,           // Additional params
 *     _headEffect: any,      // Head effect (optional)
 *     _headBox: string,      // Head box ID (optional)
 *     _oriServerId: number,  // Original server ID
 *     _serverId: number,     // Server ID (optional)
 *     _showMain: boolean     // Show in main chat
 *   }
 * 
 * Author: Local SDK Bridge
 * Version: 1.0.0
 * ============================================================
 */

(function(window) {
    'use strict';

    // ========================================================
    // 1. STYLISH LOGGER
    // ========================================================
    var LOG = {
        prefix: '💬 [CHAT-SERVER]',
        styles: {
            title: 'background: linear-gradient(90deg, #06b6d4 0%, #3b82f6 100%); color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;',
            success: 'color: #22c55e; font-weight: bold;',
            info: 'color: #6b7280;',
            warn: 'color: #f59e0b; font-weight: bold;',
            error: 'color: #ef4444; font-weight: bold;',
            data: 'color: #8b5cf6;',
            separator: 'color: #6b7280;',
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
        socket: function(message, data) { this._log('socket', '🔌', message, data); }
    };

    // ========================================================
    // 2. CONFIGURATION
    // ========================================================
    var CONFIG = {
        chatServerUrl: 'http://127.0.0.1:9997',
        maxMessagesPerRoom: 100
    };

    // ========================================================
    // 3. MESSAGE KIND CONSTANTS
    // ========================================================
    var MESSAGE_KIND = {
        WORLD: 0,
        GUILD: 1,
        TEAM: 2,
        WORLD_TEAM: 3
    };

    // ========================================================
    // 4. HELPER FUNCTIONS
    // ========================================================
    function getServerTime() {
        return Date.now();
    }
    
    function buildResponse(data) {
        return {
            ret: 0,
            data: typeof data === 'string' ? data : JSON.stringify(data),
            compress: false,
            serverTime: getServerTime(),
            server0Time: getServerTime()
        };
    }

    // ========================================================
    // 5. CHAT DATA STORAGE
    // ========================================================
    var CHAT_STORAGE_KEY = 'dragonball_chat_data';
    
    // Global chat rooms (shared across all users for world chat)
    var globalChatRooms = {};
    
    function getChatData(userId) {
        try {
            var stored = localStorage.getItem(CHAT_STORAGE_KEY + '_' + userId);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            LOG.warn('Failed to load chat data:', e);
        }
        
        return {
            userId: userId,
            joinedRooms: []
        };
    }
    
    function saveChatData(userId, chatData) {
        try {
            localStorage.setItem(CHAT_STORAGE_KEY + '_' + userId, JSON.stringify(chatData));
        } catch (e) {
            LOG.warn('Failed to save chat data:', e);
        }
    }
    
    function getRoomMessages(roomId) {
        if (!globalChatRooms[roomId]) {
            globalChatRooms[roomId] = {
                messages: [],
                lastTime: 0
            };
        }
        return globalChatRooms[roomId];
    }

    // ========================================================
    // 6. REQUEST HANDLERS
    // ========================================================
    var RequestHandlers = {
        
        /**
         * ============================================================
         * Handler: chat.login
         * ============================================================
         * 
         * Purpose: Login ke chat server
         * Dipanggil dari: clientStartChat() → chatLoginRequest()
         * 
         * Request:
         *   { type: "chat", action: "login", userId, serverId, version: "1.0" }
         * 
         * Response:
         *   { _success: true }
         * 
         * Flow:
         *   registChat → clientStartChat → chat.login → joinRoom (world/guild/team)
         */
        login: function(request) {
            LOG.title('HANDLING: chat.login');
            LOG.data('Request:', request);
            
            var userId = request.userId;
            var serverId = request.serverId;
            
            // Initialize chat data for user
            var chatData = getChatData(userId);
            chatData.serverId = serverId;
            saveChatData(userId, chatData);
            
            var response = {
                _success: true
            };
            
            LOG.success('Chat login successful for user:', userId);
            LOG.data('Response:', response);
            
            return buildResponse(response);
        },
        
        /**
         * ============================================================
         * Handler: chat.joinRoom
         * ============================================================
         * 
         * Purpose: Join ke room chat (world/guild/team)
         * Dipanggil dari: chatLoginRequest() → chatJoinRequest()
         * 
         * Request:
         *   { type: "chat", action: "joinRoom", userId, roomId, version: "1.0" }
         * 
         * Response:
         *   { _record: { [msgId]: ChatMessageData, ... } }
         * 
         * ChatMessageData structure:
         *   {
         *     _id: userId,           // User ID pengirim
         *     _name: string,         // Nama pengirim
         *     _content: string,      // Isi pesan
         *     _time: number,         // Timestamp
         *     _kind: number,         // MESSAGE_KIND
         *     _image: string,        // Head image
         *     _type: number,         // Message type
         *     _param: any,           // Additional params
         *     _headEffect: any,      // Head effect
         *     _headBox: string,      // Head box ID
         *     _oriServerId: number,  // Original server ID
         *     _serverId: number,     // Server ID
         *     _showMain: boolean     // Show in main
         *   }
         */
        joinRoom: function(request) {
            LOG.title('HANDLING: chat.joinRoom');
            LOG.data('Request:', request);
            
            var userId = request.userId;
            var roomId = request.roomId;
            
            if (!roomId) {
                LOG.warn('No roomId provided');
                return buildResponse({ _record: {} });
            }
            
            // Get or create chat data
            var chatData = getChatData(userId);
            
            // Add room to joined list if not already
            if (chatData.joinedRooms.indexOf(roomId) === -1) {
                chatData.joinedRooms.push(roomId);
            }
            saveChatData(userId, chatData);
            
            // Get room messages
            var room = getRoomMessages(roomId);
            
            // Build record response
            var record = {};
            for (var i = 0; i < room.messages.length; i++) {
                var msg = room.messages[i];
                record[msg._msgId] = msg;
            }
            
            var response = {
                _record: record
            };
            
            LOG.success('Joined room:', roomId);
            LOG.info('Messages in room:', room.messages.length);
            LOG.data('Response:', response);
            
            return buildResponse(response);
        },
        
        /**
         * ============================================================
         * Handler: chat.leaveRoom
         * ============================================================
         * 
         * Purpose: Leave dari room chat
         * Dipanggil dari: chatLeaveRequest()
         * 
         * Request:
         *   { type: "chat", action: "leaveRoom", userId, roomId, version: "1.0" }
         * 
         * Response:
         *   { _success: true }
         */
        leaveRoom: function(request) {
            LOG.title('HANDLING: chat.leaveRoom');
            LOG.data('Request:', request);
            
            var userId = request.userId;
            var roomId = request.roomId;
            
            if (!roomId) {
                LOG.warn('No roomId provided');
                return buildResponse({ _success: true });
            }
            
            // Get chat data
            var chatData = getChatData(userId);
            
            // Remove room from joined list
            var index = chatData.joinedRooms.indexOf(roomId);
            if (index > -1) {
                chatData.joinedRooms.splice(index, 1);
            }
            saveChatData(userId, chatData);
            
            var response = {
                _success: true
            };
            
            LOG.success('Left room:', roomId);
            LOG.data('Response:', response);
            
            return buildResponse(response);
        },
        
        /**
         * ============================================================
         * Handler: chat.sendMsg
         * ============================================================
         * 
         * Purpose: Kirim pesan ke room chat
         * Dipanggil dari: ToolCommon.sendMsg()
         * 
         * Request:
         *   { 
         *     type: "chat", 
         *     action: "sendMsg", 
         *     userId, 
         *     kind,         // MESSAGE_KIND (WORLD/GUILD/TEAM/WORLD_TEAM)
         *     content,      // Isi pesan
         *     msgType,      // Message type (0 = normal, etc)
         *     param,        // Additional params
         *     roomId,       // Target room ID
         *     version: "1.0" 
         *   }
         * 
         * Response:
         *   { _time: timestamp }  // Timestamp pesan
         * 
         * Flow after sendMsg:
         *   - createLocalData() creates local chat data
         *   - addSystemInfoWithMyChat() adds to broadcast
         */
        sendMsg: function(request) {
            LOG.title('HANDLING: chat.sendMsg');
            LOG.data('Request:', request);
            
            var userId = request.userId;
            var roomId = request.roomId;
            var content = request.content;
            var kind = request.kind;
            var msgType = request.msgType || 0;
            var param = request.param || null;
            
            if (!roomId) {
                LOG.error('No roomId provided');
                return buildResponse({ _time: getServerTime() });
            }
            
            // Get user info
            var sdkUser = window.LOCAL_SDK ? window.LOCAL_SDK.user : null;
            var playerData = null;
            if (window.MAIN_SERVER_MOCK && window.MAIN_SERVER_MOCK.getPlayerData) {
                playerData = window.MAIN_SERVER_MOCK.getPlayerData(userId);
            }
            
            // Build user info
            var userName = 'Player';
            var headImage = '';
            var userLevel = 1;
            var headEffect = null;
            var headBox = '';
            var oriServerId = 1;
            var serverId = 1;
            
            if (playerData && playerData.user) {
                userName = playerData.user._nickName || 'Player';
                headImage = playerData.user._headImage || '';
                oriServerId = playerData.user._oriServerId || 1;
            }
            if (playerData) {
                userLevel = playerData.playerLevel || 1;
            }
            if (sdkUser) {
                userName = sdkUser.nickname || userName;
            }
            
            // Get room
            var room = getRoomMessages(roomId);
            
            // Create message
            var msgTime = getServerTime();
            var msgId = 'msg_' + msgTime + '_' + Math.random().toString(36).substring(2, 8);
            
            // Build complete message data matching ChatDataBaseClass structure
            var newMessage = {
                _msgId: msgId,            // Internal message ID
                _id: userId,              // User ID pengirim
                _name: userName,          // Nama pengirim
                _content: content,        // Isi pesan
                _time: msgTime,           // Timestamp
                _kind: kind,              // MESSAGE_KIND
                _image: headImage,        // Head image URL
                _type: msgType,           // Message type
                _param: param,            // Additional params
                _headEffect: headEffect,  // Head effect
                _headBox: headBox,        // Head box ID
                _oriServerId: oriServerId,// Original server ID
                _serverId: serverId,      // Server ID
                _showMain: true           // Show in main chat
            };
            
            // Add to room messages (keep last N messages)
            room.messages.push(newMessage);
            if (room.messages.length > CONFIG.maxMessagesPerRoom) {
                room.messages.shift();
            }
            room.lastTime = msgTime;
            
            var response = {
                _time: msgTime
            };
            
            LOG.success('Message sent to room:', roomId);
            LOG.info('Content:', content);
            LOG.info('From:', userName);
            LOG.data('Response:', response);
            
            return buildResponse(response);
        },
        
        /**
         * ============================================================
         * Handler: chat.getRecord
         * ============================================================
         * 
         * Purpose: Ambil history chat dari room tertentu
         * Dipanggil dari: getTeamDungeonInfoRecord()
         * 
         * Request:
         *   { 
         *     type: "chat", 
         *     action: "getRecord", 
         *     userId, 
         *     roomId, 
         *     startTime,   // Ambil pesan setelah timestamp ini
         *     version: "1.0" 
         *   }
         * 
         * Response:
         *   { _record: { [msgId]: ChatMessageData, ... } }
         */
        getRecord: function(request) {
            LOG.title('HANDLING: chat.getRecord');
            LOG.data('Request:', request);
            
            var userId = request.userId;
            var roomId = request.roomId;
            var startTime = request.startTime || 0;
            
            if (!roomId) {
                LOG.warn('No roomId provided');
                return buildResponse({ _record: {} });
            }
            
            // Get room
            var room = getRoomMessages(roomId);
            
            // Build record response (only messages after startTime)
            var record = {};
            for (var i = 0; i < room.messages.length; i++) {
                var msg = room.messages[i];
                if (msg._time > startTime) {
                    record[msg._msgId] = msg;
                }
            }
            
            var response = {
                _record: record
            };
            
            LOG.success('Got record from room:', roomId);
            LOG.info('Messages found:', Object.keys(record).length);
            LOG.info('StartTime filter:', startTime);
            LOG.data('Response:', response);
            
            return buildResponse(response);
        }
    };

    // ========================================================
    // 7. MOCK SOCKET CLASS
    // ========================================================
    function MockSocket(serverUrl) {
        var self = this;
        
        self.url = serverUrl;
        self.connected = true;
        self.eventListeners = {};
        self.id = 'mock_chat_socket_' + Date.now();
        
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
            
            // When game registers 'verify' listener, emit verify event
            if (event === 'verify') {
                var self = this;
                setTimeout(function() {
                    LOG.socket('🔥 SERVER EMIT: verify event to client');
                    var verifyToken = 'chat_verify_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
                    self._trigger('verify', verifyToken);
                }, 100);
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
                LOG.socket('Client emit verify (encrypted token):', data);
                LOG.socket('Verify response - returning success');
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
            
            // Get handler
            var handler = RequestHandlers[request.action];
            
            if (handler) {
                var response = handler(request);
                
                LOG.success('Handler executed: chat.' + request.action);
                
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
        },
        
        sendToServer: function(request, callback) {
            LOG.socket('sendToServer() called');
            this._handleRequest(request, callback);
        }
    };

    // ========================================================
    // 8. INTERCEPT io.connect()
    // ========================================================
    function interceptSocketIO() {
        if (typeof window.io === 'undefined') {
            LOG.error('Socket.IO not found!');
            return;
        }
        
        var originalConnect = window.io.connect;
        
        if (!originalConnect) {
            LOG.error('io.connect not found!');
            return;
        }
        
        LOG.title('Intercepting io.connect() for Chat Server');
        
        window.io.connect = function(url, options) {
            LOG.socket('═══════════════════════════════════════════════════════════');
            LOG.socket('io.connect() called');
            LOG.socket('URL:', url);
            
            // Check if this is chat server URL (port 9997)
            var isChatServer = false;
            
            // Check from ts.loginInfo.serverItem.chaturl
            try {
                if (typeof ts !== 'undefined' && ts.loginInfo && ts.loginInfo.serverItem) {
                    var chatServerUrl = ts.loginInfo.serverItem.chaturl;
                    if (chatServerUrl && url.indexOf(chatServerUrl) !== -1) {
                        isChatServer = true;
                    }
                }
            } catch (e) {}
            
            // Also check by port
            if (url.indexOf('9997') !== -1 ||
                url.indexOf('127.0.0.1:9997') !== -1 ||
                url.indexOf('localhost:9997') !== -1) {
                isChatServer = true;
            }
            
            if (isChatServer) {
                LOG.success('✅ CHAT-SERVER DETECTED - Using MockSocket');
                LOG.socket('═══════════════════════════════════════════════════════════');
                return new MockSocket(url);
            } else {
                // Use original for other servers
                return originalConnect.call(window.io, url, options);
            }
        };
        
        LOG.success('io.connect() intercepted for Chat Server!');
    }

    // ========================================================
    // 9. INITIALIZE
    // ========================================================
    function init() {
        LOG.title('Chat-Server Mock v1.0.0 Initialized');
        LOG.info('Chat Server URL:', CONFIG.chatServerUrl);
        LOG.info('Max Messages Per Room:', CONFIG.maxMessagesPerRoom);
        LOG.info('');
        LOG.info('💡 Supported handlers:');
        LOG.info('   - chat.login       → Login to chat server');
        LOG.info('   - chat.joinRoom    → Join chat room');
        LOG.info('   - chat.leaveRoom   → Leave chat room');
        LOG.info('   - chat.sendMsg     → Send message');
        LOG.info('   - chat.getRecord   → Get chat history');
        
        interceptSocketIO();
    }

    // ========================================================
    // 10. EXPORT FOR DEBUGGING
    // ========================================================
    window.CHAT_SERVER_MOCK = {
        config: CONFIG,
        handlers: RequestHandlers,
        MockSocket: MockSocket,
        getChatData: getChatData,
        saveChatData: saveChatData,
        getRoomMessages: getRoomMessages,
        globalChatRooms: globalChatRooms,
        
        // Debug functions
        showRooms: function() {
            LOG.title('Current Chat Rooms');
            for (var roomId in globalChatRooms) {
                LOG.data(roomId + ':', globalChatRooms[roomId].messages.length + ' messages');
            }
        },
        
        clearRooms: function() {
            globalChatRooms = {};
            LOG.success('All chat rooms cleared');
        }
    };

    // ========================================================
    // 11. START
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