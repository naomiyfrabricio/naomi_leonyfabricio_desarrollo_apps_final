// EXTRA fuera del alcance de RF-01..12 (ver docs/plan_incrementos.md §1): "Modo quiz con reloj total". Lógica pura, sin DOM.

/** Hasta `cantidad` tarjetas al azar y sin repetir (Fisher-Yates sobre una copia; no muta la entrada). */
export function elegirPreguntasQuiz(tarjetas, cantidad = 10, azar = Math.random) {
  const copia = [...(tarjetas ?? [])];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia.slice(0, Math.max(0, cantidad));
}

/** Segundos a "m:ss" (125 → "2:05"); negativos o inválidos dan "0:00". */
export function formatearTiempo(segundos) {
  const s = Number.isFinite(segundos) ? Math.max(0, Math.floor(segundos)) : 0;
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Cifras del resumen: el puntaje son los aciertos y el porcentaje se calcula sobre todas las preguntas del quiz. */
export function resumenQuiz({ aciertos, fallos, totalPreguntas }) {
  const respondidas = aciertos + fallos;
  const sinResponder = Math.max(0, totalPreguntas - respondidas);
  const porcentaje = totalPreguntas > 0 ? Math.round((aciertos / totalPreguntas) * 100) : 0;
  return { sinResponder, respondidas, puntaje: aciertos, porcentaje };
}
