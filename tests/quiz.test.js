// EXTRA (fuera de RF-01..12): pruebas del Modo quiz con reloj total.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { elegirPreguntasQuiz, formatearTiempo, resumenQuiz } from '../src/extra/quiz.js';

const mazo = (n) => Array.from({ length: n }, (_, i) => ({ id: i + 1, pregunta: `p${i + 1}`, respuesta: `r${i + 1}` }));

function azarDeterminista(valores) {
  let i = 0;
  return () => valores[i++ % valores.length];
}

test('elegirPreguntasQuiz devuelve 10 tarjetas de un mazo grande', () => {
  assert.equal(elegirPreguntasQuiz(mazo(25)).length, 10);
});

test('elegirPreguntasQuiz respeta la cantidad pedida', () => {
  assert.equal(elegirPreguntasQuiz(mazo(25), 5).length, 5);
});

test('elegirPreguntasQuiz no repite tarjetas y son del mazo', () => {
  const tarjetas = mazo(30);
  const r = elegirPreguntasQuiz(tarjetas);
  assert.equal(new Set(r.map((t) => t.id)).size, r.length);
  for (const t of r) assert.ok(tarjetas.includes(t));
});

test('elegirPreguntasQuiz no muta la entrada', () => {
  const tarjetas = mazo(15);
  const copia = tarjetas.map((t) => t.id);
  elegirPreguntasQuiz(tarjetas);
  assert.deepEqual(tarjetas.map((t) => t.id), copia);
});

test('elegirPreguntasQuiz con mazo corto devuelve todas, barajadas', () => {
  const r = elegirPreguntasQuiz(mazo(6));
  assert.equal(r.length, 6);
  assert.deepEqual(r.map((t) => t.id).sort(), [1, 2, 3, 4, 5, 6]);
});

test('elegirPreguntasQuiz con mazo vacío devuelve lista vacía', () => {
  assert.deepEqual(elegirPreguntasQuiz([]), []);
});

test('elegirPreguntasQuiz con azar inyectado es determinista', () => {
  const a = elegirPreguntasQuiz(mazo(8), 4, azarDeterminista([0, 0.5, 0.99]));
  const b = elegirPreguntasQuiz(mazo(8), 4, azarDeterminista([0, 0.5, 0.99]));
  assert.deepEqual(a.map((t) => t.id), b.map((t) => t.id));
  const todo = elegirPreguntasQuiz(mazo(4), 10, () => 0);
  assert.deepEqual(todo.map((t) => t.id), [2, 3, 4, 1]);
});

test('formatearTiempo da m:ss', () => {
  assert.equal(formatearTiempo(0), '0:00');
  assert.equal(formatearTiempo(59), '0:59');
  assert.equal(formatearTiempo(60), '1:00');
  assert.equal(formatearTiempo(125), '2:05');
  assert.equal(formatearTiempo(3600), '60:00');
});

test('formatearTiempo trata negativos como 0:00', () => {
  assert.equal(formatearTiempo(-5), '0:00');
});

test('resumenQuiz con todas respondidas', () => {
  assert.deepEqual(resumenQuiz({ aciertos: 7, fallos: 3, totalPreguntas: 10 }), {
    sinResponder: 0, respondidas: 10, puntaje: 7, porcentaje: 70,
  });
});

test('resumenQuiz con preguntas sin responder', () => {
  assert.deepEqual(resumenQuiz({ aciertos: 3, fallos: 1, totalPreguntas: 10 }), {
    sinResponder: 6, respondidas: 4, puntaje: 3, porcentaje: 30,
  });
});

test('resumenQuiz redondea el porcentaje', () => {
  assert.equal(resumenQuiz({ aciertos: 1, fallos: 1, totalPreguntas: 3 }).porcentaje, 33);
  assert.equal(resumenQuiz({ aciertos: 2, fallos: 0, totalPreguntas: 3 }).porcentaje, 67);
});

test('resumenQuiz con total 0 da porcentaje 0', () => {
  assert.deepEqual(resumenQuiz({ aciertos: 0, fallos: 0, totalPreguntas: 0 }), {
    sinResponder: 0, respondidas: 0, puntaje: 0, porcentaje: 0,
  });
});
