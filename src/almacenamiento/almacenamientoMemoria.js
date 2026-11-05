/**
 * Almacenamiento en memoria (RNF-05).
 *
 * Implementa la interfaz común de persistencia que usa el gestor de mazos:
 *   - obtenerMazos(): Array<{id, nombre, tarjetas}>
 *   - guardarMazo(mazo): void
 *
 * En incrementos posteriores se puede sustituir por un almacenamiento
 * local (localStorage / IndexedDB) con los mismos dos métodos, sin
 * modificar el gestor de mazos.
 */
export class AlmacenamientoMemoria {
  constructor() {
    this._mazos = [];
  }

  /** Devuelve una copia de la lista de mazos guardados. */
  obtenerMazos() {
    return this._mazos.map((m) => ({ ...m, tarjetas: [...m.tarjetas] }));
  }

  /** Guarda un mazo nuevo. */
  guardarMazo(mazo) {
    this._mazos.push({ ...mazo, tarjetas: [...mazo.tarjetas] });
  }
}
