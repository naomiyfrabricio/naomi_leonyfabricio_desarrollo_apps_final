/**
 * Almacenamiento local en el dispositivo (RNF-09), con la misma interfaz
 * que AlmacenamientoMemoria (RNF-05): obtenerMazos, guardarMazo, actualizarMazo.
 *
 * Recibe el objeto de almacenamiento del navegador (window.localStorage) o
 * cualquier objeto con getItem/setItem, lo que permite probarlo en Node.
 */
export const CLAVE_MAZOS = 'flashcards.mazos';

export class AlmacenamientoLocal {
  /** @param {{getItem(k: string): string|null, setItem(k: string, v: string): void}} storage */
  constructor(storage) {
    this.storage = storage;
  }

  /** Lee los mazos. Si el contenido falta o está dañado, devuelve una lista vacía. */
  obtenerMazos() {
    const crudo = this.storage.getItem(CLAVE_MAZOS);
    if (!crudo) return [];
    try {
      const datos = JSON.parse(crudo);
      return Array.isArray(datos) ? datos : [];
    } catch {
      return [];
    }
  }

  /** Guarda un mazo nuevo al final de la lista. */
  guardarMazo(mazo) {
    const mazos = this.obtenerMazos();
    mazos.push(mazo);
    this._escribir(mazos);
  }

  /** Reemplaza un mazo existente por id. Devuelve false si no existe. */
  actualizarMazo(mazo) {
    const mazos = this.obtenerMazos();
    const i = mazos.findIndex((m) => m.id === mazo.id);
    if (i === -1) return false;
    mazos[i] = mazo;
    this._escribir(mazos);
    return true;
  }

  _escribir(mazos) {
    this.storage.setItem(CLAVE_MAZOS, JSON.stringify(mazos));
  }
}
