/**
 * ============================================================
 * HANDLER: user.registChat
 * ============================================================
 * 
 * Purpose: Mendaftarkan user ke chat server dan mendapatkan
 *          informasi room chat yang tersedia
 * 
 * Dipanggil dari: TSUIController.registChat()
 * 
 * Flow: enterGame → loginSuccessCallBack → registChat (interval 3 detik)
 * 
 * Request:
 *   { 
 *     type: "user", 
 *     action: "registChat", 
 *     userId: "...", 
 *     version: "1.0" 
 *   }
 * 
 * Response:
 *   {
 *     _success: boolean,
 *     _chatServerUrl: string,      // URL chat server (port 9997)
 *     _worldRoomId: string,        // ID room world chat
 *     _guildRoomId: string,        // ID room guild chat (null jika tidak ada guild)
 *     _teamDungeonChatRoom: string, // ID room team dungeon chat
 *     _teamChatRoom: string        // ID room team chat
 *   }
 * 
 * Struktur data dari main.min.js:
 *   registChat = function(e) {
 *     ts.processHandler({
 *       type: "user",
 *       action: "registChat",
 *       userId: UserInfoSingleton.getInstance().userId,
 *       version: "1.0"
 *     }, function(n) {
 *       n._success ? (
 *         ts.loginInfo.serverItem.chaturl = n._chatServerUrl,
 *         ts.loginInfo.serverItem.worldRoomId = n._worldRoomId,
 *         ts.loginInfo.serverItem.guildRoomId = n._guildRoomId,
 *         ts.loginInfo.serverItem.teamDungeonChatRoom = n._teamDungeonChatRoom,
 *         ts.loginInfo.serverItem.teamChatRoomId = n._teamChatRoom,
 *         clearInterval(ts.chatInterval),
 *         t.clientStartChat(!1, e)
 *       ) : (
 *         ts.chatConnectCount++,
 *         ts.chatConnectCount > 15 && clearInterval(ts.chatInterval)
 *       )
 *     })
 *   }
 * 
 * Catatan:
 *   - Handler ini dipanggil berulang setiap 3 detik sampai berhasil
 *   - Maksimal 15 kali percobaan (chatConnectCount > 15)
 *   - Response _success = true akan menghentikan interval
 *   - Untuk mock server, kita return URL lokal dan room ID dummy
 * 
 * ============================================================
 */

(function(window) {
    'use strict';

    // ========================================================
    // LOGGER (gunakan shared dari entergame.js)
    // ========================================================
    var LOG = window.MAIN_SERVER_LOG;
    
    if (!LOG) {
        LOG = {
            prefix: '🎮 [MAIN-SERVER]',
            styles: {
                title: 'background: linear-gradient(90deg, #f59e0b 0%, #ef4444 100%); color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;',
                success: 'color: #22c55e; font-weight: bold;',
                info: 'color: #6b7280;',
                warn: 'color: #f59e0b; font-weight: bold;',
                error: 'color: #ef4444; font-weight: bold;',
                data: 'color: #8b5cf6;'
            },
            _log: function(level, icon, message, data) {
                var style = this.styles[level] || this.styles.info;
                if (data !== undefined) {
                    console.log('%c' + this.prefix + ' ' + icon + ' ' + message, this.styles.title, data);
                } else {
                    console.log('%c' + this.prefix + ' ' + icon + ' ' + message, this.styles.title);
                }
            },
            success: function(message, data) { this._log('success', '✅', message, data); },
            info: function(message, data) { this._log('info', 'ℹ️', message, data); },
            warn: function(message, data) { this._log('warn', '⚠️', message, data); },
            error: function(message, data) { this._log('error', '❌', message, data); },
            data: function(message, data) { this._log('data', '📊', message, data); }
        };
    }

    // ========================================================
    // CONFIGURATION
    // ========================================================
    var CHAT_CONFIG = {
        // Chat server URL (placeholder - tidak akan digunakan di mock)
        chatServerUrl: 'http://127.0.0.1:9997',
        
        // Room IDs untuk chat
        worldRoomId: 'world_room_001',
        guildRoomId: null,  // null karena user tidak punya guild
        teamDungeonChatRoom: null,
        teamChatRoom: null
    };

    // ========================================================
    // HANDLER FUNCTION
    // ========================================================
    
    /**
     * Handle user.registChat request
     * 
     * @param {Object} request - Request data dari client
     *   - type: "user"
     *   - action: "registChat"
     *   - userId: string
     *   - version: "1.0"
     * 
     * @param {Object} playerData - Data player dari storage (tidak digunakan di handler ini)
     * 
     * @returns {Object} Response dengan format:
     *   {
     *     _success: true,
     *     _chatServerUrl: "http://127.0.0.1:9997",
     *     _worldRoomId: "world_room_001",
     *     _guildRoomId: null,
     *     _teamDungeonChatRoom: null,
     *     _teamChatRoom: null
     *   }
     */
    function handleRegistChat(request, playerData) {
        LOG.info('─────────────────────────────────────────');
        LOG.info('Handler: user.registChat');
        LOG.data('Request:', request);

        // ========================================================
        // BUILD RESPONSE
        // ========================================================
        // Untuk mock server:
        // - _success selalu true (karena tidak ada chat server asli)
        // - _chatServerUrl bisa kosong atau placeholder
        // - Room IDs bisa dummy karena tidak ada chat server
        // 
        // Catatan: Di game asli, chat server adalah server terpisah
        // yang menangani chat world, guild, dll.
        // Untuk mock, kita return success tanpa chat server aktif.
        // ========================================================
        
        var response = {
            _success: true,
            _chatServerUrl: CHAT_CONFIG.chatServerUrl,
            _worldRoomId: CHAT_CONFIG.worldRoomId,
            _guildRoomId: CHAT_CONFIG.guildRoomId,
            _teamDungeonChatRoom: CHAT_CONFIG.teamDungeonChatRoom,
            _teamChatRoom: CHAT_CONFIG.teamChatRoom
        };

        LOG.success('user.registChat: Chat registration successful');
        LOG.info('Chat Server URL:', response._chatServerUrl);
        LOG.info('World Room ID:', response._worldRoomId);
        LOG.data('Full Response:', response);

        return response;
    }

    // ========================================================
    // EXPORT HANDLER
    // ========================================================
    
    // Register ke global handler registry
    window.MAIN_SERVER_HANDLERS = window.MAIN_SERVER_HANDLERS || {};
    window.MAIN_SERVER_HANDLERS['user.registChat'] = handleRegistChat;

    // Log registration
    if (LOG) {
        LOG.info('Handler registered: user.registChat');
    }

})(window);