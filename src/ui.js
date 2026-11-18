// Menus, vestiaire, options, boucle principale et initialisation
// --- NAVIGATION MENUS & VESTIAIRE ---
function enterTitle() {
  gameState = 'TITLE';
  platforms = []; mysteryBlocks = []; enemies = []; projectiles = []; enemyProjectiles = [];
  pickups = []; particles = []; floatingTexts = [];
  spikes = []; springs = []; lasers = []; winds = []; chests = [];
  portal = null;
  player = null;
  bannerTimer = 0;
  fade = 0;
  auraLevel = 1; // le héros court avec son aura dans le menu
  currentLevelIdx = Math.min(window.SaveManager.data.unlockedLevel, window.GAME_LEVELS.length - 1);
}

function switchScreen(screenId) {
  if (screenId === 'screen-title' && gameState !== 'TITLE') enterTitle();
  if (screenId === 'screen-title') renderProfile();
  document.querySelectorAll('.overlay').forEach(el => el.classList.add('hidden'));
  if (screenId) {
    document.getElementById(screenId).classList.remove('hidden');
    document.getElementById('hud').classList.add('hidden');
  }
  document.getElementById('menu-bits').textContent = window.SaveManager.data.bits;
  document.getElementById('wardrobe-bits').textContent = window.SaveManager.data.bits;
}

function renderLevelsGrid() {
  const grid = document.getElementById('levels-grid');
  grid.innerHTML = '';
  const unlocked = window.SaveManager.data.unlockedLevel;

  window.GAME_LEVELS.forEach((lvl, idx) => {
    const isLocked = idx > unlocked;
    const card = document.createElement('div');
    card.tabIndex = isLocked ? -1 : 0;
    card.className = `level-card ${isLocked ? 'locked' : ''}`;
    const d = window.SaveManager.data;
    const ch = d.challenges[lvl.id] || {};
    const stars = (ch.nodmg ? 1 : 0) + (ch.rankS ? 1 : 0) + (ch.chest ? 1 : 0);
    const rank = d.bestRanks[lvl.id];
    const WORLD_ICON = { 1: '🖥️', 2: '🎨', 3: '⚙️', 4: '🌐', 5: '☁️', 6: '💀' };
    card.style.setProperty('--accent', lvl.theme.accent);
    card.style.background = `linear-gradient(135deg, ${lvl.theme.bg1}dd, ${lvl.theme.bg2}ee)`;
    card.innerHTML = `
      <div class="lv-top"><span class="lv-ico">${WORLD_ICON[lvl.id[0]] || '🎮'}</span><span class="lv-id">${lvl.id}</span>${rank ? `<span class="lv-rank r-${rank}">${rank}</span>` : ''}</div>
      <div class="world-tag" style="color:${lvl.theme.accent}">${lvl.world}</div>
      <h3>${lvl.name.split(':')[1] ? lvl.name.split(':')[1].trim() : lvl.name}</h3>
      <p>${lvl.desc}</p>
      <div class="lv-foot"><span>${isLocked ? 'Verrouillé' : (rank ? 'Terminé' + (d.bestTimes[lvl.id] ? ' • ⏱ ' + fmtTime(d.bestTimes[lvl.id]) : '') : 'Disponible')}</span><span class="lv-stars">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</span></div>
    `;
    if (!isLocked) {
      card.addEventListener('click', () => loadLevel(idx));
    }
    grid.appendChild(card);
  });
}

