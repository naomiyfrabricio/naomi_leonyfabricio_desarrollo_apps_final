/**
 * Módulo intercambio_mazos — Incremento 4.
 * Atiende: RF-10 / HU-05 / CA-05 (exportar e importar un mazo mediante archivo local)
 * y RF-12 (rechazar archivos corruptos sin modificar los mazos existentes).
 *
 * Formato de intercambio: JSON con { nombre, tarjetas: [{ pregunta, respuesta }] }.
 */
import { validarNombreMazo } from '../mazos/gestorMazos.js';
import { validarTarjeta } from '../tarjetas/gestorTarjetas.js';

export const MENSAJES_INTERCAMBIO = {
  MAZO_NO_EXISTE: 'El mazo seleccionado no existe.',
  ARCHIVO_INVALIDO: 'El archivo no tiene un formato válido y no se importó. Los mazos existentes no cambiaron.',
  MAZO_EXPORTADO: 'Mazo exportado correctamente.',
  MAZO_IMPORTADO: 'Mazo importado correctamente.',
};

/**
 * Construye el contenido exportable de un mazo: nombre y tarjetas (CA-05).
 * @param {{nombre:string, tarjetas: Array<{pregunta:string, respuesta:string}>}} mazo
 * @returns {{ok:true, nombreArchivo:string, contenido:string} | {ok:false, error:string}}
 */
export function exportarMazo(mazo) {
  if (!mazo) return { ok: false, error: MENSAJES_INTERCAMBIO.MAZO_NO_EXISTE };
  const datos = {
    version: 1,
    nombre: mazo.nombre,
    tarjetas: mazo.tarjetas.map((t) => ({ pregunta: t.pregunta, respuesta: t.respuesta })),
  };
  const nombreArchivo = `${mazo.nombre.trim().toLowerCase().replace(/\s+/g, '_')}.json`;
  return { ok: true, nombreArchivo, contenido: JSON.stringify(datos, null, 2) };
}

/**
 * Valida la estructura de un archivo importado sin tocar el almacenamiento (RF-12, RNF-03).
 * @returns {{valido: true, datos: {nombre:string, tarjetas: Array}} | {valido: false, error: string}}
 */
function validarEstructuraImportada(contenidoTexto, mazosExistentes) {
  let datos;
  try {
    datos = JSON.parse(contenidoTexto);
  } catch {
    return { valido: false, error: MENSAJES_INTERCAMBIO.ARCHIVO_INVALIDO };
  }
  if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
    return { valido: false, error: MENSAJES_INTERCAMBIO.ARCHIVO_INVALIDO };
  }

  const nombreValido = validarNombreMazo(datos.nombre, mazosExistentes);
  if (!nombreValido.valido) {
    return { valido: false, error: MENSAJES_INTERCAMBIO.ARCHIVO_INVALIDO };
  }

  if (!Array.isArray(datos.tarjetas)) {
    return { valido: false, error: MENSAJES_INTERCAMBIO.ARCHIVO_INVALIDO };
  }
  for (const t of datos.tarjetas) {
    if (!t || typeof t !== 'object') return { valido: false, error: MENSAJES_INTERCAMBIO.ARCHIVO_INVALIDO };
    const v = validarTarjeta(t.pregunta, t.respuesta);
    if (!v.valido) return { valido: false, error: MENSAJES_INTERCAMBIO.ARCHIVO_INVALIDO };
  }

  return { valido: true, datos };
}

export class IntercambioMazos {
  /** @param almacenamiento - cumple { obtenerMazos(), guardarMazo(mazo) } (RNF-05) */
  constructor(almacenamiento) {
    this.almacenamiento = almacenamiento;
  }

  /** Exporta un mazo existente (RF-10). */
  exportarMazo(mazoId) {
    const mazo = this.almacenamiento.obtenerMazos().find((m) => m.id === mazoId);
    return exportarMazo(mazo);
  }

  /**
   * Importa un mazo desde el texto de un archivo (RF-10). Si el archivo está
   * corrupto o mal formado, no modifica los mazos existentes (RF-12).
   * @returns {{ok:true, mazo:object, mensaje:string} | {ok:false, error:string}}
   */
  importarMazo(contenidoTexto) {
    const mazosExistentes = this.almacenamiento.obtenerMazos();
    const r = validarEstructuraImportada(contenidoTexto, mazosExistentes);
    if (!r.valido) return { ok: false, error: r.error };

    const id = mazosExistentes.reduce((max, m) => Math.max(max, m.id), 0) + 1;
    const tarjetas = r.datos.tarjetas.map((t, i) => ({
      id: i + 1,
      pregunta: t.pregunta.trim(),
      respuesta: t.respuesta.trim(),
    }));
    const mazo = { id, nombre: r.datos.nombre.trim(), tarjetas };
    this.almacenamiento.guardarMazo(mazo);
    return { ok: true, mazo, mensaje: MENSAJES_INTERCAMBIO.MAZO_IMPORTADO };
  }
}
