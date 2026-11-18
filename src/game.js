const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

let W = window.innerWidth;
let H = window.innerHeight;
let FLOOR_Y = H - 72;

const GRAVITY = 0.68;
let gameState = 'TITLE'; // 'TITLE', 'PLAYING', 'PAUSED', 'VICTORY', 'GAMEOVER'
let currentLevelIdx = 0;
let cameraX = 0;
let shake = 0;
let globalTime = 0;
let levelTimer = 0;
let levelKills = 0;
let levelBitsEarned = 0;

const WEAPONS = [
  { id: 'fists', name: '👊 Poings (Combo)', color: '#38bdf8', dmg: 18, range: 62, cooldown: 13 },
  { id: 'staff', name: '🥢 Bâton Bo', color: '#facc15', dmg: 26, range: 105, cooldown: 17 },
  { id: 'brush', name: '🖌️ Pinceau Géant', color: '#f472b6', dmg: 21, range: 80, cooldown: 18 },
  { id: 'cursor', name: '🖱️ Curseur Géant', color: '#4ade80', dmg: 23, range: 72, cooldown: 15 }
];

const POWERUP_META = {
  overclock: { label: '⚡ Overclock', color: '#38bdf8', duration: 720 },
  titan: { label: '🔥 Mode Titan', color: '#f43f5e', duration: 600 },
  shield: { label: '🛡️ Bouclier', color: '#4ade80', duration: 900 },
  magnet: { label: '🧲 Aimant', color: '#facc15', duration: 1200 }
};

