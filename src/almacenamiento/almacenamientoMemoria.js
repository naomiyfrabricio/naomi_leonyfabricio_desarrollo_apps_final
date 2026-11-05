/**
 * Almacenamiento en memoria (RNF-05).
 *
 * Implementa la interfaz común de persistencia:
 *   - obtenerMazos(): Array<{id, nombre, tarjetas}>
 *   - guardarMazo(mazo): void
 *   - actualizarMazo(mazo): boolean  (incremento 2)
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

  /** Reemplaza un mazo existente por id. Devuelve false si no existe. */
  actualizarMazo(mazo) {
    const i = this._mazos.findIndex((m) => m.id === mazo.id);
    if (i === -1) return false;
    this._mazos[i] = { ...mazo, tarjetas: [...mazo.tarjetas] };
    return true;
  }
}
