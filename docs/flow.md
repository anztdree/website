┌─────────────────────────────────────────────────────────────────────────────┐
│                           HTML5 GAME CLIENT                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────────────┐ │
│  │  index.html │───▶│ manifest.json│───▶│ Load JS Files (in order)       │ │
│  └─────────────┘    └─────────────┘    └─────────────────────────────────┘ │
│                                                     │                       │
│                                                     ▼                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    LOAD ORDER (manifest.json)                        │   │
│  │                                                                      │   │
│  │  INITIAL (Core Engine):                                              │   │
│  │  1. egret.min.js          - Game Engine Core                        │   │
│  │  2. egret.web.min.js      - Web Platform Adapter                    │   │
│  │  3. sdk/bridge.js         - ⭐ SDK Bridge (intercepts calls)        │   │
│  │  4. game.min.js           - Game Core                               │   │
│  │  5. tween.min.js          - Animation                               │   │
│  │  6. assetsmanager.min.js  - Asset Loader                            │   │
│  │  7. eui.min.js            - UI Components                           │   │
│  │  8. dragonBones.min.js    - Skeletal Animation                      │   │
│  │                                                                      │   │
│  │  GAME (Game Logic):                                                  │   │
│  │  1. md5.min.js            - MD5 Hash                                │   │
│  │  2. lz-string.min.js      - Compression                             │   │
│  │  3. socket.io.min.js      - ⭐ WebSocket Client                     │   │
│  │  4. server/login-server.js - ⭐ Mock Login Server                   │   │
│  │  5. blockmessage.min.js   - Message Handler                         │   │
│  │  6. battlelogic.min.js    - Battle System                           │   │
│  │  7. ThinkingAnalyticsSDK  - Analytics                               │   │
│  │  8. default.thm.min.js    - Theme                                   │   │
│  │  9. main.min.js           - ⭐ Main Game Code                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SDK LAYER                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐         ┌─────────────────────────────────────────┐   │
│  │   sdk/sdk.js    │────────▶│ LOCAL_SDK (User Data & Config)          │   │
│  │                 │         │ • userId, nickname, token               │   │
│  │ Loaded BEFORE   │         │ • loginServer: http://127.0.0.1:9999    │   │
│  │ bridge.js       │         │ • language, channel                     │   │
│  └─────────────────┘         └─────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────┐         ┌─────────────────────────────────────────┐   │
│  │ sdk/bridge.js   │────────▶│ Intercepts egret.ExternalInterface      │   │
│  │                 │         │                                         │   │
│  │ Loaded AFTER    │         │ • call()     - Game → SDK calls         │   │
│  │ egret.web.js    │         │ • addCallback() - SDK → Game callbacks  │   │
│  └─────────────────┘         └─────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SERVER LAYER                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    LOGIN SERVER (Port 9999)                          │   │
│  │                    server/login-server.js (MOCK)                     │   │
│  │                                                                      │   │
│  │  Handlers:                                                           │   │
│  │  • loginGame       - User login, returns token                      │   │
│  │  • GetServerList   - Returns game server list                       │   │
│  │  • SaveUserEnterInfo - Track user entry                             │   │
│  │  • SaveLanguage    - Save language preference                       │   │
│  │  • SaveHistory     - Save play history                              │   │
│  │  • LoginAnnounce   - Login announcements                            │   │
│  │                                                                      │   │
│  │  Response: Returns mainServerUrl = http://127.0.0.1:9998            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                     │                                       │
│                                     ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    MAIN SERVER (Port 9998)                           │   │
│  │                    ⚠️ NOT IMPLEMENTED - THIS IS THE PROBLEM!        │   │
│  │                                                                      │   │
│  │                                                                     |    |
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

