/**
 * Módulo sesion_estudio — Incremento 2.
 * Atiende: RF-07 / HU-03 / CA-03 (tarjetas una por una, revelar respuesta)
 *          RF-11 / HU-07 / CA-07 (aviso de mazo vacío).
 *
 * Incremento 3: permite marcar acierto o fallo (RF-08) solo después de revelar la respuesta.
 * Guardar el registro y calcular el porcentaje le corresponde al módulo de estadísticas.
 * Las tarjetas se muestran en el orden en que se agregaron.
 */

export const MENSAJES_ESTUDIO = {
  MAZO_VACIO: 'Este mazo no tiene tarjetas. Agrega al menos una antes de estudiar.',
  MAZO_NO_EXISTE: 'El mazo seleccionado no existe.',
  REVELAR_PRIMERO: 'Revela la respuesta antes de marcar acierto o fallo.',
  YA_MARCADA: 'Esta tarjeta ya se marcó en este repaso.',
};

export class SesionEstudio {
  constructor(mazo) {
    this.mazo = mazo;
    this.indice = 0;
    this.respuestaVisible = false;
    this.marcadas = new Set();
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

  /** true cuando ya se puede marcar la tarjeta actual (respuesta revelada y aún sin marcar). */
  puedeMarcar() {
    return this.respuestaVisible && !this.marcadas.has(this.indice);
  }

  /**
   * Marca la tarjeta actual como acierto (true) o fallo (false) (RF-08).
   * @returns {{ok: true, registro: {tarjetaId: number, acierto: boolean}} | {ok: false, error: string}}
   */
  marcar(acierto) {
    if (!this.respuestaVisible) return { ok: false, error: MENSAJES_ESTUDIO.REVELAR_PRIMERO };
    if (this.marcadas.has(this.indice)) return { ok: false, error: MENSAJES_ESTUDIO.YA_MARCADA };
    this.marcadas.add(this.indice);
    return { ok: true, registro: { tarjetaId: this.mazo.tarjetas[this.indice].id, acierto: acierto === true } };
  }

  /** El repaso terminó cuando la última tarjeta ya se marcó. */
  terminado() {
    return this.esUltima() && this.marcadas.has(this.indice);
  }
}
