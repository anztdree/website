## 🎯 MASALAH UTAMA

Game "超级战士Z" tidak bisa berjalan karena:
- ✅ Login Server (port 9999) - SUDAH ADA (mock via `server/login-server.js`)
- ❌ Main Server (port 9998) - **BELUM ADA**

---

## 📁 STRUKTUR LOAD DARI MANIFEST.JSON

```
manifest.json Load Order:
│
├── INITIAL (Core Engine) - Load Pertama
│   ├── js/egret.min_d9413192.js          ← Egret Engine Core
│   ├── js/egret.web.min_b66ab113.js      ← Web Platform
│   ├── sdk/bridge.js                      ← ⭐ SDK Bridge (intercepts)
│   ├── js/game.min_16249d0f.js           ← Game Core
│   ├── js/tween.min_6c5a88f9.js          ← Animation
│   ├── js/assetsmanager.min_2ef412b7.js  ← Asset Loader
│   ├── js/eui.min_493403ce.js            ← UI Components
│   └── js/dragonBones.min_6252b9c4.js    ← Skeletal Animation
│
└── GAME (Game Logic) - Load Kedua
    ├── js/md5.min_97e969ef.js             ← MD5 Hash
    ├── js/lz-string.min_896bee8b.js       ← Compression
    ├── js/socket.io.min_57ea9db7.js       ← ⭐ Socket.IO Client
    ├── server/login-server.js             ← ⭐ Mock Login Server (port 9999)
    ├── js/blockmessage.min_7dc7bcec.js    ← Message Handler
    ├── js/battlelogic.min_d446437e.js     ← Battle System
    ├── js/ThinkingAnalyticsSDK.min_72d3fad5.js ← Analytics
    ├── js/default.thm_4d02a3c6.js         ← Theme
    └── js/main.min_777039fc.js            ← ⭐ Main Game Code (434 actions)
```

---

## 🔄 FLOW KOMUNIKASI GAME

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FLOW KOMUNIKASI GAME                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. GAME START                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────────────┐  │
│  │ index.html   │───▶│ manifest.json│───▶│ Load JS (initial → game)    │  │
│  └──────────────┘    └──────────────┘    └──────────────────────────────┘  │
│                                                     │                       │
│                                                     ▼                       │
│  2. SDK INIT                                                                │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────────────┐  │
│  │ sdk/sdk.js   │───▶│ LOCAL_SDK    │───▶│ Buat userId, token, config  │  │
│  │ (load awal)  │    │ (window)     │    │ loginServer: 127.0.0.1:9999 │  │
│  └──────────────┘    └──────────────┘    └──────────────────────────────┘  │
│                                                     │                       │
│                                                     ▼                       │
│  3. BRIDGE INIT                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────────────┐  │
│  │ sdk/bridge.js│───▶│ Override     │───▶│ startGame → kasih data SDK  │  │
│  │ (setelah     │    │ egret.       │    │ ke game via callback        │  │
│  │ egret.web)   │    │ ExternalInterface                             │  │
│  └──────────────┘    └──────────────┘    └──────────────────────────────┘  │
│                                                     │                       │
│                                                     ▼                       │
│  4. LOGIN SERVER CONNECT                                                    │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────────────┐  │
│  │ Game         │───▶│ io.connect() │───▶│ login-server.js (MOCK)      │  │
│  │ (main.min.js)│    │ port 9999    │    │ • loginGame                 │  │
│  │              │    │              │    │ • GetServerList             │  │
│  │              │    │              │    │ → Return mainServerUrl:9998 │  │
│  └──────────────┘    └──────────────┘    └──────────────────────────────┘  │
│                                                     │                       │
│                                                     ▼                       │
│  5. MAIN SERVER CONNECT  ⚠️ PROBLEM HERE!                                   │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────────────┐  │
│  │ Game         │───▶│ io.connect() │───▶│ ❌ TIDAK ADA SERVER         │  │
│  │              │    │ port 9998    │    │                            │  │
│  │              │    │              │    │  Error: reconnect error    │  │
│  │              │    │              │    │  xhr poll error            │  │
│  └──────────────┘    └──────────────┘    └──────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ✅ YANG SUDAH ADA

### 1. SDK Layer (`sdk/sdk.js`)
```
Fungsi:
- Membuat userId, token, nickname
- Menyimpan di localStorage
- Konfigurasi loginServer: http://127.0.0.1:9999
- Export LOCAL_SDK ke window
```

