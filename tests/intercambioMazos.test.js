// Pruebas de exportar/importar mazos (RF-10, RF-12 / CA-05). Ejecutar con: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { IntercambioMazos, MENSAJES_INTERCAMBIO } from '../src/intercambio/intercambioMazos.js';
import { GestorMazos } from '../src/mazos/gestorMazos.js';
import { GestorTarjetas } from '../src/tarjetas/gestorTarjetas.js';
import { AlmacenamientoMemoria } from '../src/almacenamiento/almacenamientoMemoria.js';

function prepararMazoConTarjetas() {
  const alm = new AlmacenamientoMemoria();
  const mazoId = new GestorMazos(alm).crearMazo('Derivadas').mazo.id;
  const t = new GestorTarjetas(alm);
  t.agregarTarjeta(mazoId, 'd/dx x^2', '2x');
  t.agregarTarjeta(mazoId, 'd/dx sen x', 'cos(x)');
  return { alm, mazoId, intercambio: new IntercambioMazos(alm) };
}

test('NORMAL RF-10: exportar un mazo produce JSON con su nombre y tarjetas', () => {
  const { mazoId, intercambio } = prepararMazoConTarjetas();
  const r = intercambio.exportarMazo(mazoId);
  assert.equal(r.ok, true);
  assert.equal(r.nombreArchivo, 'derivadas.json');
  const datos = JSON.parse(r.contenido);
  assert.equal(datos.nombre, 'Derivadas');
  assert.deepEqual(datos.tarjetas, [
    { pregunta: 'd/dx x^2', respuesta: '2x' },
    { pregunta: 'd/dx sen x', respuesta: 'cos(x)' },
  ]);
});

test('ERROR RF-10: exportar un mazo inexistente devuelve error', () => {
  const { intercambio } = prepararMazoConTarjetas();
  const r = intercambio.exportarMazo(999);
  assert.equal(r.ok, false);
  assert.equal(r.error, MENSAJES_INTERCAMBIO.MAZO_NO_EXISTE);
});

test('NORMAL CA-05: importar un archivo válido conserva nombre y tarjetas en otro entorno', () => {
  const origen = prepararMazoConTarjetas();
  const exportado = origen.intercambio.exportarMazo(origen.mazoId);

  const destino = new IntercambioMazos(new AlmacenamientoMemoria());
  const r = destino.importarMazo(exportado.contenido);

  assert.equal(r.ok, true);
  assert.equal(r.mazo.nombre, 'Derivadas');
  assert.equal(r.mazo.tarjetas.length, 2);
  assert.equal(r.mazo.tarjetas[0].pregunta, 'd/dx x^2');
  assert.equal(r.mazo.tarjetas[1].respuesta, 'cos(x)');
});

test('LÍMITE RF-10: importar un mazo sin tarjetas se acepta con lista vacía', () => {
  const alm = new AlmacenamientoMemoria();
  const intercambio = new IntercambioMazos(alm);
  const r = intercambio.importarMazo(JSON.stringify({ nombre: 'Vacío', tarjetas: [] }));
  assert.equal(r.ok, true);
  assert.deepEqual(r.mazo.tarjetas, []);
});

test('ERROR RF-12: archivo con JSON corrupto no se importa y no cambia los mazos existentes', () => {
  const { alm, intercambio } = prepararMazoConTarjetas();
  const antes = alm.obtenerMazos();
  const r = intercambio.importarMazo('{ nombre: "Derivadas", tarjetas: [ ');
  assert.equal(r.ok, false);
  assert.equal(r.error, MENSAJES_INTERCAMBIO.ARCHIVO_INVALIDO);
  assert.deepEqual(alm.obtenerMazos(), antes);
});

test('ERROR RF-12: archivo con nombre vacío o duplicado se rechaza sin modificar los mazos', () => {
  const { alm, intercambio } = prepararMazoConTarjetas();
  const antes = alm.obtenerMazos();

  const sinNombre = intercambio.importarMazo(JSON.stringify({ nombre: '', tarjetas: [] }));
  assert.equal(sinNombre.ok, false);
  assert.equal(sinNombre.error, MENSAJES_INTERCAMBIO.ARCHIVO_INVALIDO);

  const duplicado = intercambio.importarMazo(JSON.stringify({ nombre: 'Derivadas', tarjetas: [] }));
  assert.equal(duplicado.ok, false);
  assert.deepEqual(alm.obtenerMazos(), antes);
});

test('ERROR RF-12: tarjeta con pregunta o respuesta vacía dentro del archivo lo rechaza completo', () => {
  const { alm, intercambio } = prepararMazoConTarjetas();
  const antes = alm.obtenerMazos();
  const r = intercambio.importarMazo(
    JSON.stringify({ nombre: 'Integrales', tarjetas: [{ pregunta: '∫x dx', respuesta: '' }] })
  );
  assert.equal(r.ok, false);
  assert.equal(r.error, MENSAJES_INTERCAMBIO.ARCHIVO_INVALIDO);
  assert.deepEqual(alm.obtenerMazos(), antes);
});

test('ERROR RF-12: archivo que no es un objeto (lista o texto plano) se rechaza', () => {
  const { alm, intercambio } = prepararMazoConTarjetas();
  const antes = alm.obtenerMazos();
  assert.equal(intercambio.importarMazo('[1,2,3]').ok, false);
  assert.equal(intercambio.importarMazo('"solo texto"').ok, false);
  assert.equal(intercambio.importarMazo(JSON.stringify({ nombre: 'Sin tarjetas' })).ok, false);
  assert.deepEqual(alm.obtenerMazos(), antes);
});
