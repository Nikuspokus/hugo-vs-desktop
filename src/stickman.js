// Classe Stickman (joueur et ennemis) + emotes
// Bras de l'emote équipée (partagé entre le jeu et l'aperçu du vestiaire)
function emoteLimbs(kind, t, sx, sy, f, limb) {
  const w = Math.sin(t * 0.3) * 6;
  if (kind === 'emote_wave') {
    limb(sx, sy, sx + f * 12, sy - 14, sx + f * 16 + w * 1.5, sy - 34);
    limb(sx, sy, sx - f * 8, sy + 14, sx - f * 4, sy + 22);
  } else if (kind === 'emote_flex') {
    const p = Math.sin(t * 0.3) * 3;
    limb(sx, sy, sx - 20, sy + 2, sx - 20, sy - 16 - p);
    limb(sx, sy, sx + 20, sy + 2, sx + 20, sy - 16 - p);
  } else if (kind === 'emote_dance') {
    const k = Math.sin(t * 0.35);
    limb(sx, sy, sx - 14, sy - 10 * k, sx - 20, sy - 30 * Math.max(0, k));
    limb(sx, sy, sx + 14, sy + 10 * k, sx + 20, sy - 30 * Math.max(0, -k));
  } else if (kind === 'emote_spin') {
    limb(sx, sy, sx - 16, sy + 2, sx - 32, sy + 4);
    limb(sx, sy, sx + 16, sy + 2, sx + 32, sy + 4);
  } else {
    limb(sx, sy, sx - 12, sy - 12, sx - 18 + w, sy - 32);
    limb(sx, sy, sx + 12, sy - 12, sx + 18 - w, sy - 32);
  }
}

// --- CLASSE STICKMAN ---
class Stickman {
  constructor(x, color, isPlayer = false, archetype = 'normal') {
    this.x = x;
    this.y = FLOOR_Y;
    this.vx = 0;
    this.vy = 0;
    this.color = color;
    this.isPlayer = isPlayer;
    this.archetype = archetype;
    this.baseScale = archetype === 'boss' ? 1.55 : (archetype === 'heavy' ? 1.2 : (archetype === 'kamikaze' ? 0.9 : 1.0));
    this.facing = 1;

    if (isPlayer) {
      this.maxHp = 100 + 20 * window.SaveManager.data.talents.hp;
    } else if (archetype === 'boss') {
      this.maxHp = 260;
    } else if (archetype === 'heavy') {
      this.maxHp = 70;
    } else if (archetype === 'kamikaze') {
      this.maxHp = 22;
    } else if (archetype === 'flyer') {
      this.maxHp = 34;
    } else {
      this.maxHp = 40;
    }
    if (!isPlayer) this.maxHp = Math.round(this.maxHp * diff().hp);
    this.hp = this.maxHp;
    this.animTime = 0;

    this.jumpsLeft = 2;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.afterImages = [];

    this.stun = 0;
    this.jumpBuf = 0;
    this.springing = false;
    this.shootTimer = 70 + Math.random() * 60;
    this.parryTimer = 0;
    this.parryCooldown = 0;
    this.emoteTimer = 0;
    this.phase = 1;
    this.flies = archetype === 'flyer';
    if (this.flies) this.y = FLOOR_Y - 140;

    this.weaponIdx = 0;
    this.attackTimer = 0;
    this.comboStep = 0;
    this.comboResetTimer = 0;
    this.hitCooldown = 0;
    this.hasDealtDamageThisSwing = false;

    // Pouvoirs temporaires
    this.powers = { overclock: 0, titan: 0, shield: 0, magnet: 0 };
    this.shieldCharges = 0;
  }

  get scale() {
    if (this.isPlayer && this.powers.titan > 0) return 1.35;
    return this.baseScale;
  }

  get activeColor() {
    if (!this.isPlayer) return this.color;
    const eqColor = window.WARDROBE_CATALOG.colors.find(c => c.id === window.SaveManager.data.equipped.color);
    return eqColor ? eqColor.hex : '#38bdf8';
  }

