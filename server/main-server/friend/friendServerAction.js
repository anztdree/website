/**
 * ============================================================
 * HANDLER: friend.friendServerAction
 * ============================================================
 * 
 * Purpose: Handler untuk sistem pertemanan (friend system)
 * Menggunakan relayAction untuk berbagai aksi
 * 
 * RelayAction yang didukung:
 *   - queryFriends      : Mendapatkan daftar teman
 *   - queryBlackList    : Mendapatkan daftar blacklist
 *   - addToBlacklist    : Menambah ke blacklist
 *   - removeBalcklist   : Menghapus dari blacklist
 *   - getMsg            : Mendapatkan pesan dari teman
 *   - getMsgList        : Mendapatkan daftar singkat pesan
 *   - sendMsg           : Mengirim pesan ke teman
 *   - readMsg           : Menandai pesan sudah dibaca
 *   - delMsg            : Menghapus pesan
 *   - delFriend         : Menghapus teman
 *   - apply             : Mengajak teman
 *   - handleApply       : Menerima/menolak ajakan
 *   - queryApplyList    : Mendapatkan daftar ajakan
 *   - getChatMsg        : Mendapatkan pesan chat
 *   - chat              : Chat/invite untuk team dungeon
 * 
 * ============================================================
 */

(function(window) {
    'use strict';

    // ========================================================
    // LOGGER
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
    // STORAGE KEYS
    // ========================================================
    var FRIEND_STORAGE_KEY = 'dragonball_friend_data';
    var MSG_STORAGE_KEY = 'dragonball_friend_msg';
    var APPLY_STORAGE_KEY = 'dragonball_friend_apply';

    // ========================================================
    // HELPER FUNCTIONS
    // ========================================================
    function getServerTime() {
        return Date.now();
    }
    
    function buildResponse(data) {
        return {
            ret: 0,
            data: typeof data === 'string' ? data : JSON.stringify(data),
            compress: false,
            serverTime: getServerTime(),
            server0Time: getServerTime()
        };
    }

    function getFriendData(userId) {
        try {
            var stored = localStorage.getItem(FRIEND_STORAGE_KEY + '_' + userId);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            LOG.warn('Failed to load friend data:', e);
        }
        
        // Default friend data structure
        return {
            userId: userId,
            friends: {},           // { [friendId]: { _id, _nickName, _headImage, _level, _lastLoginTime, _power } }
            blacklist: {},         // { [userId]: { _id, _nickName, _headImage } }
            applyList: []          // Array of apply requests
        };
    }
    
    function saveFriendData(userId, data) {
        try {
            localStorage.setItem(FRIEND_STORAGE_KEY + '_' + userId, JSON.stringify(data));
        } catch (e) {
            LOG.warn('Failed to save friend data:', e);
        }
    }

    function getMessageData(userId) {
        try {
            var stored = localStorage.getItem(MSG_STORAGE_KEY + '_' + userId);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            LOG.warn('Failed to load message data:', e);
        }
        
        // Default message data structure
        return {
            userId: userId,
            messages: {},          // { [friendId]: [ { _time, _isSelf, _context, _read }, ... ] }
            lastReadTime: {}       // { [friendId]: timestamp }
        };
    }
    
    function saveMessageData(userId, data) {
        try {
            localStorage.setItem(MSG_STORAGE_KEY + '_' + userId, JSON.stringify(data));
        } catch (e) {
            LOG.warn('Failed to save message data:', e);
        }
    }

    // ========================================================
    // RELAY ACTION HANDLERS
    // ========================================================
    var RelayActionHandlers = {

        /**
         * queryFriends - Mendapatkan daftar teman
         * Response: { _friends: { [friendId]: { _id, _nickName, _headImage, _level, _lastLoginTime, _power }, ... } }
         * 
         * Game parsing code:
         *   t.myFriend = [];
         *   for(var n in e._friends) {
         *     var o = new FriendlistInfoModel;
         *     o.deserialize(e._friends[n]), o.userId = n, t.myFriend.push(o)
         *   }
         */
        queryFriends: function(request, playerData) {
            LOG.info('Handler: friendServerAction.queryFriends');
            
            var friendData = getFriendData(request.userId);
            
            // Game expects _friends with underscore prefix
            var response = {
                _friends: friendData.friends || {}
            };
            
            LOG.success('queryFriends: ' + Object.keys(response._friends).length + ' friends');
            return response;
        },

        /**
         * queryBlackList - Mendapatkan daftar blacklist
         * Response: { _blacklist: { [userId]: { _id, _nickName, _headImage }, ... } }
         */
        queryBlackList: function(request, playerData) {
            LOG.info('Handler: friendServerAction.queryBlackList');
            
            var friendData = getFriendData(request.userId);
            
            // Game expects _blacklist with underscore prefix
            var response = {
                _blacklist: friendData.blacklist || {}
            };
            
            LOG.success('queryBlackList: ' + Object.keys(response._blacklist).length + ' blocked users');
            return response;
        },

        /**
         * addToBlacklist - Menambah ke blacklist
         * Request: { friendId: string }
         * Response: { success: true }
         */
        addToBlacklist: function(request, playerData) {
            LOG.info('Handler: friendServerAction.addToBlacklist');
            
            var friendData = getFriendData(request.userId);
            var friendId = request.friendId;
            
            if (friendId && !friendData.blacklist[friendId]) {
                // Add to blacklist with mock user info
                friendData.blacklist[friendId] = {
                    _id: friendId,
                    _nickName: 'Player_' + friendId.substring(0, 6),
                    _headImage: ''
                };
                
                // Remove from friends if exists
                if (friendData.friends[friendId]) {
                    delete friendData.friends[friendId];
                }
                
                saveFriendData(request.userId, friendData);
            }
            
            LOG.success('addToBlacklist: User ' + friendId + ' blocked');
            return { success: true };
        },

        /**
         * removeBalcklist - Menghapus dari blacklist
         * Request: { friendId: string }
         * Response: { success: true }
         */
        removeBalcklist: function(request, playerData) {
            LOG.info('Handler: friendServerAction.removeBalcklist');
            
            var friendData = getFriendData(request.userId);
            var friendId = request.friendId;
            
            if (friendId && friendData.blacklist[friendId]) {
                delete friendData.blacklist[friendId];
                saveFriendData(request.userId, friendData);
            }
            
            LOG.success('removeBalcklist: User ' + friendId + ' unblocked');
            return { success: true };
        },

        /**
         * getMsg - Mendapatkan pesan dari teman
         * Request: { friendId: string, time: number (optional, for pagination) }
         * Response: { _msgs: [ { _time, _isSelf, _context }, ... ] }
         */
        getMsg: function(request, playerData) {
            LOG.info('Handler: friendServerAction.getMsg');
            
            var msgData = getMessageData(request.userId);
            var friendId = request.friendId;
            var afterTime = request.time || 0;
            
            var msgs = [];
            if (msgData.messages[friendId]) {
                // Filter by time if specified
                msgs = msgData.messages[friendId].filter(function(msg) {
                    return msg._time > afterTime;
                });
            }
            
            var response = {
                _msgs: msgs
            };
            
            LOG.success('getMsg: ' + msgs.length + ' messages from ' + friendId);
            return response;
        },

        /**
         * getMsgList - Mendapatkan daftar singkat pesan (preview)
         * Response: { _brief: { [friendId]: { lastMsgTime, lastReadTime, msg, userInfo }, ... } }
         */
        getMsgList: function(request, playerData) {
            LOG.info('Handler: friendServerAction.getMsgList');
            
            var msgData = getMessageData(request.userId);
            var friendData = getFriendData(request.userId);
            
            var brief = {};
            
            for (var friendId in msgData.messages) {
                var msgs = msgData.messages[friendId];
                if (msgs && msgs.length > 0) {
                    var lastMsg = msgs[msgs.length - 1];
                    brief[friendId] = {
                        lastMsgTime: lastMsg._time,
                        lastReadTime: msgData.lastReadTime[friendId] || 0,
                        msg: lastMsg._context,
                        userInfo: friendData.friends[friendId] || {
                            _id: friendId,
                            _nickName: 'Player_' + friendId.substring(0, 6),
                            _headImage: ''
                        }
                    };
                }
            }
            
            var response = {
                _brief: brief
            };
            
            LOG.success('getMsgList: ' + Object.keys(brief).length + ' conversations');
            return response;
        },

        /**
         * sendMsg - Mengirim pesan ke teman
         * Request: { friendId: string, msg: string }
         * Response: { _time: timestamp }
         */
        sendMsg: function(request, playerData) {
            LOG.info('Handler: friendServerAction.sendMsg');
            
            var msgData = getMessageData(request.userId);
            var friendId = request.friendId;
            var msg = request.msg;
            
            if (!msgData.messages[friendId]) {
                msgData.messages[friendId] = [];
            }
            
            var msgTime = getServerTime();
            
            msgData.messages[friendId].push({
                _time: msgTime,
                _isSelf: true,
                _context: msg,
                _read: true
            });
            
            // Keep only last 100 messages
            if (msgData.messages[friendId].length > 100) {
                msgData.messages[friendId] = msgData.messages[friendId].slice(-100);
            }
            
            saveMessageData(request.userId, msgData);
            
            var response = {
                _time: msgTime
            };
            
            LOG.success('sendMsg: Message sent to ' + friendId);
            return response;
        },

        /**
         * readMsg - Menandai pesan sudah dibaca
         * Request: { friendId: string }
         * Response: { _readTime: timestamp }
         */
        readMsg: function(request, playerData) {
            LOG.info('Handler: friendServerAction.readMsg');
            
            var msgData = getMessageData(request.userId);
            var friendId = request.friendId;
            
            var readTime = getServerTime();
            msgData.lastReadTime[friendId] = readTime;
            
            // Mark all messages from this friend as read
            if (msgData.messages[friendId]) {
                for (var i = 0; i < msgData.messages[friendId].length; i++) {
                    msgData.messages[friendId][i]._read = true;
                }
            }
            
            saveMessageData(request.userId, msgData);
            
            var response = {
                _readTime: readTime
            };
            
            LOG.success('readMsg: Messages from ' + friendId + ' marked as read');
            return response;
        },

        /**
         * delMsg - Menghapus semua pesan dari teman
         * Request: { friendId: string }
         * Response: { success: true }
         */
        delMsg: function(request, playerData) {
            LOG.info('Handler: friendServerAction.delMsg');
            
            var msgData = getMessageData(request.userId);
            var friendId = request.friendId;
            
            if (msgData.messages[friendId]) {
                delete msgData.messages[friendId];
            }
            if (msgData.lastReadTime[friendId]) {
                delete msgData.lastReadTime[friendId];
            }
            
            saveMessageData(request.userId, msgData);
            
            LOG.success('delMsg: Messages from ' + friendId + ' deleted');
            return { success: true };
        },

        /**
         * delFriend - Menghapus teman
         * Request: { friendId: string }
         * Response: { success: true }
         */
        delFriend: function(request, playerData) {
            LOG.info('Handler: friendServerAction.delFriend');
            
            var friendData = getFriendData(request.userId);
            var friendId = request.friendId;
            
            if (friendData.friends[friendId]) {
                delete friendData.friends[friendId];
                saveFriendData(request.userId, friendData);
            }
            
            // Also delete messages
            var msgData = getMessageData(request.userId);
            if (msgData.messages[friendId]) {
                delete msgData.messages[friendId];
                saveMessageData(request.userId, msgData);
            }
            
            LOG.success('delFriend: Friend ' + friendId + ' removed');
            return { success: true };
        },

        /**
         * apply - Mengajak teman (send friend request)
         * Request: { friendIds: [string, ...] }
         * Response: { success: true }
         */
        apply: function(request, playerData) {
            LOG.info('Handler: friendServerAction.apply');
            
            // In mock mode, we simulate that the friend request is always accepted
            var friendData = getFriendData(request.userId);
            var friendIds = request.friendIds || [];
            
            for (var i = 0; i < friendIds.length; i++) {
                var friendId = friendIds[i];
                if (!friendData.friends[friendId] && !friendData.blacklist[friendId]) {
                    // Add as friend with mock data
                    friendData.friends[friendId] = {
                        _id: friendId,
                        _nickName: 'Player_' + friendId.substring(0, 6),
                        _headImage: '',
                        _level: Math.floor(Math.random() * 50) + 1,
                        _lastLoginTime: getServerTime() - Math.floor(Math.random() * 86400000),
                        _power: Math.floor(Math.random() * 50000) + 1000
                    };
                }
            }
            
            saveFriendData(request.userId, friendData);
            
            LOG.success('apply: Friend request sent to ' + friendIds.length + ' users');
            return { success: true };
        },

        /**
         * handleApply - Menerima/menolak ajakan
         * Request: { friendId: string, agree: boolean }
         * Response: { success: true }
         */
        handleApply: function(request, playerData) {
            LOG.info('Handler: friendServerAction.handleApply');
            
            var friendData = getFriendData(request.userId);
            var friendId = request.friendId;
            var agree = request.agree;
            
            if (agree && friendId) {
                // Add as friend with mock data
                friendData.friends[friendId] = {
                    _id: friendId,
                    _nickName: 'Player_' + friendId.substring(0, 6),
                    _headImage: '',
                    _level: Math.floor(Math.random() * 50) + 1,
                    _lastLoginTime: getServerTime(),
                    _power: Math.floor(Math.random() * 50000) + 1000
                };
                saveFriendData(request.userId, friendData);
            }
            
            LOG.success('handleApply: Friend request ' + (agree ? 'accepted' : 'rejected'));
            return { success: true };
        },

        /**
         * queryApplyList - Mendapatkan daftar ajakan (friend requests)
         * Response: { _applyList: [ { _id, _nickName, _headImage, _level, _power, _time }, ... ] }
         */
        queryApplyList: function(request, playerData) {
            LOG.info('Handler: friendServerAction.queryApplyList');
            
            // In mock mode, return empty apply list
            // You can add mock friend requests here if needed
            var response = {
                _applyList: []
            };
            
            LOG.success('queryApplyList: 0 pending requests');
            return response;
        },

        /**
         * getChatMsg - Mendapatkan pesan chat (untuk invite)
         * Request: { time: number (optional) }
         * Response: { _msgs: [ ... ] }
         */
        getChatMsg: function(request, playerData) {
            LOG.info('Handler: friendServerAction.getChatMsg');
            
            // In mock mode, return empty chat invites
            var response = {
                _msgs: []
            };
            
            LOG.success('getChatMsg: 0 chat invites');
            return response;
        },

        /**
         * chat - Chat/invite untuk team dungeon
         * Request: { friendId: string, msgType: number, params: any }
         * Response: { success: true }
         */
        chat: function(request, playerData) {
            LOG.info('Handler: friendServerAction.chat');
            
            // In mock mode, just return success
            LOG.success('chat: Invite sent to ' + request.friendId);
            return { success: true };
        }
    };

    // ========================================================
    // MAIN HANDLER FUNCTION
    // ========================================================
    function handleFriendServerAction(request, playerData) {
        LOG.info('─────────────────────────────────────────');
        LOG.info('Handler: friend.friendServerAction');
        LOG.data('Request:', request);
        
        var relayAction = request.relayAction;
        
        if (!relayAction) {
            LOG.error('No relayAction specified');
            return buildResponse({ error: 'No relayAction' });
        }
        
        var handler = RelayActionHandlers[relayAction];
        
        if (handler) {
            var result = handler(request, playerData);
            LOG.data('Response:', result);
            return result;
        } else {
            LOG.warn('Unknown relayAction: ' + relayAction);
            return { success: true };
        }
    }

    // ========================================================
    // EXPORT HANDLER
    // ========================================================
    window.MAIN_SERVER_HANDLERS = window.MAIN_SERVER_HANDLERS || {};
    window.MAIN_SERVER_HANDLERS['friend.friendServerAction'] = handleFriendServerAction;
    
    // Also export for friend server if needed
    window.MAIN_SERVER_HANDLERS['friendServerAction'] = function(request, playerData) {
        // Handle both type: "friend" and direct friendServerAction
        return handleFriendServerAction(request, playerData);
    };

    LOG.info('Handler registered: friend.friendServerAction');
    LOG.info('Supported relayActions: ' + Object.keys(RelayActionHandlers).join(', '));

})(window);