let activeWardrobeTab = 'colors';
let tryOn = {}; // objet essayé au survol (non acheté) : { slot: id }
function setTryOn(slot, item) {
  tryOn = item ? { [slot]: item.id } : {};
  document.getElementById('preview-label').textContent = item ? `Essai : ${item.name.replace('🏆 ', '')}` : 'Aperçu en direct';
}
function renderOutfits() {
  const box = document.getElementById('outfits');
  box.innerHTML = '';
  const save = window.SaveManager.data;
  save.outfits.forEach((o, i) => {
    const load = document.createElement('button');
    load.className = 'outfit-btn';
    load.textContent = o ? `👕 Tenue ${i + 1}` : `Tenue ${i + 1} (vide)`;
    load.disabled = !o;
    load.addEventListener('click', () => { save.equipped = { ...save.equipped, ...o }; window.SaveManager.save(); window.AudioEngine.playSfx('powerup'); renderWardrobe(); });
    const sv = document.createElement('button');
    sv.className = 'outfit-btn save';
    sv.textContent = '💾';
    sv.title = `Enregistrer l'équipement actuel dans la tenue ${i + 1}`;
    sv.addEventListener('click', () => { save.outfits[i] = { ...save.equipped }; window.SaveManager.save(); window.AudioEngine.playSfx('chest'); renderOutfits(); });
    const g = document.createElement('span');
    g.className = 'outfit-slot';
    g.appendChild(load); g.appendChild(sv);
    box.appendChild(g);
  });
}
function renderWardrobe() {
  setTryOn(null, null);
  renderOutfits();
  document.getElementById('wardrobe-bits').textContent = window.SaveManager.data.bits;
  const container = document.getElementById('wardrobe-items');
  container.innerHTML = '';
  const items = window.WARDROBE_CATALOG[activeWardrobeTab];
  const save = window.SaveManager.data;

  const eqKeyMap = { colors: 'color', hats: 'hat', capes: 'cape', weapons: 'weaponSkin', auras: 'aura', heads: 'head', emotes: 'emote' };
  const eqKey = eqKeyMap[activeWardrobeTab];

  items.forEach(item => {
    const isUnlocked = item.price === 0 || save.unlockedItems.includes(item.id);
    const isEquipped = save.equipped[eqKey] === item.id;
    const card = document.createElement('div');
    card.className = `item-card ${isEquipped ? 'equipped' : ''}`;

    let btnHtml = '';
    if (item.achievement && !isUnlocked) {
      btnHtml = `<button class="item-btn" disabled>🔒 Succès</button>`;
    } else if (isEquipped) {
      btnHtml = `<button class="item-btn equipped">Équipé</button>`;
    } else if (isUnlocked) {
      btnHtml = `<button class="item-btn equip">Équiper</button>`;
    } else {
      btnHtml = `<button class="item-btn buy">🪙 ${item.price}</button>`;
    }

    card.innerHTML = `
      <div class="item-info">
        <h4>${((item.hex && !item.rainbow) || (item.tint && item.tint !== 'rainbow' && item.tint)) ? `<i style="display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px;background:${item.hex || item.tint}"></i>` : ''}${item.name}</h4>
        <span>${item.desc}</span>
      </div>
      ${btnHtml}
    `;

    const btn = card.querySelector('button');
    // essai avant achat : survol, focus clavier ou manette
    card.addEventListener('mouseenter', () => setTryOn(eqKey, item));
    card.addEventListener('mouseleave', () => setTryOn(eqKey, null));
    btn.addEventListener('focus', () => setTryOn(eqKey, item));
    btn.addEventListener('blur', () => setTryOn(eqKey, null));
    if (item.achievement && !isUnlocked) { container.appendChild(card); return; }
    btn.addEventListener('click', () => {
      if (isEquipped) return;
      if (isUnlocked) {
        save.equipped[eqKey] = item.id;
        window.SaveManager.save();
        window.AudioEngine.playSfx('jump');
        renderWardrobe();
      } else if (save.bits >= item.price) {
        save.bits -= item.price;
        save.unlockedItems.push(item.id);
        save.equipped[eqKey] = item.id;
        window.SaveManager.save();
        window.AudioEngine.playSfx('powerup');
        renderWardrobe();
      } else {
        window.AudioEngine.playSfx('hurt');
      }
    });

    container.appendChild(card);
  });
}

