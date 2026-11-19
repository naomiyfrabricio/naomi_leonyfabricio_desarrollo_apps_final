// Pruebas de editar y eliminar tarjetas (RF-05, RF-06 / CA-06, CA-07). Ejecutar con: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GestorTarjetas, MENSAJES_TARJETA } from '../src/tarjetas/gestorTarjetas.js';
import { GestorMazos } from '../src/mazos/gestorMazos.js';
import { SesionEstudio, MENSAJES_ESTUDIO } from '../src/estudio/sesionEstudio.js';
import { AlmacenamientoMemoria } from '../src/almacenamiento/almacenamientoMemoria.js';

function preparar() {
  const alm = new AlmacenamientoMemoria();
  const mazos = new GestorMazos(alm);
  const mazoId = mazos.crearMazo('Lógica').mazo.id;
  const tarjetas = new GestorTarjetas(alm);
  const t = tarjetas.agregarTarjeta(mazoId, '¬(p ∧ q)', '¬p ∨ q').tarjeta;
  return { mazos, tarjetas, mazoId, t };
}

test('NORMAL CA-06: editar una tarjeta con datos válidos se refleja de inmediato', () => {
  const { mazos, tarjetas, mazoId, t } = preparar();
  const r = tarjetas.editarTarjeta(mazoId, t.id, '¬(p ∧ q)', '¬p ∨ ¬q');
  assert.equal(r.ok, true);
  assert.equal(mazos.listarMazos()[0].tarjetas[0].respuesta, '¬p ∨ ¬q');
});

test('ERROR CA-06: editar dejando la pregunta vacía muestra error y no cambia la tarjeta', () => {
  const { mazos, tarjetas, mazoId, t } = preparar();
  const r = tarjetas.editarTarjeta(mazoId, t.id, '', 'x');
  assert.equal(r.error, MENSAJES_TARJETA.PREGUNTA_VACIA);
  assert.equal(mazos.listarMazos()[0].tarjetas[0].respuesta, '¬p ∨ q');
});

test('NORMAL RF-06: eliminar con confirmación quita la tarjeta y baja el contador', () => {
  const { tarjetas, mazoId, t } = preparar();
  const r = tarjetas.eliminarTarjeta(mazoId, t.id, true);
  assert.equal(r.ok, true);
  assert.equal(tarjetas.contarTarjetas(mazoId), 0);
});

test('LÍMITE CA-06: cancelar la confirmación no borra la tarjeta', () => {
  const { tarjetas, mazoId, t } = preparar();
  const r = tarjetas.eliminarTarjeta(mazoId, t.id, false);
  assert.equal(r.cancelado, true);
  assert.equal(tarjetas.contarTarjetas(mazoId), 1);
});

test('LÍMITE CA-07: un mazo al que se le eliminaron todas sus tarjetas muestra el aviso de mazo vacío', () => {
  const { mazos, tarjetas, mazoId, t } = preparar();
  tarjetas.eliminarTarjeta(mazoId, t.id, true);
  const r = SesionEstudio.iniciar(mazos.listarMazos()[0]);
  assert.equal(r.error, MENSAJES_ESTUDIO.MAZO_VACIO);
});

test('ERROR: editar o eliminar una tarjeta inexistente devuelve error', () => {
  const { tarjetas, mazoId } = preparar();
  assert.equal(tarjetas.editarTarjeta(mazoId, 99, 'p', 'r').error, MENSAJES_TARJETA.TARJETA_NO_EXISTE);
  assert.equal(tarjetas.eliminarTarjeta(mazoId, 99, true).error, MENSAJES_TARJETA.TARJETA_NO_EXISTE);
});
