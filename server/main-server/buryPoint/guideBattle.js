/**
 * ============================================================
 * HANDLER: buryPoint.guideBattle
 * ============================================================
 * 
 * Purpose: Tracking/埋点 untuk guide battle (analytics)
 * Dipanggil dari: GuideInfoManager.guideBuriedPoint()
 * 
 * Request:
 *   { type: "buryPoint", action: "guideBattle", userId, point, passLesson, version }
 * 
 * Response:
 *   { _success: boolean }
 * 
 * Dari main.min.js:
 *   ts.processHandler({
 *     type: "buryPoint", action: "guideBattle",
 *     userId: n, point: e, passLesson: t, version: "1.0"
 *   }, function(e) {
 *     Logger.serverDebugLog("新手引导埋点！！！")
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

    var BURY_POINT_KEY = 'dragonball_bury_point';

    function handleGuideBattle(request, playerData) {
        LOG.info('Handler: buryPoint.guideBattle');
        LOG.data('Request:', request);

        var userId = request.userId;
        var point = request.point;
        var passLesson = request.passLesson;

        // Save bury point data (analytics tracking)
        try {
            var data = {
                userId: userId,
                point: point,
                passLesson: passLesson,
                timestamp: Date.now()
            };
            localStorage.setItem(BURY_POINT_KEY + '_' + userId + '_' + point, JSON.stringify(data));
        } catch (e) {}

        var response = { _success: true };

        LOG.success('guideBattle埋点: point=' + point + ', passLesson=' + passLesson);

        return response;
    }

    window.MAIN_SERVER_HANDLERS = window.MAIN_SERVER_HANDLERS || {};
    window.MAIN_SERVER_HANDLERS['buryPoint.guideBattle'] = handleGuideBattle;

    LOG.info('Handler registered: buryPoint.guideBattle');

})(window);