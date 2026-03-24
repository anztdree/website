# 📚 API Documentation - Super Warrior Z (超级战士Z)

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Socket.IO Protocol](#socketio-protocol)
4. [Login Server API (Port 9999)](#login-server-api-port-9999)
5. [Main Server API (Port 9998)](#main-server-api-port-9998)
6. [Complete Action List](#complete-action-list)
7. [Data Structures](#data-structures)
8. [Error Handling](#error-handling)

---

## Overview

Game ini menggunakan arsitektur **dual-server**:
- **Login Server (Port 9999)**: Autentikasi, server list, user management
- **Main Server (Port 9998)**: Game logic, player data, battles, dll

Kedua server menggunakan **Socket.IO** untuk komunikasi real-time.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              GAME CLIENT                                     │
│                    (Egret Engine + Socket.IO Client)                        │
└─────────────────────────────────────────────────────────────────────────────┘
                    │                                    │
                    │ Socket.IO                          │ Socket.IO
                    ▼                                    ▼
┌─────────────────────────────────┐    ┌─────────────────────────────────────┐
│       LOGIN SERVER              │    │          MAIN SERVER                 │
│         (Port 9999)             │    │           (Port 9998)                │
├─────────────────────────────────┤    ├─────────────────────────────────────┤
│ • loginGame                     │    │ • Player Data Management             │
│ • GetServerList                 │    │ • Hero System                        │
│ • LoginAnnounce                 │    │ • Battle System                      │
│ • SaveUserEnterInfo             │    │ • Guild System                       │
│ • SaveLanguage                  │    │ • Dungeon System                     │
│ • SaveHistory                   │    │ • Arena System                       │
└─────────────────────────────────┘    │ • Chat System                        │
                                       │ • Shop System                        │
                                       │ • Activity System                    │
                                       │ • Dan banyak lagi...                 │
                                       └─────────────────────────────────────┘
```

---

## Socket.IO Protocol

### Connection

```javascript
// Client connects to server
var socket = io.connect(serverUrl, {
    reconnectionAttempts: 10,
    path: "/socket.io",
    transports: ["websocket", "polling"]
});
```

### Event: `connect`
Triggered when connection established.

```javascript
socket.on('connect', function() {
    console.log('Connected to server');
});
```

### Event: `disconnect`
Triggered when connection lost.

```javascript
socket.on('disconnect', function() {
    console.log('Disconnected from server');
});
```

### Event: `reconnect_error`
Triggered on reconnection failure.

```javascript
socket.on('reconnect_error', function(error) {
    console.log('Reconnection failed:', error);
});
```

---

## Request/Response Format

### Request Format

```javascript
socket.emit('handler.process', {
    type: "<ModuleType>",
    action: "<ActionName>",
    // ... additional parameters
}, function(response) {
    // Callback with response
});
```

### Response Format

```javascript
{
    ret: 0,              // 0 = success, non-zero = error code
    data: "{}",          // JSON string or object
    compress: false,     // Whether data is compressed
    serverTime: 1774324837394,  // Server timestamp (ms)
    server0Time: 1774324837394  // Server timestamp (ms)
}
```

### Error Response

```javascript
{
    ret: 1,              // Non-zero error code
    data: '{"error":"Error message"}',
    compress: false,
    serverTime: 1774324837394,
    server0Time: 1774324837394
}
```

---

## Login Server API (Port 9999)

### 1. LoginAnnounce
Get login announcements.

**Request:**
```javascript
{
    type: "User",
    action: "LoginAnnounce"
}
```

**Response:**
```javascript
{
    ret: 0,
    data: "{}",  // Empty or announcement data
    compress: false,
    serverTime: 1774324837394,
    server0Time: 1774324837394
}
```

---

### 2. loginGame
User login to game.

**Request:**
```javascript
{
    type: "User",
    action: "loginGame",
    userId: "u_mn40tahpx1lusjux",
    password: "",
    fromChannel: "en"
}
```

**Response:**
```javascript
{
    ret: 0,
    data: {
        "loginToken": "local_xxx_xxx",
        "userId": "u_mn40tahpx1lusjux",
        "channelCode": "en",
        "sdk": "local",
        "nickName": "Player"
    },
    compress: false,
    serverTime: 1774324837394,
    server0Time: 1774324837394
}
```

---

### 3. GetServerList
Get available game servers.

**Request:**
```javascript
{
    type: "User",
    action: "GetServerList"
}
```

**Response:**
```javascript
{
    ret: 0,
    data: {
        "serverList": [
            {
                "serverId": 1,
                "name": "Local 1",      // MUST be "name", not "serverName"
                "url": "http://127.0.0.1:9998",
                "online": true,
                "hot": false,
                "new": true
            }
        ],
        "history": [],      // Array of previously played serverIds
        "offlineReason": "" // Empty = no offline reason
    },
    compress: false,
    serverTime: 1774324837394,
    server0Time: 1774324837394
}
```

---

### 4. SaveUserEnterInfo
Save user entry information.

**Request:**
```javascript
{
    type: "User",
    action: "SaveUserEnterInfo"
}
```

**Response:**
```javascript
{
    ret: 0,
    data: {
        "errorCode": 0
    },
    compress: false,
    serverTime: 1774324837394,
    server0Time: 1774324837394
}
```

---

### 5. SaveLanguage
Save user language preference.

**Request:**
```javascript
{
    type: "User",
    action: "SaveLanguage",
    language: "en"
}
```

**Response:**
```javascript
{
    ret: 0,
    data: {
        "errorCode": 0,
        "language": "en"
    },
    compress: false,
    serverTime: 1774324837394,
    server0Time: 1774324837394
}
```

---

### 6. SaveHistory
Save user play history.

**Request:**
```javascript
{
    type: "User",
    action: "SaveHistory"
}
```

**Response:**
```javascript
{
    ret: 0,
    data: {
        "loginToken": "local_xxx_xxx"
    },
    compress: false,
    serverTime: 1774324837394,
    server0Time: 1774324837394
}
```

---

## Main Server API (Port 9998)

Main server handles ALL game logic. Game connects to Main Server AFTER getting server list from Login Server.

### Connection Sequence

```
1. Game receives server list from Login Server
2. Game extracts mainServerUrl from serverList[0].url
3. Game calls io.connect(mainServerUrl) → io.connect("http://127.0.0.1:9998")
4. After connection, game sends "enterGame" request
```

---

### Critical: enterGame (FIRST REQUEST TO MAIN SERVER)

**Request:**
```javascript
socket.emit('handler.process', {
    type: "User",
    action: "enterGame",
    loginToken: "local_xxx_xxx",
    userId: "u_mn40tahpx1lusjux",
    serverId: 1,
    version: "1.0",
    language: "en",
    gameVersion: "2026-02-02193700"
}, function(response) {
    // Handle response
});
```

**Expected Response:**
```javascript
{
    ret: 0,
    data: {
        // Player basic info
        "userId": "u_mn40tahpx1lusjux",
        "nickName": "Player",
        "level": 1,
        "exp": 0,
        "vip": 0,
        "gold": 10000,
        "diamond": 1000,
        "stamina": 100,
        "createTime": 1774324837394,
        "lastLoginTime": 1774324837394,
        
        // Player heroes
        "heros": [
            {
                "heroId": 1001,
                "level": 1,
                "star": 1,
                "quality": 1,
                "skills": [1, 2, 3],
                "attr": {"hp": 1000, "atk": 100, "def": 50, "spd": 100}
            }
        ],
        
        // Player items
        "items": [],
        
        // Game progress
        "chapter": 1,
        "stage": 1,
        
        // Other data...
    },
    compress: false,
    serverTime: 1774324837394,
    server0Time: 1774324837394
}
```

---

### Other Critical Main Server Requests

#### clientConnect (Keep-alive/Reconnect)
```javascript
{
    type: "User",
    action: "clientConnect"
}
```

#### getAttrs (Get Hero Attributes)
```javascript
{
    type: "hero",
    action: "getAttrs",
    userId: "u_mn40tahpx1lusjux",
    heros: [1001, 1002, 1003],
    version: "1.0"
}
```

#### qigong (Training)
```javascript
{
    type: "hero",
    action: "qigong",
    userId: "u_mn40tahpx1lusjux",
    heroId: 1001,
    times: 1,
    version: "1.0"
}
```

#### getInfo (Expedition)
```javascript
{
    type: "entrust",
    action: "getInfo",
    userId: "u_mn40tahpx1lusjux"
}
```

#### getTreasureInfo (Guild)
```javascript
{
    type: "guild",
    action: "getTreasureInfo",
    userId: "u_mn40tahpx1lusjux",
    guildUUID: "xxx",
    version: "1.0"
}
```

#### sendMsg (Chat)
```javascript
{
    type: "chat",
    action: "sendMsg",
    userId: "u_mn40tahpx1lusjux",
    kind: 1,
    content: "Hello",
    msgType: 1,
    param: "",
    roomId: "global",
    version: "1.0"
}
```

#### getBattleReward (Battle)
```javascript
{
    type: "battle",
    action: "getBattleReward",
    userId: "u_mn40tahpx1lusjux",
    battleId: "xxx"
}
```

#### getState (Trial)
```javascript
{
    type: "trial",
    action: "getState",
    userId: "u_mn40tahpx1lusjux",
    version: "1.0"
}
```

---

## Complete Action List

### Type: User

| Action | Description | Status |
|--------|-------------|--------|
| `LoginAnnounce` | Get login announcements | ✅ Login Server |
| `loginGame` | User login | ✅ Login Server |
| `GetServerList` | Get server list | ✅ Login Server |
| `SaveUserEnterInfo` | Save user entry info | ✅ Login Server |
| `SaveLanguage` | Save language preference | ✅ Login Server |
| `SaveHistory` | Save play history | ✅ Login Server |
| `enterGame` | Enter game world | ⚠️ Main Server |
| `exitGame` | Exit game world | ⚠️ Main Server |
| `changeNickName` | Change player nickname | ⚠️ Main Server |
| `changeHeadImage` | Change avatar | ⚠️ Main Server |
| `changeHeadBox` | Change avatar frame | ⚠️ Main Server |
| `clientConnect` | Client connection handler | ⚠️ Main Server |

---

### Type: hero (Hero System)

| Action | Description |
|--------|-------------|
| `activeHeroBreak` | Activate hero breakthrough |
| `activeSkill` | Activate skill |
| `activeSuperSkill` | Activate super skill |
| `autoHeroBreak` | Auto hero breakthrough |
| `autoLevelUpSuperSkill` | Auto level up super skill |
| `evolve` | Hero evolution |
| `evolveSuperSkill` | Evolve super skill |
| `getAttrs` | Get hero attributes |
| `getFriendHeros` | Get friend's heroes |
| `heroBreak` | Hero breakthrough |
| `heroGiftReward` | Hero gift reward |
| `heroHelpBuy` | Hero help buy |
| `heroOrangeReward` | Hero orange reward |
| `heroRewardBuyToken` | Hero reward buy token |
| `heroRewardGetReward` | Hero reward get reward |
| `inherit` | Hero inheritance |
| `levelUp` | Level up hero |
| `levelUpSuperSkill` | Level up super skill |
| `queryHeroEquipInfo` | Query hero equipment info |
| `reborn` | Hero rebirth |
| `rebornSelfBreak` | Reborn self breakthrough |
| `recoverHero` | Recover hero |
| `setMainHero` | Set main hero |
| `splitHero` | Split hero |
| `starUp` | Star up hero |
| `wakeUp` | Wake up hero |

---

### Type: backpack (Inventory System)

| Action | Description |
|--------|-------------|
| `decompose` | Decompose items |
| `equip` | Equip item |
| `equipUp` | Equip upgrade |
| `getAll` | Get all items |
| `merge` | Merge items |
| `resolve` | Resolve items |
| `sell` | Sell items |
| `smelt` | Smelt items |
| `useItem` | Use item |

---

### Type: battle (Battle System)

| Action | Description |
|--------|-------------|
| `autoFight` | Auto fight |
| `checkBattleRecord` | Check battle record |
| `checkBattleResult` | Check battle result |
| `friendBattle` | Friend battle |
| `getBattleRecord` | Get battle record |
| `getBattleReward` | Get battle reward |
| `guideBattle` | Guide battle |
| `queryBattleRecord` | Query battle record |
| `recommendBattleFriend` | Recommend battle friend |
| `startBattle` | Start battle |

---

### Type: dungeon (Dungeon System)

| Action | Description |
|--------|-------------|
| `dungeonReward` | Dungeon reward |
| `getChest` | Get chest |
| `getEnemyInfo` | Get enemy info |
| `getFinishInfo` | Get finish info |
| `hangupReward` | Hangup reward |
| `nextChapter` | Next chapter |
| `queryTodayMap` | Query today map |
| `queryHistoryMap` | Query history map |
| `sweep` | Sweep dungeon |
| `treasureStartBattle` | Treasure start battle |

---

### Type: guild (Guild System)

| Action | Description |
|--------|-------------|
| `appointmentViceCaptain` | Appoint vice captain |
| `autoApply` | Auto apply settings |
| `changeAutoJoinCondition` | Change auto join condition |
| `changeGuildName` | Change guild name |
| `createGuild` | Create guild |
| `getGuildBossInfo` | Get guild boss info |
| `getGuildByIdOrName` | Get guild by ID or name |
| `getGuildDetail` | Get guild detail |
| `getGuildList` | Get guild list |
| `getGuildLog` | Get guild log |
| `getGuildMemberHonours` | Get guild member honours |
| `getMembers` | Get guild members |
| `getRequestMembers` | Get request members |
| `guildSign` | Guild sign in |
| `handleApply` | Handle application |
| `handleRequest` | Handle request |
| `impeachCaptain` | Impeach captain |
| `join` | Join guild |
| `kickOut` | Kick out member |
| `quitGuild` | Quit guild |
| `relieveViceCaptain` | Relieve vice captain |
| `requestGuild` | Request to join guild |
| `transferCaptain` | Transfer captain |
| `updateBulletin` | Update bulletin |
| `updateDes` | Update description |
| `updateGuildIcon` | Update guild icon |
| `updateRequestCondition` | Update request condition |

---

### Type: friend (Friend System)

| Action | Description |
|--------|-------------|
| `addToBlacklist` | Add to blacklist |
| `applyFriend` | Apply for friend |
| `delFriend` | Delete friend |
| `delFriendMsg` | Delete friend message |
| `getFriend` | Get friend info |
| `getFriends` | Get friends list |
| `getHeart` | Get heart |
| `giveHeart` | Give heart |
| `recommendFriend` | Recommend friend |
| `removeBalcklist` | Remove from blacklist |

---

### Type: chat (Chat System)

| Action | Description |
|--------|-------------|
| `addComment` | Add comment |
| `delMail` | Delete mail |
| `getComments` | Get comments |
| `getMailList` | Get mail list |
| `getMsg` | Get message |
| `getMsgList` | Get message list |
| `likeComment` | Like comment |
| `readBulletin` | Read bulletin |
| `readMail` | Read mail |
| `readMsg` | Read message |
| `readNew` | Read new |
| `registChat` | Register chat |
| `sendMsg` | Send message |
| `setTopMsg` | Set top message |
| `unlikeComment` | Unlike comment |

---

### Type: arena (Arena System)

| Action | Description |
|--------|-------------|
| `buyBattleTimes` | Buy battle times |
| `getEnemyInfo` | Get enemy info |
| `getRank` | Get rank |
| `getRankReward` | Get rank reward |
| `queryArenaHeroEquipInfo` | Query arena hero equip info |
| `queryBackupTeam` | Query backup team |
| `queryBackupTeamEquip` | Query backup team equip |
| `setDefence` | Set defence team |

---

### Type: activity (Activity System)

| Action | Description |
|--------|-------------|
| `activityGetTaskReward` | Activity get task reward |
| `beStrongActiveActReward` | Be strong active act reward |
| `beStrongBuyDiscount` | Be strong buy discount |
| `beStrongGiftActReward` | Be strong gift act reward |
| `beStrongRefreshDiscount` | Be strong refresh discount |
| `cumulativeRechargeReward` | Cumulative recharge reward |
| `dailyBigGiftReward` | Daily big gift reward |
| `doubleElevenGetPayReward` | Double eleven pay reward |
| `entrustActReward` | Entrust act reward |
| `friendBattleActReward` | Friend battle act reward |
| `getActivityBrief` | Get activity brief |
| `getActivityDetail` | Get activity detail |
| `getChannelWeeklyRewrd` | Get channel weekly reward |
| `getChapterReward` | Get chapter reward |
| `getDailyReward` | Get daily reward |
| `getDailyTaskReward` | Get daily task reward |
| `getDownloadReward` | Get download reward |
| `getFundReward` | Get fund reward |
| `getGrowActivityReward` | Get grow activity reward |
| `getLanternBlessTaskReward` | Get lantern bless task reward |
| `getLessonFundReward` | Get lesson fund reward |
| `getLevelReward` | Get level reward |
| `getLoginActivityExReward` | Get login activity ex reward |
| `getLoginActivityReward` | Get login activity reward |
| `getOnlineGift` | Get online gift |
| `karinActReward` | Karin act reward |
| `lanternBless` | Lantern bless |
| `lanternBlessClickTip` | Lantern bless click tip |
| `marketActReward` | Market act reward |
| `resetLanternBless` | Reset lantern bless |

---

### Type: checkin (Check-in System)

| Action | Description |
|--------|-------------|
| `checkin` | Daily check-in |
| `getSignUpInfo` | Get sign up info |
| `signUp` | Sign up |

---

### Type: equip (Equipment System)

| Action | Description |
|--------|-------------|
| `levelUpHalo` | Level up halo |
| `luckEquipGetEquip` | Luck equip get equip |
| `luckEquipGetReward` | Luck equip get reward |
| `luckEquipPushEquip` | Luck equip push equip |
| `luckEquipUp` | Luck equip up |
| `takeOff` | Take off equipment |
| `takeOffAuto` | Auto take off equipment |
| `wear` | Wear equipment |
| `wearAuto` | Auto wear equipment |

---

### Type: gift (Gift System)

| Action | Description |
|--------|-------------|
| `gain` | Gain gift |
| `getAllReward` | Get all rewards |
| `getAllBoxReward` | Get all box rewards |
| `getAllLevelReward` | Get all level rewards |
| `getHelpReward` | Get help reward |
| `getHelpRewardInfo` | Get help reward info |
| `getReward` | Get reward |
| `getRewardInfo` | Get reward info |
| `luckFeedbackGetBox` | Luck feedback get box |
| `luckFeedbackGetReward` | Luck feedback get reward |
| `luckyWheelGetReward` | Lucky wheel get reward |
| `luckyWheelLottery` | Lucky wheel lottery |
| `openBox` | Open box |
| `taskReward` | Task reward |

---

### Type: gemstone (Gemstone System)

| Action | Description |
|--------|-------------|
| `activeRing` | Activate ring |
| `autoMerge` | Auto merge |
| `autoRingLevelUp` | Auto ring level up |
| `merge` | Merge gemstones |
| `ringEvolve` | Ring evolution |

---

### Type: expedition (Expedition System)

| Action | Description |
|--------|-------------|
| `clickExpedition` | Click expedition |
| `finishEvent` | Finish event |
| `finishNow` | Finish now |
| `getInfo` | Get expedition info |
| `quickFinishEvent` | Quick finish event |
| `startEvent` | Start event |

---

### Type: dragon (Dragon System)

| Action | Description |
|--------|-------------|
| `attackBoss` | Attack boss |
| `attackNienBeast` | Attack Nien beast |
| `autoGetEventsReward` | Auto get events reward |
| `buyBossTimes` | Buy boss times |
| `getBossList` | Get boss list |
| `mergeBossBuyTimes` | Merge boss buy times |
| `mergeBossInfo` | Merge boss info |
| `mergeBossStartBattle` | Merge boss start battle |
| `startBoss` | Start boss |
| `weaponCastGetReward` | Weapon cast get reward |
| `weaponCastLottery` | Weapon cast lottery |

---

### Type: bossCompetition (Boss Competition)

| Action | Description |
|--------|-------------|
| `attackOwner` | Attack owner |
| `checkBossResult` | Check boss result |
| `getFlagOwnerInfo` | Get flag owner info |

---

### Type: gravity (Gravity System)

| Action | Description |
|--------|-------------|
| `buySeat` | Buy seat |
| `clearSeatCD` | Clear seat cooldown |
| `putChild` | Put child |
| `putInMachine` | Put in machine |
| `removeChild` | Remove child |
| `takeOutMachine` | Take out machine |

---

### Type: guide (Guide System)

| Action | Description |
|--------|-------------|
| `saveGuide` | Save guide |
| `saveGuideTeam` | Save guide team |

---

### Type: hangup (AFK System)

| Action | Description |
|--------|-------------|
| `hangupReward` | Get AFK rewards |

---

### Type: genki (Genki System)

| Action | Description |
|--------|-------------|
| `queryGenki` | Query genki |
| `qigong` | Qigong action |
| `cancelQigong` | Cancel qigong |
| `saveQigong` | Save qigong |

---

### Type: buryPoint (Analytics)

| Action | Description |
|--------|-------------|
| `click` | Click tracking |
| `clickDownload` | Click download tracking |
| `clickHonghuUrl` | Click Honghu URL |
| `clickSystem` | Click system tracking |

---

### Type: YouTuber (YouTuber System)

| Action | Description |
|--------|-------------|
| `getYouTuberRecruitReward` | Get YouTuber recruit reward |
| `joinYouTuberPlan` | Join YouTuber plan |

---

### Type: cellGame (Cell Game)

| Action | Description |
|--------|-------------|
| `resetCellGame` | Reset cell game |

---

### Type: downloadReward (Download Reward)

| Action | Description |
|--------|-------------|
| `clickDownload` | Click download |
| `getDownloadReward` | Get download reward |

---

### Type: battleMedal (Battle Medal)

| Action | Description |
|--------|-------------|
| `getBattleReward` | Get battle reward |
| `getChampionRank` | Get champion rank |
| `getLocalRank` | Get local rank |
| `getPassRank` | Get pass rank |
| `getPointRank` | Get point rank |

---

### Type: battleRecordCheck (Battle Record Check)

| Action | Description |
|--------|-------------|
| `checkBattleRecord` | Check battle record |
| `checkBattleResult` | Check battle result |
| `getBattleRecord` | Get battle record |
| `getTopBattleRecord` | Get top battle record |

---

### Type: ballWar (Ball War)

| Action | Description |
|--------|-------------|
| `signUpBallWar` | Sign up ball war |

---

### Type: entrust (Entrust System)

| Action | Description |
|--------|-------------|
| `startEntrust` | Start entrust |
| `userEntrustBook` | User entrust book |

---

## Type Summary

| Type | Count | Description |
|------|-------|-------------|
| User | 12 | User management & login |
| hero | 28 | Hero system |
| backpack | 10 | Inventory system |
| battle | 10 | Battle system |
| dungeon | 11 | Dungeon system |
| guild | 26 | Guild system |
| friend | 11 | Friend system |
| chat | 17 | Chat & mail system |
| arena | 10 | Arena/PVP system |
| activity | 37 | Activity & events |
| checkin | 3 | Daily check-in |
| equip | 11 | Equipment system |
| gift | 16 | Gift & reward system |
| gemstone | 6 | Gemstone system |
| expedition | 6 | Expedition system |
| dragon | 11 | Dragon/Boss system |
| bossCompetition | 3 | Boss competition |
| gravity | 6 | Gravity system |
| guide | 2 | Guide system |
| hangup | 1 | AFK system |
| genki | 5 | Genki system |
| buryPoint | 5 | Analytics |
| YouTuber | 2 | YouTuber system |
| cellGame | 1 | Cell game |
| downloadReward | 2 | Download reward |
| battleMedal | 5 | Battle medal |
| battleRecordCheck | 5 | Battle record |
| ballWar | 1 | Ball war |
| entrust | 2 | Entrust system |

**Total: ~230+ API Actions**

---

## Data Structures

### Player Info
```javascript
{
    userId: "u_mn40tahpx1lusjux",
    nickName: "Player",
    level: 1,
    exp: 0,
    vip: 0,
    gold: 1000,
    diamond: 100,
    stamina: 100,
    createTime: 1774324837394,
    lastLoginTime: 1774324837394
}
```

### Hero Info
```javascript
{
    heroId: 1001,
    level: 1,
    star: 1,
    quality: 1,      // 1=Normal, 2=Good, 3=Rare, 4=Epic, 5=Legendary
    skills: [1, 2, 3],
    equip: {},
    attr: {
        hp: 1000,
        atk: 100,
        def: 50,
        spd: 100
    }
}
```

### Server Info
```javascript
{
    serverId: 1,
    name: "Local 1",
    url: "http://127.0.0.1:9998",
    online: true,
    hot: false,
    new: true,
    population: 0
}
```

---

## Error Handling

### Error Codes

| Code | Description |
|------|-------------|
| 0 | Success |
| 1 | Unknown error |
| 2 | Invalid parameters |
| 3 | Not logged in |
| 4 | Permission denied |
| 5 | Resource not found |
| 6 | Operation failed |
| 7 | Cooldown active |
| 8 | Insufficient resources |
| 9 | Level requirement not met |
| 10 | Server maintenance |

### Error Response Example
```javascript
{
    ret: 8,
    data: '{"error":"Insufficient gold","required":1000,"current":500}',
    compress: false,
    serverTime: 1774324837394,
    server0Time: 1774324837394
}
```

---

## Flow Diagrams

### Login Flow
```
┌─────────────────────────────────────────────────────────────────────┐
│                         LOGIN FLOW                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. Game starts                                                      │
│     └──▶ egret.ExternalInterface.call("startGame")                   │
│          └──▶ Bridge returns SDK config                              │
│                                                                      │
│  2. Connect to Login Server (Port 9999)                              │
│     └──▶ io.connect("http://127.0.0.1:9999")                         │
│          └──▶ MockSocket created (intercepted)                       │
│                                                                      │
│  3. LoginAnnounce                                                    │
│     └──▶ emit("handler.process", {type:"User", action:"LoginAnnounce"})│
│          └──▶ Returns: {ret:0, data:"{}"}                            │
│                                                                      │
│  4. loginGame                                                        │
│     └──▶ emit("handler.process", {type:"User", action:"loginGame"})  │
│          └──▶ Returns: {loginToken, userId, nickName, ...}           │
│                                                                      │
│  5. GetServerList                                                    │
│     └──▶ emit("handler.process", {type:"User", action:"GetServerList"})│
│          └──▶ Returns: {serverList:[{...}], history:[], ...}         │
│                                                                      │
│  6. SaveUserEnterInfo                                                │
│     └──▶ emit("handler.process", {type:"User", action:"SaveUserEnterInfo"})│
│          └──▶ Returns: {ret:0}                                       │
│                                                                      │
│  7. SaveLanguage                                                     │
│     └──▶ emit("handler.process", {type:"User", action:"SaveLanguage"})│
│          └──▶ Returns: {ret:0, language:"en"}                        │
│                                                                      │
│  8. SaveHistory                                                      │
│     └──▶ emit("handler.process", {type:"User", action:"SaveHistory"})│
│          └──▶ Returns: {loginToken}                                  │
│                                                                      │
│  9. Disconnect from Login Server                                     │
│     └──▶ reportLogToPP("disConnectLoginSocket")                      │
│                                                                      │
│  10. Connect to Main Server (Port 9998)                              │
│      └──▶ io.connect("http://127.0.0.1:9998")                        │
│           └──▶ ❌ NOT INTERCEPTED - Real connection attempt          │
│                └──▶ ❌ FAILS - No server running                     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Game Flow (After Login)
```
┌─────────────────────────────────────────────────────────────────────┐
│                        GAME FLOW                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. Enter Server                                                     │
│     └──▶ emit("handler.process", {type:"User", action:"enterGame"})  │
│          └──▶ Returns: Player data, heroes, items, etc.             │
│                                                                      │
│  2. Load Player Data                                                 │
│     └──▶ All player info, inventory, heroes, etc.                   │
│                                                                      │
│  3. Game Loop                                                        │
│     ├──▶ Battle actions (type:"battle", action:"startBattle")        │
│     ├──▶ Dungeon actions (type:"dungeon", action:"sweep")            │
│     ├──▶ Hero actions (type:"hero", action:"levelUp")                │
│     ├──▶ Shop actions (type:"shop", action:"buy")                    │
│     ├──▶ Guild actions (type:"guild", action:"join")                 │
│     └──▶ etc.                                                        │
│                                                                      │
│  4. Real-time Updates                                                │
│     ├──▶ Chat messages                                               │
│     ├──▶ Guild notifications                                         │
│     ├──▶ Friend requests                                             │
│     └──▶ Event notifications                                         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Notes

### Critical Requirements

1. **Server List Response Format**
   - MUST use `name` field, NOT `serverName`
   - MUST include `serverList`, `history`, `offlineReason` fields

2. **Socket.IO Events**
   - Main event: `handler.process`
   - Must handle callback properly

3. **Response Format**
   - MUST include `ret`, `data`, `compress`, `serverTime`, `server0Time`
   - `data` can be string or object

4. **Port Configuration**
   - Login Server: 9999
   - Main Server: 9998
   - Chat Server: 9997 (optional)
   - Dungeon Server: 9996 (optional)

---

## Next Steps

Untuk membuat Mock Main Server, Anda perlu mengimplementasikan:

1. **Minimal Actions untuk Game Berjalan:**
   - `User.enterGame` - Enter game world
   - `User.clientConnect` - Client connection
   - `hero.getAttrs` - Get hero data
   - `backpack.getAll` - Get inventory
   - `dungeon.getInfo` - Get dungeon info
   - `chat.registChat` - Register chat

2. **Basic Data Storage:**
   - Player profile
   - Heroes
   - Items/Inventory
   - Progress data

---

*Documentation generated from analysis of game files*
*Version: 1.0.0*
*Last updated: Based on repository analysis*
