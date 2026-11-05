// Pruebas del módulo gestor_mazos (RF-01 / CA-01). Ejecutar con: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GestorMazos, MENSAJES, LONGITUD_MAXIMA_NOMBRE } from '../src/mazos/gestorMazos.js';
import { AlmacenamientoMemoria } from '../src/almacenamiento/almacenamientoMemoria.js';

const nuevoGestor = () => new GestorMazos(new AlmacenamientoMemoria());

// --- Caso normal ---
test('NORMAL CA-01: crea un mazo con nombre válido y aparece en la lista', () => {
  const gestor = nuevoGestor();
  const r = gestor.crearMazo('Equivalencias lógicas');
  assert.equal(r.ok, true);
  assert.equal(r.mensaje, MENSAJES.MAZO_CREADO);
  assert.equal(r.mazo.nombre, 'Equivalencias lógicas');
  assert.deepEqual(gestor.listarMazos().map((m) => m.nombre), ['Equivalencias lógicas']);
});

test('NORMAL CA-01: el mazo nuevo empieza sin tarjetas', () => {
  const r = nuevoGestor().crearMazo('Derivadas');
  assert.deepEqual(r.mazo.tarjetas, []);
});

// --- Casos límite ---
test('LÍMITE CA-01: nombre de exactamente 50 caracteres se acepta', () => {
  const r = nuevoGestor().crearMazo('a'.repeat(LONGITUD_MAXIMA_NOMBRE));
  assert.equal(r.ok, true);
});

test('LÍMITE CA-01: nombre de 51 caracteres se rechaza', () => {
  const gestor = nuevoGestor();
  const r = gestor.crearMazo('a'.repeat(LONGITUD_MAXIMA_NOMBRE + 1));
  assert.equal(r.ok, false);
  assert.equal(r.error, MENSAJES.NOMBRE_MUY_LARGO);
  assert.equal(gestor.listarMazos().length, 0);
});

test('LÍMITE CA-01: duplicado con distinta capitalización y espacios se rechaza', () => {
  const gestor = nuevoGestor();
  gestor.crearMazo('Lógica');
  const r = gestor.crearMazo('  LÓGICA  ');
  assert.equal(r.ok, false);
  assert.equal(r.error, MENSAJES.NOMBRE_DUPLICADO);
  assert.equal(gestor.listarMazos().length, 1);
});

test('LÍMITE CA-01: con mazos ya guardados, un gestor nuevo no repite ids', () => {
  const alm = new AlmacenamientoMemoria();
  new GestorMazos(alm).crearMazo('Lógica');
  const r = new GestorMazos(alm).crearMazo('Derivadas');
  assert.equal(r.mazo.id, 2);
});

// --- Casos de error ---
test('ERROR CA-01: nombre vacío muestra error y no crea el mazo', () => {
  const gestor = nuevoGestor();
  const r = gestor.crearMazo('');
  assert.equal(r.ok, false);
  assert.equal(r.error, MENSAJES.NOMBRE_VACIO);
  assert.equal(gestor.listarMazos().length, 0);
});

test('ERROR CA-01: nombre solo con espacios se trata como vacío', () => {
  const r = nuevoGestor().crearMazo('     ');
  assert.equal(r.ok, false);
  assert.equal(r.error, MENSAJES.NOMBRE_VACIO);
});

test('ERROR CA-01: nombre duplicado muestra error de nombre en uso', () => {
  const gestor = nuevoGestor();
  gestor.crearMazo('Límites');
  const r = gestor.crearMazo('Límites');
  assert.equal(r.ok, false);
  assert.equal(r.error, MENSAJES.NOMBRE_DUPLICADO);
  assert.equal(gestor.listarMazos().length, 1);
});

test('ERROR CA-01: valor que no es texto (null) se rechaza', () => {
  const r = nuevoGestor().crearMazo(null);
  assert.equal(r.ok, false);
  assert.equal(r.error, MENSAJES.NOMBRE_VACIO);
});