// Aperçu animé dans le vestiaire
const previewCanvas = document.getElementById('preview-canvas');
const pCtx = previewCanvas.getContext('2d');
const previewDummy = new Stickman(130, '#38bdf8', true);
previewDummy.y = 240;

// Stickman équipé, dessiné pieds en (0,0) : sert au vestiaire et à la carte profil
function drawStickFigure(c, time, pose, showAura, mood = 'neutral', auraLvl = 2) {
  const eq = window.SaveManager.data.equipped;
  const color = previewDummy.activeColor;
  c.save();
  if (pose === 2 && eq.emote === 'emote_spin') { c.translate(0, -36); c.scale(Math.cos(time * 5), 1); c.translate(0, 36); }
  if (showAura) window.WardrobeRenderer.drawAura(c, 0, 0, 1, auraLvl, previewDummy.auraColor, time / 3);
  window.WardrobeRenderer.drawCape(c, eq.cape, 0, -70, 1, 2, 0, time);

  c.strokeStyle = color;
  c.shadowColor = color;
  c.shadowBlur = 12;
  c.lineWidth = 4.8;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  window.WardrobeRenderer.headPath(c, eq.head, 0, -86); c.stroke();
  previewDummy.drawBackWeapon(0, -68, c);
  if (showAura) window.WardrobeRenderer.drawHair(c, 0, -86, previewDummy.auraColor, time);
  window.WardrobeRenderer.drawFace(c, 0, -86, 1, time, false, '#f8fafc', mood);
  window.WardrobeRenderer.drawHat(c, eq.hat, 0, -86, 1, time, previewDummy.weapon.color);

  c.beginPath(); c.moveTo(0, -70); c.lineTo(0, -36); c.stroke();
  c.beginPath(); c.moveTo(0, -36); c.lineTo(-12, 0); c.moveTo(0, -36); c.lineTo(14, 0); c.stroke();
  c.beginPath();
  if (pose === 2) emoteLimbs(eq.emote, time * 20, 0, -68, 1, (x1, y1, jx, jy, x2, y2) => { c.moveTo(x1, y1); c.lineTo(jx, jy); c.lineTo(x2, y2); });
  else if (pose === 1) { c.moveTo(0, -68); c.lineTo(-16, -52); c.lineTo(-6, -42); c.moveTo(0, -68); c.lineTo(16, -52); c.lineTo(6, -42); }
  else { c.moveTo(0, -68); c.lineTo(-14, -46); c.moveTo(0, -68); c.lineTo(16, -48); }
  c.stroke();
  c.save();
  c.shadowBlur = 0;
  c.strokeStyle = 'rgba(255,255,255,0.6)';
  c.lineWidth = 3;
  c.beginPath(); c.moveTo(-5, -38); c.lineTo(5, -38); c.stroke(); // ceinture
  c.fillStyle = previewDummy.weapon.color;
  c.shadowColor = c.fillStyle;
  c.shadowBlur = 8;
  c.beginPath(); c.arc(0, -53, 3, 0, Math.PI * 2); c.fill(); // noyau d'énergie
  c.restore();
  c.restore();
}

function drawWardrobePreview() {
  pCtx.clearRect(0, 0, 260, 320);
  pCtx.fillStyle = 'rgba(56, 189, 248, 0.15)';
  pCtx.beginPath();
  pCtx.ellipse(130, 245, 55, 14, 0, 0, Math.PI * 2);
  pCtx.fill();

  previewDummy.animTime += 0.05;
  const pose = (activeWardrobeTab === 'emotes' || tryOn.emote) ? 2 : Math.floor(previewDummy.animTime / 6) % 3; // 0 repos • 1 héros • 2 victoire/emote
  const d = window.SaveManager.data;
  const real = d.equipped;
  d.equipped = { ...real, ...tryOn }; // l'objet essayé remplace temporairement l'équipement
  try {
    pCtx.save();
    pCtx.translate(130, 240);
    pCtx.scale(1.4, 1.4);
    drawStickFigure(pCtx, previewDummy.animTime, pose, activeWardrobeTab === 'auras' || !!tryOn.aura, pose === 2 ? 'happy' : 'neutral');
    pCtx.restore();
  } finally {
    d.equipped = real;
  }
}

