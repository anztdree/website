/**
 * ============================================================
 * HANDLER: activity.getActivityBrief
 * ============================================================
 * 
 * Purpose: Mengembalikan daftar singkat aktivitas yang tersedia
 * Dipanggil dari: HomeScene.setActs() dan ToolCommon.backToActivityPage()
 * 
 * Request:
 *   { type: "activity", action: "getActivityBrief", userId: "...", version: "1.0" }
 * 
 * Response:
 *   { _acts: [...] }
 * 
 * Setiap item di _acts memiliki field (SEMUA WAJIB - tidak ada optional):
 *   - id: number           // Activity ID
 *   - actType: number      // Activity type
 *   - actCycle: number     // Activity cycle
 *   - endTime: number      // End timestamp (0 jika tidak ada deadline)
 *   - hangupReward: object // For ITEM_DROP type (null jika bukan ITEM_DROP)
 *   - cycleType: number    // Cycle type (0 jika tidak ada)
 *   - poolId: number       // Pool ID (0 jika tidak ada)
 * 
 * ACTIVITY_TYPE enum values:
 *   UNKNOWN = 0
 *   ITEM_DROP = 100
 *   NEW_USER_MAIL = 101
 *   FREE_INHERIT = 102
 *   LOGIN = 1001
 *   GROW = 1002
 *   HERO_GIFT = 2001
 *   ... etc
 * 
 * ACTIVITY_CYCLE enum values:
 *   UNKNOWN = 0
 *   NEW_USER = 1
 *   SERVER_OPEN = 2
 *   WEEK = 3
 *   RANK = 4
 *   SUMMON = 5
 *   BE_STRONG = 6
 *   ... etc
 * 
 * ============================================================
 */

(function(window) {
    'use strict';

    // ========================================================
    // LOGGER
    // ========================================================
    var LOG = window.MAIN_SERVER_LOG || {
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

    // ========================================================
    // ACTIVITY TYPE & CYCLE ENUMS (from main.min.js)
    // ========================================================
    var ACTIVITY_TYPE = {
        UNKNOWN: 0,
        ITEM_DROP: 100,
        NEW_USER_MAIL: 101,
        FREE_INHERIT: 102,
        LOGIN: 1001,
        GROW: 1002,
        RECHARGE_3: 1003,
        HERO_GIFT: 2001,
        HERO_ORANGE: 2002,
        NEW_SERVER_GIFT: 2003,
        RECHARGE_GIFT: 2004,
        POWER_RANK: 2005,
        RECHARGE_7: 2006,
        RECHARGE_DAILY: 2007,
        NORMAL_LUCK: 3001,
        LUXURY_LUCK: 3002,
        SUPER_GIFT: 3003,
        LUCKY_FEEDBACK: 3004,
        DAILY_DISCOUNT: 3005,
        DAILY_BIG_GIFT: 3006,
        CUMULATIVE_RECHARGE: 3007,
        SIGN_ACT: 3014,
        HERO_ARRIVAL: 3015,
        BE_STRONG: 3016,
        SUMMON_GIFT: 5005,
        COST_FEEDBACK: 5007,
        NEW_HERO_REWARD: 5015,
        FB_SHARE: 5025,
        OFFLINE_ACT: 5031,
        OFFLINE_ACT_TWO: 5033
    };

    var ACTIVITY_CYCLE = {
        UNKNOWN: 0,
        NEW_USER: 1,
        SERVER_OPEN: 2,
        WEEK: 3,
        RANK: 4,
        SUMMON: 5,
        BE_STRONG: 6,
        LIMIT_HERO: 7,
        HOLIDAY: 8,
        EQUIPTOTALACTIVITY: 9,
        SIGNTOTALACTIVITY: 10,
        SUMARRYGIFT: 11,
        MERGESERVER: 12,
        SPECIALHOLIDY: 13,
        BUDOPEAK: 14,
        SUPERLEGEND: 15,
        OLDUSERBACK: 16,
        REGRESSION: 17,
        ULTRA_INSTINCT: 18,
        WEEKEND_SIGNIN: 19,
        WELFARE_ACCOUNT: 20,
        FBSDKSHARE: 88,
        QUESTION: 60,
        OFFLINEACT: 91,
        OFFLINEACT_TWO: 92,
        RedFoxCommunity: 94,
        NEW_HERO_CHALLENGE: 5041
    };

    // ========================================================
    // HANDLER FUNCTION
    // ========================================================
    
    /**
     * Handle activity.getActivityBrief request
     * 
     * @param {Object} request - Request data dari client
     * @param {Object} playerData - Data player dari storage
     * @returns {Object} Response: { _acts: [...] }
     */
    function handleGetActivityBrief(request, playerData) {
        LOG.info('─────────────────────────────────────────');
        LOG.info('Handler: activity.getActivityBrief');
        LOG.data('Request:', request);

        // ========================================================
        // BUILD ACTIVITIES LIST
        // ========================================================
        // Untuk new user, kembalikan array kosong
        // Game akan menambahkan aktivitas lain berdasarkan:
        // - UserInfoSingleton.getInstance().getQuestData() -> QUESTION
        // - UserInfoSingleton.getInstance().userDownloadModel -> DOWNLOADREWARD
        // - UserInfoSingleton.getInstance().YouTuberModel -> YouTubeRecruit
        // - channelSpecial._honghuUrl -> RedFoxCommunity
        // ========================================================
        
        var _acts = [];

        // ========================================================
        // CONTOH AKTIVITAS (uncomment jika diperlukan untuk testing)
        // ========================================================
        // NEW_USER activity (actCycle: 1, actType: 1001 = LOGIN)
        // _acts.push({
        //     id: 10001,
        //     actType: ACTIVITY_TYPE.LOGIN,
        //     actCycle: ACTIVITY_CYCLE.NEW_USER,
        //     endTime: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days from now
        // });

        // SERVER_OPEN activity
        // _acts.push({
        //     id: 10002,
        //     actType: ACTIVITY_TYPE.NEW_SERVER_GIFT,
        //     actCycle: ACTIVITY_CYCLE.SERVER_OPEN,
        //     endTime: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
        // });

        // ========================================================
        // BUILD RESPONSE
        // ========================================================
        // Response structure dari main.min.js:
        // for(var a in t._acts) { ... }
        // _acts bisa berupa array atau object (keduanya work dengan for...in)
        // ========================================================
        
        var response = {
            _acts: _acts
        };

        LOG.success('getActivityBrief: ' + _acts.length + ' activities returned');
        LOG.data('Response:', response);

        return response;
    }

    // ========================================================
    // EXPORT HANDLER
    // ========================================================
    
    window.MAIN_SERVER_HANDLERS = window.MAIN_SERVER_HANDLERS || {};
    window.MAIN_SERVER_HANDLERS['activity.getActivityBrief'] = handleGetActivityBrief;

    LOG.info('Handler registered: activity.getActivityBrief');

})(window);
