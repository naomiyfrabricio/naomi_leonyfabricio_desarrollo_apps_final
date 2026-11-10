// Prueba de integración del incremento 3: editar, eliminar, estudiar con acierto/fallo y ver porcentaje.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearControlador } from '../src/ui/controlador.js';
import { AlmacenamientoLocal } from '../src/almacenamiento/almacenamientoLocal.js';

function storageFalso() {
  const d = {};
  return { getItem: (k) => (k in d ? d[k] : null), setItem: (k, v) => { d[k] = String(v); } };
}

test('NORMAL: flujo completo con estadísticas que persisten al recargar', () => {
  const storage = storageFalso();
  const app = crearControlador(new AlmacenamientoLocal(storage));
  const { mazo } = app.crearMazo('Calculo');
  app.renombrarMazo(mazo.id, 'Cálculo I');
  for (const [p, r] of [['d/dx x²', '2x'], ['d/dx sen x', 'cos x'], ['d/dx eˣ', 'eˣ']]) app.agregarTarjeta(mazo.id, p, r);
  const { sesion } = app.iniciarEstudio(mazo.id);
  for (const acierto of [true, false, true]) {
    sesion.revelar();
    assert.equal(app.marcar(mazo.id, sesion, acierto).ok, true);
    sesion.siguiente();
  }
  const recargada = crearControlador(new AlmacenamientoLocal(storage));
  assert.equal(recargada.obtenerMazo(mazo.id).nombre, 'Cálculo I');
  assert.equal(recargada.resumen(mazo.id).porcentaje, 67);
});

test('LÍMITE: eliminar el mazo elimina también sus registros de estudio', () => {
  const storage = storageFalso();
  const app = crearControlador(new AlmacenamientoLocal(storage));
  const { mazo } = app.crearMazo('Lógica');
  app.agregarTarjeta(mazo.id, 'p', 'r');
  const { sesion } = app.iniciarEstudio(mazo.id);
  sesion.revelar();
  app.marcar(mazo.id, sesion, true);
  assert.equal(app.eliminarMazo(mazo.id, true).ok, true);
  assert.equal(storage.getItem('flashcards.mazos'), '[]');
});

test('ERROR: marcar sin revelar no guarda registro', () => {
  const app = crearControlador(new AlmacenamientoLocal(storageFalso()));
  const { mazo } = app.crearMazo('Lógica');
  app.agregarTarjeta(mazo.id, 'p', 'r');
  const { sesion } = app.iniciarEstudio(mazo.id);
  assert.equal(app.marcar(mazo.id, sesion, true).ok, false);
  assert.equal(app.resumen(mazo.id).porcentaje, 0);
});
