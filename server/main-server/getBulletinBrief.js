/**
 * ============================================================
 * HANDLER: user.getBulletinBrief
 * ============================================================
 * 
 * Purpose: Mendapatkan daftar bulletin/pengumuman singkat
 * Dipanggil dari: MailInfoManager.getInstance().getBulletinBrief()
 * 
 * Flow: Setelah enterGame → saveUserData → getBulletinBrief
 * 
 * Request:
 *   { type: "user", action: "getBulletinBrief", userId: "...", version: "1.0" }
 * 
 * Response:
 *   { _brief: { [id]: { title, version, order }, ... } }
 * 
 * ============================================================
 */

(function(window) {
    'use strict';

    // ========================================================
    // LOGGER (shared dengan main-server)
    // ========================================================
    var LOG = window.MAIN_SERVER_LOG || {
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
        data: function(message, data) { this._log('data', '📊', message, data); }
    };

    // ========================================================
    // HANDLER FUNCTION
    // ========================================================
    
    /**
     * Handle user.getBulletinBrief request
     * 
     * Dari main.min.js:
     * getBulletinBrief = function(e) {
     *   ts.processHandler({type:"user", action:"getBulletinBrief", userId:n, version:"1.0"}, function(n) {
     *     t.bulletinList = {};
     *     for (var o in n._brief)
     *       t.bulletinList[o] = {
     *         bulletin: "",
     *         bulletinTitle: n._brief[o].title,
     *         bulletinVersion: n._brief[o].version,
     *         order: n._brief[o].order
     *       };
     *     e && e()
     *   })
     * }
     * 
     * @param {Object} request - Request data dari client
     * @param {Object} playerData - Data player dari storage
     * @returns {Object} Response dengan format { _brief: {...} }
     */
    function handleGetBulletinBrief(request, playerData) {
        LOG.info('Handling: user.getBulletinBrief');
        LOG.data('Request:', request);

        // ========================================================
        // BUILD RESPONSE
        // ========================================================
        // Struktur dari main.min.js:
        // n._brief[o].title
        // n._brief[o].version
        // n._brief[o].order
        
        var response = {
            _brief: {
                // Contoh bulletin (kosong untuk sekarang, bisa ditambah nanti)
                // "1": {
                //     title: "Selamat Datang!",
                //     version: 1,
                //     order: 1
                // }
            }
        };

        LOG.success('getBulletinBrief response sent');
        LOG.data('Response:', response);

        return response;
    }

    // ========================================================
    // EXPORT HANDLER
    // ========================================================
    
    // Register ke global handler registry
    window.MAIN_SERVER_HANDLERS = window.MAIN_SERVER_HANDLERS || {};
    window.MAIN_SERVER_HANDLERS['user.getBulletinBrief'] = handleGetBulletinBrief;

    LOG.info('Handler registered: user.getBulletinBrief');

})(window);
