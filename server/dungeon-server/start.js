/**
 * ============================================================
 * DUNGEON-SERVER/START.JS - Entry Point
 * ============================================================
 *
 * Titik Masuk dungeon-server
 *
 * FLOW:
 *   entergame → myTeamServerSocketUrl → dungeonurl → clientStartDungeon() → connect
 *
 * Data dari entergame:
 *   - myTeamServerSocketUrl → URL socket dungeon-server
 *   - teamDungeon → data team dungeon
 *   - teamServerHttpUrl → HTTP URL
 *   - teamDungeonOpenTime → waktu buka
 *
 * Type Request: "teamDungeonGame"
 *
 * Struktur file handler (dibuat terpisah):
 *   dungeon-server/
 *   ├── start.js        (file ini - entry point)
 *   └── ... (handler lainnya)
 *
 * Load Order: AFTER socket.io.min.js, BEFORE main.min.js
 *
 * ============================================================
 */

(function(window) {
    'use strict';

    // ========================================================
    // LOGGER
    // ========================================================
    var LOG = {
        prefix: '🏰 [DUNGEON-SERVER]',
        styles: {
            title: 'background: linear-gradient(90deg, #8b5cf6 0%, #ec4899 100%); color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;',
            success: 'color: #22c55e; font-weight: bold;',
            info: 'color: #6b7280;',
            warn: 'color: #f59e0b; font-weight: bold;',
            error: 'color: #ef4444; font-weight: bold;',
            data: 'color: #8b5cf6;',
            socket: 'color: #ec4899; font-weight: bold;'
        },

        _log: function(level, icon, message, data) {
            var style = this.styles[level] || this.styles.info;
            var timestamp = new Date().toISOString().substr(11, 12);
            if (data !== undefined) {
                console.log('%c' + this.prefix + ' %c[' + timestamp + '] ' + icon + ' ' + message + ' %o', this.styles.title, style, data);
            } else {
                console.log('%c' + this.prefix + ' %c[' + timestamp + '] ' + icon + ' ' + message, this.styles.title, style);
            }
        },

        title: function(msg) {
            var line = '══════════════════════════════════════════════════════';
            console.log('%c' + this.prefix + ' %c' + line, this.styles.title, 'color: #6b7280;');
            console.log('%c' + this.prefix + ' %c' + msg, this.styles.title, this.styles.title);
            console.log('%c' + this.prefix + ' %c' + line, this.styles.title, 'color: #6b7280;');
        },

        success: function(msg, data) { this._log('success', '✅', msg, data); },
        info: function(msg, data) { this._log('info', 'ℹ️', msg, data); },
        warn: function(msg, data) { this._log('warn', '⚠️', msg, data); },
        error: function(msg, data) { this._log('error', '❌', msg, data); },
        data: function(msg, data) { this._log('data', '📊', msg, data); },
        socket: function(msg, data) { this._log('socket', '🔌', msg, data); }
    };

    // ========================================================
    // CONFIG
    // ========================================================
    var CONFIG = {
        type: 'teamDungeonGame',
        port: 9996,
        dungeonServerUrl: 'http://127.0.0.1:9996'
    };

    // ========================================================
    // HELPERS (shared untuk semua handler)
    // ========================================================
    var Helpers = {
        getServerTime: function() {
            return Date.now();
        },

        generateTeamId: function() {
            return 'team_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        },

        buildResponse: function(data) {
            return {
                ret: 0,
                data: typeof data === 'string' ? data : JSON.stringify(data),
                compress: false,
                serverTime: this.getServerTime(),
                server0Time: this.getServerTime()
            };
        },

        // Storage
        getTeamsData: function() {
            try {
                var stored = localStorage.getItem('dragonball_dungeon_teams');
                return stored ? JSON.parse(stored) : {};
            } catch (e) { return {}; }
        },

        saveTeamsData: function(data) {
            try { localStorage.setItem('dragonball_dungeon_teams', JSON.stringify(data)); } catch (e) {}
        },

        getUserTeam: function(userId) {
            try {
                var stored = localStorage.getItem('dragonball_dungeon_user_team_' + userId);
                return stored ? JSON.parse(stored) : null;
            } catch (e) { return null; }
        },

        saveUserTeam: function(userId, data) {
            try { localStorage.setItem('dragonball_dungeon_user_team_' + userId, JSON.stringify(data)); } catch (e) {}
        },

        removeUserTeam: function(userId) {
            try { localStorage.removeItem('dragonball_dungeon_user_team_' + userId); } catch (e) {}
        }
    };

    // ========================================================
    // HANDLERS REGISTRY
    // ========================================================
    var RequestHandlers = {};

    function registerHandler(action, handler) {
        RequestHandlers[action] = handler;
        LOG.info('Handler registered: ' + action);
    }

    // ========================================================
    // MOCK SOCKET
    // ========================================================
    function MockSocket(url) {
        var self = this;
        self.url = url;
        self.connected = true;
        self.eventListeners = {};
        self.id = 'dungeon_socket_' + Date.now();

        LOG.socket('MockSocket created: ' + url);

        setTimeout(function() { self._trigger('connect'); }, 10);
    }

    MockSocket.prototype = {
        on: function(event, callback) {
            if (!this.eventListeners[event]) this.eventListeners[event] = [];
            this.eventListeners[event].push(callback);

            if (event === 'connect' && this.connected) {
                setTimeout(callback, 5);
            }
        },

        off: function(event) {
            this.eventListeners[event] = [];
        },

        emit: function(event, data, callback) {
            if (event === 'handler.process') {
                this._handleRequest(data, callback);
            } else if (callback) {
                callback({ ret: 0 });
            }
        },

        _handleRequest: function(request, callback) {
            var handler = RequestHandlers[request.action];

            if (handler) {
                var response = handler(request, Helpers, LOG);
                LOG.success('Handler: ' + request.action);
                if (callback) callback(response);
            } else {
                LOG.warn('No handler: ' + request.action);
                if (callback) callback(Helpers.buildResponse({ success: true }));
            }
        },

        _trigger: function(event, data) {
            var listeners = this.eventListeners[event];
            if (listeners) {
                for (var i = 0; i < listeners.length; i++) {
                    try { listeners[i](data); } catch (e) {}
                }
            }
        },

        destroy: function() {
            this.connected = false;
            this.eventListeners = {};
        }
    };

    // ========================================================
    // INTERCEPT io.connect()
    // ========================================================
    function interceptSocketIO() {
        if (!window.io || !window.io.connect) {
            LOG.error('Socket.IO not found!');
            return;
        }

        var originalConnect = window.io.connect;

        LOG.title('Dungeon-Server Entry Point Initialized');
        LOG.info('Type: ' + CONFIG.type);
        LOG.info('Port: ' + CONFIG.port);

        window.io.connect = function(url, options) {
            LOG.socket('io.connect() → ' + url);

            // Check if dungeon-server URL
            var isDungeon = url.indexOf('9996') !== -1 ||
                           url.indexOf('dungeon') !== -1 ||
                           url.indexOf('teamDungeon') !== -1 ||
                           url.indexOf('myTeamServerSocketUrl') !== -1 ||
                           url.indexOf('dungeonurl') !== -1;

            if (isDungeon) {
                LOG.success('DUNGEON-SERVER detected - Using MockSocket');
                return new MockSocket(url);
            }

            return originalConnect.call(window.io, url, options);
        };
    }

    // ========================================================
    // EXPORT
    // ========================================================
    window.DUNGEON_SERVER_MOCK = {
        config: CONFIG,
        helpers: Helpers,
        handlers: RequestHandlers,
        registerHandler: registerHandler,

        // Debug
        getTeam: function(id) { return Helpers.getTeamsData()[id]; },
        getAllTeams: function() { return Helpers.getTeamsData(); },
        clearAllTeams: function() { localStorage.removeItem('dragonball_dungeon_teams'); }
    };

    // ========================================================
    // START
    // ========================================================
    if (window.io) {
        interceptSocketIO();
    } else {
        var check = setInterval(function() {
            if (window.io) {
                clearInterval(check);
                interceptSocketIO();
            }
        }, 50);

        setTimeout(function() { clearInterval(check); }, 5000);
    }

})(window);
