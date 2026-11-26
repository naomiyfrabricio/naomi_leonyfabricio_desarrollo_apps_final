// EXTRA fuera del alcance de RF-01..12 (ver docs/plan_incrementos.md §1): "Modo 4 opciones". Lógica pura, sin DOM.

export function normalizarRespuesta(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

function barajarCopia(arr, azar) {
  const copia = [...arr];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/** true si las tarjetas tienen al menos 4 respuestas distintas (texto normalizado). */
export function puedeUsarOpciones(tarjetas) {
  const distintas = new Set((tarjetas ?? []).map((t) => normalizarRespuesta(t.respuesta)));
  distintas.delete('');
  return distintas.size >= 4;
}

/**
 * La respuesta correcta más 3 distractores tomados de otras tarjetas del mismo mazo, en posiciones barajadas.
 * @returns {{opciones: string[], indiceCorrecto: number} | null} null si no hay 3 distractores distintos.
 */
export function generarOpciones(tarjeta, tarjetasDelMazo, azar = Math.random) {
  const vistos = new Set([normalizarRespuesta(tarjeta.respuesta), '']);
  const candidatos = [];
  for (const t of tarjetasDelMazo) {
    if (t === tarjeta) continue;
    const clave = normalizarRespuesta(t.respuesta);
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    candidatos.push(t.respuesta);
  }
  if (candidatos.length < 3) return null;
  const distractores = barajarCopia(candidatos, azar).slice(0, 3);
  const opciones = barajarCopia([tarjeta.respuesta, ...distractores], azar);
  return { opciones, indiceCorrecto: opciones.indexOf(tarjeta.respuesta) };
}