### 2. Bridge Layer (`sdk/bridge.js`)
```
Fungsi:
- Override egret.ExternalInterface.call
- Override egret.ExternalInterface.addCallback
- Handle startGame callback
- Handle refresh, pei, giveLike, dll
```

### 3. Login Server (`server/login-server.js`) - Port 9999
```
Fungsi:
- Intercept io.connect() ke port 9999
- Handle 6 action handlers:

  ┌─────────────────┬────────────────────────────────────┐
  │ Action          │ Fungsi                             │
  ├─────────────────┼────────────────────────────────────┤
  │ loginGame       │ Login user, return token          │
  │ GetServerList   │ Return list server + mainServerUrl│
  │ SaveUserEnterInfo│ Track user entry                 │
  │ SaveLanguage    │ Save bahasa                       │
  │ SaveHistory     │ Save history play                 │
  │ LoginAnnounce   │ Return pengumuman login           │
  └─────────────────┴────────────────────────────────────┘

Response GetServerList:
{
  serverList: [{
    serverId: 1,
    name: "Local 1",
    url: "http://127.0.0.1:9998",  ← Main Server URL
    online: true,
    hot: false,
    new: true
  }],
  history: [],
  offlineReason: ""
}
```

### 4. Data Game (`resource/json/`) - 471 File JSON
```
File Utama:
├── hero.json           ← Data hero (ID, stats, skill)
├── skill.json          ← Data skill
├── thingsID.json       ← ID semua item
├── lesson.json         ← Data stage/lesson
├── chapter.json        ← Data chapter
├── constant.json       ← Konstanta game
├── errorDefine.json    ← Error codes
├── summon.json         ← Data summon/gacha
├── enemy.json          ← Data enemy
├── robotPlayer.json    ← Data AI player
├── vip.json            ← Data VIP
├── equip.json          ← Data equipment
├── weapon.json         ← Data weapon
├── ring.json           ← Data ring
├── jewel.json          ← Data jewel
└── ... 460+ file lainnya
```

---

## ❌ YANG MISSING (PERLU DIBUAT)

### Main Server - Port 9998

**Total Action Handlers: 434** (ditemukan di main.min.js)