  get auraColor() {
    const a = window.WARDROBE_CATALOG.auras.find(x => x.id === window.SaveManager.data.equipped.aura);
    if (a && a.rainbow) { // arc-en-ciel : HSL -> hex
      const h = (globalTime * 3) % 360, f = n => { const k = (n + h / 30) % 12; return Math.round(255 * (0.5 - 0.5 * Math.max(-1, Math.min(k - 3, 9 - k, 1)))).toString(16).padStart(2, '0'); };
      return `#${f(0)}${f(8)}${f(4)}`;
    }
    return a ? a.hex : '#facc15';
  }

  get weapon() {
    const base = WEAPONS[this.weaponIdx];
    const skin = window.WARDROBE_CATALOG.weapons.find(w => w.id === window.SaveManager.data.equipped.weaponSkin);
    return {
      ...base,
      color: (this.isPlayer && skin && skin.tint)
        ? (skin.tint === 'rainbow' ? `hsl(${(globalTime * 4) % 360}, 90%, 60%)` : skin.tint)
        : base.color
    };
  }

  activatePower(powerType) {
    const meta = POWERUP_META[powerType];
    if (!meta) return;
    this.powers[powerType] = meta.duration;
    if (powerType === 'shield') this.shieldCharges = 3;
    window.AudioEngine.playSfx('powerup');
    spawnRing(this.x, this.y - 45, meta.color);
    spawnDamageText(this.x, this.y - 95, meta.label, meta.color);
  }

  switchWeapon() {
    this.weaponIdx = (this.weaponIdx + 1) % WEAPONS.length;
    const tag = document.getElementById('weapon-name');
    tag.textContent = this.weapon.name;
    tag.style.background = this.weapon.color;
    spawnRing(this.x, this.y - 45, this.weapon.color);
    window.AudioEngine.playSfx('jump');
  }

  jump() {
    if (this.jumpsLeft > 0) {
      this.emoteTimer = 0;
      const isDouble = this.jumpsLeft === 1;
      const boost = this.powers.overclock > 0 ? 1.12 : 1;
      this.vy = (isDouble ? -15 : -16) * boost;
      this.jumpsLeft--;
      window.AudioEngine.playSfx('jump');
      if (isDouble) {
        spawnRing(this.x, this.y, this.activeColor);
        spawnParticles(this.x, this.y, this.activeColor, 10, 4.5);
        rumble(40, 0.2, 0.2);
      } else {
        spawnParticles(this.x, this.y, '#ffffff', 6, 3);
      }
    } else if (this.isPlayer) {
      this.jumpBuf = 7; // saut mémorisé : se déclenche à l'atterrissage
    }
  }

  dash() {
    if (this.dashCooldown <= 0 && this.dashTimer <= 0) {
      this.dashTimer = 9;
      this.dashCooldown = this.powers.overclock > 0 ? 18 : 30;
      this.vx = this.facing * 21;
      this.vy = 0;
      window.AudioEngine.playSfx('dash');
      spawnParticles(this.x, this.y - 40, this.activeColor, 12, 5.5);
      rumble(50, 0.3, 0.3);
    }
  }

