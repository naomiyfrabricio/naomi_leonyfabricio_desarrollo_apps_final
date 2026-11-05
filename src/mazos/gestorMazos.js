/**
 * Módulo gestor_mazos — Primer incremento.
 * Atiende: RF-01 / HU-01 / CA-01 (crear mazo con nombre válido y no duplicado).
 *
 * No incluye: editar (RF-02), eliminar (RF-03), tarjetas, interfaz gráfica
 * ni persistencia real. Esas partes corresponden a otros módulos/incrementos.
 */

/** Longitud máxima del nombre de un mazo (decisión del equipo, ver riesgos del doc). */
export const LONGITUD_MAXIMA_NOMBRE = 50;

/** Mensajes de error que la interfaz mostrará al usuario. */
export const MENSAJES = {
  NOMBRE_VACIO: 'El nombre del mazo no puede estar vacío.',
  NOMBRE_DUPLICADO: 'Ya existe un mazo con ese nombre. Elige otro.',
  NOMBRE_MUY_LARGO: `El nombre del mazo no puede tener más de ${LONGITUD_MAXIMA_NOMBRE} caracteres.`,
  MAZO_CREADO: 'Mazo creado correctamente.',
};

/**
 * Normaliza un nombre para compararlo: sin espacios en los extremos y en minúsculas.
 * Así "Lógica" y "  lógica " se consideran el mismo nombre.
 * @param {string} nombre
 * @returns {string}
 */
export function normalizarNombre(nombre) {
  return nombre.trim().toLowerCase();
}

/**
 * Valida el nombre de un mazo contra los mazos existentes.
 * @param {unknown} nombre - Texto escrito por el usuario.
 * @param {Array<{nombre: string}>} mazosExistentes
 * @returns {{valido: boolean, error?: string}}
 */
export function validarNombreMazo(nombre, mazosExistentes) {
  if (typeof nombre !== 'string' || nombre.trim() === '') {
    return { valido: false, error: MENSAJES.NOMBRE_VACIO };
  }
  if (nombre.trim().length > LONGITUD_MAXIMA_NOMBRE) {
    return { valido: false, error: MENSAJES.NOMBRE_MUY_LARGO };
  }
  const buscado = normalizarNombre(nombre);
  const duplicado = mazosExistentes.some((m) => normalizarNombre(m.nombre) === buscado);
  if (duplicado) {
    return { valido: false, error: MENSAJES.NOMBRE_DUPLICADO };
  }
  return { valido: true };
}

/**
 * Gestor de mazos. Recibe un almacenamiento que cumpla la interfaz
 * { obtenerMazos(), guardarMazo(mazo) } (RNF-05).
 */
export class GestorMazos {
  constructor(almacenamiento) {
    this.almacenamiento = almacenamiento;
    this._siguienteId = 1;
  }

  /**
   * Crea un mazo nuevo (RF-01).
   * @param {unknown} nombre
   * @returns {{ok: true, mazo: object, mensaje: string} | {ok: false, error: string}}
   */
  crearMazo(nombre) {
    const resultado = validarNombreMazo(nombre, this.almacenamiento.obtenerMazos());
    if (!resultado.valido) {
      return { ok: false, error: resultado.error };
    }
    const mazo = { id: this._siguienteId++, nombre: nombre.trim(), tarjetas: [] };
    this.almacenamiento.guardarMazo(mazo);
    return { ok: true, mazo, mensaje: MENSAJES.MAZO_CREADO };
  }

  /** Devuelve la lista principal de mazos (para que aparezcan de inmediato, CA-01). */
  listarMazos() {
    return this.almacenamiento.obtenerMazos();
  }
}
