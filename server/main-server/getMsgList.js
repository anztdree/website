/**
 * ============================================================
 * HANDLER: userMsg.getMsgList
 * ============================================================
 * 
 * Purpose: Mendapatkan daftar singkat pesan privat antar user
 * Dipanggil dari: onResourceLoadComplete() setelah hero.getAttrs
 * 
 * Flow: enterGame → loading → heroImage.getAll → hero.getAttrs → userMsg.getMsgList
 * 
 * Request:
 *   { type: "userMsg", action: "getMsgList", userId: "...", version: "1.0" }
 * 
 * Response:
 *   { _brief: { [friendId]: { lastMsgTime, lastReadTime, msg, userInfo }, ... } }
 * 
 * Struktur data dari main.min.js:
 *   setMessageFriendSimpleList = function(e) {
 *     for (var n in e) {
 *       var o = new UserMessageFriendSimpleItem;
 *       e[n].lastMsgTime && (o.lastMsgTime = e[n].lastMsgTime);
 *       e[n].lastReadTime && (o.lastReadTime = e[n].lastReadTime);
 *       o.msg = e[n].msg;
 *       o.userInfo.deserialize(e[n].userInfo);
 *       t.messageFriendSimpleItemList[n] = o;
 *     }
 *   }
 * 
 * Catatan:
 *   - Ini adalah sistem pesan privat antar player
 *   - Untuk mock server, kita bisa return empty object
 *   - Di game asli, ini berisi daftar percakapan dengan player lain
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
            data: function(message, data) { this._log('data', '📊', message, data); }
        };
    }

    // ========================================================
    // HANDLER FUNCTION
    // ========================================================
    
    /**
     * Handle userMsg.getMsgList request
     * 
     * @param {Object} request - Request data dari client
     *   - type: "userMsg"
     *   - action: "getMsgList"
     *   - userId: string
     *   - version: "1.0"
     * 
     * @param {Object} playerData - Data player dari storage
     * 
     * @returns {Object} Response dengan format:
     *   {
     *     _brief: {
     *       [friendId]: {
     *         lastMsgTime: number,
     *         lastReadTime: number,
     *         msg: string,
     *         userInfo: { _id, _nickName, _headImage, ... }
     *       }
     *     }
     *   }
     */
    function handleGetMsgList(request, playerData) {
        LOG.info('─────────────────────────────────────────');
        LOG.info('Handler: userMsg.getMsgList');
        LOG.data('Request:', request);

        // ========================================================
        // BUILD RESPONSE
        // ========================================================
        // Untuk mock server, kita return empty object
        // Di game asli, ini berisi daftar percakapan dengan player lain
        // ========================================================
        
        var response = {
            _brief: {}
        };

        LOG.success('userMsg.getMsgList: Empty message list sent (mock)');
        LOG.data('Response:', response);

        return response;
    }

    // ========================================================
    // EXPORT HANDLER
    // ========================================================
    
    // Register ke global handler registry
    window.MAIN_SERVER_HANDLERS = window.MAIN_SERVER_HANDLERS || {};
    window.MAIN_SERVER_HANDLERS['userMsg.getMsgList'] = handleGetMsgList;

    // Log registration
    if (LOG) {
        LOG.info('Handler registered: userMsg.getMsgList');
    }

})(window);
