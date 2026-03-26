/**
 * ============================================================
 * HANDLER: guide.saveGuide
 * ============================================================
 * 
 * Purpose: Menyimpan progress tutorial/guide player
 * Dipanggil dari: GuideInfoManager.enterNextGuide() untuk menyimpan step tutorial
 * 
 * Flow: Tutorial Step Complete → saveGuide → save to localStorage
 * 
 * Request:
 *   { 
 *     type: "guide", 
 *     action: "saveGuide", 
 *     userId: "...",
 *     guideType: number,     // GUIDE_TYPE enum value
 *     step: number,          // Current tutorial step ID
 *     version: "1.0" 
 *   }
 * 
 * Response:
 *   { _success: boolean }
 * 
 * Struktur data dari main.min.js:
 *   ts.processHandler({
 *     type: "guide",
 *     action: "saveGuide",
 *     userId: r,
 *     guideType: o.tutorialLine,
 *     step: e,
 *     version: "1.0"
 *   }, function(e) { Logger.serverDebugLog("成功！！！") })
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
    // CONSTANTS
    // ========================================================
    var GUIDE_STORAGE_KEY = 'dragonball_guide_progress';
    
    // ========================================================
    // HELPER FUNCTIONS
    // ========================================================
    
    /**
     * Get server time (dari shared utils)
     */
    function getServerTime() {
        if (window.MAIN_SERVER_UTILS && window.MAIN_SERVER_UTILS.getServerTime) {
            return window.MAIN_SERVER_UTILS.getServerTime();
        }
        return Date.now();
    }

    /**
     * Get existing guide progress from localStorage
     */
    function getGuideProgress(userId) {
        try {
            var stored = localStorage.getItem(GUIDE_STORAGE_KEY + '_' + userId);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            // Silent fail
        }
        return {
            guides: {}  // { guideType: step }
        };
    }

    /**
     * Save guide progress to localStorage
     */
    function saveGuideProgress(userId, data) {
        try {
            localStorage.setItem(GUIDE_STORAGE_KEY + '_' + userId, JSON.stringify(data));
        } catch (e) {
            // Silent fail
        }
    }

    // ========================================================
    // HANDLER FUNCTION
    // ========================================================
    
    /**
     * Handle guide.saveGuide request
     * 
     * @param {Object} request - Request data dari client
     *   - type: "guide"
     *   - action: "saveGuide"
     *   - userId: string
     *   - guideType: number (GUIDE_TYPE enum)
     *   - step: number (step ID)
     *   - version: "1.0"
     * 
     * @param {Object} playerData - Player data dari localStorage
     * 
     * @returns {Object} Response:
     *   { _success: true }
     */
    function handleSaveGuide(request, playerData) {
        LOG.info('─────────────────────────────────────────');
        LOG.info('Handler: guide.saveGuide');
        LOG.data('Request:', request);

        // ========================================================
        // VALIDATE REQUEST
        // ========================================================
        if (!request) {
            LOG.warn('Invalid request: request is null');
            return { _success: false };
        }

        var userId = request.userId;
        var guideType = request.guideType;
        var step = request.step;

        if (!userId) {
            LOG.warn('Missing userId in request');
            return { _success: false };
        }

        // ========================================================
        // GET & UPDATE PROGRESS
        // ========================================================
        var progressData = getGuideProgress(userId);
        
        // Update step untuk guide type ini
        progressData.guides[guideType] = step;
        progressData.lastUpdated = getServerTime();

        // Save to localStorage
        saveGuideProgress(userId, progressData);

        // ========================================================
        // BUILD RESPONSE
        // ========================================================
        var response = {
            _success: true
        };

        LOG.success('guide.saveGuide: GuideType=' + guideType + ', Step=' + step);
        LOG.data('Response:', response);

        return response;
    }

    // ========================================================
    // EXPORT HANDLER
    // ========================================================
    
    // Register ke global handler registry
    window.MAIN_SERVER_HANDLERS = window.MAIN_SERVER_HANDLERS || {};
    window.MAIN_SERVER_HANDLERS['guide.saveGuide'] = handleSaveGuide;

    // Log registration
    if (LOG) {
        LOG.info('Handler registered: guide.saveGuide');
    }

})(window);