### Kategori Action Handlers:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        434 ACTION HANDLERS YANG PERLU DIBUAT                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ CORE (8 handlers) - PALING PENTING!                                        │
│ ┌─────────────────┬───────────────────────────────────────────────────────┐ │
│ │ login           │ Login ke main server, return data player             │ │
│ │ enterGame       │ Kirim semua data player saat masuk game              │ │
│ │ exitGame        │ Save data player saat keluar                         │ │
│ │ clientConnect   │ Koneksi awal client                                  │ │
│ │ registChat      │ Register ke chat server                              │ │
│ │ getAll          │ Ambil semua data player                              │ │
│ │ getBriefInfo    │ Ambil info singkat player                            │ │
│ │ getDetail       │ Ambil detail player                                  │ │
│ └─────────────────┴───────────────────────────────────────────────────────┘ │
│                                                                             │
│ HERO (30 handlers)                                                         │
│ ┌─────────────────┬───────────────────────────────────────────────────────┐ │
│ │ levelUp         │ Level up hero                                        │ │
│ │ autoLevelUp     │ Auto level up dengan exp                             │ │
│ │ starUp          │ Naikkan bintang hero                                 │ │
│ │ wakeUp          │ Awakening hero                                       │ │
│ │ activeSuperSkill│ Aktifkan super skill                                │ │
│ │ evolve          │ Evolusi hero                                         │ │
│ │ heroBreak       │ Breakthrough hero                                    │ │
│ │ setTeam         │ Set formasi tim                                      │ │
│ │ saveFastTeam    │ Save tim cepat                                       │ │
│ │ setMainHero     │ Set hero utama                                       │ │
│ │ inherit         │ Warisi exp/level                                     │ │
│ │ resolve         │分解 hero (jadikan material)                          │ │
│ │ reborn          │ Reborn hero                                          │ │
│ │ activeSkin      │ Aktifkan skin                                        │ │
│ │ wear            │ Pakai equipment                                      │ │
│ │ wearAuto        │ Auto pakai equipment terbaik                         │ │
│ │ takeOff         │ Lepas equipment                                      │ │
│ │ activeRing      │ Aktifkan ring                                        │ │
│ │ activeWeapon    │ Aktifkan weapon                                      │ │
│ │ activeSkill     │ Aktifkan skill                                       │ │
│ │ recoverHero     │ Recover hero                                         │ │
│ │ splitHero       │ Pecah hero jadi fragment                             │ │
│ │ rebornSelfBreak │ Reborn self break                                    │ │
│ │ autoHeroBreak   │ Auto hero break                                      │ │
│ │ saveGuideTeam   │ Save guide team                                      │ │
│ │ setFastTeamName │ Set nama tim cepat                                   │ │
│ │ saveGuideTeam   │ Save guide team                                      │ │
│ │ levelUpSuperSkill│ Level up super skill                               │ │
│ │ autoLevelUpSuperSkill│ Auto level up super skill                      │ │
│ │ evolveSuperSkill│ Evolve super skill                                   │ │
│ └─────────────────┴───────────────────────────────────────────────────────┘ │
│                                                                             │
│ BATTLE (15 handlers)                                                       │
│ ┌─────────────────┬───────────────────────────────────────────────────────┐ │
│ │ start           │ Mulai battle                                         │ │
│ │ startBattle     │ Mulai pertarungan                                    │ │
│ │ checkBattleResult│ Cek hasil battle                                   │ │
│ │ checkBattleRecord│ Cek record battle                                  │ │
│ │ getBattleRecord │ Ambil record battle                                  │ │
│ │ queryBattleRecord│ Query record battle                                │ │
│ │ getBattleReward │ Ambil reward battle                                  │ │
│ │ sweep           │ Sweep stage                                          │ │
│ │ autoFight       │ Auto fight                                           │ │
│ │ guideBattle     │ Guide battle                                         │ │
│ │ friendBattle    │ Battle dengan friend                                 │ │
│ │ checkBossResult │ Cek hasil boss                                       │ │
│ │ getTopBattleRecord│ Ambil top record                                  │ │
│ │ recommendBattleFriend│ Rekomendasi friend untuk battle               │ │
│ │ treasureStartBattle│ Start treasure battle                            │ │
│ └─────────────────┴───────────────────────────────────────────────────────┘ │
│                                                                             │
│ SUMMON (10 handlers)                                                       │
│ ┌─────────────────┬───────────────────────────────────────────────────────┐ │
│ │ summonOne       │ Summon 1x                                            │ │
│ │ summonTen       │ Summon 10x                                           │ │
│ │ summonOneFree   │ Summon 1x gratis                                     │ │
│ │ summonEnergy    │ Summon dengan energy                                 │ │
│ │ normalLuck      │ Luck normal pool                                     │ │
│ │ luxuryLuck      │ Luck luxury pool                                     │ │
│ │ randSummons     │ Random summons                                       │ │
│ │ summonGiftReward│ Reward summon gift                                   │ │
│ │ turnTable       │ Turn table                                           │ │
│ │ turnTableGetReward│ Ambil reward turn table                           │ │
│ └─────────────────┴───────────────────────────────────────────────────────┘ │
│                                                                             │
│ INVENTORY (20 handlers)                                                    │
│ ┌─────────────────┬───────────────────────────────────────────────────────┐ │
│ │ useItem         │ Gunakan item                                         │ │
│ │ sell            │ Jual item                                            │ │
│ │ merge           │ Gabung item                                          │ │
│ │ decompose       │ Decompose item                                       │ │
│ │ gain            │ Terima item/reward                                   │ │
│ │ gleaning        │ Gleaning rewards                                     │ │
│ │ getAllReward    │ Ambil semua reward                                   │ │
│ │ getAllBoxReward │ Ambil semua box reward                               │ │
│ │ getAllLevelReward│ Ambil semua level reward                           │ │
│ │ getAllTaskReward│ Ambil semua task reward                              │ │
│ │ awardBox        │ Award box                                            │ │
│ │ equip           │ Equip item                                           │ │
│ │ equipUp         │ Upgrade equipment                                    │ │
│ │ takeOff         │ Lepas equipment                                      │ │
│ │ wearAuto        │ Auto wear equipment                                  │ │
│ │ openBox         │ Buka box                                             │ │
│ │ autoMerge       │ Auto merge item                                      │ │
│ │ openAll         │ Buka semua box                                       │ │
│ │ blindBoxOpen    │ Buka blind box                                       │ │
│ │ blindBoxRefresh │ Refresh blind box                                    │ │
│ └─────────────────┴───────────────────────────────────────────────────────┘ │
│                                                                             │
│ PROGRESS (15 handlers)                                                     │
│ ┌─────────────────┬───────────────────────────────────────────────────────┐ │
│ │ nextChapter     │ Chapter berikutnya                                   │ │
│ │ getChapterReward│ Ambil reward chapter                                 │ │
│ │ getStarReward   │ Ambil reward bintang                                 │ │
│ │ getLevelReward  │ Ambil reward level                                   │ │
│ │ getDailyReward  │ Ambil reward harian                                  │ │
│ │ getDownloadReward│ Ambil reward download                               │ │
│ │ getLoginActivityReward│ Ambil reward login activity                   │ │
│ │ getLoginActivityExReward│ Ambil extra reward                          │ │
│ │ getAllLevelReward│ Ambil semua level reward                           │ │
│ │ getAllTaskReward│ Ambil semua task reward                              │ │
│ │ getAllBoxReward │ Ambil semua box reward                               │ │
│ │ getAllReward    │ Ambil semua reward                                   │ │
│ │ gleaning        │ Gleaning                                             │ │
│ │ gain            │ Gain reward                                          │ │
│ │ hangupReward    │ Idle reward                                          │ │
│ └─────────────────┴───────────────────────────────────────────────────────┘ │
│                                                                             │
│ DAILY (10 handlers)                                                        │
│ ┌─────────────────┬───────────────────────────────────────────────────────┐ │
│ │ checkin         │ Daily checkin                                        │ │
│ │ getDailyTaskReward│ Ambil reward task harian                           │ │
│ │ taskReward      │ Ambil reward task                                    │ │
│ │ getAchReward    │ Ambil reward achievement                             │ │
│ │ getActivityBrief│ Ambil brief activity                                 │ │
│ │ getActivityDetail│ Ambil detail activity                              │ │
│ │ autoGetEventsReward│ Auto ambil event reward                           │ │
│ │ getOnlineGift   │ Ambil online gift                                    │ │
│ │ getFundReward   │ Ambil reward fund                                    │ │
│ │ getGrowActivityReward│ Ambil grow activity reward                     │ │
│ └─────────────────┴───────────────────────────────────────────────────────┘ │
│                                                                             │
│ SHOP (15 handlers)                                                         │
│ ┌─────────────────┬───────────────────────────────────────────────────────┐ │
│ │ shop            │ Lihat shop                                           │ │
│ │ shopBuy         │ Beli dari shop                                       │ │
│ │ buyGold         │ Beli gold                                            │ │
│ │ refresh         │ Refresh shop                                         │ │
│ │ marketActReward │ Market activity reward                               │ │
│ │ buyCard         │ Beli card                                            │ │
│ │ buyFund         │ Beli fund                                            │ │
│ │ buyVipGift      │ Beli VIP gift                                        │ │
│ │ buySuperGift    │ Beli super gift                                      │ │
│ │ buyNewServerGift│ Beli new server gift                                 │ │
│ │ buyHeroSuperGift│ Beli hero super gift                                 │ │
│ │ buyLessonFund   │ Beli lesson fund                                     │ │
│ │ buyDailyDiscount│ Beli daily discount                                  │ │
│ │ buyTodayDiscount│ Beli today discount                                  │ │
│ │ buyBonus        │ Beli bonus                                           │ │
│ └─────────────────┴───────────────────────────────────────────────────────┘ │
│                                                                             │
│ SOCIAL (20 handlers)                                                       │
│ ┌─────────────────┬───────────────────────────────────────────────────────┐ │
│ │ getFriends      │ Ambil list friend                                    │ │
│ │ applyFriend     │ Apply friend                                         │ │
│ │ delFriend       │ Hapus friend                                         │ │
│ │ giveHeart       │ Kasih heart ke friend                                │ │
│ │ getHeart        │ Ambil heart dari friend                              │ │
│ │ autoGiveGetHeart│ Auto give & get heart                                │ │
│ │ recommendFriend │ Rekomendasi friend                                   │ │
│ │ addToBlacklist  │ Tambah ke blacklist                                  │ │
│ │ removeBalcklist │ Hapus dari blacklist                                 │ │
│ │ getMailList     │ Ambil list mail                                      │ │
│ │ readMail        │ Baca mail                                            │ │
│ │ delMail         │ Hapus mail                                           │ │
│ │ autoDelMail     │ Auto hapus mail                                      │ │
│ │ sendMsg         │ Kirim pesan                                          │ │
│ │ getMsgList      │ Ambil list pesan                                     │ │
│ │ readMsg         │ Baca pesan                                           │ │
│ │ getMsg          │ Ambil pesan                                          │ │
│ │ getApplyList    │ Ambil list apply                                     │ │
│ │ agree           │ Setuju apply                                         │ │
│ │ handleApply     │ Handle apply                                         │ │
│ └─────────────────┴───────────────────────────────────────────────────────┘ │
│                                                                             │
│ GUILD (30 handlers)                                                        │
│ ┌─────────────────┬───────────────────────────────────────────────────────┐ │
│ │ createGuild     │ Buat guild                                           │ │
│ │ getGuildList    │ Ambil list guild                                     │ │
│ │ getGuildDetail  │ Ambil detail guild                                   │ │
│ │ getGuildByIdOrName│ Cari guild by ID/nama                              │ │
│ │ requestGuild    │ Request join guild                                   │ │
│ │ join            │ Join guild                                           │ │
│ │ quitGuild       │ Keluar guild                                         │ │
│ │ kickOut         │ Kick member                                          │ │
│ │ getMembers      │ Ambil list member                                    │ │
│ │ getRequestMembers│ Ambil list request                                  │ │
│ │ handleRequest   │ Handle request join                                  │ │
│ │ guildSign       │ Sign guild                                           │ │
│ │ upgradeTech     │ Upgrade teknologi guild                              │ │
│ │ resetTech       │ Reset teknologi                                      │ │
│ │ changeGuildName │ Ganti nama guild                                     │ │
│ │ updateGuildIcon │ Update icon guild                                    │ │
│ │ updateDes       │ Update deskripsi                                     │ │
│ │ transferCaptain │ Transfer ketua                                       │ │
│ │ impeachCaptain  │ Impeach ketua                                        │ │
│ │ appointmentViceCaptain│ Appoint wakil ketua                            │ │
│ │ relieveViceCaptain│ Lepas wakil ketua                                  │ │
│ │ changeAutoJoinCondition│ Ubah syarat join                              │ │
│ │ getGuildLog     │ Ambil log guild                                      │ │
│ │ getGuildBossInfo│ Ambil info boss guild                                │ │
│ │ attackBoss      │ Serang boss guild                                    │ │
│ │ getGuildMemberHonours│ Ambil honour member                             │ │
│ │ signUpBallWar   │ Daftar ball war                                      │ │
│ │ checkPropaganda │ Check propaganda                                     │ │
│ │ getAreaInfo     │ Ambil info area                                      │ │
│ │ getFlagOwnerInfo│ Ambil info flag owner                                │ │
│ └─────────────────┴───────────────────────────────────────────────────────┘ │
│                                                                             │
│ ARENA (15 handlers)                                                        │
│ ┌─────────────────┬───────────────────────────────────────────────────────┐ │
│ │ getEnemyInfo    │ Ambil info enemy arena                               │ │
│ │ startBattle     │ Mulai battle arena                                   │ │
│ │ getRank         │ Ambil ranking                                        │ │
│ │ getRankInfo     │ Ambil info ranking                                   │ │
│ │ getRankReward   │ Ambil reward ranking                                 │ │
│ │ getAllRank      │ Ambil semua ranking                                  │ │
│ │ getLocalRank    │ Ambil ranking lokal                                  │ │
│ │ getPassRank     │ Ambil pass ranking                                   │ │
│ │ getPointRank    │ Ambil point ranking                                  │ │
│ │ getChampionRank │ Ambil champion ranking                               │ │
│ │ getAuditionInfo │ Ambil info audition                                  │ │
│ │ getAuditionRank │ Ambil ranking audition                               │ │
│ │ getAuditionReward│ Ambil reward audition                              │ │
│ │ buyBattleTimes  │ Beli battle times                                    │ │
│ │ queryArenaHeroEquipInfo│ Query equipment hero arena                   │ │
│ └─────────────────┴───────────────────────────────────────────────────────┘ │
│                                                                             │
│ DUNGEON (25 handlers)                                                      │
│ ┌─────────────────┬───────────────────────────────────────────────────────┐ │
│ │ getSnakeInfo    │ Ambil info snake way                                 │ │
│ │ climb           │ Climb snake way                                      │ │
│ │ getFeetInfo     │ Ambil info feet                                      │ │
│ │ buyClimbTimes   │ Beli climb times                                     │ │
│ │ openKarin       │ Buka karin tower                                     │ │
│ │ karinRich       │ Karin rich                                           │ │
│ │ karinActReward  │ Karin activity reward                                │ │
│ │ dungeonReward   │ Dungeon reward                                       │ │
│ │ startEntrust    │ Mulai entrust                                        │ │
│ │ finishEvent     │ Selesaikan event                                     │ │
│ │ quickFinishEvent│ Quick finish event                                   │ │
│ │ clickExpedition │ Click expedition                                     │ │
│ │ finishNow       │ Finish now                                           │ │
│ │ getTreasureInfo │ Ambil info treasure                                  │ │
│ │ getTreasurePoint│ Ambil treasure point                                 │ │
│ │ buyTimes        │ Beli times dungeon                                   │ │
│ │ getFinishInfo   │ Ambil info finish                                    │ │
│ │ getState        │ Ambil state                                          │ │
│ │ getInfo         │ Ambil info                                           │ │
│ │ startEvent      │ Mulai event                                          │ │
│ │ startGeneral    │ Mulai general                                        │ │
│ │ startSeason     │ Mulai season                                         │ │
│ │ resetCurLevel   │ Reset current level                                  │ │
│ │ reset           │ Reset dungeon                                        │ │
│ │ startBoss       │ Mulai boss                                           │ │
│ └─────────────────┴───────────────────────────────────────────────────────┘ │
│                                                                             │
│ VIP (10 handlers)                                                          │
│ ┌─────────────────┬───────────────────────────────────────────────────────┐ │
│ │ getVipReward    │ Ambil reward VIP                                     │ │
│ │ vipBuy          │ Beli VIP                                             │ │
│ │ buyLevel        │ Beli level VIP                                       │ │
│ │ buySuper        │ Beli super VIP                                       │ │
│ │ buyStep         │ Beli step VIP                                        │ │
│ │ buyCount        │ Beli count VIP                                       │ │
│ │ getHelpReward   │ Ambil help reward                                    │ │
│ │ getHelpRewardInfo│ Ambil info help reward                             │ │
│ │ getFundReward   │ Ambil fund reward                                    │ │
│ │ getLessonFundReward│ Ambil lesson fund reward                         │ │
│ └─────────────────┴───────────────────────────────────────────────────────┘ │
│                                                                             │
│ SPECIAL (25 handlers)                                                      │
│ ┌─────────────────┬───────────────────────────────────────────────────────┐ │
│ │ wish            │ Wish dragon ball                                     │ │
│ │ attackBoss      │ Serang world boss                                    │ │
│ │ getBossList     │ Ambil list boss                                      │ │
│ │ checkBossResult │ Cek hasil boss                                       │ │
│ │ resetCellGame   │ Reset cell game                                      │ │
│ │ getCellInfo     │ Ambil info cell game                                 │ │
│ │ signUp          │ Sign up event                                        │ │
│ │ bet             │ Bet                                                                 │ │
│ │ getBetReward    │ Ambil reward bet                                     │ │
│ │ like            │ Like                                                                 │ │
│ │ getRecord       │ Ambil record                                         │ │
│ │ queryRecord     │ Query record                                         │ │
│ │ lanternBless    │ Lantern bless                                        │ │
│ │ getLanternBlessTaskReward│ Reward lantern                              │ │
│ │ luckyWheelLottery│ Lucky wheel lottery                                │ │
│ │ luckyWheelGetReward│ Reward lucky wheel                               │ │
│ │ turnTable       │ Turn table                                           │ │
│ │ turnTableGetReward│ Reward turn table                                 │ │
│ │ investigation   │ Investigation                                        │ │
│ │ answer          │ Answer                                                               │ │
│ │ submitQuestionnaire│ Submit questionnaire                              │ │
│ │ blindBoxOpen    │ Buka blind box                                       │ │
│ │ blindBoxRefresh │ Refresh blind box                                    │ │
│ │ blindBoxShowRewards│ Show blind box rewards                            │ │
│ │ upsetBlindBox   │ Upset blind box                                      │ │
│ └─────────────────┴───────────────────────────────────────────────────────┘ │
│                                                                             │
│ LAINNYA (200+ handlers)                                                    │
│ - Recharge, Payment, Activity                                              │
│ - Training, Time Travel, Expedition                                        │
│ - Team Dungeon, Gravity Test                                               │
│ - Month Card, First Recharge                                               │
│ - Event khusus, dll.                                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```
