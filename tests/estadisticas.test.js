// Pruebas de acierto/fallo y porcentaje (RF-08, RF-09 / CA-04). Ejecutar con: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Estadisticas, calcularPorcentaje } from '../src/estadisticas/estadisticas.js';
import { SesionEstudio, MENSAJES_ESTUDIO } from '../src/estudio/sesionEstudio.js';
import { GestorMazos } from '../src/mazos/gestorMazos.js';
import { GestorTarjetas } from '../src/tarjetas/gestorTarjetas.js';
import { AlmacenamientoMemoria } from '../src/almacenamiento/almacenamientoMemoria.js';

function preparar(nTarjetas = 3) {
  const alm = new AlmacenamientoMemoria();
  const mazoId = new GestorMazos(alm).crearMazo('Límites').mazo.id;
  const t = new GestorTarjetas(alm);
  for (let i = 1; i <= nTarjetas; i++) t.agregarTarjeta(mazoId, `P${i}`, `R${i}`);
  return { alm, mazoId, est: new Estadisticas(alm), mazo: () => alm.obtenerMazos()[0] };
}

test('NORMAL CA-04: marcar acierto guarda el registro y actualiza el porcentaje', () => {
  const { mazoId, est, mazo } = preparar();
  const { sesion } = SesionEstudio.iniciar(mazo());
  sesion.revelar();
  const m = sesion.marcar(true);
  assert.equal(m.ok, true);
  const r = est.registrar(mazoId, m.registro);
  assert.equal(r.porcentaje, 100);
  assert.equal(mazo().registros.length, 1);
});

test('LÍMITE CA-04: 2 aciertos y 1 fallo muestran 67 % (redondeo al entero más cercano)', () => {
  const { mazoId, est, mazo } = preparar();
  const { sesion } = SesionEstudio.iniciar(mazo());
  for (const acierto of [true, true, false]) {
    sesion.revelar();
    est.registrar(mazoId, sesion.marcar(acierto).registro);
    sesion.siguiente();
  }
  assert.deepEqual(est.resumen(mazoId), { ok: true, aciertos: 2, fallos: 1, porcentaje: 67 });
});

test('ERROR CA-04: un mazo sin registros muestra 0 % en lugar de un error', () => {
  const { mazoId, est } = preparar();
  assert.equal(est.resumen(mazoId).porcentaje, 0);
  assert.equal(calcularPorcentaje({}), 0);
});

test('ERROR CA-04: no se puede marcar antes de revelar la respuesta', () => {
  const { mazo } = preparar();
  const { sesion } = SesionEstudio.iniciar(mazo());
  assert.equal(sesion.puedeMarcar(), false);
  assert.equal(sesion.marcar(true).error, MENSAJES_ESTUDIO.REVELAR_PRIMERO);
});

test('ERROR CA-03: revelar dos veces deja la respuesta visible y no marca doble', () => {
  const { mazo } = preparar();
  const { sesion } = SesionEstudio.iniciar(mazo());
  sesion.revelar();
  assert.equal(sesion.revelar().respuesta, 'R1');
  sesion.marcar(true);
  assert.equal(sesion.marcar(false).error, MENSAJES_ESTUDIO.YA_MARCADA);
});

test('LÍMITE CA-03: con una sola tarjeta, al marcarla el repaso termina', () => {
  const { mazo } = preparar(1);
  const { sesion } = SesionEstudio.iniciar(mazo());
  sesion.revelar();
  sesion.marcar(false);
  assert.equal(sesion.terminado(), true);
});
