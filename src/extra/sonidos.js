// EXTRA fuera del alcance de RF-01..12 (ver docs/plan_incrementos.md §1): sonidos sintetizados de acierto y fallo. Solo UI, sin archivos de audio.
// Reciben un AudioContext ya creado y devuelven la duración en segundos para que quien lo creó lo cierre.

function crearSalida(ctx, volumen) {
  const master = ctx.createGain();
  master.gain.value = volumen;
  const compresor = ctx.createDynamicsCompressor();
  compresor.threshold.value = -6;
  compresor.knee.value = 0;
  compresor.ratio.value = 20;
  compresor.attack.value = 0.001;
  compresor.release.value = 0.25;
  master.connect(compresor).connect(ctx.destination);
  return master;
}

function tono(ctx, destino, { onda, f0, f1, inicio, dur, pico, filtro }) {
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
  nodo.connect(ganancia).connect(destino);
  osc.start(inicio);
  osc.stop(inicio + dur + 0.02);
}

export function tocarAcierto(ctx) {
  const destino = crearSalida(ctx, 3);
  const t0 = ctx.currentTime + 0.06;
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
    tono(ctx, destino, { onda: 'square', f0: f, inicio: t0 + i * 0.07, dur: 0.08, pico: 0.15 }));
  const destello = t0 + 0.28;
  tono(ctx, destino, { onda: 'triangle', f0: 1046.5, f1: 1568, inicio: destello, dur: 0.14, pico: 0.2 });
  tono(ctx, destino, { onda: 'triangle', f0: 1318.5, inicio: destello, dur: 0.14, pico: 0.15 });
  return 0.47;
}

export function tocarFallo(ctx) {
  const destino = crearSalida(ctx, 4);
  const t0 = ctx.currentTime + 0.06;
  const notas = [
    { f0: 392, f1: 277, dur: 0.2 },
    { f0: 349, f1: 247, dur: 0.2 },
    { f0: 311, f1: 196, dur: 0.26 },
  ];
  notas.forEach((n, i) =>
    tono(ctx, destino, {
      onda: 'sawtooth',
      f0: n.f0,
      f1: n.f1,
      inicio: t0 + i * 0.22,
      dur: n.dur,
      pico: 0.22,
      filtro: { desde: 900, hasta: 220 },
    }));
  return 0.76;
}
