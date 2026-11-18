window.GAME_LEVELS = [
  {
    id: '1-1',
    world: 'Monde 1 • Le Bureau',
    name: '1-1 : Réveil sur le Bureau',
    desc: 'Découvre les commandes, les blocs mystères [?] et nettoie les dossiers corrompus.',
    theme: { bg1: '#1e1b4b', bg2: '#311042', grid: 'rgba(56, 189, 248, 0.07)', accent: '#38bdf8' },
    length: 2600,
    platforms: [
      { x: 340, yOffset: 150, w: 220, color: '#ec4899', title: 'Dossier_Travail' },
      { x: 680, yOffset: 260, w: 220, color: '#06b6d4', title: 'Corbeille_Vidée' },
      { x: 1120, yOffset: 165, w: 250, color: '#8b5cf6', title: 'Bloc_Notes.txt' },
      { x: 1520, yOffset: 270, w: 230, color: '#ec4899', title: 'Explorateur.exe' },
      { x: 1960, yOffset: 160, w: 240, color: '#06b6d4', title: 'Portail_Sortie' }
    ],
    blocks: [
      { x: 430, yOffset: 270, type: 'mystery', power: 'overclock' },
      { x: 770, yOffset: 380, type: 'heal' },
      { x: 1220, yOffset: 285, type: 'mystery', power: 'magnet' },
      { x: 1610, yOffset: 390, type: 'mystery', power: 'shield' }
    ],
    spawns: [
      { x: 580, archetype: 'normal', color: '#f43f5e' },
      { x: 960, archetype: 'normal', color: '#f43f5e' },
      { x: 1380, archetype: 'fast', color: '#fb923c' },
      { x: 1780, archetype: 'normal', color: '#f43f5e' },
      { x: 2150, archetype: 'heavy', color: '#a855f7' }
    ]
  },
  {
    id: '1-2',
    world: 'Monde 1 • Le Bureau',
    name: '1-2 : Alerte Antivirus',
    desc: 'Affronte le Mini-Boss Antivirus au bout du couloir système.',
    theme: { bg1: '#172554', bg2: '#1e1b4b', grid: 'rgba(250, 204, 21, 0.07)', accent: '#facc15' },
    length: 2800,
    platforms: [
      { x: 320, yOffset: 160, w: 210, color: '#facc15', title: 'Pare_Feu_v1' },
      { x: 640, yOffset: 280, w: 210, color: '#38bdf8', title: 'Quarantaine' },
      { x: 1050, yOffset: 175, w: 240, color: '#f43f5e', title: 'Scan_Rapide' },
      { x: 1480, yOffset: 280, w: 240, color: '#facc15', title: 'Base_Virale' },
      { x: 2050, yOffset: 180, w: 260, color: '#38bdf8', title: 'Noyau_Sécurisé' }
    ],
    blocks: [
      { x: 405, yOffset: 280, type: 'mystery', power: 'titan' },
      { x: 730, yOffset: 400, type: 'mystery', power: 'overclock' },
      { x: 1580, yOffset: 400, type: 'heal' },
      { x: 2160, yOffset: 310, type: 'mystery', power: 'shield' }
    ],
    spawns: [
      { x: 540, archetype: 'fast', color: '#fb923c' },
      { x: 920, archetype: 'heavy', color: '#a855f7' },
      { x: 1350, archetype: 'fast', color: '#fb923c' },
      { x: 1800, archetype: 'heavy', color: '#a855f7' },
      { x: 2420, archetype: 'boss', color: '#facc15', bossName: '⚠️ ANTIVIRUS ZÉLÉ' }
    ]
  },
  {
    id: '2-1',
    world: 'Monde 2 • Studio Graphique',
    name: '2-1 : Calques & Couleurs',
    desc: 'Saute de calque en calque et utilise le Pinceau ou le Curseur Géant.',
    theme: { bg1: '#4a044e', bg2: '#1e1b4b', grid: 'rgba(236, 72, 153, 0.08)', accent: '#ec4899' },
    length: 3000,
    platforms: [
      { x: 300, yOffset: 155, w: 210, color: '#ec4899', title: 'Calque_Fond' },
      { x: 610, yOffset: 270, w: 210, color: '#a855f7', title: 'Masque_Fusion' },
      { x: 940, yOffset: 360, w: 220, color: '#06b6d4', title: 'Plume_Vector' },
      { x: 1350, yOffset: 180, w: 250, color: '#f43f5e', title: 'Palette_RVB' },
      { x: 1820, yOffset: 270, w: 240, color: '#ec4899', title: 'Rendu_Final' },
      { x: 2280, yOffset: 165, w: 240, color: '#06b6d4', title: 'Export_PNG' }
    ],
    blocks: [
      { x: 390, yOffset: 275, type: 'mystery', power: 'magnet' },
      { x: 1030, yOffset: 475, type: 'mystery', power: 'titan' },
      { x: 1460, yOffset: 300, type: 'heal' },
      { x: 1920, yOffset: 390, type: 'mystery', power: 'overclock' }
    ],
    spawns: [
      { x: 520, archetype: 'fast', color: '#fb923c' },
      { x: 860, archetype: 'normal', color: '#f43f5e' },
      { x: 1220, archetype: 'heavy', color: '#a855f7' },
      { x: 1680, archetype: 'fast', color: '#fb923c' },
      { x: 2120, archetype: 'heavy', color: '#a855f7' },
      { x: 2620, archetype: 'boss', color: '#ec4899', bossName: '⚠️ LE CURSEUR CORROMPU' }
    ]
  },
  {
    id: '3-1',
    world: 'Monde 3 • Noyau Système',
    name: '3-1 : Le Terminal & Écran Bleu',
    desc: 'Au cœur du processeur. Vaincs le Boss Écran Bleu pour ouvrir la suite !',
    theme: { bg1: '#052e16', bg2: '#090d16', grid: 'rgba(74, 222, 128, 0.08)', accent: '#4ade80' },
    length: 3200,
    platforms: [
      { x: 310, yOffset: 160, w: 210, color: '#4ade80', title: 'Root_Access' },
      { x: 640, yOffset: 280, w: 210, color: '#38bdf8', title: 'Overclock_CPU' },
      { x: 1020, yOffset: 170, w: 230, color: '#f43f5e', title: 'Kernel_Panic' },
      { x: 1420, yOffset: 290, w: 230, color: '#4ade80', title: 'Registre_RAM' },
      { x: 1860, yOffset: 180, w: 250, color: '#38bdf8', title: 'Bios_System' },
      { x: 2350, yOffset: 250, w: 260, color: '#facc15', title: 'Secteur_Zéro' }
    ],
    blocks: [
      { x: 400, yOffset: 280, type: 'mystery', power: 'shield' },
      { x: 730, yOffset: 400, type: 'mystery', power: 'titan' },
      { x: 1520, yOffset: 410, type: 'heal' },
      { x: 1970, yOffset: 300, type: 'mystery', power: 'overclock' },
      { x: 2460, yOffset: 375, type: 'heal' }
    ],
    spawns: [
      { x: 560, archetype: 'fast', color: '#4ade80' },
      { x: 920, archetype: 'heavy', color: '#a855f7' },
      { x: 1320, archetype: 'fast', color: '#fb923c' },
      { x: 1720, archetype: 'heavy', color: '#a855f7' },
      { x: 2180, archetype: 'fast', color: '#4ade80' },
      { x: 2820, archetype: 'boss', color: '#38bdf8', bossName: '⚠️ BOSS : ÉCRAN BLEU (BSOD)' }
    ]
  },
  {
    id: '4-1',
    world: 'Monde 4 • Le Réseau',
    name: '4-1 : Câbles & Paquets',
    desc: 'Traverse les serveurs du réseau local. Les paquets corrompus te foncent dessus.',
    theme: { bg1: '#0c4a6e', bg2: '#082f49', grid: 'rgba(56, 189, 248, 0.08)', accent: '#0ea5e9' },
    length: 3300,
    platforms: [
      { x: 320, yOffset: 160, w: 210, color: '#0ea5e9', title: 'Routeur_Wifi' },
      { x: 660, yOffset: 275, w: 200, color: '#22d3ee', title: 'Switch_8_ports' },
      { x: 1040, yOffset: 175, w: 230, color: '#38bdf8', title: 'Paquet_TCP' },
      { x: 1440, yOffset: 290, w: 230, color: '#0ea5e9', title: 'Serveur_DNS' },
      { x: 1880, yOffset: 185, w: 240, color: '#22d3ee', title: 'Pare_Feu_Edge' },
      { x: 2380, yOffset: 270, w: 250, color: '#38bdf8', title: 'Passerelle_WAN' }
    ],
    blocks: [
      { x: 410, yOffset: 280, type: 'mystery', power: 'overclock' },
      { x: 750, yOffset: 395, type: 'mystery', power: 'shield' },
      { x: 1540, yOffset: 410, type: 'heal' },
      { x: 1990, yOffset: 305, type: 'mystery', power: 'magnet' }
    ],
    spawns: [
      { x: 560, archetype: 'fast', color: '#22d3ee' },
      { x: 900, archetype: 'normal', color: '#f43f5e' },
      { x: 1300, archetype: 'fast', color: '#22d3ee' },
      { x: 1700, archetype: 'heavy', color: '#a855f7' },
      { x: 2200, archetype: 'fast', color: '#fb923c' },
      { x: 2850, archetype: 'boss', color: '#0ea5e9', bossName: '⚠️ ROUTEUR SURCHARGÉ' }
    ]
  },
  {
    id: '4-2',
    world: 'Monde 4 • Le Réseau',
    name: '4-2 : Tempête de Spam',
    desc: 'Les indésirables débarquent en masse. Garde ton aimant pour les Bits !',
    theme: { bg1: '#1e3a8a', bg2: '#172554', grid: 'rgba(96, 165, 250, 0.08)', accent: '#60a5fa' },
    length: 3400,
    platforms: [
      { x: 300, yOffset: 155, w: 200, color: '#60a5fa', title: 'Boîte_Réception' },
      { x: 620, yOffset: 270, w: 200, color: '#f43f5e', title: 'Spam_Pub.eml' },
      { x: 980, yOffset: 360, w: 210, color: '#facc15', title: 'Pièce_Jointe' },
      { x: 1380, yOffset: 200, w: 240, color: '#60a5fa', title: 'Newsletter' },
      { x: 1820, yOffset: 290, w: 240, color: '#f43f5e', title: 'Phishing.html' },
      { x: 2300, yOffset: 180, w: 250, color: '#facc15', title: 'Corbeille_Mail' }
    ],
    blocks: [
      { x: 390, yOffset: 275, type: 'mystery', power: 'magnet' },
      { x: 1070, yOffset: 475, type: 'mystery', power: 'titan' },
      { x: 1480, yOffset: 320, type: 'heal' },
      { x: 1930, yOffset: 410, type: 'mystery', power: 'overclock' }
    ],
    spawns: [
      { x: 520, archetype: 'normal', color: '#f43f5e' },
      { x: 800, archetype: 'fast', color: '#fb923c' },
      { x: 1150, archetype: 'normal', color: '#f43f5e' },
      { x: 1500, archetype: 'heavy', color: '#a855f7' },
      { x: 1900, archetype: 'fast', color: '#fb923c' },
      { x: 2300, archetype: 'heavy', color: '#a855f7' },
      { x: 2950, archetype: 'boss', color: '#60a5fa', bossName: '⚠️ ROI DU SPAM' }
    ]
  },
  {
    id: '5-1',
    world: 'Monde 5 • Le Cloud',
    name: '5-1 : Nuages de Données',
    desc: 'Saute de nuage en nuage dans les serveurs en altitude.',
    theme: { bg1: '#312e81', bg2: '#1e1b4b', grid: 'rgba(196, 181, 253, 0.08)', accent: '#a78bfa' },
    length: 3500,
    platforms: [
      { x: 330, yOffset: 170, w: 210, color: '#a78bfa', title: 'Sauvegarde_01' },
      { x: 680, yOffset: 290, w: 200, color: '#c4b5fd', title: 'Sync_Drive' },
      { x: 1050, yOffset: 380, w: 210, color: '#818cf8', title: 'Upload_Géant' },
      { x: 1460, yOffset: 230, w: 230, color: '#a78bfa', title: 'Partage_Public' },
      { x: 1920, yOffset: 310, w: 240, color: '#c4b5fd', title: 'Stockage_Infini' },
      { x: 2420, yOffset: 200, w: 250, color: '#818cf8', title: 'Latence_0ms' }
    ],
    blocks: [
      { x: 420, yOffset: 290, type: 'mystery', power: 'shield' },
      { x: 1140, yOffset: 490, type: 'mystery', power: 'overclock' },
      { x: 1560, yOffset: 340, type: 'heal' },
      { x: 2030, yOffset: 430, type: 'mystery', power: 'titan' }
    ],
    spawns: [
      { x: 580, archetype: 'fast', color: '#a78bfa' },
      { x: 940, archetype: 'heavy', color: '#a855f7' },
      { x: 1320, archetype: 'fast', color: '#fb923c' },
      { x: 1750, archetype: 'heavy', color: '#a855f7' },
      { x: 2200, archetype: 'fast', color: '#a78bfa' },
      { x: 2650, archetype: 'heavy', color: '#a855f7' },
      { x: 3050, archetype: 'boss', color: '#818cf8', bossName: '⚠️ GARDIEN DU CLOUD' }
    ]
  },
  {
    id: '5-2',
    world: 'Monde 5 • Le Cloud',
    name: '5-2 : Panne Générale',
    desc: 'Le datacenter surchauffe. Ennemis rapides et plateformes lointaines.',
    theme: { bg1: '#7c2d12', bg2: '#431407', grid: 'rgba(251, 146, 60, 0.09)', accent: '#fb923c' },
    length: 3600,
    platforms: [
      { x: 310, yOffset: 165, w: 200, color: '#fb923c', title: 'Ventilo_HS' },
      { x: 640, yOffset: 285, w: 200, color: '#f43f5e', title: 'Surchauffe' },
      { x: 1010, yOffset: 185, w: 220, color: '#facc15', title: 'Rack_42' },
      { x: 1400, yOffset: 300, w: 230, color: '#fb923c', title: 'Onduleur' },
      { x: 1850, yOffset: 200, w: 240, color: '#f43f5e', title: 'Disque_Mort' },
      { x: 2350, yOffset: 290, w: 250, color: '#facc15', title: 'Court_Circuit' }
    ],
    blocks: [
      { x: 400, yOffset: 285, type: 'mystery', power: 'titan' },
      { x: 730, yOffset: 405, type: 'mystery', power: 'magnet' },
      { x: 1500, yOffset: 420, type: 'heal' },
      { x: 1950, yOffset: 320, type: 'mystery', power: 'overclock' },
      { x: 2460, yOffset: 410, type: 'heal' }
    ],
    spawns: [
      { x: 540, archetype: 'fast', color: '#fb923c' },
      { x: 880, archetype: 'fast', color: '#fb923c' },
      { x: 1250, archetype: 'heavy', color: '#a855f7' },
      { x: 1650, archetype: 'fast', color: '#fb923c' },
      { x: 2100, archetype: 'heavy', color: '#a855f7' },
      { x: 2600, archetype: 'fast', color: '#f43f5e' },
      { x: 3150, archetype: 'boss', color: '#fb923c', bossName: '⚠️ SURCHAUFFE CRITIQUE' }
    ]
  },
  {
    id: '6-1',
    world: 'Monde 6 • Le Darknet',
    name: '6-1 : Le Dernier Donjon',
    desc: 'Le cœur du Darknet. Vaincs le Root Admin pour sauver ton PC !',
    theme: { bg1: '#09090b', bg2: '#1c0a1f', grid: 'rgba(244, 63, 94, 0.09)', accent: '#f43f5e' },
    length: 3800,
    platforms: [
      { x: 320, yOffset: 165, w: 200, color: '#f43f5e', title: 'Tor_Node' },
      { x: 650, yOffset: 285, w: 200, color: '#a855f7', title: 'Dark_Market' },
      { x: 1020, yOffset: 180, w: 220, color: '#f43f5e', title: 'Zero_Day' },
      { x: 1420, yOffset: 300, w: 230, color: '#a855f7', title: 'Ransomware' },
      { x: 1870, yOffset: 195, w: 240, color: '#f43f5e', title: 'Backdoor' },
      { x: 2370, yOffset: 280, w: 250, color: '#a855f7', title: 'Root_Admin' }
    ],
    blocks: [
      { x: 410, yOffset: 285, type: 'mystery', power: 'shield' },
      { x: 740, yOffset: 405, type: 'mystery', power: 'titan' },
      { x: 1520, yOffset: 420, type: 'heal' },
      { x: 1970, yOffset: 315, type: 'mystery', power: 'overclock' },
      { x: 2470, yOffset: 400, type: 'heal' }
    ],
    spawns: [
      { x: 560, archetype: 'fast', color: '#f43f5e' },
      { x: 900, archetype: 'heavy', color: '#a855f7' },
      { x: 1280, archetype: 'fast', color: '#fb923c' },
      { x: 1680, archetype: 'heavy', color: '#a855f7' },
      { x: 2120, archetype: 'fast', color: '#f43f5e' },
      { x: 2600, archetype: 'heavy', color: '#a855f7' },
      { x: 3350, archetype: 'boss', color: '#f43f5e', bossName: '⚠️ BOSS FINAL : ROOT ADMIN' }
    ]
  }
];

