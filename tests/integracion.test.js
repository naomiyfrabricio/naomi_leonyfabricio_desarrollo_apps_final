// Prueba de integración del incremento 2: crear mazo → añadir tarjetas → estudiar.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearControlador } from '../src/ui/controlador.js';
import { AlmacenamientoLocal } from '../src/almacenamiento/almacenamientoLocal.js';
import { MENSAJES_ESTUDIO } from '../src/estudio/sesionEstudio.js';

function storageFalso() {
  const d = {};
  return { getItem: (k) => (k in d ? d[k] : null), setItem: (k, v) => { d[k] = String(v); } };
}

test('NORMAL: flujo completo crear mazo, añadir 2 tarjetas y estudiarlas', () => {
  const app = crearControlador(new AlmacenamientoLocal(storageFalso()));
  const { mazo } = app.crearMazo('Equivalencias lógicas');
  app.agregarTarjeta(mazo.id, '¬(p ∧ q) ≡ ?', '¬p ∨ ¬q');
  app.agregarTarjeta(mazo.id, '¬(p ∨ q) ≡ ?', '¬p ∧ ¬q');
  const { ok, sesion } = app.iniciarEstudio(mazo.id);
  assert.equal(ok, true);
  assert.equal(sesion.vistaActual().respuesta, null);
  assert.equal(sesion.revelar().respuesta, '¬p ∨ ¬q');
  sesion.siguiente();
  assert.equal(sesion.vistaActual().pregunta, '¬(p ∨ q) ≡ ?');
});

test('LÍMITE: los datos persisten al "recargar" (nuevo controlador sobre el mismo almacenamiento)', () => {
  const storage = storageFalso();
  const a = crearControlador(new AlmacenamientoLocal(storage));
  const { mazo } = a.crearMazo('Límites');
  a.agregarTarjeta(mazo.id, 'lim sen(x)/x, x→0', '1');
  const b = crearControlador(new AlmacenamientoLocal(storage));
  assert.equal(b.listarMazos()[0].tarjetas.length, 1);
  assert.equal(b.crearMazo('Derivadas').mazo.id, 2);
});

test('ERROR: estudiar un mazo recién creado sin tarjetas muestra el aviso (RF-11)', () => {
  const app = crearControlador(new AlmacenamientoLocal(storageFalso()));
  const { mazo } = app.crearMazo('Vacío');
  const r = app.iniciarEstudio(mazo.id);
  assert.equal(r.ok, false);
  assert.equal(r.error, MENSAJES_ESTUDIO.MAZO_VACIO);
});
