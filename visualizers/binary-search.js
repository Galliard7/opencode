/* ══════════════════════════════════════════════════════════════
   OpenCode — Binary Search Visualizer (vanilla SVG)
   ══════════════════════════════════════════════════════════════ */

const BinarySearchVisualizer = (() => {

  const ARRAY = [2, 5, 8, 12, 16, 23, 38, 45, 56, 72, 91];
  const TARGET = 23;

  const CODE = [
    'def binary_search(nums, target):',
    '    l, r = 0, len(nums) - 1',
    '    while l <= r:',
    '        mid = (l + r) // 2',
    '        if nums[mid] == target:',
    '            return mid',
    '        elif nums[mid] < target:',
    '            l = mid + 1',
    '        else:',
    '            r = mid - 1',
    '    return -1',
  ];

  const C = {
    bg: '#0f0f0f', panel: '#161616', border: '#2a2a2a',
    text: '#e0e0e0', muted: '#666',
    accent: '#6366f1', accentSoft: 'rgba(99,102,241,0.15)',
    left: '#3b82f6', leftSoft: 'rgba(59,130,246,0.15)',
    right: '#ef4444', rightSoft: 'rgba(239,68,68,0.15)',
    mid: '#f59e0b', midSoft: 'rgba(245,158,11,0.15)',
    found: '#22c55e', foundSoft: 'rgba(34,197,94,0.15)',
    eliminated: 'rgba(255,255,255,0.03)',
  };

  function generateSteps() {
    const steps = [];
    let l = 0, r = ARRAY.length - 1;

    steps.push({ l, r, mid: -1, type: 'init', line: 1, msg: `initialize: l=0, r=${r}` });

    while (l <= r) {
      const mid = Math.floor((l + r) / 2);
      steps.push({ l, r, mid, type: 'compute-mid', line: 3, msg: `mid = (${l} + ${r}) // 2 = ${mid}, nums[${mid}] = ${ARRAY[mid]}` });

      if (ARRAY[mid] === TARGET) {
        steps.push({ l, r, mid, type: 'found', line: 5, msg: `nums[${mid}] == ${TARGET} — found at index ${mid}!` });
        return steps;
      } else if (ARRAY[mid] < TARGET) {
        steps.push({ l, r, mid, type: 'too-small', line: 7, msg: `nums[${mid}] = ${ARRAY[mid]} < ${TARGET} — eliminate left half, l = ${mid + 1}` });
        l = mid + 1;
      } else {
        steps.push({ l, r, mid, type: 'too-large', line: 9, msg: `nums[${mid}] = ${ARRAY[mid]} > ${TARGET} — eliminate right half, r = ${mid - 1}` });
        r = mid - 1;
      }
    }
    steps.push({ l, r, mid: -1, type: 'not-found', line: 10, msg: 'l > r — target not found' });
    return steps;
  }

  let steps, stepIdx, playing, speed, timer, container;

  function init(el) {
    container = el;
    steps = generateSteps();
    stepIdx = 0;
    playing = false;
    speed = 1000;
    render();
  }

  function render() {
    const cur = steps[stepIdx];
    const cellW = 60, cellH = 50, gap = 4;
    const totalW = ARRAY.length * (cellW + gap) - gap;
    const startX = 20;
    const y = 80;

    // Array cells
    let cellsSvg = '';
    for (let i = 0; i < ARRAY.length; i++) {
      const x = startX + i * (cellW + gap);
      let fill = C.panel, stroke = C.border, textColor = C.muted;

      if (cur.type === 'found' && i === cur.mid) {
        fill = C.foundSoft; stroke = C.found; textColor = C.found;
      } else if (i === cur.mid && cur.mid >= 0) {
        fill = C.midSoft; stroke = C.mid; textColor = C.text;
      } else if (i >= cur.l && i <= cur.r) {
        fill = C.panel; stroke = C.border; textColor = C.text;
      } else {
        fill = C.eliminated; stroke = C.border; textColor = '#333';
      }

      // Cell
      cellsSvg += `<rect x="${x}" y="${y}" width="${cellW}" height="${cellH}" rx="4" fill="${fill}" stroke="${stroke}" stroke-width="${i === cur.mid ? 2 : 1}" style="transition:all 300ms"/>`;
      // Value
      cellsSvg += `<text x="${x + cellW/2}" y="${y + cellH/2 - 2}" text-anchor="middle" dominant-baseline="central" fill="${textColor}" style="font:600 14px 'JetBrains Mono',monospace;transition:fill 300ms">${ARRAY[i]}</text>`;
      // Index
      cellsSvg += `<text x="${x + cellW/2}" y="${y + cellH + 14}" text-anchor="middle" fill="${C.muted}" style="font:10px 'JetBrains Mono',monospace">${i}</text>`;

      // Pointer labels
      if (i === cur.l && cur.l <= cur.r) {
        cellsSvg += `<text x="${x + cellW/2}" y="${y - 12}" text-anchor="middle" fill="${C.left}" style="font:600 11px 'JetBrains Mono',monospace">L ↓</text>`;
      }
      if (i === cur.r && cur.l <= cur.r) {
        cellsSvg += `<text x="${x + cellW/2}" y="${y - 12}" text-anchor="middle" fill="${C.right}" style="font:600 11px 'JetBrains Mono',monospace">${i === cur.l ? 'L/R ↓' : 'R ↓'}</text>`;
      }
      if (i === cur.mid && cur.mid >= 0 && i !== cur.l && i !== cur.r) {
        cellsSvg += `<text x="${x + cellW/2}" y="${y - 12}" text-anchor="middle" fill="${C.mid}" style="font:600 11px 'JetBrains Mono',monospace">M ↓</text>`;
      }
    }

    // Target indicator
    const targetSvg = `<text x="${startX}" y="30" fill="${C.text}" style="font:12px 'Inter',sans-serif">target = <tspan fill="${C.mid}" style="font:600 14px 'JetBrains Mono',monospace">${TARGET}</tspan></text>`;

    // Code highlight
    let codeHtml = CODE.map((line, i) => {
      const active = i === cur.line;
      return `<div style="padding:2px 8px;background:${active ? C.accentSoft : 'transparent'};border-left:2px solid ${active ? C.accent : 'transparent'};font:12px 'JetBrains Mono',monospace;color:${active ? C.text : C.muted};white-space:pre">${line}</div>`;
    }).join('');

    // State panel
    const stateHtml = `
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px">
        <div style="background:${C.leftSoft};border:1px solid ${C.left};border-radius:4px;padding:8px;text-align:center">
          <div style="font:600 9px 'JetBrains Mono',monospace;color:${C.left};text-transform:uppercase;letter-spacing:0.1em;margin-bottom:2px">Left</div>
          <div style="font:600 18px 'JetBrains Mono',monospace;color:${C.text}">${cur.l}</div>
        </div>
        <div style="background:${cur.mid >= 0 ? C.midSoft : C.panel};border:1px solid ${cur.mid >= 0 ? C.mid : C.border};border-radius:4px;padding:8px;text-align:center">
          <div style="font:600 9px 'JetBrains Mono',monospace;color:${C.mid};text-transform:uppercase;letter-spacing:0.1em;margin-bottom:2px">Mid</div>
          <div style="font:600 18px 'JetBrains Mono',monospace;color:${C.text}">${cur.mid >= 0 ? cur.mid : '—'}</div>
        </div>
        <div style="background:${C.rightSoft};border:1px solid ${C.right};border-radius:4px;padding:8px;text-align:center">
          <div style="font:600 9px 'JetBrains Mono',monospace;color:${C.right};text-transform:uppercase;letter-spacing:0.1em;margin-bottom:2px">Right</div>
          <div style="font:600 18px 'JetBrains Mono',monospace;color:${C.text}">${cur.r}</div>
        </div>
      </div>`;

    const svgW = totalW + 40;
    container.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 300px;gap:8px;height:100%;padding:8px;font-family:'Inter',sans-serif">
        <div style="background:${C.panel};border:1px solid ${C.border};border-radius:6px;padding:12px;display:flex;flex-direction:column;overflow:hidden">
          <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.1em;color:${C.muted};margin-bottom:8px;font-weight:600">Sorted Array</div>
          <div style="flex:1;display:flex;align-items:center;justify-content:center;overflow-x:auto">
            <svg viewBox="0 0 ${svgW} 160" style="width:100%;max-height:100%">${targetSvg}${cellsSvg}</svg>
          </div>
          <div style="margin-top:8px;padding:8px;background:${cur.type === 'found' ? C.foundSoft : C.midSoft};border:1px solid ${cur.type === 'found' ? C.found : C.mid};border-radius:4px;font:11px 'JetBrains Mono',monospace;color:${cur.type === 'found' ? C.found : C.mid}">› ${cur.msg}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <div style="background:${C.panel};border:1px solid ${C.border};border-radius:6px;padding:8px">
            <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.1em;color:${C.muted};margin-bottom:6px;font-weight:600">State</div>
            ${stateHtml}
          </div>
          <div style="background:${C.panel};border:1px solid ${C.border};border-radius:6px;padding:8px;flex:1">
            <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.1em;color:${C.muted};margin-bottom:6px;font-weight:600">Code</div>
            ${codeHtml}
          </div>
        </div>
      </div>`;
  }

  function step(dir) { stop(); stepIdx = Math.max(0, Math.min(steps.length - 1, stepIdx + dir)); render(); updateStepLabel(); }
  function play() { if (stepIdx >= steps.length - 1) stepIdx = 0; playing = true; tick(); }
  function tick() { if (!playing || stepIdx >= steps.length - 1) { stop(); return; } stepIdx++; render(); updateStepLabel(); timer = setTimeout(tick, speed); }
  function stop() { playing = false; clearTimeout(timer); }
  function reset() { stop(); stepIdx = 0; render(); updateStepLabel(); }
  function setSpeed(s) { speed = s; }
  function updateStepLabel() { const l = document.getElementById('viz-step-label'); if (l) l.textContent = `${stepIdx + 1} / ${steps.length}`; }
  function getTitle() { return 'Binary Search'; }
  function getStepCount() { return steps ? steps.length : 0; }
  function isPlaying() { return playing; }

  return { init, step, play, stop, reset, setSpeed, getTitle, getStepCount, isPlaying, render };
})();

if (typeof window.VIZ_REGISTRY === 'undefined') window.VIZ_REGISTRY = {};
window.VIZ_REGISTRY['binary-search'] = BinarySearchVisualizer;
