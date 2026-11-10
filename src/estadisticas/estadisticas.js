/**
 * Módulo estadísticas (M5) — Incremento 3.
 * Atiende: RF-08 (guardar acierto o fallo) y RF-09 / HU-04 / CA-04 (porcentaje por mazo).
 *
 * Los registros se guardan dentro del mazo (mazo.registros), así que al eliminar
 * un mazo se eliminan también sus registros (RF-03).
 */

export const MENSAJES_ESTADISTICAS = {
  MAZO_NO_EXISTE: 'El mazo seleccionado no existe.',
};

/**
 * Porcentaje de aciertos de un mazo, redondeado al entero más cercano.
 * Devuelve 0 cuando no hay registros (CA-04).
 * @param {{registros?: Array<{acierto: boolean}>}} mazo
 * @returns {number}
 */
export function calcularPorcentaje(mazo) {
  const registros = (mazo && mazo.registros) || [];
  if (registros.length === 0) return 0;
  const aciertos = registros.filter((r) => r.acierto).length;
  return Math.round((aciertos / registros.length) * 100);
}

export class Estadisticas {
  /** @param almacenamiento - cumple { obtenerMazos(), actualizarMazo(mazo) } (RNF-05) */
  constructor(almacenamiento) {
    this.almacenamiento = almacenamiento;
  }

  /**
   * Guarda un registro de estudio y devuelve el porcentaje actualizado (RF-08).
   * @param {number} mazoId
   * @param {{tarjetaId: number, acierto: boolean}} registro
   */
  registrar(mazoId, registro) {
    const mazo = this.almacenamiento.obtenerMazos().find((m) => m.id === mazoId);
    if (!mazo) return { ok: false, error: MENSAJES_ESTADISTICAS.MAZO_NO_EXISTE };
    const registros = [...(mazo.registros || []), { ...registro, fecha: new Date().toISOString() }];
    const actualizado = { ...mazo, registros };
    this.almacenamiento.actualizarMazo(actualizado);
    return { ok: true, porcentaje: calcularPorcentaje(actualizado) };
  }

  /** Resumen del mazo para la pantalla de estadísticas (RF-09). */
  resumen(mazoId) {
    const mazo = this.almacenamiento.obtenerMazos().find((m) => m.id === mazoId);
    if (!mazo) return { ok: false, error: MENSAJES_ESTADISTICAS.MAZO_NO_EXISTE };
    const registros = mazo.registros || [];
    const aciertos = registros.filter((r) => r.acierto).length;
    return { ok: true, aciertos, fallos: registros.length - aciertos, porcentaje: calcularPorcentaje(mazo) };
  }
}