let platforms = [];
let mysteryBlocks = [];
let enemies = [];
let projectiles = [];
let particles = [];
let floatingTexts = [];
let pickups = []; // { x, y, vx, vy, type: 'bit' | 'heal' | 'powerup', power?: string }
let portal = null;
let enemyProjectiles = [];
let lasers = [];
let winds = [];
let chests = [];
let energy = 0;            // jauge de Nova (0-100)
let combo = 0;             // coups enchaînés sans pause
let comboTimer = 0;
let bannerText = '';
let bannerColor = '#fff';
let bannerTimer = 0;
let fade = 0;              // fondu noir à l'entrée d'un niveau
let wave = 0;              // mode infini
let levelDamageTaken = false;
let levelChestFound = false;
let bossIntroDone = false;
let lives = 2;             // vies supplémentaires (respawn au dernier checkpoint)
let checkpoints = [];      // { x, on }
let checkpointX = 130;
let doors = [];            // { x, open, slide }
let keyItems = [];         // { x, yOff, taken }
let cine = null;           // cinématique d'intro de boss { t, max, boss }
let iris = 1;              // ouverture en iris à l'entrée d'un niveau (1 = ouvert)
let ghostRec = [];         // trajectoire enregistrée (x, hauteur, sens) toutes les 3 frames
let ghostData = null;
let ghostActor = null;
const fmtTime = t => { const sec = Math.floor(t / 60); return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`; };
const REWARDS = { boss: 100, heavy: 30, shooter: 20, flyer: 18, kamikaze: 12, fast: 15, normal: 15 };
const TRACK_OF = { '1-1': 0, '1-2': 1, '2-1': 2, '3-1': 3, '4-1': 4, '4-2': 4, '5-1': 5, '5-2': 5, '6-1': 6, inf: 6 };
let hitStop = 0;           // gel d'image à l'impact
let camBias = 0.38;        // position du joueur à l'écran (look-ahead)
const DIFFICULTY = {
  easy: { hp: 0.75, dmg: 0.7, reward: 1, lives: 4 },
  normal: { hp: 1, dmg: 1, reward: 1, lives: 2 },
  hard: { hp: 1.35, dmg: 1.3, reward: 1.25, lives: 1 }
};
function diff() {
  return DIFFICULTY[window.SaveManager.data.options.difficulty] || DIFFICULTY.normal;
}
const inView = (x, w = 80) => x + w > cameraX - 100 && x < cameraX + W + 100;
let auraLevel = 0; // 0 = normal, 1 = Super, 2 = Super + éclairs (selon les ennemis vaincus)
let spikes = [];
let springs = [];
let player = null;

function curLevel() {
  return currentLevelIdx < 0 ? window.ENDLESS_LEVEL : window.GAME_LEVELS[currentLevelIdx];
}

function showBanner(text, color = '#ffffff', frames = 130) {
  bannerText = text;
  bannerColor = color;
  bannerTimer = frames;
}

function updateHpBar() {
  if (player) document.getElementById('hp-fill').style.width = Math.max(0, (player.hp / player.maxHp) * 100) + '%';
}

function comboMult() {
  return 1 + Math.min(8, Math.floor(combo / 5)) * 0.25;
}

function updateStreakHud() {
  document.getElementById('streak-badge').textContent = combo >= 3 ? `🔥 ${combo} HITS ×${comboMult().toFixed(2)}` : '';
}

function addEnergy(n) {
  energy = Math.min(100, energy + n);
  document.getElementById('energy-fill').style.width = energy + '%';
  document.getElementById('energy-fill').classList.toggle('ready', energy >= 100);
  document.getElementById('nova-hint').textContent = energy >= 100 ? '⚡ NOVA PRÊTE ! (R / LB)' : '';
}

function resizeCanvas() {
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = W;
  canvas.height = H;
  const dy = (H - 72) - FLOOR_Y;
  FLOOR_Y = H - 72;
  // le sol bouge : décale tout ce qui est positionné par rapport à lui
  [...platforms, ...mysteryBlocks, ...enemies, ...projectiles, ...enemyProjectiles, ...chests, ...pickups, portal, player]
    .forEach(o => { if (o) o.y += dy; });
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- PARTICULES & EFFETS ---
function spawnParticles(x, y, color, count = 10, speed = 6) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const v = Math.random() * speed + 1;
    particles.push({
      x, y,
      vx: Math.cos(angle) * v,
      vy: Math.sin(angle) * v - 2,
      life: 25 + Math.random() * 15,
      maxLife: 40,
      color,
      size: 3 + Math.random() * 4
    });
  }
}

function spawnRing(x, y, color) {
  particles.push({
    x, y, vx: 0, vy: 0,
    life: 18, maxLife: 18,
    color, isRing: true, radius: 8
  });
}

function spawnDamageText(x, y, text, color = '#fff') {
  floatingTexts.push({ x, y, text, color, life: 40 });
}

function triggerMysteryBlock(block) {
  if (block.used) return;
  block.used = true;
  block.bounce = -10;
  window.AudioEngine.playSfx('block');
  spawnParticles(block.x + block.w / 2, block.y, '#facc15', 14, 5);

  if (block.type === 'heal') {
    pickups.push({ x: block.x + block.w / 2, y: block.y - 24, vx: 0, vy: -5, type: 'heal' });
  } else {
    pickups.push({ x: block.x + block.w / 2, y: block.y - 24, vx: 0, vy: -6, type: 'powerup', power: block.power });
    for (let i = 0; i < 4; i++) {
      pickups.push({
        x: block.x + block.w / 2,
        y: block.y - 20,
        vx: (Math.random() - 0.5) * 6,
        vy: -5 - Math.random() * 4,
        type: 'bit'
      });
    }
  }
}

// --- CHARGEMENT D'UN NIVEAU ---
function loadLevel(idx) {
  currentLevelIdx = idx;
  const lvl = curLevel();
  cameraX = 0;
  levelTimer = 0;
  levelKills = 0;
  levelBitsEarned = 0;
  auraLevel = 0;
  energy = 0;
  combo = 0;
  comboTimer = 0;
  wave = 0;
  levelDamageTaken = false;
  levelChestFound = false;
  bossIntroDone = false;
  projectiles = [];
  enemyProjectiles = [];
  particles = [];
  floatingTexts = [];
  pickups = [];
  lives = diff().lives;
  cine = null;
  checkpointX = 130;
  ghostRec = [];

  player = new Stickman(130, '#38bdf8', true);
  updateHpBar();
  drawHudAvatar();
  addEnergy(0);
  updateStreakHud();
  document.getElementById('weapon-name').textContent = player.weapon.name;
  document.getElementById('hud-level-name').textContent = lvl.name;
  document.getElementById('hud-bits').textContent = window.SaveManager.data.bits;

  platforms = lvl.platforms.map(p => ({
    x: p.x,
    y: FLOOR_Y - p.yOffset,
    w: p.w,
    h: 22,
    color: p.color,
    title: p.title,
    crumble: !!p.crumble
  }));

  platforms.push(...(lvl.movers || []).map(m => ({
    x: m.x, baseX: m.x, y: FLOOR_Y - m.yOffset, w: m.w, h: 22, color: m.color, title: m.title,
    range: m.range, speed: m.speed, dx: 0
  })));
  lasers = (lvl.lasers || []).map(l => ({ ...l }));
  winds = (lvl.winds || []).map(w => ({ ...w }));
  doors = (lvl.doors || []).map(d => ({ x: d.x, open: false, slide: 0 }));
  keyItems = (lvl.doors || []).map(d => ({ x: d.keyX, yOff: d.keyYOffset, taken: false }));
  checkpoints = (lvl.checkpoints || []).map(x => ({ x, on: false }));
  const opts = window.SaveManager.data.options;
  ghostData = !lvl.endless && opts.ghost ? window.SaveManager.data.ghosts[lvl.id] || null : null;
  ghostActor = ghostData ? new Stickman(0, '#a5b4fc', false) : null;
  chests = (lvl.chests || []).map(c => ({ x: c.x, y: FLOOR_Y - c.yOffset - 14, opened: false }));
  spikes = (lvl.spikes || []).map(sp => ({ ...sp }));
  springs = (lvl.springs || []).map(sp => ({ ...sp, w: 46, squash: 0 }));
  pickups.push(...(lvl.coins || []).map(c => ({
    x: c.x, y: FLOOR_Y - c.yOffset, vx: 0, vy: 0, type: 'bit', static: true, value: 5
  })));

  mysteryBlocks = lvl.blocks.map(b => ({
    x: b.x,
    y: FLOOR_Y - b.yOffset - 38, // ~1 cm
    w: 42,
    h: 42,
    type: b.type,
    power: b.power,
    used: false,
    bounce: 0
  }));

  enemies = lvl.spawns.map(s => {
    const e = new Stickman(s.x, s.color, false, s.archetype);
    e.bossName = s.bossName || '⚠️ BOSS SYSTÈME';
    return e;
  });

  const hasBoss = enemies.some(e => e.archetype === 'boss');
  const bossHud = document.getElementById('boss-hud');
  if (hasBoss) {
    const boss = enemies.find(e => e.archetype === 'boss');
    document.getElementById('boss-title').textContent = boss.bossName;
    document.getElementById('boss-fill').style.width = '100%';
    bossHud.classList.remove('hidden');
  } else {
    bossHud.classList.add('hidden');
  }

  portal = lvl.endless ? { x: -9999, y: -9999, open: false } : { x: lvl.length - 120, y: FLOOR_Y - 110, open: false };
  switchScreen(null);
  document.getElementById('hud').classList.remove('hidden');
  gameState = 'PLAYING';
  window.AudioEngine.startMusic(TRACK_OF[lvl.id] ?? 0);
  fade = 0;
  iris = 0;
  hitStop = 0;
  camBias = 0.38;
  showBanner(lvl.name, lvl.theme.accent, 140);
}

function startEndless() {
  loadLevel(-1);
}

// --- COMBAT & INTERACTIONS ---
function updateCombatAndPickups() {
  const lvl = curLevel();

  // Ramassage des Bits, Soins et Pouvoirs
  pickups.forEach(pk => {
    if (!pk.static) {
      pk.vy += 0.35;
      pk.x += pk.vx;
      pk.y += pk.vy;
      if (pk.y >= FLOOR_Y - 14) {
        pk.y = FLOOR_Y - 14;
        pk.vy = 0;
        pk.vx *= 0.8;
      }
    }

    // Aimant à données
    if (player.powers.magnet > 0 && (pk.type === 'bit' || pk.type === 'heal')) {
      const dx = player.x - pk.x;
      const dy = (player.y - 45) - pk.y;
      const d = Math.hypot(dx, dy);
      if (d < 340) {
        pk.x += (dx / d) * 9;
        pk.y += (dy / d) * 9;
      }
    }

    if (Math.abs(player.x - pk.x) < 38 && Math.abs((player.y - 45) - pk.y) < 50) {
      pk.collected = true;
      if (pk.type === 'bit') {
        const val = pk.value || 10;
        levelBitsEarned += val;
        window.SaveManager.addBits(val);
        document.getElementById('hud-bits').textContent = window.SaveManager.data.bits;
        window.AudioEngine.playSfx('coin');
        spawnDamageText(player.x, player.y - 80, `+${val}`, '#facc15');
      } else if (pk.type === 'heal') {
        player.hp = Math.min(player.maxHp, player.hp + 35);
        updateHpBar();
        window.AudioEngine.playSfx('powerup');
        spawnDamageText(player.x, player.y - 85, '+35 PV', '#4ade80');
      } else if (pk.type === 'powerup') {
        player.activatePower(pk.power);
      }
    }
  });
  pickups = pickups.filter(pk => !pk.collected);

  // Projectiles
  projectiles.forEach(proj => {
    proj.x += proj.vx;
    proj.y += proj.vy;
    proj.life--;
    enemies.forEach(enemy => {
      if (Math.abs(proj.x - enemy.x) < 34 * enemy.scale && Math.abs(proj.y - (enemy.y - 45 * enemy.scale)) < 52 * enemy.scale) {
        proj.life = 0;
        damageEnemy(enemy, proj.dmg, proj.color);
      }
    });
  });
  projectiles = projectiles.filter(p => p.life > 0);

  // Mêlée Joueur & Ennemis
  enemies.forEach(enemy => {
    if (player.attackTimer > 0 && !player.hasDealtDamageThisSwing) {
      const hitX = player.x + player.facing * (player.weapon.range * 0.75 * player.scale);
      if (Math.abs(hitX - enemy.x) < (player.weapon.range * 0.7) * enemy.scale && Math.abs(player.y - enemy.y) < 70 * enemy.scale) {
        player.hasDealtDamageThisSwing = true;
        const isFinisher = player.comboStep === 3;
        const titanMult = player.powers.titan > 0 ? 2 : 1;
        const dmg = (player.weapon.dmg + (isFinisher ? 14 : 0)) * titanMult;
        damageEnemy(enemy, dmg, player.weapon.color, isFinisher);
      }
    }

    if (enemy.attackTimer === 10) {
      const hitX = enemy.x + enemy.facing * (45 * enemy.scale);
      if (Math.abs(hitX - player.x) < 38 * enemy.scale && Math.abs(player.y - enemy.y) < 55 * enemy.scale) {
        hurtPlayer(enemy.archetype === 'boss' ? 18 : (enemy.archetype === 'heavy' ? 14 : 9), enemy.facing * 11, 0, enemy);
      }
    }
  });

  enemies = enemies.filter(e => {
    if (e.hp <= 0) {
      levelKills++;
      if (levelKills === 3 || levelKills === 5) {
        auraLevel = levelKills === 3 ? 1 : 2;
        shake = 16;
        window.AudioEngine.playSfx('powerup');
        spawnRing(player.x, player.y - 45, player.auraColor);
        spawnRing(player.x, player.y - 45, '#ffffff');
        spawnParticles(player.x, player.y - 45, player.auraColor, 30, 9);
        spawnDamageText(player.x, player.y - 110, auraLevel === 1 ? '🔥 SUPER HUGO !' : '⚡ NIVEAU 2 !', player.auraColor);
        rumble(300, 0.8, 1);
      }
      const st = window.SaveManager.data.stats;
      st.kills++;
      if (e.archetype === 'boss') st.bosses++;
      addEnergy(e.archetype === 'boss' ? 50 : 18);
      const reward = Math.round((REWARDS[e.archetype] || 15) * comboMult() * diff().reward);
      levelBitsEarned += reward;
      window.SaveManager.addBits(reward);
      document.getElementById('hud-bits').textContent = window.SaveManager.data.bits;

      spawnParticles(e.x, e.y - 40, e.color, 24, 8.5);
      spawnRing(e.x, e.y - 40, e.color);
      if (Math.random() < 0.35) {
        pickups.push({ x: e.x, y: e.y - 20, vx: 0, vy: -5, type: 'heal' });
      }
      if (e.archetype === 'boss') { showBanner('BOSS VAINCU !', '#4ade80', 120); hitStop = 12; }
      if (window.Progress) window.Progress.check();
      return false;
    }
    return true;
  });

  const boss = enemies.find(e => e.archetype === 'boss');
  if (boss) {
    document.getElementById('boss-fill').style.width = Math.max(0, (boss.hp / boss.maxHp) * 100) + '%';
  } else {
    document.getElementById('boss-hud').classList.add('hidden');
  }

  // Ouverture du portail quand tous les ennemis du niveau sont vaincus
  if (!lvl.endless && enemies.length === 0 && !portal.open) {
    portal.open = true;
    spawnRing(portal.x, portal.y + 50, '#4ade80');
    spawnDamageText(portal.x, portal.y - 20, 'PORTAIL OUVERT !', '#4ade80');
    window.AudioEngine.playSfx('powerup');
  }

  // Passage dans le portail de fin de niveau
  if (!lvl.endless && portal.open && Math.abs(player.x - portal.x) < 50 && Math.abs(player.y - (portal.y + 70)) < 85) {
    completeLevel();
  }

  // Mise à jour des puces de pouvoir dans le HUD
  const puBar = document.getElementById('powerups-bar');
  const puKey = Object.entries(player.powers).map(([k, f]) => f > 0 ? `${k}${Math.ceil(f / 60)}` : '').join('|');
  if (puKey === puBar.dataset.key) return;
  puBar.dataset.key = puKey;
  puBar.innerHTML = '';
  Object.entries(player.powers).forEach(([key, frames]) => {
    if (frames > 0) {
      const sec = Math.ceil(frames / 60);
      const chip = document.createElement('span');
      chip.className = 'pu-chip';
      chip.style.borderColor = POWERUP_META[key].color;
      chip.style.color = POWERUP_META[key].color;
      chip.textContent = `${POWERUP_META[key].label} (${sec}s)`;
      puBar.appendChild(chip);
    }
  });
}

// Retourne false (ignoré), true (touché), 'block' (bouclier) ou 'parry' (parade)
function hurtPlayer(dmg, knockVx, knockVy = 0, src = null, unblockable = false) {
  if (player.hitCooldown > 0 || player.dashTimer > 0 || player.hp <= 0) return false;
  dmg = Math.max(1, Math.round(dmg * diff().dmg));

  if (!unblockable) {
    if (player.parryTimer > 0) {
      player.hitCooldown = 20;
      addEnergy(25);
      window.AudioEngine.playSfx('parry');
      spawnRing(player.x + player.facing * 20, player.y - 46, '#ffffff');
      spawnParticles(player.x + player.facing * 24, player.y - 46, '#ffffff', 12, 6);
      spawnDamageText(player.x, player.y - 90, '⚔️ PARADE !', '#ffffff');
      shake = 7;
      rumble(80, 0.5, 0.7);
      if (src) { src.stun = 55; src.vx = -Math.sign(knockVx || 1) * 9; }
      return 'parry';
    }
    if (player.powers.shield > 0 && player.shieldCharges > 0) {
      player.shieldCharges--;
      player.hitCooldown = 25;
      if (player.shieldCharges === 0) player.powers.shield = 0;
      window.AudioEngine.playSfx('block');
      spawnDamageText(player.x, player.y - 85, 'BLOQUÉ !', '#4ade80');
      return 'block';
    }
  }

  player.hp = Math.max(0, player.hp - dmg);
  player.vx = knockVx;
  if (knockVy) player.vy = knockVy;
  player.hitCooldown = 24;
  levelDamageTaken = true;
  combo = 0;
  updateStreakHud();
  shake = 10;
  window.AudioEngine.playSfx('hurt');
  spawnParticles(player.x, player.y - 45, '#f43f5e', 14, 6);
  spawnDamageText(player.x, player.y - 80, `-${dmg}`, '#f43f5e');
  rumble(150, 0.7, 0.9);
  updateHpBar();

  if (player.hp <= 0 && lives > 0 && !curLevel().endless) {
    respawnPlayer();
    return true;
  }
  if (player.hp <= 0) {
    gameState = 'GAMEOVER';
    const lvl = curLevel();
    const extra = document.getElementById('go-extra');
    if (lvl.endless) {
      const reached = Math.max(0, wave - 1);
      const d = window.SaveManager.data;
      if (reached > d.endlessBest) d.endlessBest = reached;
      window.SaveManager.save();
      extra.textContent = `Vagues survécues : ${reached} • Record : ${d.endlessBest}`;
    } else {
      extra.textContent = 'Hugo a été effacé de la mémoire vive. Réessaie !';
    }
    if (window.Progress) window.Progress.check();
    switchScreen('screen-gameover');
  }
  return true;
}

// Mort avec vies restantes : retour au dernier checkpoint
function respawnPlayer() {
  lives--;
  player.hp = player.maxHp;
  player.x = checkpointX;
  player.y = FLOOR_Y - 420;
  player.vx = 0; player.vy = 0;
  player.hitCooldown = 100;
  player.dashTimer = 0;
  combo = 0; comboTimer = 0;
  updateStreakHud();
  updateHpBar();
  enemies.forEach(e => {
    if (e.archetype !== 'boss' && Math.abs(e.x - checkpointX) < 240) e.x = checkpointX + (e.x >= checkpointX ? 1 : -1) * 260;
  });
  enemyProjectiles = [];
  cameraX = Math.max(0, checkpointX - W * 0.38);
  iris = 0.35;
  shake = 6;
  spawnRing(checkpointX, FLOOR_Y - 60, '#4ade80');
  showBanner(`💔 Vie perdue • ${lives} restante${lives > 1 ? 's' : ''}`, '#f43f5e', 120);
}

// --- ACTIONS DU JOUEUR : Nova, parade, emote ---
function useNova() {
  if (gameState !== 'PLAYING' || !player || energy < 100) return;
  energy = 0;
  addEnergy(0);
  window.AudioEngine.playSfx('nova');
  shake = 22;
  rumble(300, 1, 1);
  player.hitCooldown = 30;
  [player.auraColor, '#ffffff', '#38bdf8'].forEach(c => spawnRing(player.x, player.y - 45, c));
  spawnParticles(player.x, player.y - 45, player.auraColor, 40, 12);
  spawnDamageText(player.x, player.y - 115, '💥 NOVA !', '#ffffff');
  enemyProjectiles = [];
  enemies.forEach(e => {
    if (Math.abs(e.x - player.x) < 300 && Math.abs(e.y - player.y) < 200) {
      damageEnemy(e, 55, '#ffffff', true);
      e.stun = 40;
      e.vx = (e.x >= player.x ? 1 : -1) * 14;
    }
  });
}

function parry() {
  if (gameState !== 'PLAYING' || !player || player.parryCooldown > 0 || player.parryTimer > 0) return;
  player.parryTimer = 14;
  player.parryCooldown = 40;
  player.emoteTimer = 0;
  window.AudioEngine.playSfx('swing');
}

function emote() {
  if (gameState === 'PLAYING' && player && player.vy === 0 && player.attackTimer <= 0) player.emoteTimer = 110;
}

// Projectiles ennemis, phases de boss, vagues du mode infini, bandeaux
function updateExtras() {
  const lvl = curLevel();
  if (comboTimer > 0 && --comboTimer === 0) { combo = 0; updateStreakHud(); }
  if (bannerTimer > 0) bannerTimer--;
  if (fade > 0) fade = Math.max(0, fade - 0.025);
  if (iris < 1) iris = Math.min(1, iris + 0.03);

  enemyProjectiles.forEach(pr => {
    pr.x += pr.vx;
    pr.y += pr.vy;
    pr.life--;
    if (Math.abs(pr.x - player.x) < 24 && Math.abs(pr.y - (player.y - 45)) < 46) {
      const r = hurtPlayer(pr.dmg, Math.sign(pr.vx) * 6);
      if (r === 'parry') {
        projectiles.push({ x: pr.x, y: pr.y, vx: -pr.vx * 1.4, vy: 0, color: '#ffffff', dmg: 30, isLaser: true, life: 80 });
        pr.life = 0;
      } else if (r) {
        pr.life = 0;
      }
    }
  });
  enemyProjectiles = enemyProjectiles.filter(pr => pr.life > 0);

  const boss = enemies.find(e => e.archetype === 'boss');
  if (boss) {
    if (!bossIntroDone && Math.abs(boss.x - player.x) < 900) {
      bossIntroDone = true;
      cine = { t: 0, max: 170, boss };
      window.AudioEngine.playSfx('boss');
      shake = 8;
    }
    boss.t = (boss.t || 0) + 1;
    const r = boss.hp / boss.maxHp;
    const ph = r < 0.34 ? 3 : (r < 0.67 ? 2 : 1);
    if (ph > boss.phase) {
      boss.phase = ph;
      showBanner(ph === 2 ? 'PHASE 2 : RENFORTS !' : 'PHASE 3 : FUREUR !', '#f43f5e', 100);
      window.AudioEngine.playSfx('boss');
      shake = 14;
      spawnRing(boss.x, boss.y - 60, '#f43f5e');
      [-180, 180].forEach(dx => {
        const m = new Stickman(Math.max(80, Math.min(lvl.length - 80, boss.x + dx)), ph === 3 ? '#fb923c' : '#f43f5e', false, ph === 3 ? 'fast' : 'normal');
        enemies.push(m);
      });
    }
    if (ph >= 2 && !boss.slam && boss.stun <= 0 && boss.t % (ph === 3 ? 170 : 240) === 0 && boss.y >= FLOOR_Y - 1) {
      boss.vy = -17;
      boss.slam = true;
      boss.air = false;
    }
    if (boss.slam) {
      if (boss.vy < -1) boss.air = true;
      if (boss.air && boss.vy === 0) {
        boss.slam = false;
        window.AudioEngine.playSfx('explosion');
        shake = 18;
        [0, 1, 2].forEach(k => spawnRing(boss.x + (k - 1) * 70, boss.y - 6, '#f43f5e'));
        spawnParticles(boss.x, boss.y - 4, '#f43f5e', 26, 9);
        if (player.vy === 0 && Math.abs(player.x - boss.x) < 270) hurtPlayer(14, (player.x >= boss.x ? 1 : -1) * 10, -8, boss);
      }
    }
  }

  // Mode infini : vague suivante quand l'arène est vide
  if (lvl.endless && enemies.length === 0 && gameState === 'PLAYING') {
    const d = window.SaveManager.data;
    wave++;
    if (wave - 1 > d.endlessBest) d.endlessBest = wave - 1;
    if (window.Progress) window.Progress.check();
    document.getElementById('hud-level-name').textContent = `♾️ Vague ${wave}`;
    showBanner(`VAGUE ${wave}`, '#facc15', 110);
    player.hp = Math.min(player.maxHp, player.hp + 25);
    updateHpBar();
    const isBossWave = wave % 5 === 0;
    const count = Math.min(10, 2 + Math.floor(wave * 0.8));
    const pool = ['normal', 'fast', 'heavy', 'shooter', 'kamikaze', 'flyer'].slice(0, Math.min(6, 2 + Math.floor(wave / 2)));
    const colors = { normal: '#f43f5e', fast: '#fb923c', heavy: '#a855f7', shooter: '#fb7185', kamikaze: '#f97316', flyer: '#c084fc' };
    const spawnX = () => {
      let side = Math.random() < 0.5 ? -1 : 1;
      let x = player.x + side * (520 + Math.random() * 300);
      if (x < 120 || x > lvl.length - 120) x = player.x - side * (520 + Math.random() * 300);
      return Math.max(120, Math.min(lvl.length - 120, x));
    };
    const scale = 1 + 0.07 * wave;
    for (let i = 0; i < count; i++) {
      const a = pool[Math.floor(Math.random() * pool.length)];
      const e = new Stickman(spawnX(), colors[a], false, a);
      e.maxHp = Math.round(e.maxHp * scale);
      e.hp = e.maxHp;
      enemies.push(e);
    }
    if (isBossWave) {
      const b = new Stickman(spawnX(), '#facc15', false, 'boss');
      b.bossName = `⚠️ ROI DU CHAOS • VAGUE ${wave}`;
      b.maxHp = 260 + (wave / 5 - 1) * 120;
      b.hp = b.maxHp;
      enemies.push(b);
      bossIntroDone = false;
      document.getElementById('boss-title').textContent = b.bossName;
      document.getElementById('boss-hud').classList.remove('hidden');
    }
    pickups.push({ x: player.x + 60, y: player.y - 80, vx: 0, vy: -4, type: 'heal' });
  }
}

// Éléments interactifs : plateformes mobiles, piques, tremplins
function updateHazards() {
  platforms.forEach(p => {
    if (!p.range) return;
    const nx = p.baseX + Math.sin(levelTimer * p.speed) * p.range;
    p.dx = nx - p.x;
    p.x = nx;
  });

  platforms.forEach(p => {
    if (!p.crumble) return;
    if (p.state === 'shaking') {
      if (--p.timer <= 0) {
        p.state = 'fallen';
        p.fallen = true;
        p.timer = 220;
        spawnParticles(p.x + p.w / 2, p.y, p.color, 16, 5);
      }
    } else if (p.state === 'fallen') {
      if (--p.timer <= 0) {
        p.state = null;
        p.fallen = false;
        spawnRing(p.x + p.w / 2, p.y, p.color);
      }
    }
  });

  lasers.forEach(l => {
    const ph = (levelTimer + l.offset) % 260;
    l.warn = ph >= 130 && ph < 170;
    l.on = ph >= 170;
    if (ph === 130 || ph === 150) window.AudioEngine.playSfx('laser_warn');
    if (ph === 170) window.AudioEngine.playSfx('laser');
    if (l.on && Math.abs(player.x - l.x) < 15) hurtPlayer(14, (player.x >= l.x ? 1 : -1) * 9, -8, null, true);
  });

  keyItems.forEach((k, i) => {
    if (k.taken || Math.abs(player.x - k.x) > 34 || Math.abs((player.y - 45) - (FLOOR_Y - k.yOff)) > 64) return;
    k.taken = true;
    const d = doors[i];
    if (d) d.open = true;
    window.AudioEngine.playSfx('chest');
    spawnRing(k.x, FLOOR_Y - k.yOff, '#facc15');
    spawnParticles(k.x, FLOOR_Y - k.yOff, '#facc15', 18, 6);
    showBanner('🔑 CLÉ ! Une porte s\'ouvre', '#facc15', 110);
  });
  doors.forEach(d => { if (d.open && d.slide < 1) d.slide = Math.min(1, d.slide + 0.03); });
  checkpoints.forEach(cp => {
    if (!cp.on && player.x > cp.x) {
      cp.on = true;
      checkpointX = cp.x;
      window.AudioEngine.playSfx('powerup');
      spawnRing(cp.x, FLOOR_Y - 60, '#4ade80');
      spawnParticles(cp.x, FLOOR_Y - 70, '#4ade80', 16, 5);
      showBanner('🚩 Checkpoint', '#4ade80', 80);
    }
  });

  winds.forEach(w => {
    if (player.x > w.x && player.x < w.x + w.w) player.x += w.force * (player.vy === 0 ? 0.6 : 1);
  });

  chests.forEach(c => {
    if (!c.opened && Math.abs(player.x - c.x) < 34 && Math.abs((player.y - 45) - c.y) < 62) {
      c.opened = true;
      levelChestFound = true;
      window.AudioEngine.playSfx('chest');
      spawnParticles(c.x, c.y, '#facc15', 24, 8);
      spawnRing(c.x, c.y, '#facc15');
      spawnDamageText(c.x, c.y - 40, '🎁 COFFRE !', '#facc15');
      const powers = Object.keys(POWERUP_META);
      pickups.push({ x: c.x, y: c.y - 20, vx: 0, vy: -6, type: 'powerup', power: powers[Math.floor(Math.random() * powers.length)] });
      if (Math.random() < 0.4) { lives++; spawnDamageText(c.x, c.y - 66, '❤️ +1 VIE', '#f43f5e'); }
      for (let i = 0; i < 8; i++) pickups.push({ x: c.x, y: c.y - 16, vx: (Math.random() - 0.5) * 8, vy: -5 - Math.random() * 5, type: 'bit' });
    }
  });

  const feet = player.y >= FLOOR_Y - 14;
  if (feet && player.hitCooldown === 0 && player.dashTimer <= 0) {
    if (spikes.some(sp => player.x > sp.x && player.x < sp.x + sp.w)) hurtPlayer(12, -player.facing * 9, -11, null, true);
  }
  springs.forEach(sp => {
    if (sp.squash > 0) sp.squash--;
    if (player.vy >= 0 && feet && Math.abs(player.x - (sp.x + sp.w / 2)) < sp.w / 2 + 10) {
      player.vy = -25;
      player.springing = true;
      player.jumpsLeft = 1;
      sp.squash = 12;
      window.AudioEngine.playSfx('jump');
      spawnRing(sp.x + sp.w / 2, FLOOR_Y - 8, '#4ade80');
    }
  });
}

function damageEnemy(enemy, dmg, color, isFinisher = false) {
  if (auraLevel > 0) dmg = Math.round(dmg * (1 + auraLevel * 0.2)); // bonus d'aura : +20 % / +40 %
  dmg = Math.round(dmg * (1 + 0.08 * window.SaveManager.data.talents.dmg));
  combo++;
  comboTimer = 150;
  const st = window.SaveManager.data.stats;
  if (combo > st.bestCombo) st.bestCombo = combo;
  updateStreakHud();
  addEnergy(8);
  enemy.hp -= dmg;
  const resist = enemy.archetype === 'boss' ? 0.35 : (enemy.archetype === 'heavy' ? 0.65 : 1);
  enemy.vx = player.facing * (isFinisher ? 18 : 10) * resist;
  enemy.vy = (isFinisher ? -11.5 : -5) * resist;
  enemy.hitCooldown = 8;
  hitStop = Math.max(hitStop, isFinisher ? 5 : 2);
  shake = isFinisher ? 12 : 6;
  window.AudioEngine.playSfx(isFinisher ? 'finisher' : 'hit');
  spawnParticles(enemy.x, enemy.y - 45 * enemy.scale, color, isFinisher ? 20 : 10, 7);
  spawnDamageText(enemy.x, enemy.y - 85 * enemy.scale, isFinisher ? `${dmg}!` : `${dmg}`, color);
  rumble(isFinisher ? 120 : 60, isFinisher ? 0.8 : 0.4, isFinisher ? 0.9 : 0.5);
}

function completeLevel() {
  gameState = 'VICTORY';
  window.AudioEngine.playSfx('victory');
  window.SaveManager.unlockLevel(currentLevelIdx + 1);

  const totalSec = Math.floor(levelTimer / 60);
  const mins = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const secs = String(totalSec % 60).padStart(2, '0');
  const par = curLevel().length / 58; // ~45 s pour 2600 px
  const rank = totalSec < par ? 'S' : (totalSec < par * 1.65 ? 'A' : 'B');
  window.SaveManager.setBestRank(curLevel().id, rank);

  const sv = window.SaveManager.data, lid = curLevel().id, prevBest = sv.bestTimes[lid];
  const isRecord = !prevBest || levelTimer < prevBest;
  if (isRecord) { sv.bestTimes[lid] = levelTimer; sv.ghosts[lid] = ghostRec.slice(); window.SaveManager.save(); }
  document.getElementById('vic-best').innerHTML = isRecord ? '🏆 <strong style="color:#facc15">NOUVEAU RECORD !</strong> (fantôme enregistré)' : `🏁 Record : <strong>${fmtTime(prevBest)}</strong>`;
  document.getElementById('vic-title').textContent = curLevel().name;
  document.getElementById('vic-time').textContent = `${mins}:${secs}`;
  document.getElementById('vic-kills').textContent = levelKills;
  document.getElementById('vic-bits').textContent = `+${levelBitsEarned}`;
  document.getElementById('vic-rank').textContent = rank;
  document.getElementById('vic-challenges').innerHTML = window.Progress.completeChallenges(
    curLevel().id, { nodmg: !levelDamageTaken, rankS: rank === 'S', chest: levelChestFound });
  document.getElementById('menu-bits').textContent = window.SaveManager.data.bits;
  window.Progress.check();

  const nextBtn = document.getElementById('btn-next-level');
  if (currentLevelIdx + 1 < window.GAME_LEVELS.length) {
    nextBtn.style.display = 'block';
  } else {
    nextBtn.style.display = 'none';
  }

  switchScreen('screen-victory');
}

// --- RENDU DU MONDE & DÉCOR ---
function drawWorld() {
  const lvl = curLevel();
  const grad = ctx.createRadialGradient(W * 0.5, H * 0.35, 80, W * 0.5, H * 0.5, Math.max(W, H) * 0.9);
  grad.addColorStop(0, lvl.theme.bg2);
  grad.addColorStop(0.55, lvl.theme.bg1);
  grad.addColorStop(1, '#090d16');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Grille avec parallaxe
  ctx.save();
  ctx.strokeStyle = lvl.theme.grid;
  ctx.lineWidth = 1;
  const gridSize = 48;
  const offsetX = -(cameraX * 0.4) % gridSize;
  for (let x = offsetX; x < W; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, FLOOR_Y); ctx.stroke();
  }
  for (let y = 0; y < FLOOR_Y; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  ctx.restore();

  // Décors animés en parallaxe propres à chaque monde
  window.Scenery.drawBackground(ctx, { lvl, cameraX, W, H, floor: FLOOR_Y, t: globalTime / 60 });

  // Caméra horizontale
  ctx.save();
  ctx.translate(-cameraX, 0);

  // Zones de vent
  winds.forEach(w => {
    ctx.save();
    ctx.fillStyle = 'rgba(148, 163, 184, 0.06)';
    ctx.fillRect(w.x, 60, w.w, FLOOR_Y - 60);
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.35)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 16; i++) {
      const sx = w.x + ((((i * 97 + levelTimer * w.force * 3) % w.w) + w.w) % w.w);
      const sy = 90 + ((i * 53) % Math.max(40, FLOOR_Y - 130));
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + Math.sign(w.force) * 22, sy);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(226, 232, 240, 0.5)';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(w.force > 0 ? '»»»' : '«««', w.x + w.w / 2 - 20, 84);
    ctx.restore();
  });

  // Lasers
  lasers.forEach(l => {
    ctx.save();
    ctx.fillStyle = '#334155';
    ctx.fillRect(l.x - 12, 0, 24, 18);
    ctx.fillRect(l.x - 12, FLOOR_Y - 8, 24, 8);
    if (l.warn) {
      ctx.strokeStyle = `rgba(244, 63, 94, ${0.25 + 0.4 * Math.abs(Math.sin(levelTimer * 0.4))})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath(); ctx.moveTo(l.x, 18); ctx.lineTo(l.x, FLOOR_Y - 8); ctx.stroke();
    } else if (l.on) {
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 24;
      ctx.fillStyle = '#fda4af';
      ctx.fillRect(l.x - 7, 18, 14, FLOOR_Y - 26);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(l.x - 3, 18, 6, FLOOR_Y - 26);
    }
    ctx.restore();
  });

  // Checkpoints
  checkpoints.forEach(cp => {
    if (!inView(cp.x, 40)) return;
    ctx.save();
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cp.x, FLOOR_Y); ctx.lineTo(cp.x, FLOOR_Y - 84); ctx.stroke();
    ctx.fillStyle = cp.on ? '#4ade80' : '#64748b';
    ctx.shadowColor = cp.on ? '#4ade80' : 'transparent';
    ctx.shadowBlur = cp.on ? 14 : 0;
    const wv = Math.sin(globalTime * 0.12) * (cp.on ? 5 : 1);
    ctx.beginPath(); ctx.moveTo(cp.x, FLOOR_Y - 84); ctx.quadraticCurveTo(cp.x + 18, FLOOR_Y - 84 + wv, cp.x + 34, FLOOR_Y - 76); ctx.quadraticCurveTo(cp.x + 18, FLOOR_Y - 68 - wv, cp.x, FLOOR_Y - 62); ctx.fill();
    ctx.restore();
  });

  // Portes verrouillées + clés
  doors.forEach(d => {
    if (d.slide >= 1 || !inView(d.x, 40)) return;
    const top = -20, bottom = FLOOR_Y - (FLOOR_Y + 20) * d.slide;
    ctx.save();
    ctx.shadowColor = '#facc15'; ctx.shadowBlur = 16;
    ctx.fillStyle = 'rgba(30,27,75,0.92)';
    ctx.strokeStyle = '#facc15'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.rect(d.x - 14, top, 28, bottom - top); ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(250,204,21,0.25)'; ctx.lineWidth = 1;
    for (let y = ((globalTime * 0.5) % 24); y < bottom - top; y += 24) { ctx.beginPath(); ctx.moveTo(d.x - 14, top + y); ctx.lineTo(d.x + 14, top + y); ctx.stroke(); }
    const ly = Math.min(bottom - 40, FLOOR_Y - 110);
    ctx.fillStyle = '#facc15';
    ctx.beginPath(); ctx.roundRect(d.x - 8, ly, 16, 13, 3); ctx.fill();
    ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(d.x, ly, 5, Math.PI, 0); ctx.stroke();
    ctx.restore();
  });
  keyItems.forEach(k => {
    if (k.taken || !inView(k.x, 30)) return;
    const ky = FLOOR_Y - k.yOff + Math.sin(globalTime * 0.08 + k.x) * 6;
    ctx.save();
    ctx.translate(k.x, ky);
    ctx.rotate(Math.sin(globalTime * 0.05) * 0.2);
    ctx.shadowColor = '#facc15'; ctx.shadowBlur = 18;
    ctx.strokeStyle = '#facc15'; ctx.fillStyle = '#facc15'; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, -8, 7, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -1); ctx.lineTo(0, 16); ctx.moveTo(0, 10); ctx.lineTo(7, 10); ctx.moveTo(0, 15); ctx.lineTo(6, 15); ctx.stroke();
    ctx.restore();
  });

  // Fantôme de ton meilleur run
  if (ghostActor && inView(ghostActor.x, 60)) {
    ctx.save();
    ctx.globalAlpha = 0.38;
    ghostActor.renderSkeleton(ghostActor.x, ghostActor.y, '#a5b4fc', true);
    ctx.restore();
  }

  // Coffres cachés
  chests.forEach(c => {
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.shadowColor = c.opened ? 'transparent' : '#facc15';
    ctx.shadowBlur = 16;
    ctx.fillStyle = c.opened ? '#475569' : '#b45309';
    ctx.strokeStyle = c.opened ? '#94a3b8' : '#facc15';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.roundRect(-16, -8, 32, 22, 4); ctx.fill(); ctx.stroke();
    ctx.beginPath();
    if (c.opened) { ctx.moveTo(-16, -8); ctx.lineTo(-12, -20); ctx.lineTo(12, -20); ctx.lineTo(16, -8); }
    else { ctx.roundRect(-16, -16, 32, 10, [6, 6, 0, 0]); }
    ctx.fill(); ctx.stroke();
    if (!c.opened) { ctx.fillStyle = '#facc15'; ctx.fillRect(-3, -4, 6, 8); }
    ctx.restore();
  });

  // Piques au sol
  spikes.forEach(sp => {
    if (!inView(sp.x, sp.w)) return;
    ctx.save();
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#e2e8f0';
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2;
    const n = Math.max(2, Math.round(sp.w / 22));
    const tw = sp.w / n;
    for (let i = 0; i < n; i++) {
      ctx.beginPath();
      ctx.moveTo(sp.x + i * tw, FLOOR_Y);
      ctx.lineTo(sp.x + i * tw + tw / 2, FLOOR_Y - 24);
      ctx.lineTo(sp.x + (i + 1) * tw, FLOOR_Y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  });

  // Tremplins : plaque, ressort en zigzag, plateau qui s'écrase au rebond
  springs.forEach(sp => {
    if (!inView(sp.x, sp.w)) return;
    const top = FLOOR_Y - 20 + sp.squash * 1.1;
    ctx.save();
    ctx.shadowColor = '#4ade80';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#166534';
    ctx.fillRect(sp.x + 2, FLOOR_Y - 5, sp.w - 4, 5);
    ctx.strokeStyle = '#bbf7d0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(sp.x + 12, FLOOR_Y - 5);
    for (let i = 0; i < 5; i++) ctx.lineTo(sp.x + (i % 2 ? sp.w - 12 : 12), FLOOR_Y - 5 - ((i + 1) / 5) * (FLOOR_Y - 5 - top - 5));
    ctx.stroke();
    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.roundRect(sp.x, top - 5, sp.w, 7, 3);
    ctx.fill();
    ctx.restore();
  });

  // Plateformes
  platforms.forEach(p => {
    if (p.fallen || !inView(p.x, p.w)) return;
    ctx.save();
    if (p.state === 'shaking') ctx.translate((Math.random() - 0.5) * 4, 0);
    // ombre portée
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.roundRect(p.x + 4, p.y + 9, p.w, p.h, 7);
    ctx.fill();
    // corps « verre » en dégradé
    const pg = ctx.createLinearGradient(0, p.y, 0, p.y + p.h);
    pg.addColorStop(0, 'rgba(71, 85, 105, 0.96)');
    pg.addColorStop(1, 'rgba(15, 23, 42, 0.96)');
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = pg;
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(p.x, p.y, p.w, p.h, 7);
    ctx.fill();
    ctx.shadowBlur = 0;
    if (p.crumble) ctx.setLineDash([7, 5]); // pointillés = plateforme fragile
    ctx.stroke();
    ctx.setLineDash([]);
    // reflet + boutons de fenêtre
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.fillRect(p.x + 3, p.y + 2, p.w - 6, 4);
    ['#ff5f56', '#ffbd2e', '#27c93f'].forEach((col, k) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(p.x + 12 + k * 12, p.y + 12, 3.2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '600 10px sans-serif';
    ctx.fillText(p.title, p.x + 50, p.y + 15);
    ctx.restore();
  });

  // Blocs Mystères [?]
  mysteryBlocks.forEach(b => {
    if (!inView(b.x, b.w)) return;
    ctx.save();
    const by = b.y + b.bounce + (b.used ? 0 : Math.sin(globalTime * 0.06 + b.x) * 1.5);
    const isHeal = b.type === 'heal';
    const baseColor = b.used ? '#475569' : (isHeal ? '#4ade80' : '#facc15');
    ctx.shadowColor = b.used ? 'transparent' : baseColor;
    ctx.shadowBlur = 14;
    ctx.fillStyle = baseColor;
    ctx.beginPath();
    ctx.roundRect(b.x, by, b.w, b.h, 8);
    ctx.fill();

    if (!b.used) { // reflet qui balaie le bloc
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(b.x, by, b.w, b.h, 8);
      ctx.clip();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.38)';
      ctx.fillRect(b.x + ((globalTime * 0.8 + b.x) % 100) - 25, by, 8, b.h);
      ctx.restore();
    }
    ctx.fillStyle = '#090d16';
    ctx.font = '900 20px sans-serif';
    ctx.fillText(b.used ? '•' : (isHeal ? '+' : '?'), b.x + 14, by + 28);
    ctx.restore();
  });

  // Portail de fin de niveau
  if (portal && inView(portal.x, 80)) {
    ctx.save();
    const open = portal.open;
    const pColor = open ? '#4ade80' : '#64748b';
    const cx = portal.x, cy = portal.y + 55;
    if (open) {
      const pgrad = ctx.createRadialGradient(cx, cy, 4, cx, cy, 60);
      pgrad.addColorStop(0, 'rgba(187, 247, 208, 0.55)');
      pgrad.addColorStop(1, 'rgba(74, 222, 128, 0)');
      ctx.fillStyle = pgrad;
      ctx.beginPath(); ctx.ellipse(cx, cy, 44, 76, 0, 0, Math.PI * 2); ctx.fill();
      ctx.shadowColor = pColor;
      ctx.shadowBlur = 18;
      ctx.strokeStyle = pColor;
      ctx.lineWidth = 3;
      for (let k = 0; k < 4; k++) { // anneaux qui tournent en sens inverse
        ctx.globalAlpha = 0.85 - k * 0.18;
        ctx.setLineDash([12, 8]);
        ctx.lineDashOffset = -globalTime * (1 + k * 0.6) * (k % 2 ? -1 : 1);
        ctx.beginPath(); ctx.ellipse(cx, cy, 28 - k * 6, 52 - k * 10, 0, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#d1fae5';
      for (let k = 0; k < 6; k++) { // étincelles en orbite
        const a = globalTime * 0.05 + k * 1.05;
        ctx.beginPath(); ctx.arc(cx + Math.cos(a) * 30, cy + Math.sin(a) * 56, 2.2, 0, Math.PI * 2); ctx.fill();
      }
    } else {
      ctx.strokeStyle = pColor;
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.ellipse(cx, cy, 28, 52, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = pColor; // cadenas
      ctx.fillRect(cx - 8, cy - 4, 16, 13);
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(cx, cy - 4, 6, Math.PI, 0); ctx.stroke();
    }
    ctx.shadowBlur = 0;
    ctx.fillStyle = pColor;
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(open ? 'SORTIE' : 'VERROUILLÉ', cx - 28, portal.y - 10);
    ctx.restore();
  }

  // Pickups (Bits, Soins, Pouvoirs)
  pickups.forEach(pk => {
    if (!inView(pk.x, 20)) return;
    ctx.save();
    const c = pk.type === 'bit' ? '#facc15' : (pk.type === 'heal' ? '#4ade80' : POWERUP_META[pk.power].color);
    ctx.shadowColor = c;
    ctx.shadowBlur = 14;
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(pk.x, pk.y, pk.type === 'bit' ? 8 : 13, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#090d16';
    ctx.font = 'bold 12px sans-serif';
    const sym = pk.type === 'bit' ? 'B' : (pk.type === 'heal' ? '+' : '⚡');
    ctx.fillText(sym, pk.x - 4, pk.y + 4);
    ctx.restore();
  });

  if (gameState === 'TITLE') {
    drawTitleScene();
  } else {
    if (player) player.draw();
    enemies.forEach(e => { if (inView(e.x, 80)) e.draw(); });
  }

  // Projectiles ennemis
  enemyProjectiles.forEach(pr => {
    ctx.save();
    ctx.shadowColor = '#fb7185';
    ctx.shadowBlur = 16;
    ctx.fillStyle = '#fb7185';
    ctx.beginPath(); ctx.arc(pr.x, pr.y, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff1f2';
    ctx.beginPath(); ctx.arc(pr.x, pr.y, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  });

  // Projectiles
  projectiles.forEach(p => {
    if (!inView(p.x, 30)) return;
    ctx.save();
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 14;
    ctx.fillStyle = p.color;
    if (p.isLaser) {
      ctx.beginPath();
      ctx.roundRect(p.x - 14, p.y - 3, 28, 6, 3);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });

  // Particules
  particles.forEach(pt => {
    if (!inView(pt.x, 40)) return;
    ctx.save();
    ctx.globalAlpha = pt.life / pt.maxLife;
    if (pt.isRing) {
      ctx.strokeStyle = pt.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });

  // Textes flottants
  floatingTexts.forEach(ft => {
    ctx.save();
    ctx.globalAlpha = ft.life / 40;
    ctx.fillStyle = ft.color;
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(ft.text, ft.x - 15, ft.y);
    ctx.restore();
  });

  ctx.restore();

  // Sol : barre des tâches, puis vignette et effets de lumière
  const sceneParams = { lvl, cameraX, W, H, floor: FLOOR_Y, t: globalTime / 60, accent: lvl.theme.accent };
  window.Scenery.drawFloor(ctx, sceneParams);
  window.Scenery.drawVignette(ctx, sceneParams);
}

// Animations visuelles : avancent d'un pas fixe (60 Hz), indépendamment du rendu
function updateEffects() {
  mysteryBlocks.forEach(b => { if (b.bounce < 0) b.bounce += 1.2; });
  particles.forEach(pt => {
    if (pt.isRing) {
      pt.radius += 3.8;
    } else {
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.vy += 0.25;
    }
    pt.life--;
  });
  particles = particles.filter(pt => pt.life > 0);
  floatingTexts.forEach(ft => { ft.y -= 1.2; ft.life--; });
  floatingTexts = floatingTexts.filter(ft => ft.life > 0);
}

// --- CONTRÔLES CLAVIER & MANETTE XBOX ---
const keys = {};
let activeGamepad = null;
let prevGpButtons = {};
let hatAxis = -1;
let navPrev = { up: false, down: false, left: false, right: false };
// F2 : affiche l'état brut de la manette (aide au diagnostic)
let debugGp = false;
const debugEl = document.createElement('pre');
debugEl.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:200;margin:0;padding:8px;background:rgba(0,0,0,.8);color:#4ade80;font:11px monospace;display:none;pointer-events:none';
document.body.appendChild(debugEl);
window.addEventListener('keydown', e => {
  if (e.code === 'F2') { debugGp = !debugGp; debugEl.style.display = debugGp ? 'block' : 'none'; }
});

window.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (e.code === 'Escape') {
    if (gameState === 'PLAYING') {
      gameState = 'PAUSED';
      switchScreen('screen-pause');
    } else if (gameState === 'PAUSED') {
      gameState = 'PLAYING';
      switchScreen(null);
    }
    return;
  }
  if (gameState === 'GAMEOVER' && e.code === 'Enter') {
    loadLevel(currentLevelIdx);
    return;
  }
  if (gameState !== 'PLAYING' || !player) return;
  if (cine) { if (e.code === 'Space' || e.code === 'Enter') cine = null; return; }
  if (e.code === 'KeyF') player.attack();
  if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') player.jump();
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') player.dash();
  if (e.code === 'KeyE') player.switchWeapon();
  if (e.code === 'KeyR') useNova();
  if (e.code === 'KeyC') parry();
  if (e.code === 'KeyG') emote();
});
window.addEventListener('keyup', e => {
  keys[e.code] = false;
  if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') cutJump();
});
// Relâcher tôt = saut plus court
function cutJump() {
  if (player && gameState === 'PLAYING' && player.vy < -6 && !player.springing && player.hitCooldown === 0 && player.dashTimer <= 0) player.vy *= 0.5;
}
window.addEventListener('blur', () => {
  Object.keys(keys).forEach(k => keys[k] = false);
  if (gameState === 'PLAYING') { gameState = 'PAUSED'; switchScreen('screen-pause'); }
});
window.addEventListener('mousedown', e => {
  if (gameState === 'PLAYING' && e.target.tagName === 'CANVAS' && player) {
    player.attack();
  }
});

function getConnectedGamepad() {
  if (!navigator.getGamepads) return null;
  const pads = navigator.getGamepads();
  for (let i = 0; i < pads.length; i++) {
    if (pads[i] && pads[i].connected) {
      if (!activeGamepad) {
        document.getElementById('gp-status').style.color = '#4ade80';
        document.getElementById('gp-status').textContent = '🎮 Manette Xbox active';
        document.getElementById('title-gp-hint').textContent = '🎮 Manette Xbox connectée — Appuie sur A pour jouer';
      }
      activeGamepad = pads[i];
      return pads[i];
    }
  }
  return null;
}

function rumble(duration = 80, weak = 0.4, strong = 0.6) {
  if (!window.SaveManager.data.options.rumble) return;
  const gp = getConnectedGamepad();
  if (gp && gp.vibrationActuator) {
    gp.vibrationActuator.playEffect('dual-rumble', {
      startDelay: 0,
      duration,
      weakMagnitude: weak,
      strongMagnitude: strong
    }).catch(() => {});
  }
}

function pollGamepad() {
  const gp = getConnectedGamepad();
  const state = {
    left: keys['ArrowLeft'] || keys['KeyA'],
    right: keys['ArrowRight'] || keys['KeyD'],
    down: keys['ArrowDown'] || keys['KeyS'],
    up: false
  };
  if (!gp) return state;

  if (gp.axes[0] < -0.25 || gp.buttons[14]?.pressed) state.left = true;
  if (gp.axes[0] > 0.25 || gp.buttons[15]?.pressed) state.right = true;
  if (gp.axes[1] > 0.5 || gp.buttons[13]?.pressed) state.down = true;
  if (gp.axes[1] < -0.5 || gp.buttons[12]?.pressed) state.up = true;
  // Manettes génériques (SNES USB…) : la croix peut être un « hat » sur un axe à part (valeur de repos 1.2857)
  if (gp.mapping !== 'standard') {
    if (hatAxis < 0) hatAxis = gp.axes.findIndex((v, i) => i >= 2 && Math.abs(v - 1.2857) < 0.06);
    if (hatAxis >= 0) {
      const h = Math.round((gp.axes[hatAxis] + 1) * 3.5); // 0=haut, 1=haut-droite … 7=haut-gauche, 8=neutre
      if (h >= 1 && h <= 3) state.right = true;
      if (h >= 3 && h <= 5) state.down = true;
      if (h >= 5 && h <= 7) state.left = true;
      if (h === 7 || h <= 1) state.up = true;
    } else if (gp.buttons.length <= 12) { // sans hat : certaines SNES envoient la croix sur les axes 2/3
      if (gp.axes[2] < -0.5) state.left = true;
      if (gp.axes[2] > 0.5) state.right = true;
      if (gp.axes[3] > 0.5) state.down = true;
      if (gp.axes[3] < -0.5) state.up = true;
    }
  }
  if (debugGp) {
    debugEl.textContent = `${gp.id}\nmapping: "${gp.mapping}"\naxes: ${gp.axes.map(a => a.toFixed(2)).join(' ')}\nboutons: ${gp.buttons.map((b, k) => b.pressed ? k : '').filter(x => x !== '').join(' ')}\nhat: ${hatAxis}`;
  }

  const justPressed = (idx) => {
    const pressed = !!gp.buttons[idx]?.pressed;
    const wasPressed = !!prevGpButtons[idx];
    prevGpButtons[idx] = pressed;
    return pressed && !wasPressed;
  };

  const aDown = !!gp.buttons[0]?.pressed;
  const aWasDown = !!prevGpButtons[0];
  const A = justPressed(0);
  const B = justPressed(1);
  const START = justPressed(9);

  if (START && (gameState === 'PLAYING' || gameState === 'PAUSED')) {
    if (gameState === 'PLAYING') { gameState = 'PAUSED'; switchScreen('screen-pause'); }
    else { gameState = 'PLAYING'; switchScreen(null); }
    return state;
  }

  // Menus : croix = déplacer le focus, A/B = valider (écran titre : Start aussi)
  const overlay = document.querySelector('.overlay:not(.hidden)');
  if (overlay) {
    const items = [...overlay.querySelectorAll('button:not([disabled]), .level-card:not(.locked)')].filter(b => b.offsetParent !== null);
    const step = ((state.down && !navPrev.down) || (state.right && !navPrev.right)) ? 1
      : (((state.up && !navPrev.up) || (state.left && !navPrev.left)) ? -1 : 0);
    navPrev = { up: state.up, down: state.down, left: state.left, right: state.right };
    let idx = items.indexOf(document.activeElement);
    if (step && items.length) {
      idx = idx < 0 ? 0 : (idx + step + items.length) % items.length;
      items[idx].focus();
      window.AudioEngine.playSfx('step');
    }
    if ((A || B || (START && overlay.id === 'screen-title')) && items.length) {
      items[Math.max(0, idx)].click();
    }
    return { left: false, right: false, down: false, up: false };
  }
  navPrev = { up: false, down: false, left: false, right: false };

  if (gameState !== 'PLAYING' || !player) return state;
  if (cine) { if (A) cine = null; return state; }
  if (!aDown && aWasDown) cutJump(); // bouton relâché : saut plus court
  if (A) player.jump();
  if (justPressed(2) || justPressed(7)) player.attack();
  if (B || justPressed(5)) player.dash();
  if (justPressed(3)) player.switchWeapon();
  if (justPressed(4)) useNova();
  if (justPressed(6) || justPressed(8)) parry();

  return state;
}

