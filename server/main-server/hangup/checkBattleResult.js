/**
 * ============================================================
 * HANDLER: hangup.checkBattleResult
 * ============================================================
 * 
 * Purpose: Check hasil battle dari hangup/lesson/guide
 * Dipanggil dari: Setelah battle selesai
 * 
 * Request:
 *   { type: "hangup", action: "checkBattleResult", userId, version, isGuide?, battleId?, super?, checkResult?, battleField?, runaway? }
 * 
 * Response:
 *   { _battleResult: 0, _curLess: number, _maxPassLesson: number, _changeInfo: { _items: [] } }
 * 
 * Dari main.min.js:
 *   ts.processHandler({
 *     type: "hangup", action: "checkBattleResult",
 *     userId, version: "1.0", isGuide: !0
 *   }, function(e) {
 *     var t = 0 == e._battleResult ? !0 : !1;
 *     // t._curLess, t._maxPassLesson
 *   })
 * ============================================================
 */

(function(window) {
    'use strict';

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

    var STORAGE_KEY = 'dragonball_player_data';

    function handleCheckBattleResult(request, playerData) {
        LOG.info('Handler: hangup.checkBattleResult');
        LOG.data('Request:', request);

        var userId = request.userId;
        var isGuide = request.isGuide;

        // Get current lesson from playerData
        var curLess = 10101;
        var maxPassLesson = 10101;
        var maxPassChapter = 0;

        if (playerData && playerData.hangup) {
            curLess = playerData.hangup._curLess || 10101;
            maxPassLesson = playerData.hangup._maxPassLesson || 10101;
            maxPassChapter = playerData.hangup._maxPassChapter || 0;
        }

        // For guide battle, always win and progress to next lesson
        if (isGuide) {
            // Tutorial lesson progression: 10101 -> 10201 -> 10202 -> etc
            var nextLesson = 10201;
            maxPassLesson = Math.max(maxPassLesson, nextLesson);
            curLess = nextLesson;

            // Update playerData
            if (playerData && playerData.hangup) {
                playerData.hangup._curLess = curLess;
                playerData.hangup._maxPassLesson = maxPassLesson;
                try {
                    localStorage.setItem(STORAGE_KEY + '_' + userId, JSON.stringify(playerData));
                } catch (e) {}
            }
        }

        // Response - _battleResult: 0 = win
        var response = {
            _battleResult: 0,  // 0 = win
            _curLess: curLess,
            _maxPassLesson: maxPassLesson,
            _maxPassChapter: maxPassChapter,
            _changeInfo: {
                _items: []
            }
        };

        LOG.success('checkBattleResult: win, curLess=' + curLess + ', maxPass=' + maxPassLesson);

        return response;
    }

    window.MAIN_SERVER_HANDLERS = window.MAIN_SERVER_HANDLERS || {};
    window.MAIN_SERVER_HANDLERS['hangup.checkBattleResult'] = handleCheckBattleResult;

    LOG.info('Handler registered: hangup.checkBattleResult');

})(window);