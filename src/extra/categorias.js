// EXTRA fuera del alcance de RF-01..12 (ver docs/plan_incrementos.md §1): agrupa los mazos de "Tus mazos" por categoría. Solo UI.
import { normalizarNombre } from '../mazos/gestorMazos.js';

export const CATEGORIA_OTROS = 'Otros';

/** Orden fijo de los grupos en la lista. "Otros" (mazos creados por el usuario) va al final. */
export const ORDEN_CATEGORIAS = [
  'Álgebra y trigonometría',
  'Cálculo',
  'Geometría',
  'Matemáticas básicas',
  'Lógica y matemáticas discretas',
  'Métodos numéricos',
  'Estadística y probabilidad',
  'Electrónica',
  'Computación y bases de datos',
  'Ciberseguridad',
  CATEGORIA_OTROS,
];

// Claves tal como aparecen en mazosEjemplo.js; se comparan con normalizarNombre.
const CATEGORIA_POR_MAZO = new Map(Object.entries({
  'Álgebra': 'Álgebra y trigonometría',
  'Factorización': 'Álgebra y trigonometría',
  'Trigonometría': 'Álgebra y trigonometría',
  'Álgebra lineal': 'Álgebra y trigonometría',
  'Cálculo 1': 'Cálculo',
  'Cálculo 2': 'Cálculo',
  'Cálculo Vectorial': 'Cálculo',
  'derivadas': 'Cálculo',
  'Integrales': 'Cálculo',
  'Geometría': 'Geometría',
  'Matemáticas básicas': 'Matemáticas básicas',
  'Matemáticas discretas': 'Lógica y matemáticas discretas',
  'Métodos Numéricos': 'Métodos numéricos',
  'Estadística y Probabilidad': 'Estadística y probabilidad',
  'Circuitos': 'Electrónica',
  'Electrónica Digital': 'Electrónica',
  'Estructuras de Datos': 'Computación y bases de datos',
  'SQL y Bases de Datos': 'Computación y bases de datos',
  'Programación en Python': 'Computación y bases de datos',
  'Ciberseguridad': 'Ciberseguridad',
}).map(([nombre, categoria]) => [normalizarNombre(nombre), categoria]));

/**
 * Categoría de un mazo según su nombre. Los mazos que no están en el mapa
 * (los que crea el usuario) caen en "Otros".
 * @param {string} nombre
 * @returns {string}
 */
export function categoriaDe(nombre) {
  return CATEGORIA_POR_MAZO.get(normalizarNombre(nombre)) ?? CATEGORIA_OTROS;
}