// --- MENU PRINCIPAL : héros qui court, carte profil, portrait de HUD ---
let titleHero = null;
let titleChasers = [];
let avatarTime = 0;
const profileCtx = document.getElementById('profile-avatar').getContext('2d');
const hudAvatarCtx = document.getElementById('hud-avatar').getContext('2d');

function titleActors() {
  if (titleHero) return;
  titleHero = new Stickman(0, '#38bdf8', true);
  titleChasers = [new Stickman(0, '#f43f5e', false, 'normal'), new Stickman(0, '#fb923c', false, 'fast'), new Stickman(0, '#a855f7', false, 'heavy')];
}

function drawTitleScene() {
  titleActors();
  const hx = cameraX + W * 0.55;
  titleHero.x = hx; titleHero.y = FLOOR_Y; titleHero.vx = 7.4; titleHero.vy = 0; titleHero.facing = 1;
  titleChasers.forEach((e, i) => {
    e.x = hx - 210 - i * 130 + Math.sin(globalTime * 0.03 + i) * 22;
    e.y = FLOOR_Y; e.vx = 5; e.vy = 0; e.facing = 1;
    e.draw();
  });
  titleHero.draw();
}

function playerXp(d) {
  const ach = Object.keys(d.achievements).length;
  const xp = d.stats.kills * 10 + Math.min(9, d.unlockedLevel) * 100 + ach * 50 + d.stats.bestCombo * 5;
  const lvl = Math.floor(Math.sqrt(xp / 40)) + 1;
  const base = 40 * (lvl - 1) ** 2, next = 40 * lvl ** 2;
  return { xp, lvl, pct: (xp - base) / (next - base), into: xp - base, need: next - base, ach };
}

function renderProfile() {
  const d = window.SaveManager.data;
  const x = playerXp(d);
  const RANKS = [[16, 'Légende'], [12, 'Maître'], [8, 'Élite'], [5, 'Vétéran'], [3, 'Soldat'], [1, 'Recrue']];
  document.getElementById('profile-lvl').textContent = x.lvl;
  document.getElementById('profile-rank').textContent = RANKS.find(r => x.lvl >= r[0])[1];
  document.getElementById('profile-xp').style.width = Math.round(x.pct * 100) + '%';
  document.getElementById('profile-xp-label').textContent = `${x.into} / ${x.need} XP`;
  const sRanks = Object.values(d.bestRanks).filter(r => r === 'S').length;
  const total = window.Progress ? window.Progress.ACHIEVEMENTS.length : 0;
  const chips = [
    ['⚔️', d.stats.kills, 'Ennemis'], ['🏆', `${x.ach}/${total}`, 'Succès'], ['🔥', d.stats.bestCombo, 'Combo max'],
    ['🗺️', `${Math.min(9, d.unlockedLevel)}/${window.GAME_LEVELS.length}`, 'Donjons'], ['⭐', sRanks, 'Rangs S'], ['♾️', d.endlessBest, 'Record infini']
  ];
  document.getElementById('profile-stats').innerHTML = chips.map(([i, v, k]) => `<div class="stat-chip"><div class="v">${i} ${v}</div><div class="k">${k}</div></div>`).join('');
  const C = window.WARDROBE_CATALOG;
  const eq = d.equipped;
  const names = [C.colors.find(i => i.id === eq.color), C.hats.find(i => i.id === eq.hat), C.capes.find(i => i.id === eq.cape), C.weapons.find(i => i.id === eq.weaponSkin), C.auras.find(i => i.id === eq.aura)];
  document.getElementById('profile-equip').innerHTML = names.filter(Boolean).map(i => `<span class="equip-chip">${i.name.replace('🏆 ', '')}</span>`).join('');
  const idx = Math.min(d.unlockedLevel, window.GAME_LEVELS.length - 1);
  document.getElementById('play-sub').textContent = `Continuer • Niveau ${window.GAME_LEVELS[idx].id}`;
  document.getElementById('endless-sub').textContent = d.endlessBest ? `Record : ${d.endlessBest} vague(s)` : 'Vagues sans fin';
  document.getElementById('progress-sub').textContent = `Talents • ${x.ach}/${total} succès`;
}