  attack() {
    if (this.attackTimer <= 0) {
      this.emoteTimer = 0;
      this.comboStep = (this.comboStep % 3) + 1;
      const speedMult = (this.isPlayer && this.powers.overclock > 0) ? 0.65 : 1;
      this.attackTimer = this.isPlayer ? Math.round(this.weapon.cooldown * speedMult) : 22;
      this.comboResetTimer = 48;
      this.hasDealtDamageThisSwing = false;

      if (this.isPlayer) {
        document.getElementById('combo-badge').textContent = this.comboStep > 1 ? `COMBO x${this.comboStep}!` : '';
      }

      this.vx = this.facing * (this.isPlayer ? (this.comboStep === 3 ? 9 : 4.5) : 2.5);

      if (this.isPlayer && this.weapon.id === 'brush') {
        window.AudioEngine.playSfx('swing');
        const paintColors = ['#ff007f', '#00f2fe', '#facc15', '#a855f7', '#4ade80'];
        const pColor = paintColors[Math.floor(Math.random() * paintColors.length)];
        projectiles.push({
          x: this.x + this.facing * 45,
          y: this.y - 52,
          vx: this.facing * 14,
          vy: (this.comboStep - 2) * 1.5,
          color: pColor,
          dmg: this.powers.titan > 0 ? 36 : 20,
          isLaser: false,
          life: 55
        });
      } else if (this.isPlayer && this.weapon.id === 'cursor') {
        window.AudioEngine.playSfx('laser');
        projectiles.push({
          x: this.x + this.facing * 48,
          y: this.y - 50,
          vx: this.facing * 19,
          vy: 0,
          color: this.weapon.color,
          dmg: this.powers.titan > 0 ? 40 : 23,
          isLaser: true,
          life: 45
        });
      } else if (this.isPlayer) {
        window.AudioEngine.playSfx('swing');
      }
    }
  }

  specialAI() {
    const dist = player.x - this.x;
    const adist = Math.abs(dist);
    const distY = player.y - this.y;
    if (adist > 760) {
      this.vx *= 0.8;
      if (this.flies) this.vy *= 0.9;
      return;
    }
    this.facing = dist > 0 ? 1 : -1;

    if (this.archetype === 'shooter') {
      if (adist < 240) this.vx = -this.facing * 2.2;
      else if (adist > 430) this.vx = this.facing * 1.8;
      else this.vx *= 0.8;
      if (--this.shootTimer <= 0 && adist < 680) {
        this.shootTimer = 100 + Math.random() * 50;
        enemyProjectiles.push({ x: this.x + this.facing * 30, y: this.y - 50, vx: this.facing * 5.4, vy: 0, life: 160, dmg: 8 });
        window.AudioEngine.playSfx('shoot');
        spawnParticles(this.x + this.facing * 30, this.y - 50, '#fb7185', 6, 3);
      }
    } else if (this.archetype === 'kamikaze') {
      this.vx = this.facing * 4.3;
      if (distY < -90 && this.jumpsLeft === 2 && Math.random() < 0.03) this.jump();
      if (adist < 50 && Math.abs(distY) < 70) this.explode();
    } else if (this.flies) {
      const swoop = adist < 220;
      const ty = swoop ? player.y - 35 : player.y - 150 + Math.sin(globalTime * 0.05 + this.x) * 25;
      this.vy = Math.max(-6, Math.min(6, (ty - this.y) * 0.06));
      this.vx = adist > 60 ? this.facing * 2.6 : this.vx * 0.8;
      if (adist < 70 && Math.abs(distY) < 80 && Math.random() < 0.03) this.attack();
    }
  }

  explode() {
    if (this.hp <= 0) return;
    this.hp = 0;
    window.AudioEngine.playSfx('explosion');
    spawnParticles(this.x, this.y - 30, '#f97316', 34, 10);
    spawnRing(this.x, this.y - 30, '#f97316');
    spawnRing(this.x, this.y - 30, '#facc15');
    shake = 14;
    if (Math.abs(player.x - this.x) < 120 && Math.abs(player.y - this.y) < 90) {
      hurtPlayer(20, (player.x >= this.x ? 1 : -1) * 12, -9, this);
    }
  }

