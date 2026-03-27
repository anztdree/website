/**
 * ============================================================
 * HANDLER: hero.getAttrs
 * ============================================================
 * 
 * Purpose: Mendapatkan atribut total dan base untuk hero
 * Dipanggil dari: onResourceLoadComplete() setelah heroImage.getAll
 * 
 * Flow: enterGame → loading → heroImage.getAll → hero.getAttrs
 * 
 * Request:
 *   { type: "hero", action: "getAttrs", userId: "...", heros: ["heroId1", ...], version: "1.0" }
 * 
 * Response:
 *   {
 *     _attrs: { "0": { _items: [{_id, _num}, ...] }, ... },
 *     _baseAttrs: { "0": { _items: [{_id, _num}, ...] }, ... }
 *   }
 * 
 * Struktur data dari main.min.js:
 *   getAttrsCallBack = function(e, t) {
 *     for (var o in t._attrs) {
 *       var a = n.getHero(e[o]);
 *       var r = {};
 *       r._totalAttr = t._attrs[o];
 *       r._baseAttr = t._baseAttrs[o];
 *       n.setTotalAttrs(r, a);
 *     }
 *   }
 * 
 * Attribute IDs (dari HERO_ATTR_TYPE):
 *   0: HP, 1: Attack, 2: Armor, 3: Speed, 4: Hit, 5: Dodge
 *   6: Block, 7: BlockEffect, 8: SkillDamage, 9: Critical, 10: CriticalResist
 *   11: CriticalDamage, 12: ArmorBreak, 13: DamageReduce, 14: ControlResist
 *   15: TrueDamage, 16: Energy, 17: HPPercent, 18: ArmorPercent
 *   19: AttackPercent, 20: SpeedPercent, 21: Power
 *   22: OrgHP, 25: Healer, 26: ExtraArmor, 27: Shielder
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
    // ATTRIBUTE ID CONSTANTS
    // ========================================================
    var ATTR_ID = {
        HP: 0,
        ATTACK: 1,
        ARMOR: 2,
        SPEED: 3,
        HIT: 4,
        DODGE: 5,
        BLOCK: 6,
        BLOCK_EFFECT: 7,
        SKILL_DAMAGE: 8,
        CRITICAL: 9,
        CRITICAL_RESIST: 10,
        CRITICAL_DAMAGE: 11,
        ARMOR_BREAK: 12,
        DAMAGE_REDUCE: 13,
        CONTROL_RESIST: 14,
        TRUE_DAMAGE: 15,
        ENERGY: 16,
        HP_PERCENT: 17,
        ARMOR_PERCENT: 18,
        ATTACK_PERCENT: 19,
        SPEED_PERCENT: 20,
        POWER: 21,
        ORG_HP: 22,
        HEALER: 25,
        EXTRA_ARMOR: 26,
        SHIELDER: 27
    };

    // ========================================================
    // HELPER FUNCTIONS
    // ========================================================
    
    /**
     * Convert hero base attributes to attribute items format
     * Format: { _items: [{_id: attrId, _num: value}, ...] }
     */
    function buildAttrItems(heroBaseAttr) {
        var items = [];
        
        // Map attribute names to IDs
        var attrMap = {
            '_hp': ATTR_ID.HP,
            '_attack': ATTR_ID.ATTACK,
            '_armor': ATTR_ID.ARMOR,
            '_speed': ATTR_ID.SPEED,
            '_hit': ATTR_ID.HIT,
            '_dodge': ATTR_ID.DODGE,
            '_block': ATTR_ID.BLOCK,
            '_damageReduce': ATTR_ID.DAMAGE_REDUCE,
            '_armorBreak': ATTR_ID.ARMOR_BREAK,
            '_controlResist': ATTR_ID.CONTROL_RESIST,
            '_skillDamage': ATTR_ID.SKILL_DAMAGE,
            '_criticalDamage': ATTR_ID.CRITICAL_DAMAGE,
            '_blockEffect': ATTR_ID.BLOCK_EFFECT,
            '_critical': ATTR_ID.CRITICAL,
            '_criticalResist': ATTR_ID.CRITICAL_RESIST,
            '_trueDamage': ATTR_ID.TRUE_DAMAGE,
            '_energy': ATTR_ID.ENERGY,
            '_power': ATTR_ID.POWER,
            '_extraArmor': ATTR_ID.EXTRA_ARMOR,
            '_hpPercent': ATTR_ID.HP_PERCENT,
            '_armorPercent': ATTR_ID.ARMOR_PERCENT,
            '_attackPercent': ATTR_ID.ATTACK_PERCENT,
            '_speedPercent': ATTR_ID.SPEED_PERCENT,
            '_orghp': ATTR_ID.ORG_HP,
            '_superDamage': 23,
            '_healPlus': 24,
            '_healerPlus': ATTR_ID.HEALER,
            '_damageDown': 28,
            '_shielderPlus': ATTR_ID.SHIELDER,
            '_damageUp': 29,
            '_level': 30,
            '_maxlevel': 31,
            '_evolveLevel': 32,
            '_talent': 33
        };
        
        for (var attrName in heroBaseAttr) {
            var attrId = attrMap[attrName];
            if (attrId !== undefined && heroBaseAttr[attrName] !== undefined) {
                items.push({
                    _id: attrId,
                    _num: heroBaseAttr[attrName]
                });
            }
        }
        
        return { _items: items };
    }

    // ========================================================
    // HANDLER FUNCTION
    // ========================================================
    
    /**
     * Handle hero.getAttrs request
     * 
     * @param {Object} request - Request data dari client
     *   - type: "hero"
     *   - action: "getAttrs"
     *   - userId: string
     *   - heros: array of hero IDs
     *   - version: "1.0"
     * 
     * @param {Object} playerData - Data player dari storage
     * 
     * @returns {Object} Response dengan format:
     *   {
     *     _attrs: { "0": { _items: [...] }, "1": { _items: [...] }, ... },
     *     _baseAttrs: { "0": { _items: [...] }, "1": { _items: [...] }, ... }
     *   }
     */
    function handleHeroGetAttrs(request, playerData) {
        LOG.info('─────────────────────────────────────────');
        LOG.info('Handler: hero.getAttrs');
        LOG.data('Request:', request);

        // ========================================================
        // BUILD RESPONSE
        // ========================================================
        // Request berisi array hero IDs: heros: ["heroId1", "heroId2", ...]
        // Response berisi _attrs dan _baseAttrs dengan index 0, 1, 2, ...
        // ========================================================
        
        var attrs = {};
        var baseAttrs = {};
        var heros = request.heros || [];
        
        for (var i = 0; i < heros.length; i++) {
            var heroId = heros[i];
            var hero = null;
            
            // Cari hero di playerData
            if (playerData && playerData.heros && playerData.heros[heroId]) {
                hero = playerData.heros[heroId];
            }
            
            if (hero && hero._heroBaseAttr) {
                // Build base attributes
                baseAttrs[i] = buildAttrItems(hero._heroBaseAttr);
                
                // Build total attributes (sama dengan base untuk sekarang)
                // Di game asli, total attributes termasuk bonus dari equipment, dll
                attrs[i] = buildAttrItems(hero._heroBaseAttr);
            } else {
                // Hero tidak ditemukan, kirim empty
                attrs[i] = { _items: [] };
                baseAttrs[i] = { _items: [] };
            }
        }

        var response = {
            _attrs: attrs,
            _baseAttrs: baseAttrs
        };

        // Log jumlah hero
        LOG.success('hero.getAttrs: ' + heros.length + ' hero(s) processed');
        LOG.data('Response:', response);

        return response;
    }

    // ========================================================
    // EXPORT HANDLER
    // ========================================================
    
    // Register ke global handler registry
    window.MAIN_SERVER_HANDLERS = window.MAIN_SERVER_HANDLERS || {};
    window.MAIN_SERVER_HANDLERS['hero.getAttrs'] = handleHeroGetAttrs;

    // Log registration
    if (LOG) {
        LOG.info('Handler registered: hero.getAttrs');
    }

})(window);