function drawProfileAvatar() {
  const c = profileCtx;
  c.clearRect(0, 0, 150, 190);
  c.fillStyle = 'rgba(56, 189, 248, 0.22)';
  c.beginPath(); c.ellipse(75, 174, 46, 10, 0, 0, Math.PI * 2); c.fill();
  const pose = Math.floor(avatarTime / 5) % 3;
  c.save();
  c.translate(75, 172);
  c.scale(1.32, 1.32);
  drawStickFigure(c, avatarTime, pose, true, pose === 2 ? 'happy' : 'neutral', 1);
  c.restore();
}

// Portrait du HUD : anneau de vie autour de la tête équipée
function drawHudAvatar() {
  if (!player) return;
  const c = hudAvatarCtx;
  c.clearRect(0, 0, 60, 60);
  const ratio = Math.max(0, player.hp / player.maxHp);
  c.lineWidth = 4;
  c.strokeStyle = 'rgba(255,255,255,0.15)';
  c.beginPath(); c.arc(30, 30, 26, 0, Math.PI * 2); c.stroke();
  c.strokeStyle = ratio > 0.5 ? '#4ade80' : (ratio > 0.25 ? '#facc15' : '#f43f5e');
  c.lineCap = 'round';
  c.beginPath(); c.arc(30, 30, 26, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio); c.stroke();
  c.fillStyle = 'rgba(15, 23, 42, 0.92)';
  c.beginPath(); c.arc(30, 30, 22, 0, Math.PI * 2); c.fill();
  c.save();
  c.translate(30, 37);
  c.scale(0.85, 0.85);
  c.strokeStyle = player.activeColor;
  c.lineWidth = 3.6;
  c.beginPath(); c.arc(0, -2, 12, 0, Math.PI * 2); c.stroke();
  if (auraLevel > 0) window.WardrobeRenderer.drawHair(c, 0, -2, player.auraColor, globalTime / 20);
  window.WardrobeRenderer.drawFace(c, 0, -2, 1, globalTime / 20, false, '#f8fafc', player.hitCooldown > 0 ? 'hurt' : 'neutral');
  window.WardrobeRenderer.drawHat(c, window.SaveManager.data.equipped.hat, 0, -2, 1, globalTime / 20, player.weapon.color);
  c.restore();
}

// Boutons UI
document.getElementById('btn-play').addEventListener('click', () => {
  loadLevel(Math.min(window.SaveManager.data.unlockedLevel, window.GAME_LEVELS.length - 1));
});
document.getElementById('btn-endless').addEventListener('click', () => startEndless());
document.getElementById('btn-progress').addEventListener('click', () => {
  window.Progress.render();
  switchScreen('screen-progress');
});
document.getElementById('btn-levels').addEventListener('click', () => {
  renderLevelsGrid();
  switchScreen('screen-levels');
});
document.getElementById('btn-wardrobe').addEventListener('click', () => {
  renderWardrobe();
  switchScreen('screen-wardrobe');
});
document.getElementById('btn-options').addEventListener('click', () => {
  document.getElementById('opt-sfx').checked = window.SaveManager.data.options.sfx;
  document.getElementById('opt-music').checked = window.SaveManager.data.options.music;
  document.getElementById('opt-rumble').checked = window.SaveManager.data.options.rumble;
  document.getElementById('opt-shake').checked = window.SaveManager.data.options.shake;
  document.getElementById('opt-difficulty').value = window.SaveManager.data.options.difficulty;
  document.getElementById('opt-ghost').checked = window.SaveManager.data.options.ghost;
  document.getElementById('opt-vol-sfx').value = window.SaveManager.data.options.volSfx;
  document.getElementById('opt-vol-music').value = window.SaveManager.data.options.volMusic;
  switchScreen('screen-options');
});
document.getElementById('btn-quit').addEventListener('click', () => ipcRenderer.send('quit-app'));

