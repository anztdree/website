/**
 * ============================================================
 * HANDLER: heroImage.getAll
 * ============================================================
 * 
 * Purpose: Mendapatkan daftar semua hero yang sudah dimiliki player
 * Dipanggil dari: onResourceLoadComplete() setelah loading screen
 * 
 * Flow: enterGame → loading → heroImage.getAll → hero.getAttrs
 * 
 * Request:
 *   { type: "heroImage", action: "getAll", userId: "...", version: "1.0" }
 * 
 * Response:
 *   { _heros: { [heroId]: { _id, _maxLevel, _selfComments }, ... } }
 * 
 * Struktur data dari main.min.js:
 *   setAlreadyGainHeroID = function(e) {
 *     t.alreadyGainHeroIDList = {};
 *     for (var n in e._heros) {
 *       var o = e._heros[n]._id;
 *       var a = new HeroImageInfo;
 *       a.id = o;
 *       a.maxLevel = e._heros[n]._maxLevel;
 *       a.selfComments = [];
 *       var r = e._heros[n]._selfComments;
 *       if (r) for (var i=0; i<r.length; i++)
 *         a.selfComments.push(r[i]);
 *       t.alreadyGainHeroIDList[o] = a;
 *     }
 *   }
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
     * Handle heroImage.getAll request
     * 
     * @param {Object} request - Request data dari client
     *   - type: "heroImage"
     *   - action: "getAll"
     *   - userId: string
     *   - version: "1.0"
     * 
     * @param {Object} playerData - Data player dari storage (hasil loadOrCreatePlayerData)
     *   - heros: { [heroId]: { _heroDisplayId, _heroLevel, ... }, ... }
     * 
     * @returns {Object} Response dengan format:
     *   {
     *     _heros: {
     *       [heroKey]: {
     *         _id: number,           // hero display id
     *         _maxLevel: number,     // max level hero
     *         _selfComments: []      // comments (optional)
     *       }
     *     }
     *   }
     */
    function handleHeroImageGetAll(request, playerData) {
        LOG.info('─────────────────────────────────────────');
        LOG.info('Handler: heroImage.getAll');
        LOG.data('Request:', request);

        // ========================================================
        // BUILD RESPONSE
        // ========================================================
        // Ambil data hero dari playerData
        // playerData.heros berisi: { [heroId]: { _heroDisplayId, _heroLevel, _maxLevel, ... } }
        // 
        // Response harus memiliki struktur:
        //   { _heros: { [key]: { _id, _maxLevel, _selfComments } } }
        // ========================================================
        
        var herosData = {};
        
        // Ambil dari playerData.heros
        if (playerData && playerData.heros) {
            for (var heroId in playerData.heros) {
                var hero = playerData.heros[heroId];
                
                // Gunakan heroId sebagai key
                // _id adalah heroDisplayId (untuk HeroImageInfo)
                herosData[heroId] = {
                    _id: hero._heroDisplayId || hero._id,
                    _maxLevel: hero._maxLevel || hero._heroLevel || 1,
                    _selfComments: hero._selfComments || []
                };
            }
        }

        var response = {
            _heros: herosData
        };

        // Log jumlah hero
        var heroCount = Object.keys(herosData).length;
        LOG.success('heroImage.getAll: ' + heroCount + ' hero(s) sent');
        LOG.data('Response:', response);

        return response;
    }

    // ========================================================
    // EXPORT HANDLER
    // ========================================================
    
    // Register ke global handler registry
    window.MAIN_SERVER_HANDLERS = window.MAIN_SERVER_HANDLERS || {};
    window.MAIN_SERVER_HANDLERS['heroImage.getAll'] = handleHeroImageGetAll;

    // Log registration
    if (LOG) {
        LOG.info('Handler registered: heroImage.getAll');
    }

})(window);
