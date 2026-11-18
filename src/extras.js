// Progression : talents, succès, défis de niveau, records
window.Progress = {
  ACHIEVEMENTS: [
    { id: 'first_blood', name: 'Premier Sang', desc: 'Vaincre 1 ennemi', test: d => d.stats.kills >= 1, reward: { bits: 25 } },
    { id: 'killer_100', name: 'Exterminateur', desc: 'Vaincre 100 ennemis', test: d => d.stats.kills >= 100, reward: { item: 'cape_galaxy' } },
    { id: 'rich', name: 'Gros Portefeuille', desc: 'Gagner 2000 Bits au total', test: d => d.stats.bitsEarned >= 2000, reward: { bits: 150 } },
    { id: 'boss_3', name: 'Chasseur de Boss', desc: 'Vaincre 3 boss', test: d => d.stats.bosses >= 3, reward: { bits: 100 } },
    { id: 'combo_30', name: 'Combo Infernal', desc: 'Enchaîner 30 coups', test: d => d.stats.bestCombo >= 30, reward: { item: 'aura_rainbow' } },
    { id: 'world3', name: 'Cœur du Système', desc: 'Terminer le Monde 3', test: d => d.unlockedLevel >= 4, reward: { bits: 100 } },
    { id: 'clear_all', name: 'Sauveur du PC', desc: 'Terminer les 9 donjons', test: d => d.unlockedLevel >= 9, reward: { bits: 300 } },
    { id: 'all_s', name: 'Perfectionniste', desc: 'Rang S dans les 9 donjons', test: d => window.GAME_LEVELS.every(l => d.bestRanks[l.id] === 'S'), reward: { item: 'cape_pixel' } },
    { id: 'no_dmg_3', name: 'Intouchable', desc: 'Finir 3 niveaux sans dégâts', test: d => Object.values(d.challenges).filter(c => c.nodmg).length >= 3, reward: { bits: 150 } },
    { id: 'chest_5', name: 'Chasseur de Trésors', desc: 'Trouver 5 coffres cachés', test: d => Object.values(d.challenges).filter(c => c.chest).length >= 5, reward: { bits: 100 } },
    { id: 'talents_max', name: 'Maître des Talents', desc: 'Atteindre 15 niveaux de talents', test: d => d.talents.hp + d.talents.spd + d.talents.dmg >= 15, reward: { bits: 200 } },
    { id: 'endless_8', name: 'Survivant', desc: 'Survivre à 8 vagues en mode infini', test: d => d.endlessBest >= 8, reward: { item: 'hat_legend' } }
  ],

  TALENTS: [
    { key: 'hp', name: '❤️ Vitalité', desc: '+20 PV max par niveau' },
    { key: 'spd', name: '👟 Agilité', desc: '+4 % de vitesse par niveau' },
    { key: 'dmg', name: '💪 Puissance', desc: '+8 % de dégâts par niveau' }
  ],
  MAX_TALENT: 5,
  tab: 'talents',

  // Débloque les succès remplis, donne la récompense et affiche une notification
  check() {
    const d = window.SaveManager.data;
    this.ACHIEVEMENTS.forEach(a => {
      if (d.achievements[a.id] || !a.test(d)) return;
      d.achievements[a.id] = true;
      if (a.reward.bits) window.SaveManager.addBits(a.reward.bits);
      if (a.reward.item && !d.unlockedItems.includes(a.reward.item)) d.unlockedItems.push(a.reward.item);
      window.SaveManager.save();
      window.AudioEngine.playSfx('achievement');
      this.toast(`🏆 Succès : ${a.name} — ${a.reward.bits ? `+${a.reward.bits} Bits` : 'objet débloqué !'}`);
    });
  },

  toast(text) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  },

  // Défis d'un niveau : 60 Bits la première fois. Retourne le HTML pour l'écran de victoire.
  completeChallenges(levelId, got) {
    const d = window.SaveManager.data;
    const saved = d.challenges[levelId] || (d.challenges[levelId] = {});
    const defs = [['nodmg', '🛡️ Sans aucun dégât'], ['rankS', '⏱️ Rang S'], ['chest', '🎁 Coffre caché trouvé']];
    const html = defs.map(([k, label]) => {
      let extra = '';
      if (got[k] && !saved[k]) {
        saved[k] = true;
        window.SaveManager.addBits(60);
        extra = ' <strong>+60 Bits</strong>';
      }
      return `<div class="${got[k] || saved[k] ? 'done' : ''}">${got[k] ? '✅' : (saved[k] ? '☑️' : '⬜')} ${label}${extra}</div>`;
    }).join('');
    window.SaveManager.save();
    return html;
  },

  talentCost(key) {
    return 100 * (window.SaveManager.data.talents[key] + 1);
  },

  render() {
    const d = window.SaveManager.data;
    document.getElementById('progress-bits').textContent = d.bits;
    const box = document.getElementById('progress-content');
    box.innerHTML = '';
    box.style.gridTemplateColumns = this.tab === 'records' ? '1fr' : '';

    if (this.tab === 'talents') {
      this.TALENTS.forEach(t => {
        const lvl = d.talents[t.key];
        const maxed = lvl >= this.MAX_TALENT;
        const cost = this.talentCost(t.key);
        const card = document.createElement('div');
        card.className = 'item-card';
        card.innerHTML = `<div class="item-info"><h4>${t.name}</h4><span>${t.desc}</span><br><span class="pips">${'●'.repeat(lvl)}${'○'.repeat(this.MAX_TALENT - lvl)}</span></div>
          <button class="item-btn ${maxed ? 'equipped' : 'buy'}">${maxed ? 'MAX' : '🪙 ' + cost}</button>`;
        card.querySelector('button').addEventListener('click', () => {
          if (maxed) return;
          if (d.bits < cost) { window.AudioEngine.playSfx('hurt'); return; }
          d.bits -= cost;
          d.talents[t.key]++;
          window.SaveManager.save();
          window.AudioEngine.playSfx('powerup');
          this.check();
          this.render();
        });
        box.appendChild(card);
      });
    } else if (this.tab === 'achievements') {
      this.ACHIEVEMENTS.forEach(a => {
        const done = !!d.achievements[a.id];
        const reward = a.reward.bits ? `+${a.reward.bits} Bits` : 'Objet exclusif';
        const card = document.createElement('div');
        card.className = 'item-card' + (done ? ' equipped' : '');
        card.innerHTML = `<div class="item-info"><h4>${done ? '✅' : '🔒'} ${a.name}</h4><span>${a.desc} • ${reward}</span></div>`;
        box.appendChild(card);
      });
    } else {
      const lines = [`<div class="item-card"><div class="item-info"><h4>♾️ Mode Infini</h4><span>Record : ${d.endlessBest} vague(s) • Ennemis vaincus : ${d.stats.kills} • Meilleur combo : ${d.stats.bestCombo}</span></div></div>`];
      window.GAME_LEVELS.forEach(l => {
        const c = d.challenges[l.id] || {};
        const rank = d.bestRanks[l.id] || '—';
        lines.push(`<div class="item-card"><div class="item-info"><h4>${l.name}</h4><span>Meilleur rang : ${rank} • ${c.nodmg ? '✅' : '⬜'} Sans dégâts • ${c.rankS ? '✅' : '⬜'} Rang S • ${c.chest ? '✅' : '⬜'} Coffre</span></div></div>`);
      });
      box.innerHTML = lines.join('');
    }
  }
};

document.querySelectorAll('.tab[data-ptab]').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab[data-ptab]').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    window.Progress.tab = tab.getAttribute('data-ptab');
    window.Progress.render();
  });
});
