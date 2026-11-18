window.AudioEngine = {
  ctx: null,
  musicTimer: null,
  step: 0,

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.sfxGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain.connect(this.ctx.destination);
      this.musicGain.connect(this.ctx.destination);
      this.setVolumes();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  setVolumes() {
    if (!this.sfxGain) return;
    const o = window.SaveManager.data.options;
    this.sfxGain.gain.value = (o.volSfx ?? 100) / 100;
    this.musicGain.gain.value = (o.volMusic ?? 100) / 100;
  },

  playSfx(type) {
    if (!window.SaveManager.data.options.sfx) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.sfxGain);

    switch (type) {
      case 'swing':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(75, now + 0.09);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.start(now);
        osc.stop(now + 0.09);
        break;
      case 'hit':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(155, now);
        osc.frequency.exponentialRampToValueAtTime(42, now + 0.12);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
        break;
      case 'finisher':
        osc.type = 'square';
        osc.frequency.setValueAtTime(230, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.22);
        gain.gain.setValueAtTime(0.26, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
        break;
      case 'laser':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(920, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.11);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
        osc.start(now);
        osc.stop(now + 0.11);
        break;
      case 'jump':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(230, now);
        osc.frequency.exponentialRampToValueAtTime(540, now + 0.12);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
        break;
      case 'dash':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(480, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.14);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.start(now);
        osc.stop(now + 0.14);
        break;
      case 'block':
        osc.type = 'square';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.setValueAtTime(520, now + 0.05);
        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        osc.start(now);
        osc.stop(now + 0.16);
        break;
      case 'powerup':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(330, now);
        osc.frequency.setValueAtTime(495, now + 0.07);
        osc.frequency.setValueAtTime(660, now + 0.14);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.28);
        break;
      case 'coin':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(987, now);
        osc.frequency.setValueAtTime(1318, now + 0.05);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      case 'hurt':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(115, now);
        osc.frequency.linearRampToValueAtTime(52, now + 0.22);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
        break;
      case 'step': {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(70 + Math.random() * 25, now);
        gain.gain.setValueAtTime(0.035, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
        break;
      }
      case 'nova':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(90, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.18);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.5);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
        break;
      case 'parry':
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1760, now + 0.08);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
        break;
      case 'shoot':
        osc.type = 'square';
        osc.frequency.setValueAtTime(420, now);
        osc.frequency.exponentialRampToValueAtTime(160, now + 0.1);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      case 'explosion':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(28, now + 0.35);
        gain.gain.setValueAtTime(0.32, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
        break;
      case 'laser_warn':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.06);
        break;
      case 'boss':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(70, now);
        osc.frequency.linearRampToValueAtTime(48, now + 0.9);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
        osc.start(now);
        osc.stop(now + 0.9);
        break;
      case 'chest':
      case 'achievement':
        [659, 784, 988, 1318].forEach((freq, i) => {
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.type = 'sine';
          o.frequency.setValueAtTime(freq, now + i * 0.07);
          g.gain.setValueAtTime(0.13, now + i * 0.07);
          g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.22);
          o.connect(g);
          g.connect(this.sfxGain);
          o.start(now + i * 0.07);
          o.stop(now + i * 0.07 + 0.22);
        });
        gain.gain.setValueAtTime(0.0001, now);
        osc.start(now);
        osc.stop(now + 0.01);
        break;
      case 'victory':
        [523, 659, 783, 1046].forEach((freq, i) => {
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.type = 'triangle';
          o.frequency.setValueAtTime(freq, now + i * 0.1);
          g.gain.setValueAtTime(0.16, now + i * 0.1);
          g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.25);
          o.connect(g);
          g.connect(this.sfxGain);
          o.start(now + i * 0.1);
          o.stop(now + i * 0.1 + 0.25);
        });
        break;
    }
  },

  // Une piste par monde : [basse, arpège, tempo ms, forme d'onde]
  TRACKS: [
    { bass: [110, 110, 130.8, 146.8, 98, 98, 123.5, 130.8], arp: [440, 523, 659, 523], tempo: 260, wave: 'triangle' },   // Bureau
    { bass: [98, 98, 123.5, 130.8, 87.3, 87.3, 110, 123.5], arp: [392, 494, 587, 494], tempo: 240, wave: 'triangle' },   // Antivirus
    { bass: [130.8, 164.8, 146.8, 196, 110, 138.6, 123.5, 164.8], arp: [523, 659, 784, 659], tempo: 250, wave: 'sine' }, // Studio
    { bass: [82.4, 82.4, 98, 110, 73.4, 73.4, 92.5, 98], arp: [330, 392, 494, 392], tempo: 220, wave: 'square' },       // Noyau
    { bass: [110, 130.8, 110, 164.8, 98, 123.5, 98, 146.8], arp: [440, 587, 698, 587], tempo: 210, wave: 'sawtooth' },  // Réseau
    { bass: [146.8, 130.8, 164.8, 123.5, 130.8, 110, 146.8, 98], arp: [587, 698, 880, 698], tempo: 270, wave: 'sine' }, // Cloud
    { bass: [73.4, 73.4, 87.3, 82.4, 65.4, 65.4, 77.8, 82.4], arp: [294, 349, 440, 349], tempo: 190, wave: 'sawtooth' } // Darknet
  ],

  startMusic(trackIdx = 0) {
    trackIdx = Math.max(0, Math.min(this.TRACKS.length - 1, trackIdx));
    if (this.musicTimer && this.trackIdx === trackIdx) return;
    if (this.musicTimer) clearInterval(this.musicTimer);
    this.trackIdx = trackIdx;
    const tr = this.TRACKS[trackIdx];
    this.musicTimer = setInterval(() => {
      if (!window.SaveManager.data.options.music) return;
      this.init();
      const now = this.ctx.currentTime;
      const note = (freq, type, vol, dur) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(now);
        osc.stop(now + dur);
      };
      note(tr.bass[this.step % tr.bass.length], tr.wave, 0.045, 0.24);
      if (this.step % 2 === 1) note(tr.arp[(this.step >> 1) % tr.arp.length] * 2, 'square', 0.012, 0.12);
      this.step++;
    }, tr.tempo);
  }
};