  update(gpState, levelLength) {
    if (this.vy >= 0) this.springing = false;
    if (this.jumpBuf > 0) {
      this.jumpBuf--;
      if (this.jumpsLeft > 0) { this.jumpBuf = 0; this.jump(); }
    }
    if (this.parryTimer > 0) this.parryTimer--;
    if (this.parryCooldown > 0) this.parryCooldown--;
    if (this.emoteTimer > 0) {
      this.emoteTimer--;
      if (globalTime % 6 === 0) spawnParticles(this.x, this.y - 100, ['#facc15', '#f472b6', '#38bdf8', '#4ade80'][Math.floor(Math.random() * 4)], 3, 4);
    }
    if (this.hitCooldown > 0) this.hitCooldown--;
    if (this.dashCooldown > 0) this.dashCooldown--;
    if (this.attackTimer > 0) this.attackTimer--;
    if (this.comboResetTimer > 0) {
      this.comboResetTimer--;
      if (this.comboResetTimer === 0) {
        this.comboStep = 0;
        if (this.isPlayer) document.getElementById('combo-badge').textContent = '';
      }
    }

    if (this.isPlayer) {
      Object.keys(this.powers).forEach(k => {
        if (this.powers[k] > 0) this.powers[k]--;
      });
    }

    if (this.dashTimer > 0) {
      this.dashTimer--;
      this.afterImages.push({ x: this.x, y: this.y, alpha: 0.7 });
      if (this.isPlayer) spawnParticles(this.x - this.facing * 14, this.y - 20 - Math.random() * 50, this.activeColor, 1, 1.6);
    }
    this.afterImages.forEach(img => img.alpha -= 0.08);
    this.afterImages = this.afterImages.filter(img => img.alpha > 0);

    if (this.isPlayer) {
      const moveSpeed = (this.powers.overclock > 0 ? 10.2 : 7.4) * (1 + 0.04 * window.SaveManager.data.talents.spd);
      if (this.dashTimer <= 0) {
        if (gpState.left) { this.vx = -moveSpeed; this.facing = -1; }
        else if (gpState.right) { this.vx = moveSpeed; this.facing = 1; }
        else { this.vx *= 0.78; }
      }
      if (this.emoteTimer > 0 && (gpState.left || gpState.right)) this.emoteTimer = 0;
    } else if (this.stun > 0) {
      this.stun--;
      this.vx *= 0.85;
    } else if (this.archetype === 'shooter' || this.archetype === 'kamikaze' || this.archetype === 'flyer') {
      this.specialAI();
    } else {
      const dist = player.x - this.x;
      const distY = player.y - this.y;
      if (Math.abs(dist) < 680) {
        this.facing = dist > 0 ? 1 : -1;
        const baseSpeed = this.archetype === 'fast' ? 3.2 : (this.archetype === 'heavy' ? 1.5 : (this.archetype === 'boss' ? 2.0 * (1 + 0.25 * (this.phase - 1)) : 2.1));
        const stopDist = this.archetype === 'boss' ? 88 : 68;

        if (Math.abs(dist) > stopDist) {
          this.vx = this.facing * baseSpeed;
        } else {
          this.vx *= 0.8;
          if (Math.random() < (this.archetype === 'boss' ? 0.045 : 0.03)) this.attack();
        }
        if (distY < -90 && this.jumpsLeft === 2 && Math.random() < 0.018) {
          this.jump();
        }
      } else {
        this.vx *= 0.8;
      }
    }

    const prevY = this.y;
    if (!this.flies && this.dashTimer <= 0) this.vy += GRAVITY;
    const px = this.x;
    this.x += this.vx;
    this.y += this.vy;
    const impact = this.vy;
    if (!this.flies) {
      for (const d of doors) {
        if (!d.open && Math.abs(this.x - d.x) < 22) { this.x = px < d.x ? d.x - 22 : d.x + 22; this.vx = 0; }
      }
    }

    // Frapper un bloc mystère [?] par en dessous en sautant
    if (this.isPlayer && this.vy < 0) {
      const headTop = this.y - 96 * this.scale;
      mysteryBlocks.forEach(b => {
        if (Math.abs(this.x - (b.x + b.w / 2)) < b.w * 0.65 && headTop <= b.y + b.h && prevY - 96 * this.scale >= b.y + b.h - 12) {
          this.vy = 2;
          triggerMysteryBlock(b);
        }
      });
    }

    // Collision plateformes
    if (!this.flies && this.vy >= 0 && !(this.isPlayer && gpState.down)) {
      for (const p of platforms) {
        if (p.fallen) continue;
        if (this.x > p.x && this.x < p.x + p.w && prevY <= p.y && this.y >= p.y) {
          this.y = p.y;
          this.vy = 0;
          this.jumpsLeft = 2;
          if (p.dx) this.x += p.dx; // plateforme mobile : entraîne le personnage
          if (p.crumble && !p.state) { p.state = 'shaking'; p.timer = 40; }
        }
      }
      for (const b of mysteryBlocks) {
        if (this.x > b.x && this.x < b.x + b.w && prevY <= b.y && this.y >= b.y) {
          this.y = b.y;
          this.vy = 0;
          this.jumpsLeft = 2;
        }
      }
    }

    // Sol
    if (this.y >= FLOOR_Y) {
      this.y = FLOOR_Y;
      this.vy = 0;
      this.jumpsLeft = 2;
    }

    this.x = Math.max(40, Math.min(levelLength - 40, this.x));

    // Poussière et choc à l'atterrissage
    if (this.isPlayer && impact > 5 && this.vy === 0) {
      spawnParticles(this.x, this.y - 2, '#cbd5e1', Math.min(14, Math.round(impact)), 3.2);
      spawnRing(this.x, this.y - 3, '#94a3b8');
      if (impact > 13) { shake = Math.max(shake, 3); rumble(40, 0.2, 0.3); }
    }

    if (this.isPlayer && this.vy === 0 && Math.abs(this.vx) > 5 && globalTime % 5 === 0) {
      spawnParticles(this.x - this.facing * 10, this.y - 2, '#94a3b8', 2, 1.6);
    }
    if (this.isPlayer && this.vy === 0 && Math.abs(this.vx) > 3 && globalTime % 14 === 0) {
      window.AudioEngine.playSfx('step');
    }

    if (Math.abs(this.vx) > 0.6 && this.vy === 0) {
      this.animTime += Math.abs(this.vx) * 0.045;
    } else {
      this.animTime += 0.05;
    }
  }

