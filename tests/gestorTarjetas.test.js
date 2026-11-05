// Pruebas del módulo gestor_tarjetas (RF-04 / CA-02). Ejecutar con: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GestorTarjetas, MENSAJES_TARJETA } from '../src/tarjetas/gestorTarjetas.js';
import { GestorMazos } from '../src/mazos/gestorMazos.js';
import { AlmacenamientoMemoria } from '../src/almacenamiento/almacenamientoMemoria.js';

function preparar() {
  const alm = new AlmacenamientoMemoria();
  const mazo = new GestorMazos(alm).crearMazo('Derivadas').mazo;
  return { tarjetas: new GestorTarjetas(alm), mazoId: mazo.id };
}

test('NORMAL CA-02: tarjeta válida se agrega y el contador aumenta en uno', () => {
  const { tarjetas, mazoId } = preparar();
  assert.equal(tarjetas.contarTarjetas(mazoId), 0);
  const r = tarjetas.agregarTarjeta(mazoId, '¿Derivada de x²?', '2x');
  assert.equal(r.ok, true);
  assert.equal(r.mensaje, MENSAJES_TARJETA.TARJETA_AGREGADA);
  assert.equal(tarjetas.contarTarjetas(mazoId), 1);
});

test('LÍMITE CA-02: textos de un solo carácter se aceptan y se guardan sin espacios extremos', () => {
  const { tarjetas, mazoId } = preparar();
  const r = tarjetas.agregarTarjeta(mazoId, '  p ', ' r  ');
  assert.equal(r.ok, true);
  assert.deepEqual([r.tarjeta.pregunta, r.tarjeta.respuesta], ['p', 'r']);
});

test('LÍMITE CA-02: la segunda tarjeta recibe un id distinto', () => {
  const { tarjetas, mazoId } = preparar();
  const a = tarjetas.agregarTarjeta(mazoId, 'p1', 'r1').tarjeta;
  const b = tarjetas.agregarTarjeta(mazoId, 'p2', 'r2').tarjeta;
  assert.notEqual(a.id, b.id);
  assert.equal(tarjetas.contarTarjetas(mazoId), 2);
});

test('ERROR CA-02: pregunta vacía muestra error y no guarda la tarjeta', () => {
  const { tarjetas, mazoId } = preparar();
  const r = tarjetas.agregarTarjeta(mazoId, '   ', '2x');
  assert.equal(r.ok, false);
  assert.equal(r.error, MENSAJES_TARJETA.PREGUNTA_VACIA);
  assert.equal(tarjetas.contarTarjetas(mazoId), 0);
});

test('ERROR CA-02: respuesta vacía muestra error y no guarda la tarjeta', () => {
  const { tarjetas, mazoId } = preparar();
  const r = tarjetas.agregarTarjeta(mazoId, '¿Derivada de x²?', '');
  assert.equal(r.ok, false);
  assert.equal(r.error, MENSAJES_TARJETA.RESPUESTA_VACIA);
  assert.equal(tarjetas.contarTarjetas(mazoId), 0);
});

test('ERROR: agregar a un mazo inexistente devuelve error', () => {
  const { tarjetas } = preparar();
  const r = tarjetas.agregarTarjeta(999, 'p', 'r');
  assert.equal(r.ok, false);
  assert.equal(r.error, MENSAJES_TARJETA.MAZO_NO_EXISTE);
});