// --- Éléments interactifs générés à partir du parcours de chaque niveau ---
// spikes : piques au sol (dégâts) • springs : tremplins • movers : plateformes mobiles • coins : arcs de Bits
(function addInteractiveElements() {
  const arc = (x, y, n = 5, step = 34) =>
    Array.from({ length: n }, (_, i) => ({ x: x + i * step, yOffset: y + Math.round(Math.sin((i / (n - 1)) * Math.PI) * 40) }));

  window.GAME_LEVELS.forEach((lvl, li) => {
    const ps = lvl.platforms;
    lvl.spikes = [];
    lvl.springs = [];
    lvl.coins = [];
    lvl.movers = [];

    for (let i = 1; i < ps.length; i++) {
      const prevEnd = ps[i - 1].x + ps[i - 1].w;
      const gap = ps[i].x - prevEnd;
      if (gap >= 200 && lvl.spikes.length < 2 + (li >> 1)) {
        lvl.spikes.push({ x: prevEnd + gap / 2 - 40, w: 80 + Math.min(li, 4) * 10 });
      } else if (i % 2 === 1) {
        lvl.springs.push({ x: ps[i].x - 60 });
      }
    }
    // niveaux avancés : piques supplémentaires juste avant le boss
    if (li >= 3) {
      const last = ps[ps.length - 1];
      lvl.spikes.push({ x: last.x + last.w + 60, w: 90 });
    }

    ps.forEach(p => lvl.coins.push(...arc(p.x + 20, p.yOffset + 50, Math.max(4, Math.floor(p.w / 45)))));

    // plateformes mobiles : montent avec le niveau
    const last = ps[ps.length - 1];
    lvl.movers.push({ x: last.x + last.w + 160, yOffset: 200 + (li % 3) * 40, w: 150, range: 70 + li * 10, speed: 0.02 + li * 0.002, color: lvl.theme.accent, title: 'Fenêtre_Mobile' });
    if (li >= 4) {
      lvl.movers.push({ x: ps[2].x + ps[2].w + 60, yOffset: 330, w: 130, range: 60, speed: 0.03, color: lvl.theme.accent, title: 'Ascenseur.exe' });
    }

    // --- Ennemis variés : tireurs, kamikazes, volants ---
    let j = 0;
    lvl.spawns.forEach(sp => {
      j++;
      if (sp.archetype === 'boss') return;
      if (li >= 1 && j === 2) { sp.archetype = 'shooter'; sp.color = '#fb7185'; }
      else if (li >= 3 && j % 4 === 3) { sp.archetype = 'kamikaze'; sp.color = '#f97316'; }
      else if (li >= 4 && j % 3 === 1 && j > 1) { sp.archetype = 'flyer'; sp.color = '#c084fc'; }
      else if (li >= 2 && j % 3 === 0) { sp.archetype = 'shooter'; sp.color = '#fb7185'; }
    });

    // --- Pièges : plateformes qui s'effondrent, lasers, vent ---
    if (li >= 1) { [1, 4].forEach(i => { if (ps[i]) ps[i].crumble = true; }); }
    lvl.lasers = [];
    if (li >= 3 && ps[3]) lvl.lasers.push({ x: ps[3].x + ps[3].w + 40, offset: 0 });
    if (li >= 5 && ps[4]) lvl.lasers.push({ x: ps[4].x + ps[4].w + 40, offset: 90 });
    lvl.winds = [];
    if (li >= 2 && ps[2]) lvl.winds.push({ x: ps[1].x + 60, w: 420, force: li % 2 ? 2.2 : -2.2 });

    // --- Porte verrouillée : la clé est sur une plateforme située avant la porte ---
    lvl.doors = [];
    if (li >= 1) {
      const doorX = Math.round(lvl.length * 0.58 / 10) * 10;
      const kp = ps.find(p => p.x + p.w / 2 > lvl.length * 0.15 && p.x + p.w / 2 < doorX - 250) || ps[0];
      lvl.doors.push({ x: doorX, keyX: Math.round(kp.x + kp.w / 2 + 40), keyYOffset: kp.yOffset + 55 });
    }
    lvl.checkpoints = [Math.round(lvl.length * 0.3), Math.round(lvl.length * 0.66)];

    // --- Coffre caché sur une plateforme ---
    const cp = ps[(li * 2 + 1) % ps.length];
    lvl.chests = [{ x: cp.x + cp.w / 2, yOffset: cp.yOffset }];
  });
})();

