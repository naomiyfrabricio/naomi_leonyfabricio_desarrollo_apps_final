// EXTRA (fuera de RF-01..12): pruebas del Modo 4 opciones.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generarOpciones, puedeUsarOpciones, normalizarRespuesta } from '../src/extra/opciones.js';

const mazo = () => [
  { id: 1, pregunta: 'p1', respuesta: 'Uno' },
  { id: 2, pregunta: 'p2', respuesta: 'Dos' },
  { id: 3, pregunta: 'p3', respuesta: 'Tres' },
  { id: 4, pregunta: 'p4', respuesta: 'Cuatro' },
  { id: 5, pregunta: 'p5', respuesta: 'Cinco' },
];

function azarDeterminista(valores) {
  let i = 0;
  return () => valores[i++ % valores.length];
}

test('genera 4 opciones únicas', () => {
  const tarjetas = mazo();
  const r = generarOpciones(tarjetas[0], tarjetas);
  assert.equal(r.opciones.length, 4);
  assert.equal(new Set(r.opciones.map(normalizarRespuesta)).size, 4);
});

test('incluye la correcta exactamente una vez y el índice apunta a ella', () => {
  const tarjetas = mazo();
  for (let k = 0; k < 30; k++) {
    const t = tarjetas[k % tarjetas.length];
    const r = generarOpciones(t, tarjetas);
    assert.equal(r.opciones.filter((o) => o === t.respuesta).length, 1);
    assert.equal(r.opciones[r.indiceCorrecto], t.respuesta);
  }
});

test('los distractores salen de otras tarjetas del mazo', () => {
  const tarjetas = mazo();
  const r = generarOpciones(tarjetas[1], tarjetas);
  const validas = new Set(tarjetas.map((t) => t.respuesta));
  assert.ok(r.opciones.every((o) => validas.has(o)));
});

test('distractores distintos aunque haya respuestas repetidas o equivalentes', () => {
  const tarjetas = [
    { id: 1, pregunta: 'a', respuesta: 'Sí' },
    { id: 2, pregunta: 'b', respuesta: 'si' },
    { id: 3, pregunta: 'c', respuesta: ' SI ' },
    { id: 4, pregunta: 'd', respuesta: 'No' },
    { id: 5, pregunta: 'e', respuesta: 'no' },
    { id: 6, pregunta: 'f', respuesta: 'Tal vez' },
    { id: 7, pregunta: 'g', respuesta: 'tal   vez' },
    { id: 8, pregunta: 'h', respuesta: 'Nunca' },
  ];
  for (const t of tarjetas) {
    const r = generarOpciones(t, tarjetas);
    assert.equal(r.opciones.length, 4);
    assert.equal(new Set(r.opciones.map(normalizarRespuesta)).size, 4);
    assert.equal(r.opciones[r.indiceCorrecto], t.respuesta);
  }
});

test('devuelve null con menos de 4 respuestas distintas', () => {
  const tarjetas = [
    { id: 1, pregunta: 'a', respuesta: 'Sí' },
    { id: 2, pregunta: 'b', respuesta: 'si' },
    { id: 3, pregunta: 'c', respuesta: 'No' },
    { id: 4, pregunta: 'd', respuesta: 'Tal vez' },
  ];
  assert.equal(generarOpciones(tarjetas[0], tarjetas), null);
  assert.equal(generarOpciones(tarjetas[0], tarjetas.slice(0, 2)), null);
});

test('puedeUsarOpciones cuenta respuestas distintas normalizadas', () => {
  assert.equal(puedeUsarOpciones(mazo()), true);
  assert.equal(puedeUsarOpciones(mazo().slice(0, 3)), false);
  assert.equal(puedeUsarOpciones([]), false);
  const equivalentes = [
    { id: 1, respuesta: 'Sí' }, { id: 2, respuesta: 'si' }, { id: 3, respuesta: 'No' }, { id: 4, respuesta: 'Tal vez' },
  ];
  assert.equal(puedeUsarOpciones(equivalentes), false);
});

test('con el mismo azar inyectado el resultado es el mismo', () => {
  const tarjetas = mazo();
  const a = generarOpciones(tarjetas[2], tarjetas, azarDeterminista([0.1, 0.7, 0.4, 0.9, 0.2, 0.6]));
  const b = generarOpciones(tarjetas[2], tarjetas, azarDeterminista([0.1, 0.7, 0.4, 0.9, 0.2, 0.6]));
  assert.deepEqual(a, b);
});

test('el azar inyectado controla las posiciones', () => {
  const tarjetas = mazo();
  const sinCambios = generarOpciones(tarjetas[0], tarjetas, () => 0.999999);
  assert.equal(sinCambios.opciones[sinCambios.indiceCorrecto], 'Uno');
  const otro = generarOpciones(tarjetas[0], tarjetas, () => 0);
  assert.equal(otro.opciones[otro.indiceCorrecto], 'Uno');
  assert.notEqual(sinCambios.indiceCorrecto, otro.indiceCorrecto);
});

test('no muta los argumentos', () => {
  const tarjetas = mazo();
  const copia = structuredClone(tarjetas);
  generarOpciones(tarjetas[0], tarjetas);
  puedeUsarOpciones(tarjetas);
  assert.deepEqual(tarjetas, copia);
});

test('ids repetidos: usa las respuestas distintas por identidad de objeto', () => {
  const tarjetas = [
    { id: 1, pregunta: 'a', respuesta: 'Uno' },
    { id: 1, pregunta: 'b', respuesta: 'Dos' },
    { id: 1, pregunta: 'c', respuesta: 'Tres' },
    { id: 1, pregunta: 'd', respuesta: 'Cuatro' },
  ];
  assert.equal(puedeUsarOpciones(tarjetas), true);
  const r = generarOpciones(tarjetas[0], tarjetas);
  assert.notEqual(r, null);
  assert.deepEqual([...r.opciones].sort(), ['Cuatro', 'Dos', 'Tres', 'Uno']);
});

test('respuestas vacías o undefined no cuentan como distintas', () => {
  const tarjetas = [
    { id: 1, respuesta: 'Uno' },
    { id: 2, respuesta: 'Dos' },
    { id: 3, respuesta: 'Tres' },
    { id: 4, respuesta: undefined },
    { id: 5, respuesta: '' },
    { id: 6, respuesta: '   ' },
  ];
  assert.equal(puedeUsarOpciones(tarjetas), false);
  assert.equal(generarOpciones(tarjetas[0], tarjetas), null);
});

test('respuestas vacías no se usan de distractor', () => {
  const tarjetas = [...mazo(), { id: 9, respuesta: '' }, { id: 10, respuesta: '  ' }, { id: 11 }];
  for (let k = 0; k < 20; k++) {
    const r = generarOpciones(tarjetas[k % 5], tarjetas);
    assert.equal(r.opciones.every((o) => normalizarRespuesta(o) !== ''), true);
  }
});
