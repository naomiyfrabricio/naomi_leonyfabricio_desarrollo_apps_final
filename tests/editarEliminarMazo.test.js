// Pruebas de editar y eliminar mazos (RF-02, RF-03 / CA-06). Ejecutar con: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GestorMazos, MENSAJES } from '../src/mazos/gestorMazos.js';
import { GestorTarjetas } from '../src/tarjetas/gestorTarjetas.js';
import { AlmacenamientoMemoria } from '../src/almacenamiento/almacenamientoMemoria.js';

function preparar() {
  const alm = new AlmacenamientoMemoria();
  const mazos = new GestorMazos(alm);
  const calculo = mazos.crearMazo('Cálculo').mazo;
  const logica = mazos.crearMazo('Lógica').mazo;
  return { alm, mazos, calculo, logica };
}

test('NORMAL CA-06: renombrar con un nombre válido se refleja de inmediato en la lista', () => {
  const { mazos, calculo } = preparar();
  const r = mazos.renombrarMazo(calculo.id, 'Derivadas');
  assert.equal(r.ok, true);
  assert.equal(mazos.listarMazos().find((m) => m.id === calculo.id).nombre, 'Derivadas');
});

test('LÍMITE CA-06: guardar el mismo nombre no se trata como duplicado', () => {
  const { mazos, calculo } = preparar();
  assert.equal(mazos.renombrarMazo(calculo.id, 'Cálculo').ok, true);
});

test('ERROR CA-06: renombrar "Cálculo" como "Lógica" muestra error y el nombre no cambia', () => {
  const { mazos, calculo } = preparar();
  const r = mazos.renombrarMazo(calculo.id, 'lógica');
  assert.equal(r.ok, false);
  assert.equal(r.error, MENSAJES.NOMBRE_DUPLICADO);
  assert.equal(mazos.listarMazos().find((m) => m.id === calculo.id).nombre, 'Cálculo');
});

test('ERROR CA-06: renombrar a vacío muestra error', () => {
  const { mazos, calculo } = preparar();
  assert.equal(mazos.renombrarMazo(calculo.id, '   ').error, MENSAJES.NOMBRE_VACIO);
});

test('NORMAL RF-03: eliminar con confirmación borra el mazo y sus tarjetas', () => {
  const { alm, mazos, calculo } = preparar();
  new GestorTarjetas(alm).agregarTarjeta(calculo.id, 'p', 'r');
  const r = mazos.eliminarMazo(calculo.id, true);
  assert.equal(r.ok, true);
  assert.equal(mazos.listarMazos().some((m) => m.id === calculo.id), false);
});

test('LÍMITE CA-06: si el usuario cancela la confirmación, el mazo no se borra', () => {
  const { mazos, calculo } = preparar();
  const r = mazos.eliminarMazo(calculo.id, false);
  assert.equal(r.ok, false);
  assert.equal(r.cancelado, true);
  assert.equal(mazos.listarMazos().length, 2);
});

test('ERROR: renombrar o eliminar un mazo inexistente devuelve error', () => {
  const { mazos } = preparar();
  assert.equal(mazos.renombrarMazo(99, 'x').error, MENSAJES.MAZO_NO_EXISTE);
  assert.equal(mazos.eliminarMazo(99, true).error, MENSAJES.MAZO_NO_EXISTE);
});