  draw() {
    // Ombre au sol
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(this.x, (this.flies ? FLOOR_Y : this.y) + 2, 18 * this.scale, 5 * this.scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (this.isPlayer && auraLevel > 0) {
      window.WardrobeRenderer.drawAura(ctx, this.x, this.y, this.scale, auraLevel, this.auraColor, globalTime / 60);
    }

    this.afterImages.forEach(img => {
      ctx.save();
      ctx.globalAlpha = img.alpha * 0.45;
      this.renderSkeleton(img.x, img.y, this.activeColor, true);
      ctx.restore();
    });

    let drawColor = this.hitCooldown > 0 ? '#ffffff' : this.activeColor;
    if (this.hitCooldown === 0 && this.archetype === 'kamikaze' && globalTime % 12 < 6) drawColor = '#fff7ed';
    if (this.hitCooldown === 0 && this.archetype === 'boss' && this.phase === 3 && globalTime % 16 < 8) drawColor = '#ff6b6b';
    this.renderSkeleton(this.x, this.y, drawColor, false);

    // Parade : arc blanc devant le joueur
    if (this.isPlayer && this.parryTimer > 0) {
      ctx.save();
      ctx.strokeStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 16;
      ctx.lineWidth = 4;
      ctx.globalAlpha = Math.min(1, this.parryTimer / 8);
      ctx.beginPath();
      ctx.arc(this.x + this.facing * 14, this.y - 46 * this.scale, 40 * this.scale, this.facing > 0 ? -1.1 : Math.PI - 1.1, this.facing > 0 ? 1.1 : Math.PI + 1.1);
      ctx.stroke();
      ctx.restore();
    }

    // Télégraphe : « ! » avant un coup ennemi (esquive/parade possible)
    if (!this.isPlayer && this.attackTimer > 10) {
      ctx.save();
      ctx.fillStyle = '#facc15';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 10;
      ctx.font = `900 ${22 + (this.attackTimer % 4)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('!', this.x, this.y - 116 * this.scale);
      ctx.restore();
    }

    // Charge du tireur
    if (this.archetype === 'shooter' && this.shootTimer < 26 && this.shootTimer > 0) {
      ctx.save();
      ctx.fillStyle = '#fb7185';
      ctx.shadowColor = '#fb7185';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(this.x + this.facing * 28, this.y - 50, (26 - this.shootTimer) / 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Bouclier Pare-feu visuel
    if (this.isPlayer && this.powers.shield > 0 && this.shieldCharges > 0) {
      ctx.save();
      ctx.strokeStyle = '#4ade80';
      ctx.shadowColor = '#4ade80';
      ctx.shadowBlur = 15;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(this.x, this.y - 46 * this.scale, 46 * this.scale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Barre de vie ennemis normaux
    if (!this.isPlayer && this.archetype !== 'boss' && this.hp < this.maxHp) {
      const topY = this.y - 108 * this.scale;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.beginPath();
      ctx.roundRect(this.x - 22, topY, 44, 6, 3);
      ctx.fill();
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.roundRect(this.x - 21, topY + 1, 42 * (this.hp / this.maxHp), 4, 2);
      ctx.fill();
    }
  }

  renderSkeleton(x, y, color, isGhost) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(this.scale, this.scale);

    const emoting = this.isPlayer && (this.emoteTimer > 0 || gameState === 'VICTORY');
    const emoteKind = this.isPlayer ? window.SaveManager.data.equipped.emote : 'emote_cheer';
    if (emoting && !isGhost) {
      ctx.translate(0, -Math.abs(Math.sin(globalTime * 0.17)) * (gameState === 'VICTORY' ? 20 : 9));
      if (emoteKind === 'emote_dance') ctx.translate(Math.sin(globalTime * 0.35) * 7, 0);
      if (emoteKind === 'emote_spin') { ctx.translate(0, -36); ctx.scale(Math.cos(globalTime * 0.25), 1); ctx.translate(0, 36); }
    }
    const mood = this.hitCooldown > 0 ? 'hurt' : (this.attackTimer > 0 ? 'shout' : (emoting ? 'happy' : 'neutral'));

    const lean = this.vx * 1.4;
    const isMoving = Math.abs(this.vx) > 0.8 && this.vy === 0;
    const bob = isMoving ? Math.abs(Math.sin(this.animTime)) * 4 : Math.sin(this.animTime) * 1.5;

    const hipX = lean * 0.4;
    const hipY = -36 + bob;
    const shoulderX = lean;
    const shoulderY = hipY - 34;
    const headX = shoulderX + lean * 0.2;
    const headY = shoulderY - 16;

    // Cape équipée (dessinée derrière le corps)
    if (this.isPlayer && !isGhost) {
      window.WardrobeRenderer.drawCape(
        ctx,
        window.SaveManager.data.equipped.cape,
        shoulderX,
        shoulderY,
        this.facing,
        this.vx,
        this.vy,
        this.animTime
      );
    }

    // Arme rangée dans le dos quand on ne frappe pas
    if (this.isPlayer && !isGhost && this.attackTimer <= 0) this.drawBackWeapon(shoulderX, shoulderY);

    if (!isGhost) {
      ctx.shadowColor = this.powers.titan > 0 ? '#f43f5e' : color;
      ctx.shadowBlur = this.isPlayer || this.archetype === 'boss' ? 14 : 6;
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = this.archetype === 'heavy' ? 6 : 4.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Tête
    window.WardrobeRenderer.headPath(ctx, this.isPlayer ? window.SaveManager.data.equipped.head : null, headX, headY);
    ctx.stroke();

    if (!isGhost) {
      // Cheveux de l'aura, puis visage
      if (this.isPlayer && auraLevel > 0) {
        window.WardrobeRenderer.drawHair(ctx, headX, headY, this.auraColor, this.animTime);
      }
      window.WardrobeRenderer.drawFace(ctx, headX, headY, this.facing, this.animTime, !this.isPlayer, this.isPlayer ? '#f8fafc' : '#fff7ed', mood);
    }

    // Couronne Boss
    if (this.archetype === 'boss' && !isGhost) {
      window.WardrobeRenderer.drawHat(ctx, 'hat_crown', headX, headY, this.facing, this.animTime, '#facc15');
    }

    // Chapeau équipé du joueur
    if (this.isPlayer && !isGhost) {
      window.WardrobeRenderer.drawHat(
        ctx,
        window.SaveManager.data.equipped.hat,
        headX,
        headY,
        this.facing,
        this.animTime,
        this.weapon.color
      );
    }

    // Ailes des ennemis volants
    if (this.flies && !isGhost) {
      const flap = Math.sin(globalTime * 0.45) * 16;
      [-1, 1].forEach(side => {
        ctx.beginPath();
        ctx.moveTo(shoulderX, shoulderY + 4);
        ctx.quadraticCurveTo(shoulderX + side * 26, shoulderY - 24 + flap, shoulderX + side * 40, shoulderY + 2 + flap);
        ctx.quadraticCurveTo(shoulderX + side * 24, shoulderY + 4, shoulderX, shoulderY + 10);
        ctx.stroke();
      });
    }

    // Torse
    this.drawLine(shoulderX, shoulderY, hipX, hipY);
    if (!isGhost) {
      ctx.save();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 3;
      this.drawLine(hipX - 5, hipY - 2, hipX + 5, hipY - 2); // ceinture
      ctx.fillStyle = this.isPlayer ? this.weapon.color : '#fff7ed';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc((shoulderX + hipX) / 2, (shoulderY + hipY) / 2, 3, 0, Math.PI * 2); // noyau d'énergie
      ctx.fill();
      ctx.restore();
    }

    // Jambes
    if (this.vy !== 0) {
      this.drawJointLimb(hipX, hipY, hipX + this.facing * 14, hipY + 14, hipX + this.facing * 6, hipY + 30);
      this.drawJointLimb(hipX, hipY, hipX - this.facing * 10, hipY + 18, hipX - this.facing * 18, hipY + 32);
    } else if (isMoving) {
      const swing = Math.sin(this.animTime) * 20;
      const lift1 = Math.max(0, -Math.cos(this.animTime) * 10);
      const lift2 = Math.max(0, Math.cos(this.animTime) * 10);
      this.drawJointLimb(hipX, hipY, hipX + swing * 0.6 + this.facing * 6, hipY + 18 - lift1, hipX + swing, -lift1);
      this.drawJointLimb(hipX, hipY, hipX - swing * 0.6 + this.facing * 6, hipY + 18 - lift2, hipX - swing, -lift2);
    } else {
      this.drawJointLimb(hipX, hipY, hipX - 10, hipY + 18, hipX - 12, 0);
      this.drawJointLimb(hipX, hipY, hipX + 12, hipY + 18, hipX + 14, 0);
    }

    // Bras + Armes
    const handIdleX = shoulderX + this.facing * 14;
    const handIdleY = shoulderY + 14;

    if (emoting && this.attackTimer <= 0) {
      emoteLimbs(emoteKind, globalTime, shoulderX, shoulderY, this.facing, (a, b, c, d, e, f) => this.drawJointLimb(a, b, c, d, e, f));
    } else if (this.attackTimer > 0) {
      const maxCd = this.isPlayer ? this.weapon.cooldown : 22;
      const progress = Math.min(1, 1 - (this.attackTimer / maxCd));
      const punchReach = Math.sin(Math.max(0, progress) * Math.PI) * this.weapon.range;
      const punchYOffset = this.comboStep === 3 ? -22 : (this.comboStep === 2 ? 6 : -4);
      const handX = shoulderX + this.facing * (15 + punchReach);
      const handY = shoulderY + punchYOffset;

      this.drawJointLimb(shoulderX, shoulderY, shoulderX - this.facing * 12, shoulderY + 10, shoulderX - this.facing * 20, shoulderY + 20);
      this.drawJointLimb(shoulderX, shoulderY, (shoulderX + handX) / 2, shoulderY + 6, handX, handY);

      if (!isGhost) this.drawWeapon(handX, handY, true, progress);
    } else {
      this.drawJointLimb(shoulderX, shoulderY, shoulderX - this.facing * 8, shoulderY + 14, shoulderX - this.facing * 4, shoulderY + 22);
      this.drawJointLimb(shoulderX, shoulderY, shoulderX + this.facing * 8, shoulderY + 12, handIdleX, handIdleY);
    }

    ctx.restore();
  }

  drawBackWeapon(sx, sy, c = ctx) {
    const line = (x1, y1, x2, y2) => { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); };
    const w = this.weapon, f = this.facing;
    const bx = sx - f * 14, by = sy + 8;
    c.save();
    c.shadowColor = w.color;
    c.shadowBlur = 8;
    c.strokeStyle = w.color;
    c.lineCap = 'round';
    if (w.id === 'staff') {
      c.lineWidth = 3.5;
      line(bx - f * 12, by - 34, bx + f * 12, by + 30);
    } else if (w.id === 'brush') {
      c.lineWidth = 4;
      c.strokeStyle = '#d97706';
      line(bx + f * 8, by + 24, bx - f * 6, by - 22);
      c.fillStyle = w.color;
      c.beginPath(); c.arc(bx - f * 7, by - 25, 6, 0, Math.PI * 2); c.fill();
    } else {
      c.fillStyle = '#ffffff';
      c.lineWidth = 2;
      c.translate(bx - f * 4, by - 4);
      c.rotate(-0.9 * f);
      c.scale(0.8, 0.8);
      if (f === -1) c.scale(-1, 1);
      c.beginPath();
      c.moveTo(0, -14); c.lineTo(18, 2); c.lineTo(8, 4); c.lineTo(13, 14); c.lineTo(8, 16); c.lineTo(3, 6); c.lineTo(-4, 12);
      c.closePath(); c.fill(); c.stroke();
    }
    c.restore();
  }

  drawWeapon(handX, handY, isAttacking, progress) {
    if (!this.isPlayer) return;
    ctx.save();
    ctx.shadowColor = this.weapon.color;
    ctx.shadowBlur = 15;

    if (this.weapon.id === 'staff') {
      ctx.strokeStyle = this.weapon.color;
      ctx.lineWidth = 4.5;
      const angle = isAttacking ? (progress * Math.PI * 2) : -0.4 * this.facing;
      const len = 52;
      ctx.beginPath();
      ctx.moveTo(handX - Math.cos(angle) * len, handY - Math.sin(angle) * len);
      ctx.lineTo(handX + Math.cos(angle) * len, handY + Math.sin(angle) * len);
      ctx.stroke();
    } else if (this.weapon.id === 'brush') {
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 5;
      const tipX = handX + this.facing * 34;
      const tipY = handY - (isAttacking ? 5 : 18);
      this.drawLine(handX, handY, tipX, tipY);
      ctx.fillStyle = this.weapon.color;
      ctx.beginPath();
      ctx.arc(tipX, tipY, 8, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.weapon.id === 'cursor') {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = this.weapon.color;
      ctx.lineWidth = 2.5;
      ctx.save();
      ctx.translate(handX + this.facing * 12, handY - 6);
      if (this.facing === -1) ctx.scale(-1, 1);
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(22, 2);
      ctx.lineTo(10, 4);
      ctx.lineTo(15, 16);
      ctx.lineTo(9, 18);
      ctx.lineTo(4, 6);
      ctx.lineTo(-4, 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    if (isAttacking && progress > 0.15 && progress < 0.85) {
      ctx.strokeStyle = this.weapon.color;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(handX, handY, 18 + this.comboStep * 5, -0.9, 0.9);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawLine(x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  drawJointLimb(x1, y1, jx, jy, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(jx, jy);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
}
