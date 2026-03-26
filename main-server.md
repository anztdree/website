# 📚 DOKUMENTASI GAME DRAGON BALL HTML5

> **Super Fighter Z (超级战士Z)** - Game RPG Dragon Ball berbasis HTML5  
> Versi Mock Server untuk Mode Offline/Standalone

---

## 📋 DAFTAR ISI

1. [Overview Proyek](#1-overview-proyek)
2. [Arsitektur Sistem](#2-arsitektur-sistem)
3. [Flow Game Lengkap](#3-flow-game-lengkap)
4. [Struktur File Proyek](#4-struktur-file-proyek)
5. [Struktur Data](#5-struktur-data)
6. [Handler yang Sudah Dibuat](#6-handler-yang-sudah-dibuat)
7. [Handler yang Perlu Dibuat](#7-handler-yang-perlu-dibuat)
8. [Singleton Manager](#8-singleton-manager)
9. [Development Guide](#9-development-guide)

---

## 1. OVERVIEW PROYEK

### 1.1 Deskripsi

Proyek ini adalah game Dragon Ball HTML5 yang telah dimodifikasi untuk dapat berjalan secara **lokal/offline** tanpa memerlukan server backend yang sebenarnya. Modifikasi dilakukan dengan cara **mengintercept** semua koneksi socket.io dan memberikan response dari localStorage.

### 1.2 Teknologi

| Komponen | Teknologi |
|----------|-----------|
| Game Engine | Egret Engine 5.x |
| UI Framework | EUI (Egret UI) |
| Animation | DragonBones |
| Networking | Socket.IO (di-intercept) |
| Storage | localStorage |
| Compression | LZ-String |
| Encryption | TEA (Tiny Encryption Algorithm) |

### 1.3 Status Proyek

| Server | Port | Status | Jumlah Handler |
|--------|------|--------|----------------|
| Login Server | 9999 | ✅ Implementasi selesai | 6 |
| Main Server | 9998 | ⚠️ Belum lengkap | 524 total, 5 sudah dibuat |
| Chat Server | 9997 | ❌ Belum dibuat | - |
| Team Dungeon Server | 9996 | ❌ Belum dibuat | - |

---

## 2. ARSITEKTUR SISTEM

### 2.1 Diagram Arsitektur

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BROWSER ENVIRONMENT                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         INDEX.HTML                                    │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │   │
│  │  │ 1. Load eruda (debug console)                                   │ │   │
│  │  │ 2. Load sdk/sdk.js        → Setup LOCAL_SDK & window functions  │ │   │
│  │  │ 3. Load manifest.json     → Daftar JS files untuk di-load       │ │   │
│  │  │ 4. Load all JS files      → Egret engine + Game code            │ │   │
│  │  └─────────────────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│                                      ▼                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         SDK LAYER                                    │   │
│  │                                                                       │   │
│  │  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐   │   │
│  │  │   sdk/sdk.js    │    │  sdk/bridge.js  │    │ localStorage    │   │   │
│  │  │                 │    │                 │    │                 │   │   │
│  │  │ - LOCAL_SDK     │    │ - Intercept     │    │ - User data     │   │   │
│  │  │ - User ID       │    │   egret calls   │    │ - Player data   │   │   │
│  │  │ - Token         │    │ - Route to      │    │ - Hero data     │   │   │
│  │  │ - Config        │    │   mock server   │    │ - Settings      │   │   │
│  │  └─────────────────┘    └─────────────────┘    └─────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│                                      ▼                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                      MOCK SERVER LAYER                               │   │
│  │                                                                       │   │
│  │  ┌───────────────────────────────────────────────────────────────┐   │   │
│  │  │                    io.connect() INTERCEPTOR                    │   │   │
│  │  │                                                                 │   │   │
│  │  │   Port 9999 → login-server.js  → MockSocket (login)            │   │   │
│  │  │   Port 9998 → entergame.js     → MockSocket (main game)        │   │   │
│  │  │   Port 9997 → (chat server)    → Belum dibuat                  │   │   │
│  │  │   Port 9996 → (dungeon server) → Belum dibuat                  │   │   │
│  │  └───────────────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│                                      ▼                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         GAME ENGINE                                  │   │
│  │                                                                       │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │   │
│  │  │   Egret     │  │    EUI      │  │ DragonBones │  │  Socket.IO  │  │   │
│  │  │   Core      │  │   UI        │  │  Animation  │  │   Client    │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘  └─────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. FLOW GAME LENGKAP

### 3.1 FLOW DIAGRAM - DARI START SAMPAI MAIN GAME

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FLOW GAME - URUTAN LENGKAP                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ══════════════════════════════════════════════════════════════════════════ │
│  【FASE 1】 STARTUP & SDK INITIALIZATION                                     │
│  ══════════════════════════════════════════════════════════════════════════ │
│                                                                              │
│  [1.0] INDEX.HTML LOADED                                                     │
│        │                                                                     │
│        ├──▶ [1.1] Load eruda (debug console)                                │
│        ├──▶ [1.2] Load sdk/sdk.js                                           │
│        ├──▶ [1.3] Load manifest.json                                        │
│        └──▶ [1.4] Load sdk/bridge.js                                        │
│                                                                              │
│  ══════════════════════════════════════════════════════════════════════════ │
│  【FASE 2】 GAME ENGINE INITIALIZATION                                       │
│  ══════════════════════════════════════════════════════════════════════════ │
│                                                                              │
│  [2.0] GAME ENGINE STARTS                                                    │
│        │                                                                     │
│        ├──▶ [2.1] TSBrowser.checkWindowFunction()                           │
│        ├──▶ [2.2] TSBrowser.isNative()                                      │
│        └──▶ [2.3] egret.ExternalInterface.call("startGame", "...")          │
│                                                                              │
│  ══════════════════════════════════════════════════════════════════════════ │
│  【FASE 3】 LOGIN SERVER CONNECTION (Port 9999)                              │
│  ══════════════════════════════════════════════════════════════════════════ │
│                                                                              │
│  [3.0] ts.connectToLogin()                                                   │
│        │                                                                     │
│        ├──▶ [3.1] io.connect("http://127.0.0.1:9999")                       │
│        ├──▶ [3.2] Socket Events: connect, verify                            │
│        ├──▶ [3.3] User.loginGame ✅                                         │
│        ├──▶ [3.4] User.GetServerList ✅                                     │
│        ├──▶ [3.5] User.SaveHistory ✅                                       │
│        └──▶ [3.6] User.SaveLanguage ✅                                      │
│                                                                              │
│  ══════════════════════════════════════════════════════════════════════════ │
│  【FASE 4】 MAIN SERVER CONNECTION (Port 9998)                               │
│  ══════════════════════════════════════════════════════════════════════════ │
│                                                                              │
│  [4.0] ts.clientStartGame()                                                  │
│        │                                                                     │
│        ├──▶ [4.1] io.connect("http://127.0.0.1:9998")                       │
│        ├──▶ [4.2] Socket Events: connect, verify                            │
│        └──▶ [4.3] user.enterGame ✅                                         │
│                                                                              │
│  ══════════════════════════════════════════════════════════════════════════ │
│  【FASE 5】 DATA PARSING & INITIALIZATION                                    │
│  ══════════════════════════════════════════════════════════════════════════ │
│                                                                              │
│  [5.0] UserDataParser.saveUserData(response)                                 │
│        │                                                                     │
│        ├──▶ [5.1] setUserInfo(e.user)                                       │
│        ├──▶ [5.2] HerosManager.getInstance().readByData(e.heros)            │
│        ├──▶ [5.3] ItemsCommonSingleton.initDragonBallEquip()                │
│        ├──▶ [5.4] OnHookSingleton → Progress stage                          │
│        ├──▶ [5.5] SummonSingleton → Summon data                             │
│        ├──▶ [5.6] EquipInfoManager → Equipment                              │
│        ├──▶ [5.7] AllRefreshCount.initData(e.scheduleInfo)                  │
│        ├──▶ [5.8] WelfareInfoManager → Gifts, rewards                       │
│        │                                                                     │
│        └──▶ [5.9] Additional Requests:                                      │
│               ├──▶ [5.9.1] heroImage.getAll ✅                              │
│               ├──▶ [5.9.2] hero.getAttrs ✅                                 │
│               ├──▶ [5.9.3] userMsg.getMsgList ✅                            │
│               └──▶ [5.9.4] user.getBulletinBrief ✅                         │
│                                                                              │
│  ══════════════════════════════════════════════════════════════════════════ │
│  【FASE 6】 GAME READY - MAIN SCREEN                                         │
│  ══════════════════════════════════════════════════════════════════════════ │
│                                                                              │
│  [6.0] GAME READY! → Show main screen                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. STRUKTUR FILE PROYEK

```
temp-repo/
│
├── index.html                      # Entry point HTML
├── manifest.json                   # Daftar JS files untuk di-load
├── DOCS.md                         # Dokumentasi (file ini)
│
├── sdk/
│   ├── sdk.js                      # Mock SDK - Setup user & config
│   └── bridge.js                   # Bridge - Intercept egret calls
│
├── server/
│   ├── login-server.js             # Mock login server (port 9999)
│   └── main-server/
│       ├── entergame.js            # Main game server (port 9998)
│       ├── getAll.js               # Handler: heroImage.getAll
│       ├── getAttrs.js             # Handler: hero.getAttrs
│       ├── getMsgList.js           # Handler: userMsg.getMsgList
│       └── getBulletinBrief.js     # Handler: user.getBulletinBrief
│
├── js/
│   ├── egret.min_xxx.js            # Egret Engine core
│   ├── egret.web.min_xxx.js        # Egret Web renderer
│   ├── eui.min_xxx.js              # EUI components
│   ├── dragonBones.min_xxx.js      # DragonBones animation
│   ├── game.min_xxx.js             # Game logic
│   ├── main.min_xxx.js             # Main game code (OBFUSCATED)
│   ├── battlelogic.min_xxx.js      # Battle system
│   ├── socket.io.min_xxx.js        # Socket.IO client
│   └── ...                         # Other libraries
│
├── resource/
│   ├── assets/                     # Game assets (images, animations)
│   ├── language/                   # Multi-language files
│   └── properties/                 # Configuration files
│
└── main.min(unminfy).js            # Unminified main code (REFERENCE)
```

---

## 5. STRUKTUR DATA

### 5.1 Response user.enterGame (MAIN DATA)

```javascript
{
    // Core User Data
    "user": { "_id", "_nickName", "_headImage", "_lastLoginTime", ... },
    "currency": { "diamond", "gold" },
    
    // Heroes
    "heros": { "_heros": { [heroId]: { ... } } },
    
    // Inventory
    "totalProps": { "_items": { ... } },
    "backpackLevel": 1,
    
    // Game Progress
    "hangup": { "_curLess", "_maxPassLesson", ... },
    "curMainTask": 0,
    
    // Other Systems
    "summon": { ... },
    "equip": { ... },
    "dungeon": { ... },
    "scheduleInfo": { ... },
    "lastTeam": { ... },
    // ... banyak lagi
}
```

---

## 6. HANDLER YANG SUDAH DIBUAT

### 6.1 Login Server (Port 9999) - 6 Handler

| No | Type | Action | File | Status |
|----|------|--------|------|--------|
| 1 | User | loginGame | login-server.js | ✅ Done |
| 2 | User | GetServerList | login-server.js | ✅ Done |
| 3 | User | SaveHistory | login-server.js | ✅ Done |
| 4 | User | SaveLanguage | login-server.js | ✅ Done |
| 5 | User | SaveUserEnterInfo | login-server.js | ✅ Done |
| 6 | User | LoginAnnounce | login-server.js | ✅ Done |

### 6.2 Main Server (Port 9998) - 5 Handler

| No | Type | Action | File | Status |
|----|------|--------|------|--------|
| 1 | user | enterGame | entergame.js | ✅ Done |
| 2 | heroImage | getAll | getAll.js | ✅ Done |
| 3 | hero | getAttrs | getAttrs.js | ✅ Done |
| 4 | userMsg | getMsgList | getMsgList.js | ✅ Done |
| 5 | user | getBulletinBrief | getBulletinBrief.js | ✅ Done |

**Total Handler Sudah Dibuat: 11**

---

## 7. HANDLER YANG PERLU DIBUAT

### 7.1 STATISTIK

| Kategori | Jumlah Handler | Status |
|----------|----------------|--------|
| **Login Server** | 6 | ✅ Selesai |
| **Main Server - Total** | **524** | ⚠️ 5 sudah, 519 belum |
| **Chat Server** | TBD | ❌ Belum ada |
| **Dungeon Server** | TBD | ❌ Belum ada |

### 7.2 DAFTAR LENGKAP MAIN SERVER HANDLER (524 Handler)

> **URUTAN BERDASARKAN FLOW GAME**
> Semua handler ini WAJIB dibuat. Jika satu missing, game akan error domino.

---

#### 【TIPE 1: User】 - 13 Handler (1 sudah, 12 belum)

| No | Type | Action | Flow | Status |
|----|------|--------|------|--------|
| 1 | user | enterGame | Fase 4 - Login | ✅ Done |
| 2 | user | getBulletinBrief | Fase 5 - Init | ✅ Done |
| 3 | user | changeNickName | Main Menu | ❌ Belum |
| 4 | user | changeHeadImage | Main Menu | ❌ Belum |
| 5 | user | changeHeadBox | Main Menu | ❌ Belum |
| 6 | user | clickSystem | Main Menu | ❌ Belum |
| 7 | user | exitGame | Main Menu | ❌ Belum |
| 8 | user | queryPlayerHeadIcon | Main Menu | ❌ Belum |
| 9 | user | readBulletin | Main Menu | ❌ Belum |
| 10 | user | registChat | Main Menu | ❌ Belum |
| 11 | user | saveFastTeam | Battle Setup | ❌ Belum |
| 12 | user | setFastTeamName | Battle Setup | ❌ Belum |
| 13 | user | suggest | Settings | ❌ Belum |

---

#### 【TIPE 2: hero】 - 20 Handler (1 sudah, 19 belum)

| No | Type | Action | Flow | Status |
|----|------|--------|------|--------|
| 1 | hero | getAttrs | Fase 5 - Init | ✅ Done |
| 2 | hero | activeHeroBreak | Hero Menu | ❌ Belum |
| 3 | hero | activeSkill | Hero Menu | ❌ Belum |
| 4 | hero | activeSkin | Hero Menu | ❌ Belum |
| 5 | hero | autoHeroBreak | Hero Menu | ❌ Belum |
| 6 | hero | autoLevelUp | Hero Menu | ❌ Belum |
| 7 | hero | cancelQigong | Hero Menu | ❌ Belum |
| 8 | hero | evolve | Hero Menu | ❌ Belum |
| 9 | hero | heroBreak | Hero Menu | ❌ Belum |
| 10 | hero | inherit | Hero Menu | ❌ Belum |
| 11 | hero | qigong | Hero Menu | ❌ Belum |
| 12 | hero | queryArenaHeroEquipInfo | Hero Menu | ❌ Belum |
| 13 | hero | queryHeroEquipInfo | Hero Menu | ❌ Belum |
| 14 | hero | reborn | Hero Menu | ❌ Belum |
| 15 | hero | rebornSelfBreak | Hero Menu | ❌ Belum |
| 16 | hero | resolve | Hero Menu | ❌ Belum |
| 17 | hero | saveQigong | Hero Menu | ❌ Belum |
| 18 | hero | splitHero | Hero Menu | ❌ Belum |
| 19 | hero | useSkin | Hero Menu | ❌ Belum |
| 20 | hero | wakeUp | Hero Menu | ❌ Belum |

---

#### 【TIPE 3: heroImage】 - 6 Handler (1 sudah, 5 belum)

| No | Type | Action | Flow | Status |
|----|------|--------|------|--------|
| 1 | heroImage | getAll | Fase 5 - Init | ✅ Done |
| 2 | heroImage | addComment | Hero Gallery | ❌ Belum |
| 3 | heroImage | getComments | Hero Gallery | ❌ Belum |
| 4 | heroImage | likeComment | Hero Gallery | ❌ Belum |
| 5 | heroImage | readHeroVersion | Hero Gallery | ❌ Belum |
| 6 | heroImage | unlikeComment | Hero Gallery | ❌ Belum |

---

#### 【TIPE 4: hangup】 - 8 Handler (BELUM SEMUA)

| No | Type | Action | Flow | Status |
|----|------|--------|------|--------|
| 1 | hangup | checkBattleResult | Fase 7 - Battle | ❌ Belum |
| 2 | hangup | startGeneral | Fase 7 - Battle | ❌ Belum |
| 3 | hangup | gain | Fase 9 - Reward | ❌ Belum |
| 4 | hangup | getChapterReward | Fase 9 - Reward | ❌ Belum |
| 5 | hangup | nextChapter | Fase 9 - Progress | ❌ Belum |
| 6 | hangup | buyLessonFund | Shop | ❌ Belum |
| 7 | hangup | getLessonFundReward | Shop | ❌ Belum |
| 8 | hangup | saveGuideTeam | Guide | ❌ Belum |

---

#### 【TIPE 5: summon】 - 6 Handler (BELUM SEMUA)

| No | Type | Action | Flow | Status |
|----|------|--------|------|--------|
| 1 | summon | summonOne | Summon - Normal | ❌ Belum |
| 2 | summon | summonOneFree | Summon - Free | ❌ Belum |
| 3 | summon | summonTen | Summon - 10x | ❌ Belum |
| 4 | summon | summonEnergy | Summon - Energy | ❌ Belum |
| 5 | summon | readWishList | Summon - Wishlist | ❌ Belum |
| 6 | summon | setWishList | Summon - Wishlist | ❌ Belum |

---

#### 【TIPE 6: equip】 - 10 Handler (BELUM SEMUA)

| No | Type | Action | Flow | Status |
|----|------|--------|------|--------|
| 1 | equip | wear | Equipment | ❌ Belum |
| 2 | equip | takeOff | Equipment | ❌ Belum |
| 3 | equip | takeOffAuto | Equipment | ❌ Belum |
| 4 | equip | wearAuto | Equipment | ❌ Belum |
| 5 | equip | merge | Equipment | ❌ Belum |
| 6 | equip | autoMerge | Equipment | ❌ Belum |
| 7 | equip | activeRing | Equipment | ❌ Belum |
| 8 | equip | activeWeapon | Equipment | ❌ Belum |
| 9 | equip | autoRingLevelUp | Equipment | ❌ Belum |
| 10 | equip | ringEvolve | Equipment | ❌ Belum |

---

#### 【TIPE 7: shop】 - 4 Handler (BELUM SEMUA)

| No | Type | Action | Flow | Status |
|----|------|--------|------|--------|
| 1 | shop | getInfo | Shop | ❌ Belum |
| 2 | shop | buy | Shop | ❌ Belum |
| 3 | shop | refresh | Shop | ❌ Belum |
| 4 | shop | readNew | Shop | ❌ Belum |

---

#### 【TIPE 8: backpack】 - 5 Handler (BELUM SEMUA)

| No | Type | Action | Flow | Status |
|----|------|--------|------|--------|
| 1 | backpack | useItem | Inventory | ❌ Belum |
| 2 | backpack | sell | Inventory | ❌ Belum |
| 3 | backpack | openBox | Inventory | ❌ Belum |
| 4 | backpack | plus | Inventory | ❌ Belum |
| 5 | backpack | randSummons | Inventory | ❌ Belum |

---

#### 【TIPE 9: gift】 - 12 Handler (BELUM SEMUA)

| No | Type | Action | Flow | Status |
|----|------|--------|------|--------|
| 1 | gift | getOnlineGift | Welfare | ❌ Belum |
| 2 | gift | getLevelReward | Welfare | ❌ Belum |
| 3 | gift | getFrisetRechargeReward | Welfare | ❌ Belum |
| 4 | gift | getVipReward | Welfare | ❌ Belum |
| 5 | gift | getRewardInfo | Welfare | ❌ Belum |
| 6 | gift | buyFund | Welfare | ❌ Belum |
| 7 | gift | buyGold | Shop | ❌ Belum |
| 8 | gift | buyVipGift | Shop | ❌ Belum |
| 9 | gift | getChannelWeeklyRewrd | Welfare | ❌ Belum |
| 10 | gift | useActiveCode | Welfare | ❌ Belum |
| 11 | gift | bsAddToHomeReward | Welfare | ❌ Belum |
| 12 | gift | clickHonghuUrl | Welfare | ❌ Belum |

---

#### 【TIPE 10: arena】 - 10 Handler (BELUM SEMUA)

| No | Type | Action | Flow | Status |
|----|------|--------|------|--------|
| 1 | arena | join | Arena | ❌ Belum |
| 2 | arena | select | Arena | ❌ Belum |
| 3 | arena | setTeam | Arena | ❌ Belum |
| 4 | arena | startBattle | Arena | ❌ Belum |
| 5 | arena | getRank | Arena | ❌ Belum |
| 6 | arena | getRecord | Arena | ❌ Belum |
| 7 | arena | getBattleRecord | Arena | ❌ Belum |
| 8 | arena | getDailyReward | Arena | ❌ Belum |
| 9 | arena | buy | Arena | ❌ Belum |
| 10 | arena | topAward | Arena | ❌ Belum |

---

#### 【TIPE 11: guild】 - 34 Handler (BELUM SEMUA)

| No | Type | Action | Flow | Status |
|----|------|--------|------|--------|
| 1 | guild | createGuild | Guild | ❌ Belum |
| 2 | guild | getGuildList | Guild | ❌ Belum |
| 3 | guild | getGuildByIdOrName | Guild | ❌ Belum |
| 4 | guild | getGuildDetail | Guild | ❌ Belum |
| 5 | guild | getMembers | Guild | ❌ Belum |
| 6 | guild | getRequestMembers | Guild | ❌ Belum |
| 7 | guild | requestGuild | Guild | ❌ Belum |
| 8 | guild | handleRequest | Guild | ❌ Belum |
| 9 | guild | quitGuild | Guild | ❌ Belum |
| 10 | guild | kickOut | Guild | ❌ Belum |
| 11 | guild | changeGuildName | Guild | ❌ Belum |
| 12 | guild | updateGuildIcon | Guild | ❌ Belum |
| 13 | guild | updateBulletin | Guild | ❌ Belum |
| 14 | guild | readBulletin | Guild | ❌ Belum |
| 15 | guild | updateDes | Guild | ❌ Belum |
| 16 | guild | updateRequestCondition | Guild | ❌ Belum |
| 17 | guild | appointmentViceCaptain | Guild | ❌ Belum |
| 18 | guild | relieveViceCaptain | Guild | ❌ Belum |
| 19 | guild | transferCaptain | Guild | ❌ Belum |
| 20 | guild | impeachCaptain | Guild | ❌ Belum |
| 21 | guild | guildSign | Guild | ❌ Belum |
| 22 | guild | upgradeTech | Guild | ❌ Belum |
| 23 | guild | resetTech | Guild | ❌ Belum |
| 24 | guild | getGuildBossInfo | Guild Boss | ❌ Belum |
| 25 | guild | startBoss | Guild Boss | ❌ Belum |
| 26 | guild | checkBossResult | Guild Boss | ❌ Belum |
| 27 | guild | buyBossTimes | Guild Boss | ❌ Belum |
| 28 | guild | getTreasureInfo | Guild Treasure | ❌ Belum |
| 29 | guild | getTreasurePoint | Guild Treasure | ❌ Belum |
| 30 | guild | treasureStartBattle | Guild Treasure | ❌ Belum |
| 31 | guild | updateTreasureDefenceTeam | Guild Treasure | ❌ Belum |
| 32 | guild | getSatanGift | Guild | ❌ Belum |
| 33 | guild | getGuildLog | Guild | ❌ Belum |
| 34 | guild | checkPropaganda | Guild | ❌ Belum |

---

#### 【TIPE 12: friend】 - 16 Handler (BELUM SEMUA)

| No | Type | Action | Flow | Status |
|----|------|--------|------|--------|
| 1 | friend | getFriends | Friend | ❌ Belum |
| 2 | friend | applyFriend | Friend | ❌ Belum |
| 3 | friend | getApplyList | Friend | ❌ Belum |
| 4 | friend | handleApply | Friend | ❌ Belum |
| 5 | friend | delFriend | Friend | ❌ Belum |
| 6 | friend | findUserBrief | Friend | ❌ Belum |
| 7 | friend | recommendFriend | Friend | ❌ Belum |
| 8 | friend | giveHeart | Friend | ❌ Belum |
| 9 | friend | getHeart | Friend | ❌ Belum |
| 10 | friend | autoGiveGetHeart | Friend | ❌ Belum |
| 11 | friend | addToBlacklist | Friend | ❌ Belum |
| 12 | friend | removeBalcklist | Friend | ❌ Belum |
| 13 | friend | friendBattle | Friend | ❌ Belum |
| 14 | friend | recommendBattleFriend | Friend | ❌ Belum |
| 15 | friend | getFriendArenaDefenceTeam | Friend | ❌ Belum |
| 16 | friend | friendServerAction | Friend | ❌ Belum |

---

#### 【TIPE 13: mail】 - 6 Handler (BELUM SEMUA)

| No | Type | Action | Flow | Status |
|----|------|--------|------|--------|
| 1 | mail | getMailList | Mail | ❌ Belum |
| 2 | mail | readMail | Mail | ❌ Belum |
| 3 | mail | getReward | Mail | ❌ Belum |
| 4 | mail | getAllReward | Mail | ❌ Belum |
| 5 | mail | delMail | Mail | ❌ Belum |
| 6 | mail | autoDelMail | Mail | ❌ Belum |

---

#### 【TIPE 14: userMsg】 - 5 Handler (1 sudah, 4 belum)

| No | Type | Action | Flow | Status |
|----|------|--------|------|--------|
| 1 | userMsg | getMsgList | Fase 5 - Init | ✅ Done |
| 2 | userMsg | getMsg | Chat | ❌ Belum |
| 3 | userMsg | sendMsg | Chat | ❌ Belum |
| 4 | userMsg | readMsg | Chat | ❌ Belum |
| 5 | userMsg | delFriendMsg | Chat | ❌ Belum |

---

#### 【TIPE 15: chat】 - 5 Handler (BELUM SEMUA)

| No | Type | Action | Flow | Status |
|----|------|--------|------|--------|
| 1 | chat | login | Chat Server | ❌ Belum |
| 2 | chat | joinRoom | Chat Server | ❌ Belum |
| 3 | chat | leaveRoom | Chat Server | ❌ Belum |
| 4 | chat | sendMsg | Chat Server | ❌ Belum |
| 5 | chat | getRecord | Chat Server | ❌ Belum |

---

#### 【TIPE 16: dungeon】 - 4 Handler (BELUM SEMUA)

| No | Type | Action | Flow | Status |
|----|------|--------|------|--------|
| 1 | dungeon | startBattle | Dungeon | ❌ Belum |
| 2 | dungeon | checkBattleResult | Dungeon | ❌ Belum |
| 3 | dungeon | sweep | Dungeon | ❌ Belum |
| 4 | dungeon | buyCount | Dungeon | ❌ Belum |

---

#### 【TIPE 17: tower】 - 11 Handler (BELUM SEMUA)

| No | Type | Action | Flow | Status |
|----|------|--------|------|--------|
| 1 | tower | openKarin | Tower | ❌ Belum |
| 2 | tower | climb | Tower | ❌ Belum |
| 3 | tower | startBattle | Tower | ❌ Belum |
| 4 | tower | openBox | Tower | ❌ Belum |
| 5 | tower | getFeetInfo | Tower | ❌ Belum |
| 6 | tower | getAllRank | Tower | ❌ Belum |
| 7 | tower | getLocalRank | Tower | ❌ Belum |
| 8 | tower | buyBattleTimes | Tower | ❌ Belum |
| 9 | tower | buyClimbTimes | Tower | ❌ Belum |
| 10 | tower | openTimesEvent | Tower | ❌ Belum |
| 11 | tower | autoGetEventsReward | Tower | ❌ Belum |

---

#### 【TIPE 18: expedition】 - 12 Handler (BELUM SEMUA)

| No | Type | Action | Flow | Status |
|----|------|--------|------|--------|
| 1 | expedition | clickExpedition | Expedition | ❌ Belum |
| 2 | expedition | investigation | Expedition | ❌ Belum |
| 3 | expedition | startEvent | Expedition | ❌ Belum |
| 4 | expedition | finishEvent | Expedition | ❌ Belum |
| 5 | expedition | quickFinishEvent | Expedition | ❌ Belum |
| 6 | expedition | startBattle | Expedition | ❌ Belum |
| 7 | expedition | checkBattleResult | Expedition | ❌ Belum |
| 8 | expedition | collection | Expedition | ❌ Belum |
| 9 | expedition | saveTeam | Expedition | ❌ Belum |
| 10 | expedition | delTeam | Expedition | ❌ Belum |
| 11 | expedition | putInMachine | Expedition | ❌ Belum |
| 12 | expedition | takeOutMachine | Expedition | ❌ Belum |

---

#### 【TIPE 19: trial】 - 7 Handler (BELUM SEMUA)

| No | Type | Action | Flow | Status |
|----|------|--------|------|--------|
| 1 | trial | getState | Trial | ❌ Belum |
| 2 | trial | startBattle | Trial | ❌ Belum |
| 3 | trial | checkBattleResult | Trial | ❌ Belum |
| 4 | trial | getDailyReward | Trial | ❌ Belum |
| 5 | trial | buyFund | Trial | ❌ Belum |
| 6 | trial | getFundReward | Trial | ❌ Belum |
| 7 | trial | vipBuy | Trial | ❌ Belum |

---

#### 【TIPE 20: timeTrial】 - 6 Handler (BELUM SEMUA)

| No | Type | Action | Flow | Status |
|----|------|--------|------|--------|
| 1 | timeTrial | startBattle | Time Trial | ❌ Belum |
| 2 | timeTrial | checkBattleResult | Time Trial | ❌ Belum |
| 3 | timeTrial | getPassRank | Time Trial | ❌ Belum |
| 4 | timeTrial | getStarReward | Time Trial | ❌ Belum |
| 5 | timeTrial | getTimeTrialHeroPower | Time Trial | ❌ Belum |
| 6 | timeTrial | buyTimes | Time Trial | ❌ Belum |

---

#### 【TIPE 21: topBattle】 - 18 Handler (BELUM SEMUA)

| No | Type | Action | Flow | Status |
|----|------|--------|------|--------|
| 1 | topBattle | setTeam | Top Battle | ❌ Belum |
| 2 | topBattle | queryRank | Top Battle | ❌ Belum |
| 3 | topBattle | queryHistory | Top Battle | ❌ Belum |
| 4 | topBattle | queryHistoryList | Top Battle | ❌ Belum |
| 5 | topBattle | queryUserHistory | Top Battle | ❌ Belum |
| 6 | topBattle | getTeamInfo | Top Battle | ❌ Belum |
| 7 | topBattle | queryBackupTeam | Top Battle | ❌ Belum |
| 8 | topBattle | queryBackupTeamEquip | Top Battle | ❌ Belum |
| 9 | topBattle | startSeason | Top Battle | ❌ Belum |
| 10 | topBattle | tryMatch | Top Battle | ❌ Belum |
| 11 | topBattle | startBattle | Top Battle | ❌ Belum |
| 12 | topBattle | getBattleRecord | Top Battle | ❌ Belum |
| 13 | topBattle | getTopBattleRecord | Top Battle | ❌ Belum |
| 14 | topBattle | like | Top Battle | ❌ Belum |
| 15 | topBattle | bet | Top Battle | ❌ Belum |
| 16 | topBattle | getBetReward | Top Battle | ❌ Belum |
| 17 | topBattle | getRankReward | Top Battle | ❌ Belum |
| 18 | topBattle | buyTimes | Top Battle | ❌ Belum |

---

#### 【TIPE 22: war】 - 12 Handler (BELUM SEMUA)

| No | Type | Action | Flow | Status |
|----|------|--------|------|--------|
| 1 | war | signUp | War | ❌ Belum |
| 2 | war | getSignUpInfo | War | ❌ Belum |
| 3 | war | getTeamInfo | War | ❌ Belum |
| 4 | war | getUserTeam | War | ❌ Belum |
| 5 | war | getAuditionInfo | War | ❌ Belum |
| 6 | war | getAuditionRank | War | ❌ Belum |
| 7 | war | getAuditionReward | War | ❌ Belum |
| 8 | war | getChampionRank | War | ❌ Belum |
| 9 | war | getBattleRecord | War | ❌ Belum |
| 10 | war | like | War | ❌ Belum |
| 11 | war | bet | War | ❌ Belum |
| 12 | war | getBetReward | War | ❌ Belum |

---

#### 【TIPE 23: ballWar】 - 14 Handler (BELUM SEMUA)

| No | Type | Action | Flow | Status |
|----|------|--------|------|--------|
| 1 | ballWar | signUpBallWar | Ball War | ❌ Belum |
| 2 | ballWar | getBriefInfo | Ball War | ❌ Belum |
| 3 | ballWar | getAreaInfo | Ball War | ❌ Belum |
| 4 | ballWar | getFinishInfo | Ball War | ❌ Belum |
| 5 | ballWar | getFlagOwnerInfo | Ball War | ❌ Belum |
| 6 | ballWar | getPointRank | Ball War | ❌ Belum |
| 7 | ballWar | getGuildMemberHonours | Ball War | ❌ Belum |
| 8 | ballWar | setDefence | Ball War | ❌ Belum |
| 9 | ballWar | removeDefence | Ball War | ❌ Belum |
| 10 | ballWar | checkHaveDefence | Ball War | ❌ Belum |
| 11 | ballWar | startBattle | Ball War | ❌ Belum |
| 12 | ballWar | getRecord | Ball War | ❌ Belum |
| 13 | ballWar | setTopMsg | Ball War | ❌ Belum |
| 14 | ballWar | buyTimes | Ball War | ❌ Belum |

---

#### 【TIPE 24: task】 - 2 Handler (BELUM SEMUA)

| No | Type | Action | Flow | Status |
|----|------|--------|------|--------|
| 1 | task | queryTask | Task | ❌ Belum |
| 2 | task | getReward | Task | ❌ Belum |

---

#### 【TIPE 25: rank】 - 2 Handler (BELUM SEMUA)

| No | Type | Action | Flow | Status |
|----|------|--------|------|--------|
| 1 | rank | getRank | Rank | ❌ Belum |
| 2 | rank | like | Rank | ❌ Belum |

---

#### 【TIPE 26: imprint】 - 10 Handler (BELUM SEMUA)

| No | Type | Action | Flow | Status |
|----|------|--------|------|--------|
| 1 | imprint | queryImprint | Imprint | ❌ Belum |
| 2 | imprint | wear | Imprint | ❌ Belum |
| 3 | imprint | takeOff | Imprint | ❌ Belum |
| 4 | imprint | autoWear | Imprint | ❌ Belum |
| 5 | imprint | autoTakeOff | Imprint | ❌ Belum |
| 6 | imprint | merge | Imprint | ❌ Belum |
| 7 | imprint | starUp | Imprint | ❌ Belum |
| 8 | imprint | decompose | Imprint | ❌ Belum |
| 9 | imprint | reborn | Imprint | ❌ Belum |
| 10 | imprint | addAttr | Imprint | ❌ Belum |

---

#### 【TIPE 27: superSkill】 - 5 Handler (BELUM SEMUA)

| No | Type | Action | Flow | Status |
|----|------|--------|------|--------|
| 1 | superSkill | activeSuperSkill | Super Skill | ❌ Belum |
| 2 | superSkill | levelUpSuperSkill | Super Skill | ❌ Belum |
| 3 | superSkill | autoLevelUpSuperSkill | Super Skill | ❌ Belum |
| 4 | superSkill | evolveSuperSkill | Super Skill | ❌ Belum |
| 5 | superSkill | resetSuperSkill | Super Skill | ❌ Belum |

---

#### 【TIPE 28: resonance】 - 5 Handler (BELUM SEMUA)

| No | Type | Action | Flow | Status |
|----|------|--------|------|--------|
| 1 | resonance | setMainHero | Resonance | ❌ Belum |
| 2 | resonance | putChild | Resonance | ❌ Belum |
| 3 | resonance | removeChild | Resonance | ❌ Belum |
| 4 | resonance | buySeat | Resonance | ❌ Belum |
| 5 | resonance | clearSeatCD | Resonance | ❌ Belum |

---

#### 【TIPE 29: gemstone】 - 4 Handler (BELUM SEMUA)

| No | Type | Action | Flow | Status |
|----|------|--------|------|--------|
| 1 | gemstone | wear | Gemstone | ❌ Belum |
| 2 | gemstone | takeOff | Gemstone | ❌ Belum |
| 3 | gemstone | levelUp | Gemstone | ❌ Belum |
| 4 | gemstone | appraisal | Gemstone | ❌ Belum |

---

#### 【TIPE 30: weapon】 - 7 Handler (BELUM SEMUA)

| No | Type | Action | Flow | Status |
|----|------|--------|------|--------|
| 1 | weapon | wear | Weapon | ❌ Belum |
| 2 | weapon | takeOff | Weapon | ❌ Belum |
| 3 | weapon | upgrade | Weapon | ❌ Belum |
| 4 | weapon | merge | Weapon | ❌ Belum |
| 5 | weapon | resolve | Weapon | ❌ Belum |
| 6 | weapon | reborn | Weapon | ❌ Belum |
| 7 | weapon | levelUpHalo | Weapon | ❌ Belum |

---

#### 【TIPE 31: dragon】 - 3 Handler (BELUM SEMUA)

| No | Type | Action | Flow | Status |
|----|------|--------|------|--------|
| 1 | dragon | equip | Dragon | ❌ Belum |
| 2 | dragon | wish | Dragon | ❌ Belum |
| 3 | dragon | handleExchangeResult | Dragon | ❌ Belum |

---

#### 【TIPE 32: genki】 - 4 Handler (BELUM SEMUA)

| No | Type | Action | Flow | Status |
|----|------|--------|------|--------|
| 1 | genki | queryGenki | Genki | ❌ Belum |
| 2 | genki | wear | Genki | ❌ Belum |
| 3 | genki | takeOff | Genki | ❌ Belum |
| 4 | genki | smelt | Genki | ❌ Belum |

---

#### 【TIPE 33: training】 - 7 Handler (BELUM SEMUA)

| No | Type | Action | Flow | Status |
|----|------|--------|------|--------|
| 1 | training | startBattle | Training | ❌ Belum |
| 2 | training | checkBattleResult | Training | ❌ Belum |
| 3 | training | move | Training | ❌ Belum |
| 4 | training | answer | Training | ❌ Belum |
| 5 | training | runAway | Training | ❌ Belum |
| 6 | training | getLog | Training | ❌ Belum |
| 7 | training | buyTimes | Training | ❌ Belum |

---

#### 【TIPE 34: teamTraining】 - 4 Handler (BELUM SEMUA)

| No | Type | Action | Flow | Status |
|----|------|--------|------|--------|
| 1 | teamTraining | unlock | Team Training | ❌ Belum |
| 2 | teamTraining | training | Team Training | ❌ Belum |
| 3 | teamTraining | autoTraining | Team Training | ❌ Belum |
| 4 | teamTraining | reborn | Team Training | ❌ Belum |

---

#### 【TIPE 35: timeMachine】 - 4 Handler (BELUM SEMUA)

| No | Type | Action | Flow | Status |
|----|------|--------|------|--------|
| 1 | timeMachine | start | Time Machine | ❌ Belum |
| 2 | timeMachine | startBoss | Time Machine | ❌ Belum |
| 3 | timeMachine | checkBattleResult | Time Machine | ❌ Belum |
| 4 | timeMachine | getReward | Time Machine | ❌ Belum |

---

#### 【TIPE 36: entrust】 - 11 Handler (BELUM SEMUA)

| No | Type | Action | Flow | Status |
|----|------|--------|------|--------|
| 1 | entrust | getInfo | Entrust | ❌ Belum |
| 2 | entrust | startEntrust | Entrust | ❌ Belum |
| 3 | entrust | getReward | Entrust | ❌ Belum |
| 4 | entrust | finishNow | Entrust | ❌ Belum |
| 5 | entrust | refreshCurrent | Entrust | ❌ Belum |
| 6 | entrust | reset | Entrust | ❌ Belum |
| 7 | entrust | getFriendHeros | Entrust | ❌ Belum |
| 8 | entrust | setHelpFriendHero | Entrust | ❌ Belum |
| 9 | entrust | getHelpRewardInfo | Entrust | ❌ Belum |
| 10 | entrust | getHelpReward | Entrust | ❌ Belum |
| 11 | entrust | userEntrustBook | Entrust | ❌ Belum |

---

#### 【TIPE 37: mine】 - 7 Handler (BELUM SEMUA)

| No | Type | Action | Flow | Status |
|----|------|--------|------|--------|
| 1 | mine | getInfo | Mine | ❌ Belum |
| 2 | mine | move | Mine | ❌ Belum |
| 3 | mine | startBattle | Mine | ❌ Belum |
| 4 | mine | getChest | Mine | ❌ Belum |
| 5 | mine | openAll | Mine | ❌ Belum |
| 6 | mine | resetCurLevel | Mine | ❌ Belum |
| 7 | mine | buyStep | Mine | ❌ Belum |

---

#### 【TIPE 38: snake】 - 8 Handler (BELUM SEMUA)

| No | Type | Action | Flow | Status |
|----|------|--------|------|--------|
| 1 | snake | getSnakeInfo | Snake | ❌ Belum |
| 2 | snake | getEnemyInfo | Snake | ❌ Belum |
| 3 | snake | startBattle | Snake | ❌ Belum |
| 4 | snake | sweep | Snake | ❌ Belum |
| 5 | snake | awardBox | Snake | ❌ Belum |
| 6 | snake | getAllBoxReward | Snake | ❌ Belum |
| 7 | snake | recoverHero | Snake | ❌ Belum |
| 8 | snake | reset | Snake | ❌ Belum |

---

#### 【TIPE 39: cellGame】 - 8 Handler (BELUM SEMUA)

| No | Type | Action | Flow | Status |
|----|------|--------|------|--------|
| 1 | cellGame | getInfo | Cell Game | ❌ Belum |
| 2 | cellGame | setTeam | Cell Game | ❌ Belum |
| 3 | cellGame | startBattle | Cell Game | ❌ Belum |
| 4 | cellGame | checkBattleResult | Cell Game | ❌ Belum |
| 5 | cellGame | recoverHero | Cell Game | ❌ Belum |
| 6 | cellGame | getChest | Cell Game | ❌ Belum |
| 7 | cellGame | reset | Cell Game | ❌ Belum |
| 8 | cellGame | resetCellGame | Cell Game | ❌ Belum |

---

#### 【TIPE 40: strongEnemy】 - 5 Handler (BELUM SEMUA)

| No | Type | Action | Flow | Status |
|----|------|--------|------|--------|
| 1 | strongEnemy | getInfo | Strong Enemy | ❌ Belum |
| 2 | strongEnemy | startBattle | Strong Enemy | ❌ Belum |
| 3 | strongEnemy | checkBattleResult | Strong Enemy | ❌ Belum |
| 4 | strongEnemy | getRankInfo | Strong Enemy | ❌ Belum |
| 5 | strongEnemy | buyTimes | Strong Enemy | ❌ Belum |

---

#### 【TIPE 41: maha】 - 6 Handler (BELUM SEMUA)

| No | Type | Action | Flow | Status |
|----|------|--------|------|--------|
| 1 | maha | join | Maha | ❌ Belum |
| 2 | maha | getFriend | Maha | ❌ Belum |
| 3 | maha | startBattle | Maha | ❌ Belum |
| 4 | maha | friendBattle | Maha | ❌ Belum |
| 5 | maha | risk | Maha | ❌ Belum |
| 6 | maha | buyTimes | Maha | ❌ Belum |

---

#### 【TIPE 42: bossCompetition】 - 6 Handler (BELUM SEMUA)

| No | Type | Action | Flow | Status |
|----|------|--------|------|--------|
| 1 | bossCompetition | getBossList | Boss Competition | ❌ Belum |
| 2 | bossCompetition | getDetail | Boss Competition | ❌ Belum |
| 3 | bossCompetition | attackBoss | Boss Competition | ❌ Belum |
| 4 | bossCompetition | attackOwner | Boss Competition | ❌ Belum |
| 5 | bossCompetition | autoFight | Boss Competition | ❌ Belum |
| 6 | bossCompetition | buyTimes | Boss Competition | ❌ Belum |

---

#### 【TIPE 43: battleMedal】 - 7 Handler (BELUM SEMUA)

| No | Type | Action | Flow | Status |
|----|------|--------|------|--------|
| 1 | battleMedal | shop | Battle Medal | ❌ Belum |
| 2 | battleMedal | buyLevel | Battle Medal | ❌ Belum |
| 3 | battleMedal | buySuper | Battle Medal | ❌ Belum |
| 4 | battleMedal | getLevelReward | Battle Medal | ❌ Belum |
| 5 | battleMedal | getAllLevelReward | Battle Medal | ❌ Belum |
| 6 | battleMedal | taskReward | Battle Medal | ❌ Belum |
| 7 | battleMedal | getAllTaskReward | Battle Medal | ❌ Belum |

---

#### 【TIPE 44: gravity】 - 3 Handler (BELUM SEMUA)

| No | Type | Action | Flow | Status |
|----|------|--------|------|--------|
| 1 | gravity | startBattle | Gravity | ❌ Belum |
| 2 | gravity | checkBattleResult | Gravity | ❌ Belum |
| 3 | gravity | buyTimes | Gravity | ❌ Belum |

---

#### 【TIPE 45: littleGame】 - 3 Handler (BELUM SEMUA)

| No | Type | Action | Flow | Status |
|----|------|--------|------|--------|
| 1 | littleGame | click | Little Game | ❌ Belum |
| 2 | littleGame | getBattleReward | Little Game | ❌ Belum |
| 3 | littleGame | getChapterReward | Little Game | ❌ Belum |

---

#### 【TIPE 46: teamDungeonGame】 - 19 Handler (BELUM SEMUA)

| No | Type | Action | Flow | Status |
|----|------|--------|------|--------|
| 1 | teamDungeonGame | createTeam | Team Dungeon | ❌ Belum |
| 2 | teamDungeonGame | queryTeam | Team Dungeon | ❌ Belum |
| 3 | teamDungeonGame | queryTeamById | Team Dungeon | ❌ Belum |
| 4 | teamDungeonGame | queryTeamByDisplayId | Team Dungeon | ❌ Belum |
| 5 | teamDungeonGame | queryTeamMembers | Team Dungeon | ❌ Belum |
| 6 | teamDungeonGame | queryTeamsMember | Team Dungeon | ❌ Belum |
| 7 | teamDungeonGame | queryUserTeam | Team Dungeon | ❌ Belum |
| 8 | teamDungeonGame | queryMyApplyList | Team Dungeon | ❌ Belum |
| 9 | teamDungeonGame | queryMyRecord | Team Dungeon | ❌ Belum |
| 10 | teamDungeonGame | queryKillRank | Team Dungeon | ❌ Belum |
| 11 | teamDungeonGame | apply | Team Dungeon | ❌ Belum |
| 12 | teamDungeonGame | autoApply | Team Dungeon | ❌ Belum |
| 13 | teamDungeonGame | addRobot | Team Dungeon | ❌ Belum |
| 14 | teamDungeonGame | quitTeam | Team Dungeon | ❌ Belum |
| 15 | teamDungeonGame | setTeamDungeonTeam | Team Dungeon | ❌ Belum |
| 16 | teamDungeonGame | getReward | Team Dungeon | ❌ Belum |
| 17 | teamDungeonGame | getAllReward | Team Dungeon | ❌ Belum |
| 18 | teamDungeonGame | getAchReward | Team Dungeon | ❌ Belum |
| 19 | teamDungeonGame | getDailyTaskReward | Team Dungeon | ❌ Belum |

---

#### 【TIPE 47: teamDungeonTeam】 - 12 Handler (BELUM SEMUA)

| No | Type | Action | Flow | Status |
|----|------|--------|------|--------|
| 1 | teamDungeonTeam | clientConnect | Team Dungeon | ❌ Belum |
| 2 | teamDungeonTeam | queryUserTeam | Team Dungeon | ❌ Belum |
| 3 | teamDungeonTeam | queryRobot | Team Dungeon | ❌ Belum |
| 4 | teamDungeonTeam | queryTodayMap | Team Dungeon | ❌ Belum |
| 5 | teamDungeonTeam | queryHistoryMap | Team Dungeon | ❌ Belum |
| 6 | teamDungeonTeam | queryBattleRecord | Team Dungeon | ❌ Belum |
| 7 | teamDungeonTeam | queryTeamRecord | Team Dungeon | ❌ Belum |
| 8 | teamDungeonTeam | refreshApplyList | Team Dungeon | ❌ Belum |
| 9 | teamDungeonTeam | agree | Team Dungeon | ❌ Belum |
| 10 | teamDungeonTeam | changePos | Team Dungeon | ❌ Belum |
| 11 | teamDungeonTeam | changeAutoJoinCondition | Team Dungeon | ❌ Belum |
| 12 | teamDungeonTeam | startBattle | Team Dungeon | ❌ Belum |

---

#### 【TIPE 48: activity】 - 103 Handler (BELUM SEMUA)

| No | Type | Action | Flow | Status |
|----|------|--------|------|--------|
| 1 | activity | getActivityBrief | Activity | ❌ Belum |
| 2 | activity | getActivityDetail | Activity | ❌ Belum |
| 3 | activity | getLoginActivityReward | Activity | ❌ Belum |
| 4 | activity | getLoginActivityExReward | Activity | ❌ Belum |
| 5 | activity | getGrowActivityReward | Activity | ❌ Belum |
| 6 | activity | getRank | Activity | ❌ Belum |
| 7 | activity | buyFund | Activity | ❌ Belum |
| 8 | activity | getFundReward | Activity | ❌ Belum |
| 9 | activity | buyNewServerGift | Activity | ❌ Belum |
| 10 | activity | buySuperGift | Activity | ❌ Belum |
| 11 | activity | buyHeroSuperGift | Activity | ❌ Belum |
| 12 | activity | buyDailyDiscount | Activity | ❌ Belum |
| 13 | activity | buyTodayDiscount | Activity | ❌ Belum |
| 14 | activity | beStrongBuyDiscount | Activity | ❌ Belum |
| 15 | activity | beStrongRefreshDiscount | Activity | ❌ Belum |
| 16 | activity | beStrongGiftActReward | Activity | ❌ Belum |
| 17 | activity | beStrongActiveActReward | Activity | ❌ Belum |
| 18 | activity | activityGetTaskReward | Activity | ❌ Belum |
| 19 | activity | heroGiftReward | Activity | ❌ Belum |
| 20 | activity | heroOrangeReward | Activity | ❌ Belum |
| 21 | activity | heroHelpBuy | Activity | ❌ Belum |
| 22 | activity | heroRewardBuyToken | Activity | ❌ Belum |
| 23 | activity | heroRewardGetReward | Activity | ❌ Belum |
| 24 | activity | summonGiftReward | Activity | ❌ Belum |
| 25 | activity | friendBattleActReward | Activity | ❌ Belum |
| 26 | activity | marketActReward | Activity | ❌ Belum |
| 27 | activity | entrustActReward | Activity | ❌ Belum |
| 28 | activity | karinActReward | Activity | ❌ Belum |
| 29 | activity | karinRich | Activity | ❌ Belum |
| 30 | activity | karinRichTask | Activity | ❌ Belum |
| 31 | activity | recharge3DayReward | Activity | ❌ Belum |
| 32 | activity | recharge3DayResign | Activity | ❌ Belum |
| 33 | activity | recharge3FinialReward | Activity | ❌ Belum |
| 34 | activity | recharge7Reward | Activity | ❌ Belum |
| 35 | activity | rechargeDailyReward | Activity | ❌ Belum |
| 36 | activity | rechargeGiftReward | Activity | ❌ Belum |
| 37 | activity | singleRechargeReward | Activity | ❌ Belum |
| 38 | activity | cumulativeRechargeReward | Activity | ❌ Belum |
| 39 | activity | dailyBigGiftReward | Activity | ❌ Belum |
| 40 | activity | costFeedback | Activity | ❌ Belum |
| 41 | activity | shopBuy | Activity | ❌ Belum |
| 42 | activity | diamondShop | Activity | ❌ Belum |
| 43 | activity | bulmaPartyBuyGoods | Activity | ❌ Belum |
| 44 | activity | weaponCastGetReward | Activity | ❌ Belum |
| 45 | activity | weaponCastLottery | Activity | ❌ Belum |
| 46 | activity | luckEquipGetReward | Activity | ❌ Belum |
| 47 | activity | luckEquipGetEquip | Activity | ❌ Belum |
| 48 | activity | luckEquipPushEquip | Activity | ❌ Belum |
| 49 | activity | luckEquipUp | Activity | ❌ Belum |
| 50 | activity | luckyWheelGetReward | Activity | ❌ Belum |
| 51 | activity | luckyWheelLottery | Activity | ❌ Belum |
| 52 | activity | turnTable | Activity | ❌ Belum |
| 53 | activity | turnTableGetReward | Activity | ❌ Belum |
| 54 | activity | whisFeastGetRankReward | Activity | ❌ Belum |
| 55 | activity | whisFeastBlessExchange | Activity | ❌ Belum |
| 56 | activity | whisFeastGivingFood | Activity | ❌ Belum |
| 57 | activity | whisFeastFoodFeedbackReward | Activity | ❌ Belum |
| 58 | activity | lanternBless | Activity | ❌ Belum |
| 59 | activity | getLanternBlessTaskReward | Activity | ❌ Belum |
| 60 | activity | resetLanternBless | Activity | ❌ Belum |
| 61 | activity | lanternBlessClickTip | Activity | ❌ Belum |
| 62 | activity | queryLanternBlessRecord | Activity | ❌ Belum |
| 63 | activity | GAGetTaskReward | Activity | ❌ Belum |
| 64 | activity | GAOpenBox | Activity | ❌ Belum |
| 65 | activity | GARoll | Activity | ❌ Belum |
| 66 | activity | buggyGetTaskReward | Activity | ❌ Belum |
| 67 | activity | buggyTreasureRandom | Activity | ❌ Belum |
| 68 | activity | buggyTreasureNext | Activity | ❌ Belum |
| 69 | activity | imprintUpGetReward | Activity | ❌ Belum |
| 70 | activity | imprintExtraction | Activity | ❌ Belum |
| 71 | activity | imprintUpStudy | Activity | ❌ Belum |
| 72 | activity | refreshImprint | Activity | ❌ Belum |
| 73 | activity | handleRefreshImprintResult | Activity | ❌ Belum |
| 74 | activity | queryImprintTmpPower | Activity | ❌ Belum |
| 75 | activity | newHeroRewardBuyGoods | Activity | ❌ Belum |
| 76 | activity | newHeroRewardPropExchange | Activity | ❌ Belum |
| 77 | activity | newHeroChallenge | Activity | ❌ Belum |
| 78 | activity | newHeroChallengeLike | Activity | ❌ Belum |
| 79 | activity | newHeroChallengeQueryHonorRoll | Activity | ❌ Belum |
| 80 | activity | newHeroChallengeQueryWinRank | Activity | ❌ Belum |
| 81 | activity | mergeBossInfo | Activity | ❌ Belum |
| 82 | activity | mergeBossStartBattle | Activity | ❌ Belum |
| 83 | activity | mergeBossBuyTimes | Activity | ❌ Belum |
| 84 | activity | merchantExchange | Activity | ❌ Belum |
| 85 | activity | attackNienBeast | Activity | ❌ Belum |
| 86 | activity | gleaning | Activity | ❌ Belum |
| 87 | activity | gleaningBuyTicket | Activity | ❌ Belum |
| 88 | activity | goodHarvestsGetReward | Activity | ❌ Belum |
| 89 | activity | equipUp | Activity | ❌ Belum |
| 90 | activity | luxuryLuck | Activity | ❌ Belum |
| 91 | activity | normalLuck | Activity | ❌ Belum |
| 92 | activity | luckFeedbackGetBox | Activity | ❌ Belum |
| 93 | activity | luckFeedbackGetReward | Activity | ❌ Belum |
| 94 | activity | timeLimitPropExchange | Activity | ❌ Belum |
| 95 | activity | timeLimitPropReceive | Activity | ❌ Belum |
| 96 | activity | userCertification | Activity | ❌ Belum |
| 97 | activity | queryCSRank | Activity | ❌ Belum |
| 98 | activity | queryWeaponCastRecord | Activity | ❌ Belum |
| 99 | activity | blindBoxOpen | Activity | ❌ Belum |
| 100 | activity | blindBoxRefresh | Activity | ❌ Belum |
| 101 | activity | blindBoxShowRewards | Activity | ❌ Belum |
| 102 | activity | upsetBlindBox | Activity | ❌ Belum |
| 103 | activity | doubleElevenGetPayReward | Activity | ❌ Belum |

---

#### 【TIPE 49: market】 - 2 Handler (BELUM SEMUA)

| No | Type | Action | Flow | Status |
|----|------|--------|------|--------|
| 1 | market | getInfo | Market | ❌ Belum |
| 2 | vipMarket | getInfo | Market | ❌ Belum |

---

#### 【TIPE 50: monthCard】 - 2 Handler (BELUM SEMUA)

| No | Type | Action | Flow | Status |
|----|------|--------|------|--------|
| 1 | monthCard | buyCard | Month Card | ❌ Belum |
| 2 | monthCard | getReward | Month Card | ❌ Belum |

---

#### 【TIPE 51: retrieve】 - 2 Handler (BELUM SEMUA)

| No | Type | Action | Flow | Status |
|----|------|--------|------|--------|
| 1 | retrieve | hangupReward | Retrieve | ❌ Belum |
| 2 | retrieve | dungeonReward | Retrieve | ❌ Belum |

---

#### 【TIPE 52: timeBonus】 - 2 Handler (BELUM SEMUA)

| No | Type | Action | Flow | Status |
|----|------|--------|------|--------|
| 1 | timeBonus | buyBonus | Time Bonus | ❌ Belum |
| 2 | timeBonus | triggerLackOfGoldBonus | Time Bonus | ❌ Belum |

---

#### 【TIPE 53: downloadReward】 - 2 Handler (BELUM SEMUA)

| No | Type | Action | Flow | Status |
|----|------|--------|------|--------|
| 1 | downloadReward | clickDownload | Download Reward | ❌ Belum |
| 2 | downloadReward | getDownloadReward | Download Reward | ❌ Belum |

---

#### 【TIPE 54: YouTuber】 - 2 Handler (BELUM SEMUA)

| No | Type | Action | Flow | Status |
|----|------|--------|------|--------|
| 1 | YouTuber | joinYouTuberPlan | YouTuber | ❌ Belum |
| 2 | YouTuber | getYouTuberRecruitReward | YouTuber | ❌ Belum |

---

#### 【TIPE 55: Others】 - 5 Handler (BELUM SEMUA)

| No | Type | Action | Flow | Status |
|----|------|--------|------|--------|
| 1 | battle | getRandom | Battle | ❌ Belum |
| 2 | battleRecordCheck | checkBattleRecord | Battle | ❌ Belum |
| 3 | buryPoint | guideBattle | Analytics | ❌ Belum |
| 4 | checkin | checkin | Daily | ❌ Belum |
| 5 | guide | saveGuide | Guide | ❌ Belum |
| 6 | questionnaire | submitQuestionnaire | Questionnaire | ❌ Belum |
| 7 | recharge | recharge | Payment | ❌ Belum |

---

## 8. SINGLETON MANAGER

### 8.1 Daftar Singleton di Game

| Singleton | Deskripsi |
|-----------|-----------|
| `UserInfoSingleton` | Data user utama |
| `HerosManager` | Semua hero milik player |
| `ItemsCommonSingleton` | Inventory & items |
| `OnHookSingleton` | Progress stage/chapter |
| `SummonSingleton` | Data summon |
| `EquipInfoManager` | Equipment |
| `AllRefreshCount` | Daily counter |
| `WelfareInfoManager` | Gifts, rewards |
| `DungeonInfoManager` | Dungeon progress |
| `MailInfoManager` | Mail & messages |
| `BulletinInfoManager` | Announcements |
| `CheckInInfoManager` | Daily check-in |
| `TeamTrainingManager` | Team training |
| `TeamTechnologyManager` | Team tech |
| `BattleSetStartParamSingleton` | Battle setup |
| `LastTeamSingleton` | Last team config |
| `ArenaInfoManager` | Arena data |
| `KarinInfoManager` | Tower/Karin |
| `ExpeditionManager` | Expedition |
| `TimeTrialManager` | Time trial |
| `GlobalWarManager` | Global war |
| `GemstoneManager` | Gemstone system |
| `ResonanceManager` | Resonance |
| `HeroSkinManager` | Hero skins |
| `SuperSkillManager` | Super skills |
| `ImprintManager` | Imprint |
| `GravityManager` | Gravity trial |
| `LittleGameManager` | Mini games |

---

## 9. DEVELOPMENT GUIDE

### 9.1 Cara Membuat Handler Baru

1. **Buat file baru** di `server/main-server/` dengan format:
   ```javascript
   (function(window) {
       'use strict';
       
       var LOG = window.MAIN_SERVER_LOG;
       
       function handleXxx(request, playerData) {
           LOG.info('Handler: type.action');
           // Process request
           // Update playerData
           // Save to localStorage
           return { /* response */ };
       }
       
       window.MAIN_SERVER_HANDLERS = window.MAIN_SERVER_HANDLERS || {};
       window.MAIN_SERVER_HANDLERS['type.action'] = handleXxx;
       
   })(window);
   ```

2. **Tambahkan script** ke `manifest.json`

### 9.2 Storage Keys

| Key | Deskripsi |
|-----|-----------|
| `dragonball_local_sdk` | User SDK data |
| `dragonball_player_data_{userId}` | Complete player data |

### 9.3 Debug Commands

```javascript
LOCAL_SDK.showConfig()
LOGIN_SERVER_MOCK.showConfig()
MAIN_SERVER_MOCK.showConfig()
MAIN_SERVER_MOCK.getPlayerData('userId')
BRIDGE_DEBUG.logState()
```

---

## 10. RINGKASAN

### Total Handler

| Server | Total Handler | Sudah Dibuat | Belum Dibuat |
|--------|---------------|--------------|--------------|
| Login Server | 6 | 6 | 0 |
| Main Server | **524** | **5** | **519** |
| Chat Server | TBD | 0 | TBD |
| Dungeon Server | TBD | 0 | TBD |
| **TOTAL** | **524+** | **11** | **519+** |

### Handler per Kategori (Main Server)

| Kategori | Jumlah |
|----------|--------|
| activity | 103 |
| guild | 34 |
| hero | 20 |
| teamDungeonGame | 19 |
| topBattle | 18 |
| friend | 16 |
| ballWar | 14 |
| user | 13 |
| war | 12 |
| teamDungeonTeam | 12 |
| gift | 12 |
| expedition | 12 |
| tower | 11 |
| entrust | 11 |
| imprint | 10 |
| equip | 10 |
| arena | 10 |
| snake | 8 |
| hangup | 8 |
| cellGame | 8 |
| weapon | 7 |
| trial | 7 |
| training | 7 |
| mine | 7 |
| battleMedal | 7 |
| timeTrial | 6 |
| summon | 6 |
| mail | 6 |
| maha | 6 |
| heroImage | 6 |
| bossCompetition | 6 |
| userMsg | 5 |
| superSkill | 5 |
| strongEnemy | 5 |
| resonance | 5 |
| chat | 5 |
| backpack | 5 |
| timeMachine | 4 |
| teamTraining | 4 |
| shop | 4 |
| genki | 4 |
| gemstone | 4 |
| dungeon | 4 |
| littleGame | 3 |
| gravity | 3 |
| dragon | 3 |
| Others | 12 |

---

*Dokumentasi ini berisi semua 524 handler yang ditemukan dari analisis source code game.*
*Semua handler WAJIB dibuat untuk game bisa berjalan lengkap.*