document.querySelectorAll('[data-back]').forEach(btn => {
  btn.addEventListener('click', () => {
    let target = btn.getAttribute('data-back');
    if (target === 'screen-title' && gameState === 'PAUSED') target = 'screen-pause';
    else if (target === 'screen-title' && gameState === 'VICTORY') target = 'screen-victory';
    switchScreen(target);
  });
});

document.querySelectorAll('.tab[data-cat]').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab[data-cat]').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    activeWardrobeTab = tab.getAttribute('data-cat');
    renderWardrobe();
  });
});

document.getElementById('opt-sfx').addEventListener('change', e => { window.SaveManager.data.options.sfx = e.target.checked; window.SaveManager.save(); });
document.getElementById('opt-music').addEventListener('change', e => { window.SaveManager.data.options.music = e.target.checked; window.SaveManager.save(); });
document.getElementById('opt-rumble').addEventListener('change', e => { window.SaveManager.data.options.rumble = e.target.checked; window.SaveManager.save(); });
document.getElementById('opt-shake').addEventListener('change', e => { window.SaveManager.data.options.shake = e.target.checked; window.SaveManager.save(); });
document.getElementById('opt-difficulty').addEventListener('change', e => { window.SaveManager.data.options.difficulty = e.target.value; window.SaveManager.save(); });
document.getElementById('opt-ghost').addEventListener('change', e => { window.SaveManager.data.options.ghost = e.target.checked; window.SaveManager.save(); });
[['opt-vol-sfx', 'volSfx'], ['opt-vol-music', 'volMusic']].forEach(([id, key]) => {
  document.getElementById(id).addEventListener('input', e => {
    window.SaveManager.data.options[key] = +e.target.value;
    window.AudioEngine.setVolumes();
    window.SaveManager.saveSoon();
  });
});
document.getElementById('opt-reset').addEventListener('click', e => {
  const btn = e.target;
  if (btn.dataset.armed) {
    window.SaveManager.reset();
    location.reload();
    return;
  }
  btn.dataset.armed = '1';
  btn.textContent = 'Cliquer pour CONFIRMER';
  setTimeout(() => { delete btn.dataset.armed; btn.textContent = 'Réinitialiser'; }, 4000);
});
document.getElementById('opt-fullscreen').addEventListener('click', () => ipcRenderer.send('toggle-fullscreen'));

document.getElementById('btn-resume').addEventListener('click', () => { gameState = 'PLAYING'; switchScreen(null); });
document.getElementById('btn-restart-level').addEventListener('click', () => loadLevel(currentLevelIdx));
document.getElementById('btn-pause-wardrobe').addEventListener('click', () => { renderWardrobe(); switchScreen('screen-wardrobe'); });
document.getElementById('btn-to-menu').addEventListener('click', () => { switchScreen('screen-title'); });

document.getElementById('btn-next-level').addEventListener('click', () => loadLevel(currentLevelIdx + 1));
document.getElementById('btn-vic-wardrobe').addEventListener('click', () => { renderWardrobe(); switchScreen('screen-wardrobe'); });
document.getElementById('btn-vic-menu').addEventListener('click', () => { switchScreen('screen-title'); });

document.getElementById('btn-go-retry').addEventListener('click', () => loadLevel(currentLevelIdx));
document.getElementById('btn-go-menu').addEventListener('click', () => { switchScreen('screen-title'); });

