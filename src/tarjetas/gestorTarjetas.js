/**
 * Módulo gestor_tarjetas — Incremento 2.
 * Atiende: RF-04 / HU-02 / CA-02 (añadir tarjeta con pregunta y respuesta en texto).
 *
 * No incluye editar (RF-05) ni eliminar (RF-06) tarjetas.
 */

export const MENSAJES_TARJETA = {
  PREGUNTA_VACIA: 'La pregunta no puede estar vacía.',
  RESPUESTA_VACIA: 'La respuesta no puede estar vacía.',
  MAZO_NO_EXISTE: 'El mazo seleccionado no existe.',
  TARJETA_AGREGADA: 'Tarjeta agregada correctamente.',
  TARJETA_EDITADA: 'Tarjeta actualizada.',
  TARJETA_ELIMINADA: 'Tarjeta eliminada.',
  TARJETA_NO_EXISTE: 'La tarjeta seleccionada no existe.',
  ELIMINACION_CANCELADA: 'Eliminación cancelada. No se borró nada.',
};

const estaVacio = (texto) => typeof texto !== 'string' || texto.trim() === '';

/**
 * Valida los campos de una tarjeta.
 * @returns {{valido: boolean, error?: string}}
 */
export function validarTarjeta(pregunta, respuesta) {
  if (estaVacio(pregunta)) return { valido: false, error: MENSAJES_TARJETA.PREGUNTA_VACIA };
  if (estaVacio(respuesta)) return { valido: false, error: MENSAJES_TARJETA.RESPUESTA_VACIA };
  return { valido: true };
}

export class GestorTarjetas {
  /** @param almacenamiento - cumple { obtenerMazos(), actualizarMazo(mazo) } (RNF-05) */
  constructor(almacenamiento) {
    this.almacenamiento = almacenamiento;
  }

  /**
   * Añade una tarjeta al mazo indicado (RF-04).
   * @returns {{ok: true, tarjeta: object, totalTarjetas: number, mensaje: string} | {ok: false, error: string}}
   */
  agregarTarjeta(mazoId, pregunta, respuesta) {
    const mazo = this.almacenamiento.obtenerMazos().find((m) => m.id === mazoId);
    if (!mazo) return { ok: false, error: MENSAJES_TARJETA.MAZO_NO_EXISTE };

    const v = validarTarjeta(pregunta, respuesta);
    if (!v.valido) return { ok: false, error: v.error };

    const id = mazo.tarjetas.reduce((max, t) => Math.max(max, t.id), 0) + 1;
    const tarjeta = { id, pregunta: pregunta.trim(), respuesta: respuesta.trim() };
    const actualizado = { ...mazo, tarjetas: [...mazo.tarjetas, tarjeta] };
    this.almacenamiento.actualizarMazo(actualizado);
    return { ok: true, tarjeta, totalTarjetas: actualizado.tarjetas.length, mensaje: MENSAJES_TARJETA.TARJETA_AGREGADA };
  }

  /**
   * Edita la pregunta y la respuesta de una tarjeta existente (RF-05).
   * @returns {{ok: true, tarjeta: object, mensaje: string} | {ok: false, error: string}}
   */
  editarTarjeta(mazoId, tarjetaId, pregunta, respuesta) {
    const mazo = this.almacenamiento.obtenerMazos().find((m) => m.id === mazoId);
    if (!mazo) return { ok: false, error: MENSAJES_TARJETA.MAZO_NO_EXISTE };
    if (!mazo.tarjetas.some((t) => t.id === tarjetaId)) return { ok: false, error: MENSAJES_TARJETA.TARJETA_NO_EXISTE };
    const v = validarTarjeta(pregunta, respuesta);
    if (!v.valido) return { ok: false, error: v.error };
    const tarjeta = { id: tarjetaId, pregunta: pregunta.trim(), respuesta: respuesta.trim() };
    const tarjetas = mazo.tarjetas.map((t) => (t.id === tarjetaId ? tarjeta : t));
    this.almacenamiento.actualizarMazo({ ...mazo, tarjetas });
    return { ok: true, tarjeta, mensaje: MENSAJES_TARJETA.TARJETA_EDITADA };
  }

  /**
   * Elimina una tarjeta (RF-06). Solo borra si `confirmado` es true.
   * @returns {{ok: true, totalTarjetas: number, mensaje: string} | {ok: false, cancelado?: true, error: string}}
   */
  eliminarTarjeta(mazoId, tarjetaId, confirmado) {
    if (confirmado !== true) return { ok: false, cancelado: true, error: MENSAJES_TARJETA.ELIMINACION_CANCELADA };
    const mazo = this.almacenamiento.obtenerMazos().find((m) => m.id === mazoId);
    if (!mazo) return { ok: false, error: MENSAJES_TARJETA.MAZO_NO_EXISTE };
    const tarjetas = mazo.tarjetas.filter((t) => t.id !== tarjetaId);
    if (tarjetas.length === mazo.tarjetas.length) return { ok: false, error: MENSAJES_TARJETA.TARJETA_NO_EXISTE };
    this.almacenamiento.actualizarMazo({ ...mazo, tarjetas });
    return { ok: true, totalTarjetas: tarjetas.length, mensaje: MENSAJES_TARJETA.TARJETA_ELIMINADA };
  }

  /** Número de tarjetas del mazo (el contador de CA-02). Devuelve 0 si no existe. */
  contarTarjetas(mazoId) {
    const mazo = this.almacenamiento.obtenerMazos().find((m) => m.id === mazoId);
    return mazo ? mazo.tarjetas.length : 0;
  }
}
