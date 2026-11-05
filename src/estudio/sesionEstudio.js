/**
 * Módulo sesion_estudio — Incremento 2.
 * Atiende: RF-07 / HU-03 / CA-03 (tarjetas una por una, revelar respuesta)
 *          RF-11 / HU-07 / CA-07 (aviso de mazo vacío).
 *
 * No registra aciertos ni fallos (RF-08): eso corresponde al incremento siguiente.
 * Las tarjetas se muestran en el orden en que se agregaron.
 */

export const MENSAJES_ESTUDIO = {
  MAZO_VACIO: 'Este mazo no tiene tarjetas. Agrega al menos una antes de estudiar.',
  MAZO_NO_EXISTE: 'El mazo seleccionado no existe.',
};

export class SesionEstudio {
  constructor(mazo) {
    this.mazo = mazo;
    this.indice = 0;
    this.respuestaVisible = false;
  }

  /**
   * Inicia una sesión de estudio sobre un mazo (RF-07, RF-11).
   * @returns {{ok: true, sesion: SesionEstudio} | {ok: false, error: string}}
   */
  static iniciar(mazo) {
    if (!mazo) return { ok: false, error: MENSAJES_ESTUDIO.MAZO_NO_EXISTE };
    if (!Array.isArray(mazo.tarjetas) || mazo.tarjetas.length === 0) {
      return { ok: false, error: MENSAJES_ESTUDIO.MAZO_VACIO };
    }
    return { ok: true, sesion: new SesionEstudio(mazo) };
  }

  /** Lo que la interfaz debe mostrar ahora: pregunta, y respuesta solo si ya se reveló. */
  vistaActual() {
    const t = this.mazo.tarjetas[this.indice];
    return {
      posicion: this.indice + 1,
      total: this.mazo.tarjetas.length,
      pregunta: t.pregunta,
      respuesta: this.respuestaVisible ? t.respuesta : null,
    };
  }

  /** Revela la respuesta de la tarjeta actual (botón "Revelar" o tocar la tarjeta). */
  revelar() {
    this.respuestaVisible = true;
    return this.vistaActual();
  }

  /** Avanza a la siguiente tarjeta con la respuesta oculta. Devuelve false si ya era la última. */
  siguiente() {
    if (this.esUltima()) return false;
    this.indice += 1;
    this.respuestaVisible = false;
    return true;
  }

  esUltima() {
    return this.indice === this.mazo.tarjetas.length - 1;
  }
}