// --- BOUCLE PRINCIPALE (pas fixe 60 Hz : même vitesse sur écrans 60/120/144 Hz) ---
const STEP_MS = 1000 / 60;
let lastFrame = performance.now();
let accumulator = 0;

function tick(gpState) {
  globalTime++;
  if (shake > 0.5) shake *= 0.84;
  if (gameState === 'TITLE') {
    cameraX += 1.6; // le décor défile derrière le menu
    titleActors();
    titleHero.animTime += 0.33;
    titleChasers.forEach((e, i) => { e.animTime += 0.27 + i * 0.04; });
    avatarTime += 0.04;
    return;
  }
  if (gameState === 'VICTORY' && player) {
    // Danse de victoire + confettis
    player.animTime += 0.05;
    if (globalTime % 7 === 0) spawnParticles(player.x + (Math.random() - 0.5) * 160, player.y - 150, ['#facc15', '#f472b6', '#38bdf8', '#4ade80'][Math.floor(Math.random() * 4)], 4, 3);
    updateEffects();
    return;
  }
  if (gameState !== 'PLAYING' || !player) return;
  if (hitStop > 0) { hitStop--; return; }

  if (cine) {
    cine.t++;
    const lv = curLevel();
    const focus = cine.t < cine.max * 0.7 ? cine.boss.x - W * 0.5 : player.x - W * camBias;
    cameraX += (Math.max(0, Math.min(lv.length - W, focus)) - cameraX) * 0.08;
    cine.boss.animTime += 0.05;
    if (cine.t === 50) { shake = 14; window.AudioEngine.playSfx('explosion'); spawnRing(cine.boss.x, cine.boss.y - 60, '#f43f5e'); spawnParticles(cine.boss.x, cine.boss.y - 50, '#f43f5e', 22, 8); }
    updateEffects();
    if (cine.t >= cine.max) cine = null;
    return;
  }

  levelTimer++;
  const lvl = curLevel();
  if (!lvl.endless && levelTimer % 3 === 0) ghostRec.push(Math.round(player.x), Math.round(FLOOR_Y - player.y), player.facing);
  if (ghostActor) {
    const k = Math.floor(levelTimer / 3) * 3, f = (levelTimer % 3) / 3;
    if (k + 5 < ghostData.length) {
      const ax = ghostData[k], bx = ghostData[k + 3], ay = ghostData[k + 1], by = ghostData[k + 4];
      ghostActor.x = ax + (bx - ax) * f;
      ghostActor.y = FLOOR_Y - (ay + (by - ay) * f);
      ghostActor.vx = (bx - ax) / 3;
      ghostActor.vy = Math.abs(by - ay) > 0.5 ? 1 : 0;
      ghostActor.facing = ghostData[k + 2];
      ghostActor.animTime += Math.abs(ghostActor.vx) * 0.045 + 0.02;
    } else ghostActor = null;
  }
  updateHazards();
  player.update(gpState, lvl.length);
  enemies.forEach(e => e.update({}, lvl.length));
  updateCombatAndPickups();
  updateExtras();
  updateEffects();

  // Caméra fluide centrée sur le joueur
  camBias += ((player.facing > 0 ? 0.34 : 0.62) - camBias) * 0.03;
  const targetCam = Math.max(0, Math.min(lvl.length - W, player.x - W * camBias));
  if (globalTime % 6 === 0) drawHudAvatar();
  if (levelTimer % 10 === 0) {
    const best = window.SaveManager.data.bestTimes[lvl.id];
    document.getElementById('hud-info').textContent = `⏱️ ${fmtTime(levelTimer)} • 👾 ${enemies.length}${lvl.endless ? '' : ` • ❤️ ×${lives}`}${best ? ` • 🏁 ${fmtTime(best)}` : ''}`;
  }
  cameraX += (targetCam - cameraX) * 0.12;
}

