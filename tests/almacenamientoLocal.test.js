// Pruebas del almacenamiento local (RNF-05, RNF-09). Ejecutar con: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AlmacenamientoLocal, CLAVE_MAZOS } from '../src/almacenamiento/almacenamientoLocal.js';
import { AlmacenamientoMemoria } from '../src/almacenamiento/almacenamientoMemoria.js';

/** Simula window.localStorage en Node. */
function storageFalso(inicial = {}) {
  const datos = { ...inicial };
  return { getItem: (k) => (k in datos ? datos[k] : null), setItem: (k, v) => { datos[k] = String(v); } };
}

test('NORMAL RNF-09: un mazo guardado se recupera desde otra instancia', () => {
  const storage = storageFalso();
  new AlmacenamientoLocal(storage).guardarMazo({ id: 1, nombre: 'Lógica', tarjetas: [] });
  const recuperados = new AlmacenamientoLocal(storage).obtenerMazos();
  assert.deepEqual(recuperados, [{ id: 1, nombre: 'Lógica', tarjetas: [] }]);
});

test('NORMAL: actualizarMazo reemplaza el mazo con el mismo id', () => {
  const alm = new AlmacenamientoLocal(storageFalso());
  alm.guardarMazo({ id: 1, nombre: 'Lógica', tarjetas: [] });
  const ok = alm.actualizarMazo({ id: 1, nombre: 'Lógica', tarjetas: [{ pregunta: 'p', respuesta: 'r' }] });
  assert.equal(ok, true);
  assert.equal(alm.obtenerMazos()[0].tarjetas.length, 1);
});

test('LÍMITE: almacenamiento sin datos devuelve lista vacía', () => {
  assert.deepEqual(new AlmacenamientoLocal(storageFalso()).obtenerMazos(), []);
});

test('ERROR: contenido dañado en el almacenamiento devuelve lista vacía sin lanzar error', () => {
  const alm = new AlmacenamientoLocal(storageFalso({ [CLAVE_MAZOS]: '{no es json' }));
  assert.deepEqual(alm.obtenerMazos(), []);
});

test('ERROR: actualizarMazo con id inexistente devuelve false (local y memoria)', () => {
  assert.equal(new AlmacenamientoLocal(storageFalso()).actualizarMazo({ id: 99, nombre: 'x', tarjetas: [] }), false);
  assert.equal(new AlmacenamientoMemoria().actualizarMazo({ id: 99, nombre: 'x', tarjetas: [] }), false);
});
