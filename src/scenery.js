// Décors : couches en parallaxe animées par monde, sol « barre des tâches », vignette
window.Scenery = (() => {
  const R = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const wrap = (v, span) => ((v % span) + span) % span;

  // Parcourt les tuiles visibles d'une couche (index absolu => décor stable)
  function tiles(gap, par, o, fn, margin = 320) {
    const off = o.cam * par;
    const first = Math.floor((off - margin) / gap);
    const last = Math.ceil((off + o.W + margin) / gap);
    for (let i = first; i <= last; i++) fn(i, i * gap - off);
  }

  function bezier(p0, p1, p2, t) {
    const u = 1 - t;
    return u * u * p0 + 2 * u * t * p1 + t * t * p2;
  }

  function polyPoint(pts, p) {
    let total = 0;
    const lens = [];
    for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); lens.push(l); total += l; }
    let d = p * total;
    for (let i = 0; i < lens.length; i++) {
      if (d <= lens[i]) { const k = d / lens[i]; return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k]; }
      d -= lens[i];
    }
    return pts[pts.length - 1];
  }

  // ---------- MONDE 1 : Bureau ----------
  function office(c, o) {
    tiles(540, 0.12, o, (i, x) => {
      const w = 280 + R(i) * 160, h = 170 + R(i + 9) * 140, y = o.floor - h - 30 - R(i + 3) * 60;
      c.fillStyle = 'rgba(15, 23, 42, 0.42)';
      c.beginPath(); c.roundRect(x, y, w, h, 10); c.fill();
      c.fillStyle = 'rgba(255, 255, 255, 0.07)';
      c.fillRect(x, y, w, 24);
      ['#ff5f56', '#ffbd2e', '#27c93f'].forEach((col, k) => { c.fillStyle = col; c.globalAlpha = 0.5; c.beginPath(); c.arc(x + 14 + k * 14, y + 12, 4, 0, 6.3); c.fill(); });
      c.globalAlpha = 1;
      if (R(i + 2) > 0.5) { // graphique animé
        for (let j = 0; j < 7; j++) {
          const bh = (h - 70) * (0.25 + 0.75 * Math.abs(Math.sin(o.t * 0.7 + j * 0.8 + i)));
          c.fillStyle = `rgba(${o.rgb}, 0.18)`;
          c.fillRect(x + 20 + j * ((w - 40) / 7), y + h - 14 - bh, (w - 40) / 7 - 8, bh);
        }
      } else { // texte + curseur
        c.fillStyle = 'rgba(255, 255, 255, 0.08)';
        for (let j = 0; j < 7; j++) c.fillRect(x + 18, y + 40 + j * 16, (w - 40) * (0.35 + R(i * 7 + j) * 0.6), 5);
        if (Math.floor(o.t * 2) % 2) { c.fillStyle = `rgba(${o.rgb}, 0.5)`; c.fillRect(x + 18 + (w - 40) * (0.35 + R(i * 7 + 6) * 0.6) + 6, y + 36 + 6 * 16, 2, 12); }
      }
    });
    // widget « mise à jour » avec barre de progression
    tiles(900, 0.22, o, (i, x) => {
      const y = 70 + R(i + 4) * 90;
      c.fillStyle = 'rgba(15, 23, 42, 0.5)';
      c.beginPath(); c.roundRect(x, y, 190, 46, 8); c.fill();
      c.fillStyle = 'rgba(255, 255, 255, 0.14)';
      c.font = '600 10px sans-serif';
      c.fillText('Mise à jour du système…', x + 12, y + 18);
      c.fillStyle = 'rgba(255, 255, 255, 0.1)';
      c.fillRect(x + 12, y + 28, 166, 6);
      c.fillStyle = `rgba(${o.rgb}, 0.55)`;
      c.fillRect(x + 12, y + 28, 166 * ((o.t * 0.08 + R(i)) % 1), 6);
    });
    // icônes flottantes
    tiles(230, 0.3, o, (i, x) => {
      const kind = Math.floor(R(i) * 3);
      const y = 60 + R(i + 5) * Math.max(80, o.floor - 260) + Math.sin(o.t + i) * 10;
      c.save();
      c.translate(x, y);
      c.rotate(Math.sin(o.t * 0.6 + i) * 0.25);
      c.strokeStyle = `rgba(${o.rgb}, 0.22)`;
      c.lineWidth = 1.6;
      c.beginPath();
      if (kind === 0) { c.moveTo(0, 0); c.lineTo(0, 22); c.lineTo(6, 17); c.lineTo(11, 27); c.lineTo(15, 25); c.lineTo(10, 16); c.lineTo(17, 16); c.closePath(); }
      else if (kind === 1) { c.moveTo(0, 6); c.lineTo(0, 24); c.lineTo(26, 24); c.lineTo(26, 6); c.lineTo(12, 6); c.lineTo(9, 2); c.lineTo(0, 2); c.closePath(); }
      else { c.moveTo(0, 0); c.lineTo(14, 0); c.lineTo(20, 6); c.lineTo(20, 26); c.lineTo(0, 26); c.closePath(); c.moveTo(14, 0); c.lineTo(14, 6); c.lineTo(20, 6); }
      c.stroke();
      c.restore();
    });
  }

  // ---------- MONDE 2 : Studio graphique ----------
  function studio(c, o) {
    const pal = ['#ec4899', '#a855f7', '#06b6d4', '#f43f5e', '#facc15'];
    tiles(620, 0.1, o, (i, x) => { // rubans de peinture
      const y0 = 140 + R(i) * (o.floor - 320);
      c.strokeStyle = pal[Math.floor(R(i + 3) * pal.length)];
      c.globalAlpha = 0.11;
      c.lineWidth = 30;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(x, y0);
      c.quadraticCurveTo(x + 170, y0 - 130 + Math.sin(o.t * 0.6 + i) * 34, x + 340, y0 + 20);
      c.quadraticCurveTo(x + 480, y0 + 120 + Math.cos(o.t * 0.5 + i) * 24, x + 600, y0 - 30);
      c.stroke();
      c.globalAlpha = 1;
    });
    tiles(1100, 0.18, o, (i, x) => { // plan de travail à damier (transparence)
      const w = 300, h = 200, y = o.floor - h - 40 - R(i) * 120;
      c.fillStyle = 'rgba(15, 23, 42, 0.35)';
      c.fillRect(x, y, w, h);
      c.fillStyle = 'rgba(255, 255, 255, 0.045)';
      for (let a = 0; a < w / 20; a++) for (let b = 0; b < h / 20; b++) if ((a + b) % 2 === 0) c.fillRect(x + a * 20, y + b * 20, 20, 20);
      c.strokeStyle = `rgba(${o.rgb}, 0.3)`;
      c.setLineDash([6, 5]);
      c.lineDashOffset = -o.t * 10;
      c.strokeRect(x, y, w, h);
      c.setLineDash([]);
    });
    tiles(260, 0.28, o, (i, x) => { // pastilles de couleur qui tournent
      const y = 70 + R(i + 5) * Math.max(80, o.floor - 240) + Math.sin(o.t * 0.8 + i) * 12;
      c.save();
      c.translate(x, y);
      c.rotate(o.t * 0.3 + i);
      c.fillStyle = pal[Math.floor(R(i) * pal.length)];
      c.globalAlpha = 0.28;
      if (i % 2) c.fillRect(-13, -13, 26, 26); else { c.beginPath(); c.arc(0, 0, 14, 0, 6.3); c.fill(); }
      c.restore();
    });
    c.strokeStyle = 'rgba(255, 255, 255, 0.06)'; // repères
    c.setLineDash([10, 8]);
    [120, o.floor - 150].forEach(y => { c.beginPath(); c.moveTo(0, y); c.lineTo(o.W, y); c.stroke(); });
    c.setLineDash([]);
  }

  // ---------- MONDE 3 : Noyau système ----------
  function core(c, o) {
    tiles(480, 0.1, o, (i, x) => { // puces CPU
      const s = 190 + R(i) * 110, y = o.floor - s - 40 - R(i + 2) * 100;
      c.fillStyle = 'rgba(255, 255, 255, 0.03)';
      c.fillRect(x, y, s, s);
      c.strokeStyle = `rgba(${o.rgb}, 0.14)`;
      c.lineWidth = 1.5;
      c.strokeRect(x, y, s, s);
      c.strokeRect(x + s * 0.22, y + s * 0.22, s * 0.56, s * 0.56);
      for (let k = 1; k < 10; k++) {
        const p = (s / 10) * k;
        c.beginPath();
        c.moveTo(x + p, y); c.lineTo(x + p, y - 10);
        c.moveTo(x + p, y + s); c.lineTo(x + p, y + s + 10);
        c.moveTo(x, y + p); c.lineTo(x - 10, y + p);
        c.moveTo(x + s, y + p); c.lineTo(x + s + 10, y + p);
        c.stroke();
      }
    });
    tiles(360, 0.25, o, (i, x) => { // pistes de circuit + impulsions
      const y = 90 + R(i) * (o.floor - 260);
      const pts = [[x, y], [x + 80, y], [x + 80, y + 60], [x + 210, y + 60], [x + 210, y - 30], [x + 340, y - 30]];
      c.strokeStyle = `rgba(${o.rgb}, 0.2)`;
      c.lineWidth = 2;
      c.beginPath();
      pts.forEach((p, k) => (k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
      c.stroke();
      const q = polyPoint(pts, (o.t * 0.25 + R(i + 1)) % 1);
      c.fillStyle = `rgba(${o.rgb}, 0.85)`;
      c.beginPath(); c.arc(q[0], q[1], 3.2, 0, 6.3); c.fill();
    });
    rain(c, o, 70, 0.5, `rgba(${o.rgb}, 0.3)`, '01');
  }

  function rain(c, o, gap, par, color, chars) {
    c.font = '12px monospace';
    c.fillStyle = color;
    tiles(gap, par, o, (i, x) => {
      const sp = 40 + R(i) * 70;
      const y = wrap(o.t * sp + R(i + 1) * 900, o.H + 120) - 60;
      for (let j = 0; j < 5; j++) {
        c.globalAlpha = (1 - j / 5) * 0.9;
        c.fillText(chars[(Math.floor(o.t * 6) + i + j * 3) % chars.length], x, y - j * 15);
      }
    }, 40);
    c.globalAlpha = 1;
  }

  // ---------- MONDE 4 : Réseau ----------
  function net(c, o) {
    tiles(260, 0.1, o, (i, x) => { // baies de serveurs
      const w = 110, h = 240 + R(i) * 140, y = o.floor - h;
      c.fillStyle = 'rgba(15, 23, 42, 0.5)';
      c.fillRect(x, y, w, h);
      c.strokeStyle = `rgba(${o.rgb}, 0.14)`;
      c.strokeRect(x, y, w, h);
      for (let j = 0; j < h / 18 - 1; j++) {
        c.fillStyle = 'rgba(255, 255, 255, 0.05)';
        c.fillRect(x + 8, y + 10 + j * 18, w - 16, 12);
        const on = Math.sin(o.t * 3 + i * 5 + j * 2.1) > 0.2;
        c.fillStyle = on ? 'rgba(74, 222, 128, 0.75)' : 'rgba(74, 222, 128, 0.15)';
        c.fillRect(x + w - 20, y + 14 + j * 18, 5, 5);
        c.fillStyle = Math.sin(o.t * 1.7 + j + i) > 0.6 ? 'rgba(250, 204, 21, 0.7)' : 'rgba(250, 204, 21, 0.12)';
        c.fillRect(x + w - 30, y + 14 + j * 18, 5, 5);
      }
    });
    tiles(700, 0.28, o, (i, x) => { // câbles qui s'affaissent + paquets de données
      const y0 = 60 + R(i) * 60, y1 = 70 + R(i + 1) * 60, cy = 250 + R(i + 2) * 60;
      c.strokeStyle = `rgba(${o.rgb}, 0.22)`;
      c.lineWidth = 3;
      c.beginPath(); c.moveTo(x, y0); c.quadraticCurveTo(x + 350, cy, x + 700, y1); c.stroke();
      for (let k = 0; k < 3; k++) {
        const p = (o.t * 0.22 + k / 3 + R(i + 6)) % 1;
        c.fillStyle = `rgba(${o.rgb}, 0.9)`;
        c.fillRect(bezier(x, x + 350, x + 700, p) - 4, bezier(y0, cy, y1, p) - 4, 8, 8);
      }
    });
    tiles(520, 0.2, o, (i, x) => { // nœuds qui émettent des ondes
      const y = 110 + R(i + 8) * (o.floor - 330);
      const p = (o.t * 0.5 + R(i)) % 1;
      c.strokeStyle = `rgba(${o.rgb}, ${0.35 * (1 - p)})`;
      c.lineWidth = 2;
      c.beginPath(); c.arc(x, y, 8 + p * 46, 0, 6.3); c.stroke();
      c.fillStyle = `rgba(${o.rgb}, 0.6)`;
      c.beginPath(); c.arc(x, y, 6, 0, 6.3); c.fill();
    });
  }

  // ---------- MONDE 5 : Cloud ----------
  function cloudShape(c, x, y, s) {
    c.beginPath(); // un seul tracé : pas de bords visibles là où les cercles se chevauchent
    [[0, 0, 34], [38, -14, 42], [82, -4, 36], [120, 4, 28], [52, 10, 34]].forEach(([dx, dy, r]) => {
      c.moveTo(x + (dx + r) * s, y + dy * s);
      c.arc(x + dx * s, y + dy * s, r * s, 0, 6.3);
    });
    c.fill();
  }
  function cloud(c, o) {
    for (let i = 0; i < 50; i++) { // étoiles
      const x = wrap(R(i) * o.W * 1.5 - o.cam * 0.03, o.W), y = R(i + 7) * (o.floor * 0.6);
      c.fillStyle = `rgba(255, 255, 255, ${0.15 + 0.45 * Math.abs(Math.sin(o.t * 1.4 + i))})`;
      c.fillRect(x, y, 2, 2);
    }
    for (let k = 0; k < 4; k++) { // rayons de lumière
      const x = (o.W / 4) * k + Math.sin(o.t * 0.3 + k) * 40;
      const g = c.createLinearGradient(x, 0, x + 160, o.floor);
      g.addColorStop(0, `rgba(${o.rgb}, 0.07)`);
      g.addColorStop(1, `rgba(${o.rgb}, 0)`);
      c.fillStyle = g;
      c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 90, 0); c.lineTo(x + 330, o.floor); c.lineTo(x + 140, o.floor); c.closePath(); c.fill();
    }
    c.fillStyle = 'rgba(255, 255, 255, 0.045)';
    tiles(420, 0.08, o, (i, x) => cloudShape(c, x, 90 + R(i) * 170, 1.4 + R(i + 1)));
    tiles(380, 0.15, o, (i, x) => { // tours de données lointaines
      const w = 36, h = 200 + R(i) * 170, y = o.floor - h;
      c.fillStyle = 'rgba(15, 23, 42, 0.35)';
      c.fillRect(x, y, w, h);
      c.fillRect(x + w / 2 - 1, y - 30, 2, 30);
      c.fillStyle = Math.sin(o.t * 4 + i) > 0 ? 'rgba(244, 63, 94, 0.9)' : 'rgba(244, 63, 94, 0.2)';
      c.beginPath(); c.arc(x + w / 2, y - 32, 3, 0, 6.3); c.fill();
      for (let j = 0; j < h / 22; j++) {
        c.fillStyle = Math.sin(o.t * 2 + i * 3 + j) > 0.3 ? `rgba(${o.rgb}, 0.6)` : 'rgba(255, 255, 255, 0.05)';
        c.fillRect(x + 8, y + 10 + j * 22, w - 16, 4);
      }
    });
    c.fillStyle = 'rgba(255, 255, 255, 0.07)';
    tiles(340, 0.22, o, (i, x) => cloudShape(c, x, 180 + R(i + 4) * 200 + Math.sin(o.t * 0.4 + i) * 8, 0.9 + R(i + 2) * 0.6));
  }

  // ---------- MONDE 6 : Darknet ----------
  function dark(c, o) {
    tiles(240, 0.1, o, (i, x) => { // flèches de métal
      const h = 150 + R(i) * 240, w = 70 + R(i + 1) * 60;
      c.fillStyle = 'rgba(0, 0, 0, 0.4)';
      c.beginPath();
      c.moveTo(x, o.floor);
      c.lineTo(x + w * 0.2, o.floor - h * 0.55);
      c.lineTo(x + w * 0.5, o.floor - h);
      c.lineTo(x + w * 0.8, o.floor - h * 0.6);
      c.lineTo(x + w, o.floor);
      c.closePath();
      c.fill();
    });
    rain(c, o, 54, 0.4, `rgba(${o.rgb}, 0.32)`, '01#$%&@X7F');
    tiles(900, 0.2, o, (i, x) => { // yeux rouges qui clignent
      const y = 120 + R(i) * (o.floor - 340);
      if (Math.floor(o.t * 0.8 + R(i + 3) * 10) % 5 === 0) return;
      c.fillStyle = `rgba(${o.rgb}, 0.55)`;
      c.beginPath(); c.ellipse(x, y, 9, 4, 0, 0, 6.3); c.ellipse(x + 30, y, 9, 4, 0, 0, 6.3); c.fill();
    });
    if (o.t % 4 < 0.1) { // glitch
      c.fillStyle = `rgba(${o.rgb}, 0.08)`;
      for (let k = 0; k < 4; k++) c.fillRect((R(Math.floor(o.t) + k) - 0.5) * 60, R(k + Math.floor(o.t)) * o.floor, o.W, 8 + R(k) * 14);
    }
  }

  // ---------- Mode infini : arène ----------
  function arena(c, o) {
    tiles(46, 0.2, o, (i, x) => { // foule de stickmen
      const bob = Math.abs(Math.sin(o.t * 3 + i * 1.3)) * (6 + R(i) * 10);
      const y = o.floor - 14 - bob - R(i + 2) * 26;
      c.strokeStyle = 'rgba(255, 255, 255, 0.11)';
      c.lineWidth = 2;
      c.beginPath();
      c.arc(x, y - 24, 5, 0, 6.3);
      c.moveTo(x, y - 19); c.lineTo(x, y - 6);
      c.moveTo(x, y - 6); c.lineTo(x - 4, y + 4); c.moveTo(x, y - 6); c.lineTo(x + 4, y + 4);
      c.moveTo(x, y - 16); c.lineTo(x - 7, y - 24 - (i % 2) * 6); c.moveTo(x, y - 16); c.lineTo(x + 7, y - 24 - ((i + 1) % 2) * 6);
      c.stroke();
    });
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 3; k++) { // projecteurs
      const bx = (o.W / 4) * (k + 1), a = Math.sin(o.t * 0.6 + k * 2) * 0.45, ex = bx + Math.tan(a) * o.floor;
      const g = c.createLinearGradient(bx, 0, ex, o.floor);
      g.addColorStop(0, `rgba(${o.rgb}, 0.16)`);
      g.addColorStop(1, `rgba(${o.rgb}, 0)`);
      c.fillStyle = g;
      c.beginPath(); c.moveTo(bx - 8, 0); c.lineTo(bx + 8, 0); c.lineTo(ex + 90, o.floor); c.lineTo(ex - 90, o.floor); c.closePath(); c.fill();
    }
    c.restore();
  }

  const WORLDS = { 1: office, 2: studio, 3: core, 4: net, 5: cloud, 6: dark };

  function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
  }

  function drawBackground(c, p) {
    const o = { cam: p.cameraX, W: p.W, H: p.H, floor: p.floor, t: p.t, rgb: hexToRgb(p.lvl.theme.accent) };
    c.save();
    (p.lvl.endless ? arena : WORLDS[p.lvl.id[0]] || office)(c, o);
    // poussières lumineuses
    c.fillStyle = `rgba(${o.rgb}, 0.28)`;
    for (let i = 0; i < 34; i++) {
      const x = wrap(R(i) * o.W * 2.5 - o.cam * (0.12 + R(i + 1) * 0.25) + Math.sin(o.t * 0.5 + i) * 18, o.W + 40) - 20;
      const y = wrap(R(i + 2) * o.H - o.t * (8 + R(i) * 14), o.H);
      c.beginPath(); c.arc(x, y, 1 + R(i + 3) * 2, 0, 6.3); c.fill();
    }
    c.restore();
  }

  // Sol : barre des tâches avec menu démarrer, icônes, horloge
  function drawFloor(c, p) {
    const { W, H, floor: y, cameraX: cam, accent } = p;
    const h = H - y;
    const g = c.createLinearGradient(0, y, 0, H);
    g.addColorStop(0, '#141b2d');
    g.addColorStop(1, '#05070d');
    c.fillStyle = g;
    c.fillRect(0, y, W, h);

    const glow = c.createLinearGradient(0, y - 26, 0, y);
    glow.addColorStop(0, 'rgba(0,0,0,0)');
    glow.addColorStop(1, accent + '33');
    c.fillStyle = glow;
    c.fillRect(0, y - 26, W, 26);
    c.fillStyle = accent;
    c.fillRect(0, y, W, 3.5);

    c.strokeStyle = 'rgba(255,255,255,0.05)';
    c.lineWidth = 1;
    for (let x = wrap(-cam, 64); x < W; x += 64) { c.beginPath(); c.moveTo(x, y + 4); c.lineTo(x, H); c.stroke(); }

    const by = y + Math.min(14, (h - 30) / 2 + 6);
    c.fillStyle = 'rgba(255,255,255,0.08)';
    c.beginPath(); c.roundRect(12, by, 36, 30, 7); c.fill();
    ['#38bdf8', '#4ade80', '#facc15', '#f43f5e'].forEach((col, k) => {
      c.fillStyle = col;
      c.fillRect(21 + (k % 2) * 10, by + 6 + Math.floor(k / 2) * 10, 8, 8);
    });
    for (let i = 0; i < 6; i++) {
      c.fillStyle = i === 0 ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.06)';
      c.beginPath(); c.roundRect(64 + i * 42, by, 34, 30, 7); c.fill();
      c.fillStyle = ['#38bdf8', '#facc15', '#4ade80', '#a855f7', '#f43f5e', '#fb923c'][i];
      c.globalAlpha = 0.85;
      c.beginPath(); c.roundRect(72 + i * 42, by + 8, 18, 14, 3); c.fill();
      c.globalAlpha = 1;
      if (i === 0) { c.fillStyle = accent; c.fillRect(70 + i * 42, by + 27, 22, 3); }
    }
    const d = new Date();
    c.fillStyle = '#cbd5e1';
    c.font = '600 13px sans-serif';
    c.textAlign = 'right';
    c.fillText(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`, W - 14, by + 20);
    c.fillStyle = 'rgba(255,255,255,0.35)';
    for (let k = 0; k < 3; k++) c.fillRect(W - 100 - k * 14, by + 22 - k * 4 - 4, 8, 4 + k * 4);
    c.textAlign = 'left';
  }

  let vigKey = '', vigGrad = null;
  function drawVignette(c, p) {
    const key = p.W + 'x' + p.H;
    if (key !== vigKey) {
      vigKey = key;
      vigGrad = c.createRadialGradient(p.W / 2, p.H / 2, Math.min(p.W, p.H) * 0.45, p.W / 2, p.H / 2, Math.max(p.W, p.H) * 0.78);
      vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
      vigGrad.addColorStop(1, 'rgba(0,0,0,0.5)');
    }
    c.fillStyle = vigGrad;
    c.fillRect(0, 0, p.W, p.H);

    if (!p.lvl.endless && p.lvl.id[0] === '6' && p.t % 7.2 < 0.17) { // éclair du Darknet
      c.fillStyle = 'rgba(255, 220, 230, 0.12)';
      c.fillRect(0, 0, p.W, p.H);
    }

    // bokeh d'avant-plan
    const o = { cam: p.cameraX, W: p.W };
    const rgb = hexToRgb(p.lvl.theme.accent);
    tiles(900, 1.5, o, (i, x) => {
      c.fillStyle = `rgba(${rgb}, 0.035)`;
      c.beginPath(); c.arc(x, 90 + R(i) * (p.floor - 180), 60 + R(i + 1) * 70, 0, 6.3); c.fill();
    }, 200);
  }

  // Météo par monde : pluie, orage, neige, braises, pétales de peinture, cendres
  const WEATHER = { '2-1': 'petals', '3-1': 'embers', '4-1': 'rain', '4-2': 'rain', '5-1': 'snow', '5-2': 'storm', '6-1': 'ash' };
  const COUNT = { rain: 120, storm: 160, snow: 90, embers: 60, petals: 40, ash: 70 };
  function drawWeather(c, p) {
    const kind = WEATHER[p.lvl.id];
    if (!kind) return;
    const { W, H, t, cameraX: cam } = p;
    const n = COUNT[kind];
    c.save();
    if (kind === 'rain' || kind === 'storm') {
      c.strokeStyle = kind === 'storm' ? 'rgba(210,220,255,0.5)' : 'rgba(147,197,253,0.4)';
      c.lineWidth = 1.2;
      c.beginPath();
      for (let i = 0; i < n; i++) {
        const x = wrap(R(i + 1) * W * 1.4 - cam * 0.3 - t * 140, W * 1.4) - W * 0.2;
        const y = wrap(R(i + 2) * H + t * (700 + R(i) * 500), H + 40) - 20;
        c.moveTo(x, y); c.lineTo(x - 5, y + 15);
      }
      c.stroke();
      if (kind === 'storm') {
        const fl = Math.pow(Math.max(0, Math.sin(t * 0.7) * Math.sin(t * 1.9 + 1)), 12);
        if (fl > 0.02) { c.fillStyle = `rgba(230,235,255,${Math.min(0.5, fl * 0.6)})`; c.fillRect(0, 0, W, H); }
      }
    } else if (kind === 'snow') {
      c.fillStyle = 'rgba(255,255,255,0.85)';
      for (let i = 0; i < n; i++) {
        const x = wrap(R(i + 1) * W * 1.4 - cam * 0.25 + Math.sin(t * 0.9 + i) * 24 - t * 20, W * 1.4) - W * 0.2;
        const y = wrap(R(i + 2) * H + t * (40 + R(i) * 60), H + 20) - 10;
        c.beginPath(); c.arc(x, y, 1.2 + R(i + 3) * 2.2, 0, 6.3); c.fill();
      }
    } else if (kind === 'embers') {
      for (let i = 0; i < n; i++) {
        const x = wrap(R(i + 1) * W * 1.4 - cam * 0.35 + Math.sin(t + i) * 16, W * 1.4) - W * 0.2;
        const y = H - wrap(R(i + 2) * H + t * (30 + R(i) * 60), H + 20);
        c.fillStyle = `rgba(${R(i + 4) > 0.5 ? '251,146,60' : '74,222,128'},${0.3 + 0.5 * R(i + 5)})`;
        c.beginPath(); c.arc(x, y, 1 + R(i + 3) * 2, 0, 6.3); c.fill();
      }
    } else if (kind === 'petals') {
      const cols = ['#f472b6', '#38bdf8', '#facc15', '#a855f7'];
      for (let i = 0; i < n; i++) {
        const x = wrap(R(i + 1) * W * 1.4 - cam * 0.3 + Math.sin(t * 0.8 + i) * 30 - t * 25, W * 1.4) - W * 0.2;
        const y = wrap(R(i + 2) * H + t * (30 + R(i) * 40), H + 20) - 10;
        c.fillStyle = cols[i % 4]; c.globalAlpha = 0.6;
        c.beginPath(); c.ellipse(x, y, 5, 2.5, t + i, 0, 6.3); c.fill();
      }
    } else if (kind === 'ash') {
      c.fillStyle = 'rgba(203,213,225,0.45)';
      for (let i = 0; i < n; i++) {
        const x = wrap(R(i + 1) * W * 1.4 - cam * 0.3 + Math.sin(t * 0.6 + i) * 20, W * 1.4) - W * 0.2;
        const y = wrap(R(i + 2) * H + t * (25 + R(i) * 40), H + 20) - 10;
        c.fillRect(x, y, 2 + R(i + 3) * 2, 2);
      }
    }
    c.restore();
  }

  return { drawBackground, drawFloor, drawVignette, drawWeather };
})();