function mainLoop(now) {
  accumulator = Math.min(accumulator + (now - lastFrame), STEP_MS * 5);
  lastFrame = now;
  const gpState = pollGamepad();
  while (accumulator >= STEP_MS) {
    tick(gpState);
    accumulator -= STEP_MS;
  }

  ctx.save();
  if (shake > 0.5 && window.SaveManager.data.options.shake) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
  drawWorld();
  if (fade > 0) {
    ctx.fillStyle = `rgba(0, 0, 0, ${fade})`;
    ctx.fillRect(0, 0, W, H);
  }
  if (gameState !== 'TITLE' && curLevel()) window.Scenery.drawWeather(ctx, { lvl: curLevel(), cameraX, W, H, t: globalTime / 60 });
  if (iris < 1 && player && gameState === 'PLAYING') {
    const e = 1 - Math.pow(1 - iris, 3);
    ctx.save();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    ctx.arc(player.x - cameraX, player.y - 46, Math.max(0.1, e * Math.hypot(W, H)), 0, Math.PI * 2);
    ctx.fill('evenodd');
    ctx.restore();
  }
  if (cine) {
    const bar = H * 0.13 * Math.min(1, cine.t / 18, (cine.max - cine.t) / 18);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, bar);
    ctx.fillRect(0, H - bar, W, bar);
    const a = Math.max(0, Math.min(1, (cine.t - 30) / 20, (cine.max - cine.t) / 20));
    ctx.save();
    ctx.globalAlpha = a;
    ctx.textAlign = 'center';
    ctx.shadowColor = '#f43f5e'; ctx.shadowBlur = 30;
    ctx.fillStyle = '#fecaca';
    ctx.font = '900 ' + Math.round(Math.min(58, W / 16)) + 'px sans-serif';
    ctx.fillText(cine.boss.bossName, W / 2, H * 0.3);
    ctx.font = '600 18px sans-serif';
    ctx.fillStyle = '#f87171';
    ctx.fillText('Espace / A : passer', W / 2, H - bar - 16);
    ctx.restore();
  }
  if (gameState === 'PLAYING' && portal && portal.open) {
    // flèche vers la sortie quand elle est hors de l'écran
    const sx = portal.x - cameraX;
    if (sx < 30 || sx > W - 30) {
      const right = sx > 0;
      const ax = right ? W - 50 : 50, ay = FLOOR_Y - 90, dir = right ? 1 : -1;
      ctx.save();
      ctx.globalAlpha = 0.6 + 0.4 * Math.sin(globalTime * 0.15);
      ctx.fillStyle = '#4ade80';
      ctx.shadowColor = '#4ade80';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(ax + dir * 22, ay);
      ctx.lineTo(ax - dir * 10, ay - 18);
      ctx.lineTo(ax - dir * 10, ay + 18);
      ctx.closePath();
      ctx.fill();
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SORTIE', ax, ay - 28);
      ctx.restore();
    }
  }
  if (bannerTimer > 0 && gameState === 'PLAYING' && !cine) {
    const a = Math.min(1, bannerTimer / 30, (150 - Math.min(150, bannerTimer)) / 12 + 0.2);
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, a));
    ctx.textAlign = 'center';
    ctx.font = '900 44px sans-serif';
    ctx.shadowColor = bannerColor;
    ctx.shadowBlur = 24;
    ctx.fillStyle = bannerColor;
    ctx.fillText(bannerText, W / 2, H * 0.28);
    ctx.restore();
  }
  if (!document.getElementById('screen-wardrobe').classList.contains('hidden')) {
    drawWardrobePreview();
  }
  if (gameState === 'TITLE' && !document.getElementById('screen-title').classList.contains('hidden')) drawProfileAvatar();
  ctx.restore();
  requestAnimationFrame(mainLoop);
}

// Initialisation
enterTitle();
switchScreen('screen-title');
requestAnimationFrame(mainLoop);