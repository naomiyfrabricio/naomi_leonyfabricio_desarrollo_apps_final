// Pruebas del módulo sesion_estudio (RF-07 / CA-03, RF-11 / CA-07). Ejecutar con: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { SesionEstudio, MENSAJES_ESTUDIO } from '../src/estudio/sesionEstudio.js';

const mazoCon = (n) => ({
  id: 1,
  nombre: 'Lógica',
  tarjetas: Array.from({ length: n }, (_, i) => ({ id: i + 1, pregunta: `P${i + 1}`, respuesta: `R${i + 1}` })),
});

test('NORMAL CA-03: al iniciar se muestra la pregunta de la primera tarjeta con la respuesta oculta', () => {
  const r = SesionEstudio.iniciar(mazoCon(3));
  assert.equal(r.ok, true);
  assert.deepEqual(r.sesion.vistaActual(), { posicion: 1, total: 3, pregunta: 'P1', respuesta: null });
});

test('NORMAL CA-03: revelar muestra la respuesta en menos de 500 ms', () => {
  const { sesion } = SesionEstudio.iniciar(mazoCon(3));
  const t0 = performance.now();
  const vista = sesion.revelar();
  const ms = performance.now() - t0;
  assert.equal(vista.respuesta, 'R1');
  assert.ok(ms < 500, `tardó ${ms} ms`);
});

test('NORMAL RF-07: siguiente avanza una por una y vuelve a ocultar la respuesta', () => {
  const { sesion } = SesionEstudio.iniciar(mazoCon(2));
  sesion.revelar();
  assert.equal(sesion.siguiente(), true);
  assert.deepEqual(sesion.vistaActual(), { posicion: 2, total: 2, pregunta: 'P2', respuesta: null });
});

test('LÍMITE RF-07: mazo de una sola tarjeta inicia y no permite avanzar más allá', () => {
  const { sesion } = SesionEstudio.iniciar(mazoCon(1));
  assert.equal(sesion.esUltima(), true);
  assert.equal(sesion.siguiente(), false);
  assert.equal(sesion.vistaActual().posicion, 1);
});

test('LÍMITE RNF-02: revelar en un mazo de 1000 tarjetas sigue tardando menos de 500 ms', () => {
  const { sesion } = SesionEstudio.iniciar(mazoCon(1000));
  const t0 = performance.now();
  sesion.revelar();
  assert.ok(performance.now() - t0 < 500);
});

test('ERROR CA-07: mazo sin tarjetas no inicia y muestra el aviso de mazo vacío', () => {
  const r = SesionEstudio.iniciar(mazoCon(0));
  assert.equal(r.ok, false);
  assert.equal(r.error, MENSAJES_ESTUDIO.MAZO_VACIO);
});

test('ERROR: mazo inexistente no inicia', () => {
  const r = SesionEstudio.iniciar(undefined);
  assert.equal(r.ok, false);
  assert.equal(r.error, MENSAJES_ESTUDIO.MAZO_NO_EXISTE);
});
