const { ipcRenderer } = require('electron');

const DEFAULT_SAVE = {
  bits: 150,
  unlockedLevel: 0,
  bestRanks: {},
  stats: { kills: 0, bitsEarned: 0, bosses: 0, bestCombo: 0 },
  talents: { hp: 0, spd: 0, dmg: 0 },
  achievements: {},
  challenges: {},
  endlessBest: 0,
  bestTimes: {},
  ghosts: {},
  outfits: [null, null, null],
  unlockedItems: ['color_cyan', 'hat_bandana', 'cape_none', 'wskin_classic', 'head_round', 'emote_cheer'],
  equipped: {
    color: 'color_cyan',
    hat: 'hat_bandana',
    cape: 'cape_none',
    weaponSkin: 'wskin_classic',
    aura: 'aura_gold',
    head: 'head_round',
    emote: 'emote_cheer'
  },
  options: {
    sfx: true,
    music: true,
    rumble: true,
    shake: true,
    difficulty: 'normal',
    ghost: true,
    volSfx: 100,
    volMusic: 100
  }
};

window.SaveManager = {
  data: null,

  load() {
    const loaded = ipcRenderer.sendSync('load-save');
    if (loaded && typeof loaded === 'object') {
      this.data = {
        ...DEFAULT_SAVE,
        ...loaded,
        bestRanks: { ...(loaded.bestRanks || {}) },
        stats: { ...DEFAULT_SAVE.stats, ...(loaded.stats || {}) },
        talents: { ...DEFAULT_SAVE.talents, ...(loaded.talents || {}) },
        achievements: { ...(loaded.achievements || {}) },
        challenges: { ...(loaded.challenges || {}) },
        bestTimes: { ...(loaded.bestTimes || {}) },
        ghosts: { ...(loaded.ghosts || {}) },
        outfits: Array.isArray(loaded.outfits) ? loaded.outfits : [null, null, null],
        equipped: { ...DEFAULT_SAVE.equipped, ...(loaded.equipped || {}) },
        options: { ...DEFAULT_SAVE.options, ...(loaded.options || {}) }
      };
    } else {
      this.data = JSON.parse(JSON.stringify(DEFAULT_SAVE));
      this.save();
    }
    return this.data;
  },

  reset() {
    this.data = JSON.parse(JSON.stringify(DEFAULT_SAVE));
    this.save();
  },

  save() {
    ipcRenderer.sendSync('write-save', this.data);
  },

  // Sauvegarde différée : évite une écriture disque synchrone à chaque Bit ramassé
  saveSoon() {
    clearTimeout(this._t);
    this._t = setTimeout(() => this.save(), 400);
  },

  addBits(amount) {
    this.data.bits += amount;
    if (amount > 0) this.data.stats.bitsEarned += amount;
    this.saveSoon();
  },

  setBestRank(levelId, rank) {
    const order = 'BAS';
    const cur = this.data.bestRanks[levelId];
    if (!cur || order.indexOf(rank) > order.indexOf(cur)) {
      this.data.bestRanks[levelId] = rank;
      this.save();
    }
  },

  unlockLevel(index) {
    if (index > this.data.unlockedLevel) {
      this.data.unlockedLevel = index;
      this.save();
    }
  }
};

window.SaveManager.load();

window.addEventListener('beforeunload', () => window.SaveManager.save());
