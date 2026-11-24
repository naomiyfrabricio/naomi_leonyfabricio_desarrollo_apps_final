// EXTRA fuera del alcance de RF-01..12 (ver docs/plan_incrementos.md §1): sonidos sintetizados de acierto y fallo. Solo UI, sin archivos de audio.
// Reciben un AudioContext ya creado y devuelven la duración en segundos para que quien lo creó lo cierre.

function tono(ctx, { onda, f0, f1, inicio, dur, pico, filtro }) {
  const osc = ctx.createOscillator();
  const ganancia = ctx.createGain();
  osc.type = onda;
  osc.frequency.setValueAtTime(f0, inicio);
  if (f1) osc.frequency.exponentialRampToValueAtTime(f1, inicio + dur * 0.8);
  ganancia.gain.setValueAtTime(0.0001, inicio);
  ganancia.gain.exponentialRampToValueAtTime(pico, inicio + 0.01);
  ganancia.gain.exponentialRampToValueAtTime(0.0001, inicio + dur);
  let nodo = osc;
  if (filtro) {
    const wah = ctx.createBiquadFilter();
    wah.type = 'lowpass';
    wah.Q.value = 8;
    wah.frequency.setValueAtTime(filtro.desde, inicio);
    wah.frequency.exponentialRampToValueAtTime(filtro.hasta, inicio + dur);
    osc.connect(wah);
    nodo = wah;
  }
  nodo.connect(ganancia).connect(ctx.destination);
  osc.start(inicio);
  osc.stop(inicio + dur + 0.02);
}

export function tocarAcierto(ctx) {
  const t0 = ctx.currentTime + 0.01;
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
    tono(ctx, { onda: 'square', f0: f, inicio: t0 + i * 0.07, dur: 0.08, pico: 0.05 }));
  const destello = t0 + 0.28;
  tono(ctx, { onda: 'triangle', f0: 1046.5, f1: 1568, inicio: destello, dur: 0.14, pico: 0.07 });
  tono(ctx, { onda: 'triangle', f0: 1318.5, inicio: destello, dur: 0.14, pico: 0.05 });
  return 0.42;
}

export function tocarFallo(ctx) {
  const t0 = ctx.currentTime + 0.01;
  const notas = [
    { f0: 392, f1: 277, dur: 0.2 },
    { f0: 349, f1: 247, dur: 0.2 },
    { f0: 311, f1: 196, dur: 0.26 },
  ];
  notas.forEach((n, i) =>
    tono(ctx, {
      onda: 'sawtooth',
      f0: n.f0,
      f1: n.f1,
      inicio: t0 + i * 0.22,
      dur: n.dur,
      pico: 0.08,
      filtro: { desde: 900, hasta: 220 },
    }));
  return 0.71;
}
