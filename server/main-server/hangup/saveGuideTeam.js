/**
 * ============================================================
 * HANDLER: hangup.saveGuideTeam
 * ============================================================
 * 
 * Purpose: Menyimpan lineup tim dari tutorial/guide battle
 * Dipanggil dari: GuideInfoManager setelah tutorial battle selesai
 * 
 * Flow: Tutorial Battle End → saveGuideTeam → checkBattleResult
 * 
 * Request:
 *   { 
 *     type: "hangup", 
 *     action: "saveGuideTeam", 
 *     userId: "...",
 *     team: ["heroId1", "heroId2", ...],     // Array of hero IDs in lineup
 *     supers: ["superSkillId1", ...],        // Array of super skill IDs
 *     version: "1.0" 
 *   }
 * 
 * Response:
 *   { _success: boolean }
 * 
 * Struktur data dari main.min.js:
 *   ts.processHandler({
 *     type: "hangup",
 *     action: "saveGuideTeam",
 *     userId: r,
 *     team: n,
 *     supers: a,
 *     version: "1.0"
 *   }, function(e) {
 *     // Callback - continue to checkBattleResult
 *     ts.processHandler({
 *       type: "hangup",
 *       action: "checkBattleResult",
 *       ...
 *     })
 *   })
 * 
 * Catatan:
 *   - Handler ini dipanggil SETELAH tutorial/guide battle selesai
 *   - Menyimpan lineup tim yang digunakan player selama tutorial
 *   - Data disimpan ke localStorage untuk persistensi
 *   - Team berisi array hero IDs (urutan = posisi dalam tim)
 *   - Supers berisi array super skill IDs yang di-deploy
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
    // STORAGE KEY
    // ========================================================
    var GUIDE_TEAM_STORAGE_KEY = 'dragonball_guide_team';

    // ========================================================
    // HELPER FUNCTIONS
    // ========================================================
    function getServerTime() {
        return Date.now();
    }

    /**
     * Get guide team data from localStorage
     */
    function getGuideTeamData(userId) {
        try {
            var stored = localStorage.getItem(GUIDE_TEAM_STORAGE_KEY + '_' + userId);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            LOG.warn('Failed to load guide team data:', e);
        }
        
        // Default guide team data structure
        return {
            userId: userId,
            team: [],           // Array of hero IDs
            supers: [],         // Array of super skill IDs
            savedAt: null
        };
    }

    /**
     * Save guide team data to localStorage
     */
    function saveGuideTeamData(userId, data) {
        try {
            localStorage.setItem(GUIDE_TEAM_STORAGE_KEY + '_' + userId, JSON.stringify(data));
            LOG.success('Guide team data saved for user:', userId);
        } catch (e) {
            LOG.error('Failed to save guide team data:', e);
        }
    }

    // ========================================================
    // HANDLER FUNCTION
    // ========================================================
    
    /**
     * Handle hangup.saveGuideTeam request
     * 
     * @param {Object} request - Request data dari client
     *   - type: "hangup"
     *   - action: "saveGuideTeam"
     *   - userId: string
     *   - team: array of hero IDs (lineup)
     *   - supers: array of super skill IDs
     *   - version: "1.0"
     * 
     * @param {Object} playerData - Data player dari storage (tidak digunakan di handler ini)
     * 
     * @returns {Object} Response dengan format:
     *   { _success: true }
     */
    function handleSaveGuideTeam(request, playerData) {
        LOG.info('─────────────────────────────────────────');
        LOG.info('Handler: hangup.saveGuideTeam');
        LOG.data('Request:', request);

        // ========================================================
        // VALIDATE REQUEST
        // ========================================================
        var userId = request.userId;
        var team = request.team || [];
        var supers = request.supers || [];

        if (!userId) {
            LOG.error('No userId provided');
            return { _success: false, _error: 'No userId' };
        }

        // ========================================================
        // SAVE GUIDE TEAM DATA
        // ========================================================
        // Get existing data or create new
        var guideTeamData = getGuideTeamData(userId);
        
        // Update with new team data
        guideTeamData.team = team;
        guideTeamData.supers = supers;
        guideTeamData.savedAt = getServerTime();
        
        // Save to localStorage
        saveGuideTeamData(userId, guideTeamData);

        // ========================================================
        // UPDATE LAST TEAM (untuk HANGUP type)
        // ========================================================
        // Also update the lastTeam data in playerData if available
        if (playerData && playerData.lastTeam && playerData.lastTeam._lastTeamInfo) {
            var hangupTeamType = '9'; // LAST_TEAM_TYPE.HANGUP = 9
            
            playerData.lastTeam._lastTeamInfo[hangupTeamType] = {
                _team: team,
                _superSkill: supers
            };
            
            // Save updated playerData
            var STORAGE_KEY = 'dragonball_player_data';
            try {
                localStorage.setItem(STORAGE_KEY + '_' + userId, JSON.stringify(playerData));
                LOG.info('Updated lastTeam in playerData');
            } catch (e) {
                LOG.warn('Failed to update playerData:', e);
            }
        }

        // ========================================================
        // BUILD RESPONSE
        // ========================================================
        var response = {
            _success: true
        };

        LOG.success('saveGuideTeam: Team saved successfully');
        LOG.info('Team heroes:', team.length + ' hero(s)');
        LOG.info('Super skills:', supers.length + ' skill(s)');
        LOG.data('Response:', response);

        return response;
    }

    // ========================================================
    // EXPORT HANDLER
    // ========================================================
    
    // Register ke global handler registry
    window.MAIN_SERVER_HANDLERS = window.MAIN_SERVER_HANDLERS || {};
    window.MAIN_SERVER_HANDLERS['hangup.saveGuideTeam'] = handleSaveGuideTeam;

    // Log registration
    if (LOG) {
        LOG.info('Handler registered: hangup.saveGuideTeam');
    }

})(window);