// --- Mode infini : une arène, des vagues sans fin ---
window.ENDLESS_LEVEL = {
  id: 'inf',
  endless: true,
  world: 'Mode Infini',
  name: '♾️ Mode Infini',
  desc: 'Survis le plus longtemps possible.',
  theme: { bg1: '#1e1b4b', bg2: '#0f172a', grid: 'rgba(250, 204, 21, 0.07)', accent: '#facc15' },
  length: 2400,
  platforms: [
    { x: 280, yOffset: 160, w: 240, color: '#38bdf8', title: 'Arene_01' },
    { x: 700, yOffset: 280, w: 240, color: '#ec4899', title: 'Arene_02' },
    { x: 1120, yOffset: 170, w: 260, color: '#facc15', title: 'Arene_03' },
    { x: 1560, yOffset: 280, w: 240, color: '#4ade80', title: 'Arene_04' },
    { x: 1980, yOffset: 160, w: 240, color: '#a855f7', title: 'Arene_05' }
  ],
  blocks: [
    { x: 380, yOffset: 280, type: 'mystery', power: 'shield' },
    { x: 1230, yOffset: 290, type: 'heal' },
    { x: 2080, yOffset: 280, type: 'mystery', power: 'overclock' }
  ],
  doors: [], checkpoints: [], spawns: [], spikes: [], coins: [], movers: [], lasers: [], winds: [], chests: [],
  springs: [{ x: 600 }, { x: 1480 }]
};
