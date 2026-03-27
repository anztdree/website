/**
 * ============================================================
 * ENTERGAME.JS - DragonBall HTML5 Mock Main Game Server
 * ============================================================
 * 
 * Purpose: Handler untuk user.enterGame - Main login handler
 * Returns ALL player data when user enters the game
 * 
 * IMPORTANT: Semua field WAJIB ada sesuai dengan saveUserData() di main.min.js
 * Tidak ada field opsional - jika ada di handler, harus ada di response
 * 
 * Author: Local SDK Bridge
 * Version: 2.0.0 - 100% Aligned with main.min.js saveUserData()
 * ============================================================
 */

(function(window) {
    'use strict';

    // ========================================================
    // 1. STYLISH LOGGER
    // ========================================================
    var LOG = {
        prefix: '🎮 [MAIN-SERVER]',
        styles: {
            title: 'background: linear-gradient(90deg, #f59e0b 0%, #ef4444 100%); color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;',
            success: 'color: #22c55e; font-weight: bold;',
            info: 'color: #6b7280;',
            warn: 'color: #f59e0b; font-weight: bold;',
            error: 'color: #ef4444; font-weight: bold;',
            data: 'color: #8b5cf6;',
            separator: 'color: #6b7280;',
            socket: 'color: #ec4899; font-weight: bold;'
        },
        
        _log: function(level, icon, message, data) {
            var timestamp = new Date().toISOString().substr(11, 12);
            var style = this.styles[level] || this.styles.info;
            var format = '%c' + this.prefix + ' %c[' + timestamp + '] ' + icon + ' ' + message;
            
            if (data !== undefined) {
                console.log(format + ' %o', this.styles.title, style, data);
            } else {
                console.log(format, this.styles.title, style);
            }
        },
        
        title: function(message) {
            var line = '══════════════════════════════════════════════════════';
            console.log('%c' + this.prefix + ' %c' + line, this.styles.title, this.styles.separator);
            console.log('%c' + this.prefix + ' %c' + message, this.styles.title, this.styles.title);
            console.log('%c' + this.prefix + ' %c' + line, this.styles.title, this.styles.separator);
        },
        
        success: function(message, data) { this._log('success', '✅', message, data); },
        info: function(message, data) { this._log('info', 'ℹ️', message, data); },
        warn: function(message, data) { this._log('warn', '⚠️', message, data); },
        error: function(message, data) { this._log('error', '❌', message, data); },
        data: function(message, data) { this._log('data', '📊', message, data); },
        socket: function(message, data) { this._log('socket', '🔌', message, data); }
    };

    // ========================================================
    // 2. CONFIGURATION
    // ========================================================
    var CONFIG = {
        serverId: 1,
        serverName: 'Local Server 1',
        mainServerUrl: 'http://127.0.0.1:9998',
        
        // Starting hero from constant.json
        startHero: {
            displayId: 1205,
            level: 3,
            quality: 'white',
            star: 0
        },
        
        // Starting items from thingsID.json
        startItems: {
            gold: 10000,
            diamond: 0
        }
    };

    // ========================================================
    // 3. PLAYER DATA STORAGE
    // ========================================================
    var STORAGE_KEY = 'dragonball_player_data';
    
    function generateHeroId() {
        return 'h_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
    }
    
    function getServerTime() {
        return Date.now();
    }
    
    /**
     * Load existing player data or create new player data
     * CRITICAL: All fields must match what saveUserData expects
     */
    function loadOrCreatePlayerData(request) {
        // Get userId from request if available
        var requestUserId = request ? request.userId : null;
        
        // Try to load existing data
        if (requestUserId) {
            try {
                var stored = localStorage.getItem(STORAGE_KEY + '_' + requestUserId);
                if (stored) {
                    var parsed = JSON.parse(stored);
                    LOG.info('Loaded existing player data:', parsed.userId);
                    return parsed;
                }
            } catch (e) {
                LOG.warn('Failed to load stored player data:', e);
            }
        }
        
        // Get user info from SDK or request
        var sdkUser = window.LOCAL_SDK ? window.LOCAL_SDK.user : null;
        var userId = requestUserId || (sdkUser ? sdkUser.userId : 'player_' + Date.now().toString(36));
        var nickname = sdkUser ? sdkUser.nickname : 'Player';
        
        // Create new player data
        var now = Date.now();
        var heroId = generateHeroId();
        
        var newPlayerData = {
            userId: userId,
            isNewUser: true,
            createTime: now,
            lastLoginTime: now,
            
            // ========================================================
            // USER INFO - Used by setUserInfo()
            // Fields: _id, _pwd, _nickName, _headImage, _lastLoginTime, 
            //         _createTime, _bulletinVersions, _oriServerId, _nickChangeTimes
            // ========================================================
            user: {
                _id: userId,
                _pwd: '',
                _nickName: nickname,
                _headImage: '',
                _lastLoginTime: now,
                _createTime: now,
                _bulletinVersions: 0,
                _oriServerId: CONFIG.serverId,
                _nickChangeTimes: 0
            },
            
            // ========================================================
            // HEROES - Used by HerosManager.getInstance().readByData()
            // ========================================================
            heros: {},
            
            // ========================================================
            // ITEMS/INVENTORY - Used by setBackpack()
            // Items stored with key as string: { "101": { _id: 101, _num: x }, ... }
            // ========================================================
            items: {
                '101': { _id: 101, _num: CONFIG.startItems.diamond },
                '102': { _id: 102, _num: CONFIG.startItems.gold }
            },
            
            // ========================================================
            // HANGUP/AFK DATA - Used by setOnHook()
            // Fields: _curLess, _maxPassLesson, _haveGotChapterReward, 
            //         _maxPassChapter, _clickGlobalWarBuffTag, _buyFund, _haveGotFundReward
            // ========================================================
            hangup: {
                _curLess: 10101,
                _maxPassLesson: 10101,
                _haveGotChapterReward: false,
                _maxPassChapter: 0,
                _clickGlobalWarBuffTag: false,
                _buyFund: false,
                _haveGotFundReward: false
            },
            
            // ========================================================
            // SUMMON DATA - Used by setSummon()
            // Fields: _energy, _wishList, _wishVersion, _canCommonFreeTime, 
            //         _canSuperFreeTime, _summonTimes
            // ========================================================
            summon: {
                _energy: 0,
                _wishList: [],
                _wishVersion: 0,
                _canCommonFreeTime: 0,
                _canSuperFreeTime: 0,
                _summonTimes: {}
            },
            
            // ========================================================
            // EQUIPMENT - Used by setEquip()
            // ========================================================
            equip: {
                _suits: {}
            },
            
            // ========================================================
            // IMPRINT - Used by setSign()
            // Structure: _items: { "imprintId": SignInfoModel, ... }
            // ========================================================
            imprint: {
                _items: {}
            },
            
            // ========================================================
            // DUNGEON - Used by setCounterpart()
            // Structure: _dungeons: { "dungeonId": dungeonData, ... }
            // ========================================================
            dungeon: {
                _dungeons: {}
            },
            
            // ========================================================
            // CHECKIN - Used by setSignIn()
            // ========================================================
            checkin: {},
            
            // ========================================================
            // CURRENT MAIN TASK - Used by setMainTask()
            // ========================================================
            curMainTask: 0,
            
            // ========================================================
            // PLAYER LEVEL & VIP
            // ========================================================
            playerLevel: 1,
            playerExp: 0,
            vipLevel: 0,
            vipExp: 0
        };
        
        // ========================================================
        // ADD STARTING HERO - COMPLETE FORMAT
        // Based on SetHeroDataToModel in main.min.js - ALL required fields
        // ========================================================
        newPlayerData.heros[heroId] = {
            // ID fields
            _id: heroId,
            _heroId: heroId,
            _heroDisplayId: CONFIG.startHero.displayId,
            _heroName: '',
            
            // Level and progression
            _heroLevel: CONFIG.startHero.level,
            _heroStar: CONFIG.startHero.star,
            _heroQuality: CONFIG.startHero.quality,
            _maxLevel: 100,
            _exp: 0,
            _evolution: 0,
            _heroAwakening: 0,
            _expeditionMaxLevel: 0,
            
            // Skin and skills
            _heroSkin: 0,
            _skillLevelList: [],
            _superSkillResetCount: 0,
            _potentialResetCount: 0,
            _superSkillLevel: [],
            _potentialLevel: [],
            
            // Equipment and fragments
            _equipQuality: {},
            _skinProgress: {},
            _fragment: 0,
            
            // Tags
            _heroTag: [],
            
            // ========================================================
            // HERO BASE ATTRIBUTES - CRITICAL!
            // ========================================================
            _heroBaseAttr: {
                _hp: 1000,
                _attack: 100,
                _armor: 50,
                _speed: 100,
                _hit: 0,
                _dodge: 0,
                _block: 0,
                _damageReduce: 0,
                _armorBreak: 0,
                _controlResist: 0,
                _skillDamage: 0,
                _criticalDamage: 0,
                _blockEffect: 0,
                _critical: 0,
                _criticalResist: 0,
                _trueDamage: 0,
                _energy: 0,
                _power: 500,
                _extraArmor: 0,
                _hpPercent: 0,
                _armorPercent: 0,
                _attackPercent: 0,
                _speedPercent: 0,
                _orghp: 1000,
                _superDamage: 0,
                _healPlus: 0,
                _healerPlus: 0,
                _damageDown: 0,
                _shielderPlus: 0,
                _damageUp: 0,
                _level: CONFIG.startHero.level,
                _maxlevel: 100,
                _evolveLevel: 0,
                _talent: 1
            },
            
            // Qigong (Ki/Chi system)
            _qigong: null,
            _qigongTmp: null,
            _qigongStage: 1,
            _qigongTmpPower: 0,
            
            // Cost and Break
            _totalCost: null,
            _breakInfo: null,
            _gemstoneSuitId: 0,
            
            // Link system
            _linkTo: [],
            _linkFrom: '',
            
            // Other
            _heroLife: 0,
            _selfComments: []
        };
        
        // Save to localStorage
        try {
            localStorage.setItem(STORAGE_KEY + '_' + userId, JSON.stringify(newPlayerData));
            LOG.success('Created new player data:', userId);
        } catch (e) {
            LOG.warn('Failed to store player data:', e);
        }
        
        return newPlayerData;
    }
    
    // ========================================================
    // 4. BUILD RESPONSE
    // ========================================================
    function buildResponse(data) {
        return {
            ret: 0,
            data: typeof data === 'string' ? data : JSON.stringify(data),
            compress: false,
            serverTime: getServerTime(),
            server0Time: getServerTime()
        };
    }

    // ========================================================
    // 5. REQUEST HANDLERS
    // ========================================================
    var RequestHandlers = {
        
        /**
         * Handle user.enterGame
         * Main login handler - returns all player data
         * This is called AFTER verify is complete
         * 
         * CRITICAL: Semua field harus ada sesuai saveUserData() di main.min.js
         */
        enterGame: function(request, playerData) {
            LOG.title('HANDLING: user.enterGame');
            LOG.data('Request:', request);
            
            // Update last login time
            playerData.lastLoginTime = Date.now();
            playerData.user._lastLoginTime = playerData.lastLoginTime;
            
            // Check if new user
            var isNewUser = playerData.isNewUser;
            playerData.isNewUser = false;
            
            // Save updated data
            try {
                localStorage.setItem(STORAGE_KEY + '_' + playerData.userId, JSON.stringify(playerData));
            } catch (e) {
                LOG.warn('Failed to save player data:', e);
            }
            
            // ========================================================
            // BUILD COMPLETE RESPONSE DATA
            // Based on saveUserData() in main.min.js - ALL FIELDS REQUIRED
            // ========================================================
            var responseData = {
                
                // ========================================================
                // 1. CURRENCY - ts.currency = e.currency
                // ========================================================
                currency: {
                    diamond: playerData.items['101'] ? playerData.items['101']._num : 0,
                    gold: playerData.items['102'] ? playerData.items['102']._num : 0
                },
                
                // ========================================================
                // 2. USER INFO - t.setUserInfo(e)
                // Used fields: _id, _pwd, _nickName, _headImage, _lastLoginTime,
                //              _createTime, _bulletinVersions, _oriServerId, _nickChangeTimes
                // ========================================================
                user: playerData.user,
                
                // ========================================================
                // 3. HANGUP/ONHOOK - t.setOnHook(e)
                // Used fields: _curLess, _maxPassLesson, _haveGotChapterReward,
                //              _maxPassChapter, _clickGlobalWarBuffTag, _buyFund, _haveGotFundReward
                // Also uses: globalWarBuffTag, globalWarLastRank, globalWarBuff, globalWarBuffEndTime
                // ========================================================
                hangup: playerData.hangup,
                globalWarBuffTag: null,
                globalWarLastRank: 0,
                globalWarBuff: null,
                globalWarBuffEndTime: 0,
                
                // ========================================================
                // 4. SUMMON - t.setSummon(e)
                // Used fields: _energy, _wishList, _wishVersion, _canCommonFreeTime,
                //              _canSuperFreeTime, _summonTimes
                // ========================================================
                summon: playerData.summon,
                
                // ========================================================
                // 5. BACKPACK/ITEMS - t.setBackpack(e)
                // totalProps._items and backpackLevel
                // ========================================================
                totalProps: {
                    _items: playerData.items
                },
                backpackLevel: 1,
                
                // ========================================================
                // 6. SIGN/IMPRINT - t.setSign(e)
                // imprint._items structure
                // ========================================================
                imprint: playerData.imprint,
                
                // ========================================================
                // 7. EQUIP - t.setEquip(e)
                // ========================================================
                equip: playerData.equip,
                
                // ========================================================
                // 8. DRAGON EQUIP - ItemsCommonSingleton.getInstance().initDragonBallEquip()
                // ========================================================
                dragonEquiped: null,
                
                // ========================================================
                // 9. COUNTERPART/DUNGEON - t.setCounterpart(e)
                // dungeon._dungeons structure
                // ========================================================
                dungeon: playerData.dungeon,
                
                // ========================================================
                // 10. TEAM TECHNOLOGY - t.setTeamTechnology(e)
                // ========================================================
                teamTechnology: null,
                
                // ========================================================
                // 11. TEAM TRAINING - t.setTeamTraining(e)
                // e.teamTraining && TeamTrainingManager.getInstance().saveTeamTraining()
                // ========================================================
                teamTraining: null,
                
                // ========================================================
                // 12. SUPER SKILL - SuperSkillSingleton.getInstance().initSuperSkill()
                // ========================================================
                superSkill: {},
                
                // ========================================================
                // 13. HERO SKIN - e.heroSkin && HerosManager.getInstance().setSkinData()
                // ========================================================
                heroSkin: null,
                
                // ========================================================
                // 14. HEROS - HerosManager.getInstance().readByData(e.heros)
                // Structure: { _heros: { heroId: heroData, ... } }
                // ========================================================
                heros: {
                    _heros: playerData.heros
                },
                
                // ========================================================
                // 15. SUMMON LOG - SummonSingleton.getInstance().setSummomLogList(e)
                // Structure: { "logId": { _userId, _userName, _heroDisplayId, _time }, ... }
                // ========================================================
                summonLog: {},
                
                // ========================================================
                // 16. TEAM/GUILD - t.setTeam(e)
                // userGuild, userGuildPub, guildLevel, guildTreasureMatchRet
                // ========================================================
                userGuild: null,
                userGuildPub: null,
                guildLevel: 0,
                guildName: null,
                guildTreasureMatchRet: null,
                
                // ========================================================
                // 17. MAIN TASK - t.setMainTask(e)
                // e.curMainTask
                // ========================================================
                curMainTask: playerData.curMainTask,
                
                // ========================================================
                // 18. CHECKIN/SIGNIN - t.setSignIn(e)
                // e.checkin
                // ========================================================
                checkin: playerData.checkin,
                
                // ========================================================
                // 19. CHANNEL SPECIAL - WelfareInfoManager.getInstance().channelSpecial
                // Also channelSpecial._honghuUrl, _honghuUrlStartTime, _honghuUrlEndTime
                // ========================================================
                channelSpecial: {},
                
                // ========================================================
                // 20. CELLGAME HAVE SET HERO
                // void 0 != e.cellgameHaveSetHero && (e.scheduleInfo._cellgameHaveSetHero = e.cellgameHaveSetHero)
                // ========================================================
                cellgameHaveSetHero: false,
                
                // ========================================================
                // 21. SCHEDULE INFO - AllRefreshCount.getInstance().initData(e.scheduleInfo)
                // CRITICAL: All these fields are required by initData()
                // ========================================================
                scheduleInfo: {
                    _cellgameHaveSetHero: false,
                    _marketDiamondRefreshCount: 0,
                    _vipMarketDiamondRefreshCount: 0,
                    _arenaAttackTimes: 0,
                    _arenaBuyTimesCount: 0,
                    _snakeResetTimes: 0,
                    _snakeSweepCount: 0,
                    _cellGameHaveGotReward: false,
                    _cellGameHaveTimes: 0,
                    _strongEnemyTimes: 0,
                    _strongEnemyBuyCount: 0,
                    _mergeBossBuyCount: 0,
                    _dungeonTimes: 0,
                    _dungeonBuyTimesCount: 0,
                    _karinBattleTimes: 0,
                    _karinBuyBattleTimesCount: 0,
                    _karinBuyFeetCount: 0,
                    _entrustResetTimes: 0,
                    _dragonExchangeSSPoolId: 0,
                    _dragonExchangeSSSPoolId: 0,
                    _teamDugeonUsedRobots: 0,
                    _timeTrialBuyTimesCount: 0,
                    _monthCardHaveGotReward: false,
                    _goldBuyCount: 0,
                    _likeRank: 0,
                    _mahaAttackTimes: 0,
                    _mahaBuyTimesCount: 0,
                    _mineResetTimes: 0,
                    _mineBuyResetTimesCount: 0,
                    _mineBuyStepCount: 0,
                    _guildBossTimes: 0,
                    _guildBossTimesBuyCount: 0,
                    _treasureTimes: 0,
                    _guildCheckInType: 0,
                    _templeBuyCount: 0,
                    _trainingBuyCount: 0,
                    _bossCptTimes: 0,
                    _bossCptBuyCount: 0,
                    _ballWarBuyCount: 0,
                    _expeditionEvents: null,
                    _clickExpedition: false,
                    _expeditionSpeedUpCost: 0,
                    _templeDailyReward: false,
                    _templeYesterdayLess: 0,
                    _topBattleTimes: 0,
                    _topBattleBuyCount: 0,
                    _gravityTrialBuyTimesCount: 0
                },
                
                // ========================================================
                // 22. VIP LOG - e.vipLog && WelfareInfoManager.getInstance().setVipLogList()
                // ========================================================
                vipLog: null,
                
                // ========================================================
                // 23. CARD LOG - e.cardLog && WelfareInfoManager.getInstance().setMonthCardLogList()
                // ========================================================
                cardLog: null,
                
                // ========================================================
                // 24. GUIDE - e.guide && GuideInfoManager.getInstance().setGuideInfo()
                // ========================================================
                guide: null,
                
                // ========================================================
                // 25. CLICK SYSTEM - e.clickSystem._clickSys
                // ========================================================
                clickSystem: null,
                
                // ========================================================
                // 26. GIFT INFO - Multiple uses in WelfareInfoManager
                // _gotChannelWeeklyRewardTag, _fristRecharge, _haveGotVipRewrd,
                // _buyVipGiftCount, _onlineGift, _gotBSAddToHomeReward, _clickHonghuUrlTime
                // Also: _levelGiftCount, _levelBuyGift, _fundGiftCount
                // ========================================================
                giftInfo: {
                    _id: "",
                    _isBuyFund: false,
                    _levelGiftCount: {},
                    _levelBuyGift: {},
                    _fundGiftCount: {},
                    _gotChannelWeeklyRewardTag: "",
                    _fristRecharge: {
                        _canGetReward: false,
                        _haveGotReward: false
                    },
                    _haveGotVipRewrd: {},
                    _buyVipGiftCount: {},
                    _onlineGift: {
                        _curId: 0,
                        _nextTime: 0
                    },
                    _gotBSAddToHomeReward: false,
                    _clickHonghuUrlTime: 0
                },
                
                // ========================================================
                // 27. MONTH CARD - e.monthCard && WelfareInfoManager.getInstance().setMonthCardInfo()
                // ========================================================
                monthCard: null,
                
                // ========================================================
                // 28. RECHARGE - e.recharge && WelfareInfoManager.getInstance().setRechargeInfo()
                // ========================================================
                recharge: null,
                
                // ========================================================
                // 29. TIMES INFO - e.timesInfo && TimesInfoSingleton.getInstance().initData()
                // ========================================================
                timesInfo: null,
                
                // ========================================================
                // 30. USER DOWNLOAD REWARD
                // Fields: _isClick, _haveGotDlReward, _isBind, _haveGotBindReward
                // ========================================================
                userDownloadReward: null,
                
                // ========================================================
                // 31. YOUTUBER RECRUIT - e.YouTuberRecruit && !e.YouTuberRecruit._hidden
                // Also: userYouTuberRecruit
                // ========================================================
                YouTuberRecruit: null,
                userYouTuberRecruit: null,
                
                // ========================================================
                // 32. TIME MACHINE - e.timeMachine && TimeLeapSingleton.getInstance().initData()
                // ========================================================
                timeMachine: null,
                
                // ========================================================
                // 33. ARENA TEAM - AltarInfoManger.getInstance().setArenaTeamInfo(e._arenaTeam)
                // ========================================================
                _arenaTeam: [],
                
                // ========================================================
                // 34. ARENA SUPER - AltarInfoManger.getInstance().setArenaSuperInfo(e._arenaSuper)
                // ========================================================
                _arenaSuper: [],
                
                // ========================================================
                // 35. TIME BONUS INFO - TimeLimitGiftBagManager.getInstance().setTimeLimitGiftBag()
                // ========================================================
                timeBonusInfo: null,
                
                // ========================================================
                // 36. ONLINE BULLETIN - e.onlineBulletin && BulletinSingleton.getInstance().setBulletInfo()
                // ========================================================
                onlineBulletin: null,
                
                // ========================================================
                // 37. KARIN TIME - TowerDataManager.getInstance().setKarinTime()
                // ========================================================
                karinStartTime: 0,
                karinEndTime: 0,
                
                // ========================================================
                // 38. SERVER VERSION - UserInfoSingleton.getInstance().serverVersion
                // ========================================================
                serverVersion: null,
                
                // ========================================================
                // 39. SERVER OPEN DATE - UserInfoSingleton.getInstance().setServerOpenDate()
                // ========================================================
                serverOpenDate: null,
                
                // ========================================================
                // 40. LAST TEAM - UserInfoSingleton.getInstance().firstLoginSetMyTeam(e.lastTeam._lastTeamInfo)
                // CRITICAL: Uses _superSkill (not _super)
                // Team types: 1=FRIEND, 5=ARENA, 6=DUNGEON, 9=HANGUP, 10=KARIN, 15=TEMPLE, 16=TIME_MACHINE
                // ========================================================
                lastTeam: {
                    _lastTeamInfo: {
                        "1": { _team: [], _superSkill: [] },
                        "5": { _team: [], _superSkill: [] },
                        "6": { _team: [], _superSkill: [] },
                        "9": { _team: [], _superSkill: [] },
                        "10": { _team: [], _superSkill: [] },
                        "15": { _team: [], _superSkill: [] },
                        "16": { _team: [], _superSkill: [] }
                    }
                },
                
                // ========================================================
                // 41. HERO IMAGE VERSION - UserInfoSingleton.getInstance().heroImageVersion
                // ========================================================
                heroImageVersion: null,
                
                // ========================================================
                // 42. SUPER IMAGE VERSION - UserInfoSingleton.getInstance().superImageVersion
                // ========================================================
                superImageVersion: null,
                
                // ========================================================
                // 43. TRAINING - PadipataInfoManager.getInstance().setPadipataModel()
                // ========================================================
                training: null,
                
                // ========================================================
                // 44. WAR INFO - GlobalWarManager.getInstance().setWarLoginInfo()
                // ========================================================
                warInfo: null,
                
                // ========================================================
                // 45. USER WAR - GlobalWarManager.getInstance().setUserWarModel()
                // ========================================================
                userWar: null,
                
                // ========================================================
                // 46. HEAD EFFECT - HeadEffectModel
                // ========================================================
                headEffect: null,
                
                // ========================================================
                // 47. USER BALL WAR - TeamInfoManager.getInstance().UserBallWar
                // ========================================================
                userBallWar: null,
                
                // ========================================================
                // 48. BALL WAR STATE - TeamInfoManager.getInstance().BallWarState
                // ========================================================
                ballWarState: null,
                
                // ========================================================
                // 49. BALL BROADCAST - TeamInfoManager.getInstance().setBallWarBrodecast()
                // ========================================================
                ballBroadcast: null,
                
                // ========================================================
                // 50. BALL WAR INFO - GuildBallWarInfo
                // ========================================================
                ballWarInfo: null,
                
                // ========================================================
                // 51. GUILD ACTIVE POINTS - TeamInfoManager.getInstance().setActivePoints()
                // ========================================================
                guildActivePoints: null,
                
                // ========================================================
                // 52. QQ RELATED FIELDS - WelfareInfoManager
                // enableShowQQ, showQQVip, showQQ, showQQImg1, showQQImg2, showQQUrl
                // ========================================================
                enableShowQQ: null,
                showQQVip: null,
                showQQ: null,
                showQQImg1: null,
                showQQImg2: null,
                showQQUrl: null,
                
                // ========================================================
                // 53. HIDE HEROES - WelfareInfoManager.getInstance().setHideHeroes()
                // ========================================================
                hideHeroes: null,
                
                // ========================================================
                // 54. EXPEDITION - ExpeditionManager.getInstance().setExpeditionModel()
                // ========================================================
                expedition: null,
                
                // ========================================================
                // 55. TIME TRIAL - SpaceTrialManager.getInstance().setSpaceTrialModel()
                // e.timeTrial, e.timeTrialNextOpenTime
                // ========================================================
                timeTrial: null,
                timeTrialNextOpenTime: null,
                
                // ========================================================
                // 56. RETRIEVE - GetBackReourceManager.getInstance().setRetrieveModel()
                // ========================================================
                retrieve: null,
                
                // ========================================================
                // 57. BATTLE MEDAL - BattleMedalManager.getInstance().setBattleMedal()
                // ========================================================
                battleMedal: null,
                
                // ========================================================
                // 58. SHOP NEW HEROES - ShopInfoManager.getInstance().shopNewHero
                // ========================================================
                shopNewHeroes: null,
                
                // ========================================================
                // 59. TEAM DUNGEON - TeamworkManager.getInstance().setLoginInfo()
                // ========================================================
                teamDungeon: null,
                
                // ========================================================
                // 60. TEAM SERVER HTTP URL - TeamworkManager.getInstance().teamServerHttpUrl
                // ========================================================
                teamServerHttpUrl: null,
                
                // ========================================================
                // 61. TEAM DUNGEON OPEN TIME - TeamworkManager.getInstance().teamDungeonOpenTime
                // ========================================================
                teamDungeonOpenTime: null,
                
                // ========================================================
                // 62. TEAM DUNGEON TASK - TeamworkManager.getInstance().teamDungeonTask.deserialize()
                // ========================================================
                teamDungeonTask: null,
                
                // ========================================================
                // 63. TEAM DUNGEON BROADCASTS
                // teamDungeonSplBcst (special), teamDungeonNormBcst (normal)
                // ========================================================
                teamDungeonSplBcst: null,
                teamDungeonNormBcst: null,
                
                // ========================================================
                // 64. TEAM DUNGEON HIDE INFO - TeamworkManager.getInstance().setTeamDungeonHideInfo()
                // ========================================================
                teamDungeonHideInfo: null,
                
                // ========================================================
                // 65. TEMPLE LESS - TrialManager.getInstance().setTempleLess()
                // ========================================================
                templeLess: null,
                
                // ========================================================
                // 66. TEAM DUNGEON INVITED FRIENDS - TeamworkManager.getInstance().teamDungeonInvitedFriends
                // ========================================================
                teamDungeonInvitedFriends: null,
                
                // ========================================================
                // 67. MY TEAM SERVER SOCKET URL - ts.loginInfo.serverItem.dungeonurl
                // ========================================================
                myTeamServerSocketUrl: null,
                
                // ========================================================
                // 68. GEMSTONE - EquipInfoManager.getInstance().saveGemStone()
                // ========================================================
                gemstone: null,
                
                // ========================================================
                // 69. QUESTIONNAIRES - UserInfoSingleton.getInstance().setQuestData()
                // ========================================================
                questionnaires: null,
                
                // ========================================================
                // 70. RESONANCE - HerosManager.getInstance().setResonanceModel()
                // ========================================================
                resonance: null,
                
                // ========================================================
                // 71. TOP BATTLE - TopBattleManager.getInstance().setTopBattleLoginInfo()
                // userTopBattle, topBattleInfo
                // ========================================================
                userTopBattle: null,
                topBattleInfo: null,
                
                // ========================================================
                // 72. FAST TEAM - HerosManager.getInstance().saveLoginFastTeam()
                // ========================================================
                fastTeam: null,
                
                // ========================================================
                // 73. BROADCAST RECORD - BroadcastSingleton.getInstance().setBlacklistPlayerInfo()
                // ========================================================
                broadcastRecord: [],
                
                // ========================================================
                // 74. FORBIDDEN CHAT - BroadcastSingleton.getInstance().setUserBidden()
                // ========================================================
                forbiddenChat: null,
                
                // ========================================================
                // 75. GRAVITY - TrialManager.getInstance().setGravityTrialInfo()
                // ========================================================
                gravity: null,
                
                // ========================================================
                // 76. LITTLE GAME - LittleGameManager.getInstance().saveData()
                // ========================================================
                littleGame: null,
                
                // ========================================================
                // 77. NEW USER FLAG
                // ========================================================
                newUser: isNewUser,
                
                // ========================================================
                // 78. SERVER ID - UserInfoSingleton.getInstance().setServerId()
                // ========================================================
                serverId: CONFIG.serverId
            };
            
            LOG.success('enterGame successful for user:', playerData.userId);
            LOG.data('Response Data Keys:', Object.keys(responseData));
            
            return buildResponse(responseData);
        },
        
        /**
         * Default handler for unknown actions
         */
        default: function(request, playerData) {
            LOG.warn('No handler for type: ' + request.type + ', action: ' + request.action);
            LOG.data('Request:', request);
            
            return buildResponse({});
        }
    };

    // ========================================================
    // 6. MOCK SOCKET CLASS
    // ========================================================
    function MockSocket(serverUrl) {
        var self = this;
        
        self.url = serverUrl;
        self.connected = true;
        self.eventListeners = {};
        self.id = 'mock_main_socket_' + Date.now();
        
        LOG.socket('─────────────────────────────────────────');
        LOG.socket('MockSocket created');
        LOG.socket('URL:', serverUrl);
        LOG.socket('Socket ID:', self.id);
        LOG.socket('─────────────────────────────────────────');
        
        // Auto-trigger connect event after short delay
        setTimeout(function() {
            self._trigger('connect');
        }, 10);
    }
    
    MockSocket.prototype = {
        
        on: function(event, callback) {
            LOG.socket('ON() Event: ' + event);
            
            if (!this.eventListeners[event]) {
                this.eventListeners[event] = [];
            }
            this.eventListeners[event].push(callback);
            
            // If connect event and already "connected", trigger immediately
            if (event === 'connect' && this.connected) {
                var self = this;
                setTimeout(function() {
                    LOG.socket('Auto-triggering connect event');
                    callback();
                }, 5);
            }
            
            // CRITICAL: When game registers 'verify' listener,
            // server must emit verify event to start handshake
            // IMPORTANT: data MUST be a STRING! Game will encrypt it with TEA
            if (event === 'verify') {
                var self = this;
                setTimeout(function() {
                    LOG.socket('🔥 SERVER EMIT: verify event to client');
                    var verifyToken = 'verify_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
                    LOG.socket('Verify token sent:', verifyToken);
                    self._trigger('verify', verifyToken);
                }, 100);
            }
        },
        
        off: function(event) {
            LOG.socket('OFF() Event: ' + event);
            this.eventListeners[event] = [];
        },
        
        emit: function(event, data, callback) {
            var self = this;
            
            LOG.socket('─────────────────────────────────────────');
            LOG.socket('EMIT() Event: ' + event);
            
            if (event === 'handler.process') {
                LOG.data('Request Data:', data);
                self._handleRequest(data, callback);
            } else if (event === 'verify') {
                LOG.socket('Client emit verify (encrypted token):', data);
                LOG.socket('Verify response - returning success');
                if (callback) {
                    callback({ ret: 0 });
                }
            } else {
                LOG.warn('Unknown emit event: ' + event);
                if (callback) {
                    callback({ ret: 0 });
                }
            }
        },
        
        _handleRequest: function(request, callback) {
            var self = this;
            
            LOG.info('─────────────────────────────────────────');
            LOG.info('Processing request...');
            LOG.data('Type:', request.type);
            LOG.data('Action:', request.action);
            
            // Load or create player data
            var playerData = loadOrCreatePlayerData(request);
            
            // Build response helper
            var buildResponse = function(data) {
                return {
                    ret: 0,
                    data: typeof data === 'string' ? data : JSON.stringify(data),
                    compress: false,
                    serverTime: getServerTime(),
                    server0Time: getServerTime()
                };
            };
            
            // Get handler - check multiple sources
            var handler = null;
            var handlerKey = request.type + '.' + request.action;
            
            // 1. Check external handler registry (from separate files)
            if (window.MAIN_SERVER_HANDLERS && window.MAIN_SERVER_HANDLERS[handlerKey]) {
                handler = window.MAIN_SERVER_HANDLERS[handlerKey];
                LOG.info('Using external handler: ' + handlerKey);
            }
            // 2. Check built-in handlers
            else if (request.type === 'user' && request.action === 'enterGame') {
                handler = RequestHandlers.enterGame;
            }
            // 3. Default handler
            else {
                handler = RequestHandlers.default;
            }
            
            if (handler) {
                var response = handler(request, playerData);
                
                // Wrap response if not already wrapped
                if (response.ret === undefined) {
                    response = buildResponse(response);
                }
                
                LOG.success('Handler executed: ' + request.type + '.' + request.action);
                
                if (callback) {
                    setTimeout(function() {
                        LOG.socket('Calling callback with response');
                        callback(response);
                    }, 10);
                }
            }
        },
        
        _trigger: function(event, data) {
            LOG.socket('TRIGGER() Event: ' + event);
            
            var listeners = this.eventListeners[event];
            if (listeners) {
                for (var i = 0; i < listeners.length; i++) {
                    try {
                        listeners[i](data);
                    } catch (e) {
                        LOG.error('Error in listener: ' + e.message);
                    }
                }
            }
        },
        
        destroy: function() {
            LOG.socket('Socket destroyed: ' + this.id);
            this.connected = false;
            this.eventListeners = {};
        },
        
        connect: function() {
            LOG.socket('Socket connect() called');
            this.connected = true;
            this._trigger('connect');
        },
        
        disconnect: function() {
            LOG.socket('Socket disconnect() called');
            this.connected = false;
            this._trigger('disconnect');
        }
    };

    // ========================================================
    // 7. INTERCEPT io.connect()
    // ========================================================
    function interceptSocketIO() {
        if (typeof window.io === 'undefined') {
            LOG.error('Socket.IO not found! Make sure socket.io.min.js is loaded before main-server.js');
            return;
        }
        
        var originalConnect = window.io.connect;
        
        if (!originalConnect) {
            LOG.error('io.connect not found!');
            return;
        }
        
        LOG.title('Intercepting io.connect()');
        
        window.io.connect = function(url, options) {
            LOG.socket('═══════════════════════════════════════════════════════════');
            LOG.socket('io.connect() called');
            LOG.socket('URL:', url);
            LOG.socket('Options:', options);
            
            // Check if this is main-server URL (port 9998)
            var isMainServer = false;
            
            // Check from login-server config
            var loginServerData = window.LOGIN_SERVER_MOCK ? window.LOGIN_SERVER_MOCK.config : null;
            if (loginServerData && url.indexOf(loginServerData.mainServerUrl) !== -1) {
                isMainServer = true;
            }
            
            // Also check if URL contains main-server keywords or port 9998
            if (url.indexOf('9998') !== -1 || 
                url.indexOf('main') !== -1 ||
                url.indexOf('127.0.0.1:9998') !== -1 ||
                url.indexOf('localhost:9998') !== -1) {
                isMainServer = true;
            }
            
            if (isMainServer) {
                LOG.success('✅ MAIN-SERVER DETECTED - Using MockSocket');
                LOG.socket('═══════════════════════════════════════════════════════════');
                return new MockSocket(url);
            } else {
                LOG.info('⏩ Not main-server, using original io.connect');
                LOG.socket('═══════════════════════════════════════════════════════════');
                return originalConnect.call(window.io, url, options);
            }
        };
        
        LOG.success('io.connect() intercepted successfully!');
    }

    // ========================================================
    // 8. INITIALIZE
    // ========================================================
    function init() {
        LOG.title('Main-Server Mock v2.0.0 Initialized');
        LOG.info('Server ID:', CONFIG.serverId);
        LOG.info('Server Name:', CONFIG.serverName);
        LOG.info('Start Hero ID:', CONFIG.startHero.displayId);
        LOG.info('Start Gold:', CONFIG.startItems.gold);
        LOG.info('');
        LOG.info('💡 Supported handlers:');
        LOG.info('   - user.enterGame');
        LOG.info('');
        LOG.info('📋 Response contains 78 data fields aligned with saveUserData()');
        
        // Intercept Socket.IO
        interceptSocketIO();
    }

    // ========================================================
    // 9. EXPORT FOR DEBUGGING & SHARED UTILS
    // ========================================================
    // Export LOG for use by other handler files
    window.MAIN_SERVER_LOG = LOG;
    
    // Export getServerTime for use by other handler files
    window.MAIN_SERVER_UTILS = {
        getServerTime: getServerTime,
        buildResponse: function(data) {
            return {
                ret: 0,
                data: typeof data === 'string' ? data : JSON.stringify(data),
                compress: false,
                serverTime: getServerTime(),
                server0Time: getServerTime()
            };
        }
    };
    
    window.MAIN_SERVER_MOCK = {
        config: CONFIG,
        handlers: RequestHandlers,
        MockSocket: MockSocket,
        
        getPlayerData: function(userId) {
            return loadOrCreatePlayerData({ userId: userId });
        },
        
        resetPlayerData: function(userId) {
            if (userId) {
                localStorage.removeItem(STORAGE_KEY + '_' + userId);
            } else {
                // Remove all player data
                for (var key in localStorage) {
                    if (key.indexOf(STORAGE_KEY) === 0) {
                        localStorage.removeItem(key);
                    }
                }
            }
            LOG.success('Player data cleared.');
        },
        
        showConfig: function() {
            LOG.title('Main-Server Config');
            LOG.data('serverId:', CONFIG.serverId);
            LOG.data('serverName:', CONFIG.serverName);
            LOG.data('startHero:', CONFIG.startHero);
            LOG.data('startItems:', CONFIG.startItems);
        }
    };

    // ========================================================
    // 10. START
    // ========================================================
    if (typeof window.io !== 'undefined') {
        init();
    } else {
        var checkInterval = setInterval(function() {
            if (typeof window.io !== 'undefined') {
                clearInterval(checkInterval);
                init();
            }
        }, 50);
        
        setTimeout(function() {
            clearInterval(checkInterval);
            if (typeof window.io === 'undefined') {
                LOG.error('Timeout waiting for Socket.IO to load!');
            }
        }, 5000);
    }

})(window);
