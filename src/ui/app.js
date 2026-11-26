// Conecta el controlador con la página (index.html). Solo maneja el DOM.
import { crearControlador } from './controlador.js';
import { AlmacenamientoLocal } from '../almacenamiento/almacenamientoLocal.js';
import { SesionEstudio } from '../estudio/sesionEstudio.js';
// EXTRA fuera del alcance de RF-01..12 (ver docs/plan_incrementos.md §1): explicaciones para estudiar.
import { explicacionDe } from '../extra/explicaciones.js';
// EXTRA: mazos de ejemplo para cargar con un clic (se validan con el importador de RF-10/RF-12).
import { MAZOS_EJEMPLO } from '../extra/mazosEjemplo.js';
// EXTRA: agrupación por categoría de "Tus mazos" (solo interfaz).
import { categoriaDe, ORDEN_CATEGORIAS } from '../extra/categorias.js';
// EXTRA: sonidos de acierto y fallo sintetizados con Web Audio (solo interfaz).
import { tocarAcierto, tocarFallo } from '../extra/sonidos.js';
// EXTRA: Modo 4 opciones (solo interfaz; la lógica vive en src/extra/opciones.js).
import { puedeUsarOpciones, generarOpciones } from '../extra/opciones.js';
import { normalizarNombre } from '../mazos/gestorMazos.js';

const app = crearControlador(new AlmacenamientoLocal(window.localStorage));
const $ = (id) => document.getElementById(id);
let mazoActual = null;
let tarjetaEditando = null;
let sesion = null;

// Estado de la vista "Ver explicación del tema" (extra, solo lectura).
let tarjetasPresentacion = [];
let indicePresentacion = 0;

// Estado propio de cada sesión de estudio (solo UI, no se guarda).
let ordenEstudio = [];      // tarjetas en el orden exacto que usa `sesion` (normal o barajado)
let erroresSesion = [];     // ids de tarjetas falladas en la sesión actual, para "Repasar mis errores"
let sesionAciertos = 0;
let sesionFallos = 0;
let temporizador = null;
let avanceAuto = null;
let segundosRestantes = 0;
let resumenActivo = false;
const RETRASO_AVANCE_MS = 400;
let opcionesTarjeta = null; // {sesion, indice, datos: {opciones, indiceCorrecto} | null, elegida} de la tarjeta en pantalla

/** Opciones de la tarjeta actual (se generan una sola vez por tarjeta); null si el modo no aplica. */
function opcionesVigentes() {
  if (!sesion || !$('chk-opciones').checked || $('chk-opciones').disabled) return null;
  if (!opcionesTarjeta || opcionesTarjeta.sesion !== sesion || opcionesTarjeta.indice !== sesion.indice) {
    const tarjeta = ordenEstudio[sesion.indice];
    const datos = tarjeta ? generarOpciones(tarjeta, app.obtenerMazo(mazoActual).tarjetas) : null;
    opcionesTarjeta = { sesion, indice: sesion.indice, datos, elegida: null };
  }
  return opcionesTarjeta.datos ? opcionesTarjeta : null;
}

function actualizarDisponibilidadOpciones() {
  const puede = puedeUsarOpciones(app.obtenerMazo(mazoActual).tarjetas);
  $('chk-opciones').disabled = !puede;
  if (!puede) $('chk-opciones').checked = false;
  $('aviso-opciones').hidden = puede;
}

function pintarOpciones() {
  const grupo = $('grupo-opciones');
  const op = opcionesVigentes();
  grupo.hidden = !op;
  $('fila-acierto-fallo').hidden = Boolean(op);
  $('tarjeta').classList.toggle('sin-voltear', Boolean(op));
  if (op) { $('tarjeta').removeAttribute('role'); $('tarjeta').tabIndex = -1; }
  else { $('tarjeta').setAttribute('role', 'button'); $('tarjeta').tabIndex = 0; }
  grupo.innerHTML = '';
  if (!op) return;
  $('pista-tarjeta').textContent = 'Elige una opción';
  const marcada = sesion.marcadas.has(sesion.indice);
  op.datos.opciones.forEach((texto, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn-opcion';
    const num = document.createElement('span');
    num.className = 'opc-num';
    num.textContent = `${i + 1}.`;
    const t = document.createElement('span');
    t.textContent = texto;
    const marca = document.createElement('span');
    marca.className = 'opc-marca';
    if (marcada) {
      if (i === op.datos.indiceCorrecto) { b.classList.add('correcta'); marca.textContent = '✓'; }
      else if (i === op.elegida) { b.classList.add('incorrecta'); marca.textContent = '✗'; }
    }
    b.append(num, t, marca);
    b.disabled = marcada;
    b.onclick = () => elegirOpcion(i);
    grupo.appendChild(b);
  });
}

function elegirOpcion(i) {
  const op = opcionesVigentes();
  if (!op || sesion.marcadas.has(sesion.indice)) return;
  cancelarTemporizador();
  const v = sesion.revelar();
  const acierto = i === op.datos.indiceCorrecto;
  const r = app.marcar(mazoActual, sesion, acierto);
  if (!r.ok) return;
  op.elegida = i;
  if (acierto) sesionAciertos += 1; else { sesionFallos += 1; erroresSesion.push(idTarjetaActual()); }
  registrarEstudioDeHoy();
  refrescar();
  pintarTarjetaEstudio();
  $('tarjeta').classList.add(acierto ? 'resultado-acierto' : 'resultado-fallo');
  reproducirSonido(acierto ? 'acierto' : 'fallo');
  if (acierto) { mostrarMensaje($('msg-estudio'), '¡Correcto!', false); programarAvance(); return; }
  mostrarMensaje($('msg-estudio'), `La respuesta era: ${v.respuesta}`, true);
  $('btn-siguiente').focus();
}

function enfocarInicioTarjeta() {
  const primera = opcionesVigentes() && $('grupo-opciones').querySelector('button:not(:disabled)');
  (primera || $('tarjeta')).focus();
}

// Preferencia de tema claro/oscuro (solo UI, separado de los datos de mazos — RNF-09).
const CLAVE_TEMA = 'flashcards.ui.tema';
function aplicarTema(tema) {
  if (tema) document.documentElement.setAttribute('data-theme', tema);
  else document.documentElement.removeAttribute('data-theme');
  $('btn-tema').textContent = tema === 'dark' ? '☀️' : '🌙';
}
aplicarTema(localStorage.getItem(CLAVE_TEMA));
$('btn-tema').onclick = () => {
  const prefiereOscuro = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const actual = document.documentElement.getAttribute('data-theme') || (prefiereOscuro ? 'dark' : 'light');
  const siguiente = actual === 'dark' ? 'light' : 'dark';
  localStorage.setItem(CLAVE_TEMA, siguiente);
  aplicarTema(siguiente);
};

// Preferencia de sonido (solo UI). Sonidos sintetizados con Web Audio, sin archivos externos.
const CLAVE_SONIDO = 'flashcards.ui.sonido';
function sonidoActivado() {
  return localStorage.getItem(CLAVE_SONIDO) !== 'off';
}
function pintarBotonSonido() {
  $('btn-sonido').textContent = sonidoActivado() ? '🔊' : '🔇';
}
pintarBotonSonido();
let audioCtx = null;
function obtenerAudio() {
  if (!audioCtx) {
    const Clase = window.AudioContext || window.webkitAudioContext;
    if (!Clase) return null;
    audioCtx = new Clase();
  }
  return audioCtx;
}
// Fuente inaudible (ganancia 0.0001) que mantiene activa la salida de audio entre sonidos.
let keepAlive = null;
function arrancarKeepAlive(ctx) {
  if (keepAlive) return;
  try {
    const osc = ctx.createOscillator();
    const ganancia = ctx.createGain();
    osc.frequency.value = 20;
    ganancia.gain.value = 0.0001;
    osc.connect(ganancia).connect(ctx.destination);
    osc.start();
    keepAlive = { osc, ganancia };
  } catch {
    keepAlive = null;
  }
}
function detenerKeepAlive() {
  if (!keepAlive) return;
  try {
    keepAlive.osc.stop();
    keepAlive.osc.disconnect();
    keepAlive.ganancia.disconnect();
  } catch {
    // Si ya estaba detenido no hay nada que hacer.
  }
  keepAlive = null;
}
$('btn-sonido').onclick = () => {
  localStorage.setItem(CLAVE_SONIDO, sonidoActivado() ? 'off' : 'on');
  pintarBotonSonido();
  if (sonidoActivado()) {
    const ctx = obtenerAudio();
    if (ctx) arrancarKeepAlive(ctx);
  } else {
    detenerKeepAlive();
  }
};
function desbloquearAudio() {
  try {
    const ctx = obtenerAudio();
    if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {});
    if (ctx && sonidoActivado()) arrancarKeepAlive(ctx);
  } catch {
    // Sin audio disponible la app sigue funcionando en silencio.
  }
}
for (const evento of ['pointerdown', 'keydown', 'click']) {
  document.addEventListener(evento, desbloquearAudio, { passive: true });
}
async function reproducirSonido(tipo) {
  if (!sonidoActivado()) return;
  try {
    const ctx = obtenerAudio();
    if (!ctx) return;
    if (ctx.state !== 'running') await ctx.resume();
    if (tipo === 'acierto') tocarAcierto(ctx); else tocarFallo(ctx);
  } catch {
    // Si el navegador bloquea audio, se ignora sin romper la app.
  }
}

// Racha de días estudiando (solo UI, motivacional — no es RF-08/RF-09, que llevan el registro real).
const CLAVE_RACHA = 'flashcards.ui.racha';
function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}
function registrarEstudioDeHoy() {
  const guardado = JSON.parse(localStorage.getItem(CLAVE_RACHA) || '{"ultimaFecha":null,"racha":0}');
  const hoy = hoyISO();
  if (guardado.ultimaFecha === hoy) return;
  const ayer = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const racha = guardado.ultimaFecha === ayer ? guardado.racha + 1 : 1;
  localStorage.setItem(CLAVE_RACHA, JSON.stringify({ ultimaFecha: hoy, racha }));
  pintarRacha();
}
function pintarRacha() {
  const guardado = JSON.parse(localStorage.getItem(CLAVE_RACHA) || '{"racha":0}');
  $('racha-estudio').textContent = guardado.racha > 0 ? `🔥 ${guardado.racha} día(s) seguido(s) estudiando` : '';
}
pintarRacha();

function mostrarMensaje(el, texto, esError) {
  el.textContent = texto;
  el.className = esError ? 'mensaje error' : 'mensaje ok';
}

// Colores de acento por mazo, solo decorativos (no se guardan, se calculan del id).
const PALETA_MAZOS = ['#e8604c', '#2f9e6b', '#9256c9', '#d9a521', '#2f8fd4', '#d4578f', '#1fa394', '#c9622f'];
function colorMazo(id) {
  return PALETA_MAZOS[id % PALETA_MAZOS.length];
}

/** Devuelve una copia de `arr` en orden aleatorio (Fisher-Yates). No muta el original. */
function barajar(arr) {
  const copia = [...arr];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function boton(texto, onClick, clase = '') {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = texto;
  b.className = clase;
  b.onclick = onClick;
  return b;
}

/** Quita acentos para que "calculo" encuentre "Cálculo" en el buscador. */
function normalizarBusqueda(texto) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function mazosFiltradosYOrdenados() {
  const texto = normalizarBusqueda($('buscar-mazo').value.trim());
  const orden = $('ordenar-mazos').value;

  const mazos = app.listarMazos()
    .filter((m) => normalizarBusqueda(m.nombre).includes(texto))
    .map((m) => ({ mazo: m, porcentaje: app.resumen(m.id).porcentaje }));

  const comparadores = {
    nombre: (a, b) => a.mazo.nombre.localeCompare(b.mazo.nombre, 'es', { sensitivity: 'base' }),
    'porcentaje-desc': (a, b) => b.porcentaje - a.porcentaje,
    'porcentaje-asc': (a, b) => a.porcentaje - b.porcentaje,
    'tarjetas-desc': (a, b) => b.mazo.tarjetas.length - a.mazo.tarjetas.length,
  };
  mazos.sort(comparadores[orden] || comparadores.nombre);
  return mazos;
}

// EXTRA: grupos de "Tus mazos" (solo UI). Todos arrancan cerrados; solo se recuerdan en memoria los que abre la usuaria.
const gruposAbiertos = new Set();

function pintarMazos() {
  const lista = $('lista-mazos');
  lista.innerHTML = '';
  const filtrados = mazosFiltradosYOrdenados();
  const texto = $('buscar-mazo').value.trim();
  const hayMazos = app.listarMazos().length > 0;
  $('msg-buscar-mazo').textContent =
    hayMazos && texto && filtrados.length === 0 ? `Ningún mazo coincide con "${texto}".` : '';
  $('btn-cargar-ejemplos').className = hayMazos ? 'secundario' : '';
  // Sin mazos, "Cargar ejemplos" va visible junto a la lista; con mazos pasa a "Más opciones".
  const destinoEjemplos = $(hayMazos ? 'slot-ejemplos-opciones' : 'slot-ejemplos-vacio');
  if ($('caja-ejemplos').parentElement !== destinoEjemplos) destinoEjemplos.appendChild($('caja-ejemplos'));

  if (!hayMazos) {
    const aviso = document.createElement('p');
    aviso.className = 'lista-vacia-aviso';
    aviso.textContent = 'Aún no tienes mazos. Carga los de ejemplo, sube un archivo o crea uno en «Más opciones».';
    lista.appendChild(aviso);
    return;
  }

  const porCategoria = new Map();
  for (const item of filtrados) {
    const categoria = categoriaDe(item.mazo.nombre);
    if (!porCategoria.has(categoria)) porCategoria.set(categoria, []);
    porCategoria.get(categoria).push(item);
  }
  for (const categoria of ORDEN_CATEGORIAS) {
    const items = porCategoria.get(categoria);
    if (!items) continue;

    const grupo = document.createElement('details');
    grupo.className = 'grupo-mazos';
    grupo.open = Boolean(texto) || gruposAbiertos.has(categoria);
    grupo.addEventListener('toggle', () => {
      if ($('buscar-mazo').value.trim()) return;
      if (grupo.open) gruposAbiertos.add(categoria); else gruposAbiertos.delete(categoria);
    });

    const resumen = document.createElement('summary');
    const nombreCategoria = document.createElement('span');
    nombreCategoria.textContent = categoria;
    const contador = document.createElement('span');
    contador.className = 'grupo-contador';
    contador.textContent = `${items.length} mazo(s)`;
    resumen.append(nombreCategoria, contador);

    const listaGrupo = document.createElement('ul');
    listaGrupo.className = 'grupo-lista';
    grupo.append(resumen, listaGrupo);
    lista.appendChild(grupo);

    for (const { mazo, porcentaje } of items) {
      pintarFilaMazo(listaGrupo, mazo, porcentaje);
    }
  }
}

function pintarFilaMazo(lista, m, pct) {
  const li = document.createElement('li');
  li.style.setProperty('--acento', colorMazo(m.id));

  const nombre = document.createElement('span');
  nombre.className = 'mazo-nombre';
  nombre.textContent = m.nombre;

  const meta = document.createElement('span');
  meta.className = 'mazo-meta';
  meta.textContent = `${m.tarjetas.length} tarjeta(s)`;

  const info = document.createElement('span');
  info.append(nombre, document.createElement('br'), meta);

  const badge = document.createElement('span');
  badge.className = 'mazo-badge';
  badge.textContent = `${pct} %`;

  const abrir = boton('', () => abrirPantallaEstudio(m.id), 'btn-abrir-mazo');
  abrir.dataset.mazoId = String(m.id);
  abrir.append(info, badge);

  li.append(abrir);
  lista.appendChild(li);
}

function pintarTarjetas() {
  const m = app.obtenerMazo(mazoActual);
  const lista = $('lista-tarjetas');
  lista.innerHTML = '';
  for (const t of m.tarjetas) {
    const li = document.createElement('li');
    li.className = 'tarjeta-fila';
    const txt = document.createElement('span');
    txt.textContent = `${t.pregunta} → ${t.respuesta}`;
    li.append(txt,
      boton('Editar', () => {
        tarjetaEditando = t.id;
        $('pregunta-in').value = t.pregunta;
        $('respuesta-in').value = t.respuesta;
        $('btn-tarjeta').textContent = 'Guardar cambios';
      }, 'secundario'),
      boton('Eliminar', () => {
        const r = app.eliminarTarjeta(mazoActual, t.id, window.confirm('¿Eliminar esta tarjeta?'));
        mostrarMensaje($('msg-tarjeta'), r.ok ? r.mensaje : r.error, !r.ok);
        refrescar();
      }, 'peligro'));
    lista.appendChild(li);
  }
}

function pintarEstadisticas() {
  const r = app.resumen(mazoActual);
  $('estadisticas').textContent = `Aciertos: ${r.aciertos} · Fallos: ${r.fallos} · Avance: ${r.porcentaje} %`;
}

// REDISEÑO (solo interfaz): pantalla principal, pantalla de estudio y pantalla de edición a pantalla completa.
let idFoco = null; // mazo cuya fila abrió la pantalla de estudio, para devolverle el foco al salir

function bloquearFondo(bloquear) {
  document.body.classList.toggle('sin-scroll', bloquear);
  $('app-principal').inert = bloquear;
}

function pintarTitulosMazo() {
  const m = app.obtenerMazo(mazoActual);
  $('nombre-estudio').textContent = m.nombre;
  $('titulo-mazo').textContent = `${m.nombre} · ${m.tarjetas.length} tarjeta(s)`;
}

function refrescar() {
  pintarMazos();
  if (mazoActual !== null && app.obtenerMazo(mazoActual)) {
    pintarTitulosMazo();
    pintarTarjetas();
    pintarEstadisticas();
  }
}

function abrirPantallaEstudio(id) {
  idFoco = id;
  mazoActual = id;
  sesion = null;
  cancelarTemporizador();
  $('aviso-vacio').hidden = true;
  $('btn-empezar-neutral').hidden = true;
  const m = app.obtenerMazo(id);
  $('nuevo-nombre').value = m.nombre;
  $('panel-opciones-estudio').hidden = true;
  $('btn-opciones-estudio').setAttribute('aria-expanded', 'false');
  actualizarDisponibilidadOpciones();
  $('msg-tarjeta').textContent = '';
  cancelarEdicion();
  pintarTitulosMazo();
  $('pantalla-editar').hidden = true;
  $('pantalla-estudio').hidden = false;
  $('pantalla-estudio').scrollTop = 0;
  bloquearFondo(true);
  iniciarEstudioMazoActual();
}

/** Vuelve a la pantalla principal desde estudio o edición, cancelando la sesión en curso. */
function salirAPrincipal() {
  cancelarTemporizador();
  sesion = null;
  mazoActual = null;
  $('aviso-vacio').hidden = true;
  $('btn-empezar-neutral').hidden = true;
  cancelarEdicion();
  ocultarResumen();
  $('pantalla-estudio').hidden = true;
  $('pantalla-editar').hidden = true;
  bloquearFondo(false);
  pintarMazos();
  const fila = document.querySelector(`#lista-mazos [data-mazo-id="${idFoco}"]`);
  (fila || $('buscar-mazo')).focus();
  idFoco = null;
}

function abrirPantallaEditar() {
  cancelarTemporizador();
  sesion = null;
  const m = app.obtenerMazo(mazoActual);
  $('nuevo-nombre').value = m.nombre;
  $('msg-tarjeta').textContent = '';
  cancelarEdicion();
  pintarTitulosMazo();
  pintarTarjetas();
  pintarEstadisticas();
  $('pantalla-estudio').hidden = true;
  $('pantalla-editar').hidden = false;
  $('pantalla-editar').scrollTop = 0;
  $('pregunta-in').focus();
}

function volverAEstudiar() {
  cancelarEdicion();
  $('pantalla-editar').hidden = true;
  $('pantalla-estudio').hidden = false;
  pintarTitulosMazo();
  empezarEstudio();
}

$('btn-editar').onclick = abrirPantallaEditar;
$('btn-salir-estudio').onclick = salirAPrincipal;
$('btn-cerrar-editar').onclick = salirAPrincipal;
$('btn-volver-estudiar').onclick = volverAEstudiar;
$('btn-opciones-estudio').onclick = () => {
  const panel = $('panel-opciones-estudio');
  panel.hidden = !panel.hidden;
  $('btn-opciones-estudio').setAttribute('aria-expanded', String(!panel.hidden));
};
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape' || e.defaultPrevented) return;
  if (!$('pantalla-estudio').hidden || !$('pantalla-editar').hidden) salirAPrincipal();
});
// Cambiar una opción de estudio reinicia la sesión con las opciones nuevas.
for (const id of ['chk-examen', 'examen-segundos', 'chk-opciones']) {
  $(id).onchange = () => {
    if (sesion && !$('pantalla-estudio').hidden && $('seccion-presentacion').hidden) empezarEstudio();
  };
}

function cancelarEdicion() {
  tarjetaEditando = null;
  $('pregunta-in').value = '';
  $('respuesta-in').value = '';
  $('btn-tarjeta').textContent = 'Añadir tarjeta';
}

function mensajeAnimo(pct) {
  if (pct >= 80) return '¡Lo dominas! 🎉';
  if (pct >= 50) return 'Vas por buen camino 💪';
  return 'Sigue practicando 📚';
}

function mostrarResumen() {
  cancelarTemporizador();
  resumenActivo = true;
  const total = sesionAciertos + sesionFallos;
  const pct = total > 0 ? Math.round((sesionAciertos / total) * 100) : 0;
  $('resumen-aciertos').textContent = `Aciertos: ${sesionAciertos}`;
  $('resumen-fallos').textContent = `Fallos: ${sesionFallos}`;
  $('resumen-porcentaje').textContent = `${sesionAciertos} de ${total} correctas, ${pct} %`;
  $('resumen-animo').textContent = mensajeAnimo(pct);
  $('btn-repasar-errores').hidden = erroresSesion.length === 0;
  $('btn-repasar-errores').textContent = `🔁 Repasar mis errores (${erroresSesion.length})`;
  $('seccion-estudio').hidden = true;
  $('seccion-presentacion').hidden = true;
  $('resumen-final').hidden = false;
  $('btn-estudiar-de-nuevo').focus();
}

function ocultarResumen() {
  resumenActivo = false;
  $('resumen-final').hidden = true;
}

/** Pasa a la tarjeta siguiente o, si era la última, al resumen final. */
function avanzarOResumen() {
  if (sesion.esUltima()) { mostrarResumen(); return; }
  sesion.siguiente();
  limpiarMensaje();
  pintarTarjetaEstudio();
  iniciarTemporizadorSiAplica();
  enfocarInicioTarjeta();
}

/** Avance automático cancelable (cancelarTemporizador lo limpia) y atado a la sesión que lo agendó. */
function programarAvance() {
  const sesionAgendada = sesion;
  avanceAuto = setTimeout(() => {
    avanceAuto = null;
    if (!sesion || sesion !== sesionAgendada) return;
    avanzarOResumen();
  }, RETRASO_AVANCE_MS);
}

/** id de la tarjeta que se está mostrando ahora mismo, según el orden usado en esta sesión. */
function idTarjetaActual() {
  const v = sesion.vistaActual();
  return ordenEstudio[v.posicion - 1]?.id;
}

function cancelarTemporizador() {
  if (avanceAuto) { clearTimeout(avanceAuto); avanceAuto = null; }
  if (temporizador) { clearInterval(temporizador); temporizador = null; }
  $('temporizador-estudio').textContent = '';
}

function actualizarTemporizadorUI() {
  $('temporizador-estudio').textContent = `⏱ ${segundosRestantes}s`;
}

function iniciarTemporizadorSiAplica() {
  cancelarTemporizador();
  if (!$('chk-examen').checked || sesion.terminado() || sesion.marcadas.has(sesion.indice)) return;
  segundosRestantes = Number($('examen-segundos').value) || 20;
  actualizarTemporizadorUI();
  temporizador = setInterval(() => {
    segundosRestantes -= 1;
    actualizarTemporizadorUI();
    if (segundosRestantes <= 0) tiempoAgotado();
  }, 1000);
}

/** Tiempo agotado o "No lo sé" cuentan como fallo (RF-08); tocar la tarjeta solo muestra la respuesta. */
function registrarFalloRevelado(textoMensaje) {
  if (!sesion || sesion.marcadas.has(sesion.indice)) return;
  cancelarTemporizador();
  const v = sesion.revelar();
  const r = app.marcar(mazoActual, sesion, false);
  if (!r.ok) return;
  sesionFallos += 1;
  erroresSesion.push(idTarjetaActual());
  registrarEstudioDeHoy();
  refrescar();
  pintarTarjetaEstudio();
  $('tarjeta').classList.add('resultado-fallo');
  reproducirSonido('fallo');
  mostrarMensaje($('msg-estudio'), textoMensaje(v.respuesta), true);
  $('btn-siguiente').focus();
}

function tiempoAgotado() {
  registrarFalloRevelado((resp) => `⏱ Se acabó el tiempo. La respuesta era: ${resp}`);
}

function pintarTarjetaEstudio() {
  const v = sesion.vistaActual();
  $('posicion').textContent = `${v.posicion} / ${v.total}`;
  $('pregunta').textContent = v.pregunta;
  $('respuesta').textContent = v.respuesta ?? '';
  $('barra-progreso-relleno').style.width = `${(v.posicion / v.total) * 100}%`;
  $('btn-acierto').disabled = $('btn-fallo').disabled = v.respuesta === null || sesion.marcadas.has(sesion.indice);
  $('pista-tarjeta').textContent = 'Toca la tarjeta para ver la respuesta';
  $('pista-tarjeta').hidden = v.respuesta !== null;
  $('btn-siguiente').disabled = !sesion.marcadas.has(sesion.indice);
  $('btn-revelar').disabled = sesion.marcadas.has(sesion.indice) || v.respuesta !== null;
  $('tarjeta').classList.remove('resultado-acierto', 'resultado-fallo');
  pintarOpciones();
}

function limpiarMensaje() {
  $('msg-estudio').textContent = '';
}

/** Arranca una sesión de estudio sobre `tarjetas` (ya ordenadas) y reinicia los contadores de la sesión. */
function iniciarSesionSobre(tarjetas) {
  const r = SesionEstudio.iniciar({ tarjetas });
  if (!r.ok) return r;
  ordenEstudio = tarjetas;
  erroresSesion = [];
  sesionAciertos = 0;
  sesionFallos = 0;
  sesion = r.sesion;
  $('aviso-vacio').hidden = true;
  $('btn-empezar-neutral').hidden = true;
  $('seccion-presentacion').hidden = true;
  ocultarResumen();
  $('seccion-estudio').hidden = false;
  limpiarMensaje();
  pintarTarjetaEstudio();
  iniciarTemporizadorSiAplica();
  enfocarInicioTarjeta();
  return r;
}

$('form-mazo').onsubmit = (e) => {
  e.preventDefault();
  const r = app.crearMazo($('nombre-mazo').value);
  mostrarMensaje($('msg-mazo'), r.ok ? r.mensaje : r.error, !r.ok);
  if (r.ok) { $('nombre-mazo').value = ''; pintarMazos(); }
};

$('form-renombrar').onsubmit = (e) => {
  e.preventDefault();
  const r = app.renombrarMazo(mazoActual, $('nuevo-nombre').value);
  mostrarMensaje($('msg-tarjeta'), r.ok ? r.mensaje : r.error, !r.ok);
  refrescar();
};

function descargarJSON(nombreArchivo, contenido) {
  const blob = new Blob([contenido], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo;
  a.click();
  URL.revokeObjectURL(url);
}

$('btn-exportar-mazo').onclick = () => {
  const r = app.exportarMazo(mazoActual);
  if (!r.ok) { mostrarMensaje($('msg-tarjeta'), r.error, true); return; }
  descargarJSON(r.nombreArchivo, r.contenido);
  mostrarMensaje($('msg-tarjeta'), 'Mazo exportado correctamente.', false);
};

$('btn-duplicar-mazo').onclick = () => {
  const mazo = app.obtenerMazo(mazoActual);
  let intento = 0;
  let r;
  let nombreNuevo;
  do {
    intento += 1;
    nombreNuevo = intento === 1 ? `${mazo.nombre} (copia)` : `${mazo.nombre} (copia ${intento})`;
    r = app.crearMazo(nombreNuevo);
  } while (!r.ok && intento < 50);
  if (!r.ok) { mostrarMensaje($('msg-tarjeta'), r.error, true); return; }
  for (const t of mazo.tarjetas) app.agregarTarjeta(r.mazo.id, t.pregunta, t.respuesta);
  mostrarMensaje($('msg-tarjeta'), `Mazo duplicado como "${r.mazo.nombre}".`, false);
  pintarMazos();
};

$('btn-exportar-todos').onclick = () => {
  const mazos = app.listarMazos().map((m) => JSON.parse(app.exportarMazo(m.id).contenido));
  if (mazos.length === 0) { mostrarMensaje($('msg-exportar'), 'No tienes mazos para exportar.', true); return; }
  descargarJSON('todos_mis_mazos.json', JSON.stringify({ version: 1, mazos }, null, 2));
  mostrarMensaje($('msg-exportar'), `${mazos.length} mazo(s) exportado(s) en un solo archivo.`, false);
};

function nombreYaExiste(m) {
  if (!m || typeof m !== 'object' || typeof m.nombre !== 'string' || m.nombre.trim() === '') return false;
  const clave = normalizarNombre(m.nombre);
  return app.listarMazos().some((x) => normalizarNombre(x.nombre) === clave);
}

$('form-importar').onsubmit = (e) => {
  e.preventDefault();
  const input = $('archivo-importar');
  const archivo = input.files[0];
  if (!archivo) { mostrarMensaje($('msg-importar'), 'Selecciona un archivo .json para importar.', true); return; }
  const lector = new FileReader();
  lector.onload = () => {
    let datos;
    try { datos = JSON.parse(lector.result); } catch { datos = null; }

    if (datos && Array.isArray(datos.mazos)) {
      // Archivo con varios mazos: cada uno pasa por la misma validación de RF-10/RF-12.
      let importados = 0;
      let fallidos = 0;
      let repetidos = 0;
      for (const m of datos.mazos) {
        if (nombreYaExiste(m)) { repetidos += 1; continue; }
        const r = app.importarMazo(JSON.stringify(m));
        if (r.ok) importados += 1; else fallidos += 1;
      }
      let texto = (fallidos + repetidos) > 0
        ? `Se importaron ${importados} de ${datos.mazos.length} mazo(s).`
        : `Se importaron ${importados} mazo(s) correctamente.`;
      if (repetidos > 0) texto += ` ${repetidos} se omitieron porque ya tienes un mazo con ese nombre.`;
      if (fallidos > 0) texto += ` ${fallidos} no se pudieron importar.`;
      mostrarMensaje($('msg-importar'), texto, importados === 0);
      if (importados > 0) { input.value = ''; pintarMazos(); }
      return;
    }

    if (nombreYaExiste(datos)) {
      mostrarMensaje($('msg-importar'), `Ya tienes un mazo llamado "${datos.nombre.trim()}", así que no se importó. Elimínalo o renómbralo desde EDITAR si quieres cargar este.`, true);
      return;
    }

    const r = app.importarMazo(lector.result);
    mostrarMensaje($('msg-importar'), r.ok ? r.mensaje : r.error, !r.ok);
    if (r.ok) { input.value = ''; pintarMazos(); }
  };
  lector.onerror = () => mostrarMensaje($('msg-importar'), 'No se pudo leer el archivo.', true);
  lector.readAsText(archivo);
};

$('btn-eliminar-mazo').onclick = () => {
  const r = app.eliminarMazo(mazoActual, window.confirm('¿Eliminar este mazo con todas sus tarjetas?'));
  if (r.ok) {
    salirAPrincipal();
    mostrarMensaje($('msg-global'), r.mensaje, false);
  } else {
    mostrarMensaje($('msg-tarjeta'), r.error, true);
  }
};

$('form-tarjeta').onsubmit = (e) => {
  e.preventDefault();
  const p = $('pregunta-in').value;
  const rsp = $('respuesta-in').value;
  const r = tarjetaEditando === null
    ? app.agregarTarjeta(mazoActual, p, rsp)
    : app.editarTarjeta(mazoActual, tarjetaEditando, p, rsp);
  const texto = r.ok ? (r.totalTarjetas ? `${r.mensaje} Total: ${r.totalTarjetas}` : r.mensaje) : r.error;
  const esNueva = tarjetaEditando === null;
  if (r.ok) { cancelarEdicion(); refrescar(); }
  mostrarMensaje($('msg-tarjeta'), texto, !r.ok);
  // EXTRA: tras añadir, el foco vuelve a Pregunta para escribir la siguiente tarjeta sin clics.
  if (r.ok && esNueva) $('pregunta-in').focus();
};

function empezarEstudio() {
  actualizarDisponibilidadOpciones();
  const mazo = app.obtenerMazo(mazoActual);
  const tarjetas = barajar(mazo.tarjetas);
  const r = iniciarSesionSobre(tarjetas);
  if (!r.ok) {
    sesion = null;
    cancelarTemporizador();
    $('seccion-presentacion').hidden = true;
    $('seccion-estudio').hidden = true;
    ocultarResumen();
    $('btn-empezar-neutral').hidden = true;
    mostrarMensaje($('aviso-vacio'), r.error, true);
    $('aviso-vacio').hidden = false;
    $('btn-editar').focus();
  }
}

/** Inicia el estudio del mazo actual respetando la opción de explicación previa (extra). */
function iniciarEstudioMazoActual() {
  const mazo = app.obtenerMazo(mazoActual);
  if ($('chk-explicacion-previa').checked && mazo.tarjetas.length > 0) abrirPresentacion(true);
  else empezarEstudio();
}

// EXTRA: "Ver explicación del tema" — solo lectura, pasa pregunta por pregunta con su explicación.
function pintarPresentacion() {
  const mazo = app.obtenerMazo(mazoActual);
  const t = tarjetasPresentacion[indicePresentacion];
  $('posicion-presentacion').textContent = `${indicePresentacion + 1} / ${tarjetasPresentacion.length}`;
  $('barra-progreso-presentacion').style.width = `${((indicePresentacion + 1) / tarjetasPresentacion.length) * 100}%`;
  $('pregunta-presentacion').textContent = t.pregunta;
  $('respuesta-presentacion').textContent = t.respuesta;
  $('explicacion-presentacion').textContent = explicacionDe(mazo.nombre, t.pregunta);
  $('btn-anterior-presentacion').disabled = indicePresentacion === 0;
  $('btn-siguiente-presentacion').disabled = indicePresentacion === tarjetasPresentacion.length - 1;
}

function abrirPresentacion(paraEstudiar) {
  const mazo = app.obtenerMazo(mazoActual);
  if (mazo.tarjetas.length === 0) {
    $('seccion-estudio').hidden = true;
    mostrarMensaje($('aviso-vacio'), 'Este mazo no tiene tarjetas que explicar.', true);
    $('aviso-vacio').hidden = false;
    return;
  }
  if (avanceAuto && sesion) {
    clearTimeout(avanceAuto);
    avanceAuto = null;
    if (sesion.esUltima()) {
      resumenActivo = true;
    } else {
      sesion.siguiente();
      limpiarMensaje();
      pintarTarjetaEstudio();
    }
  }
  $('resumen-final').hidden = true;
  $('aviso-vacio').hidden = true;
  $('btn-empezar-neutral').hidden = true;
  tarjetasPresentacion = mazo.tarjetas;
  indicePresentacion = 0;
  cancelarTemporizador();
  $('seccion-estudio').hidden = true;
  $('btn-empezar-preguntas').hidden = !paraEstudiar;
  $('seccion-presentacion').hidden = false;
  pintarPresentacion();
  (paraEstudiar ? $('btn-empezar-preguntas') : $('btn-siguiente-presentacion')).focus();
}

$('btn-ver-explicacion').onclick = () => abrirPresentacion(false);

$('btn-empezar-preguntas').onclick = empezarEstudio;
$('btn-empezar-neutral').onclick = empezarEstudio;

$('btn-anterior-presentacion').onclick = () => {
  if (indicePresentacion > 0) { indicePresentacion -= 1; pintarPresentacion(); }
};
$('btn-siguiente-presentacion').onclick = () => {
  if (indicePresentacion < tarjetasPresentacion.length - 1) { indicePresentacion += 1; pintarPresentacion(); }
};
$('btn-cerrar-presentacion').onclick = () => {
  if (!sesion) {
    if (!$('btn-empezar-preguntas').hidden) { salirAPrincipal(); return; }
    $('seccion-presentacion').hidden = true;
    mostrarMensaje($('aviso-vacio'), 'Pulsa ▶ Empezar para estudiar.', false);
    $('aviso-vacio').hidden = false;
    $('btn-empezar-neutral').hidden = false;
    $('btn-empezar-neutral').focus();
    return;
  }
  $('seccion-presentacion').hidden = true;
  if (resumenActivo) { mostrarResumen(); return; }
  $('seccion-estudio').hidden = false;
  pintarTarjetaEstudio();
  iniciarTemporizadorSiAplica();
  enfocarInicioTarjeta();
};

$('btn-estudiar-de-nuevo').onclick = empezarEstudio;
$('btn-salir-resumen').onclick = salirAPrincipal;
$('btn-repasar-errores').onclick = () => {
  const mazo = app.obtenerMazo(mazoActual);
  const tarjetasFalladas = mazo.tarjetas.filter((t) => erroresSesion.includes(t.id));
  iniciarSesionSobre(barajar(tarjetasFalladas));
};

$('btn-revelar').onclick = () => {
  if (!sesion || sesion.respuestaVisible) return;
  registrarFalloRevelado((resp) => `La respuesta era: ${resp}. Contó como fallo.`);
};
function voltearTarjeta() {
  if (!sesion || sesion.respuestaVisible || opcionesVigentes()) return;
  sesion.revelar();
  pintarTarjetaEstudio();
}
$('tarjeta').onclick = voltearTarjeta;
$('tarjeta').onkeydown = (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  e.preventDefault();
  voltearTarjeta();
};
// EXTRA: teclas 1-4 eligen la opción, salvo que el foco esté en un campo de texto o select.
document.addEventListener('keydown', (e) => {
  if (!/^[1-4]$/.test(e.key) || e.ctrlKey || e.altKey || e.metaKey || e.defaultPrevented) return;
  if ($('pantalla-estudio').hidden || $('seccion-estudio').hidden || !sesion) return;
  const t = e.target;
  if (t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))) return;
  const op = opcionesVigentes();
  if (!op || sesion.marcadas.has(sesion.indice)) return;
  e.preventDefault();
  elegirOpcion(Number(e.key) - 1);
});
$('btn-siguiente').onclick = () => {
  if (!sesion || !sesion.marcadas.has(sesion.indice)) return;
  cancelarTemporizador();
  avanzarOResumen();
};
for (const [id, acierto] of [['btn-acierto', true], ['btn-fallo', false]]) {
  $(id).onclick = () => {
    if (!sesion || !sesion.respuestaVisible) return;
    cancelarTemporizador();
    const r = app.marcar(mazoActual, sesion, acierto);
    if (!r.ok) return;
    if (acierto) sesionAciertos += 1; else { sesionFallos += 1; erroresSesion.push(idTarjetaActual()); }
    registrarEstudioDeHoy();
    refrescar();
    pintarTarjetaEstudio();
    $('tarjeta').classList.add(acierto ? 'resultado-acierto' : 'resultado-fallo');
    reproducirSonido(acierto ? 'acierto' : 'fallo');
    programarAvance();
  };
}

$('buscar-mazo').oninput = pintarMazos;
$('ordenar-mazos').onchange = pintarMazos;

// EXTRA: carga los mazos de ejemplo validándolos con el importador; omite los que ya existen por nombre.
$('btn-cargar-ejemplos').onclick = () => {
  const nombres = new Set(app.listarMazos().map((m) => normalizarNombre(m.nombre)));
  let cargados = 0;
  let omitidos = 0;
  let fallidos = 0;
  for (const ejemplo of MAZOS_EJEMPLO) {
    const clave = normalizarNombre(ejemplo.nombre);
    if (nombres.has(clave)) { omitidos += 1; continue; }
    const r = app.importarMazo(JSON.stringify(ejemplo));
    if (r.ok) { cargados += 1; nombres.add(clave); } else { fallidos += 1; }
  }
  let texto = `Se cargaron ${cargados} mazo(s) de ejemplo y se omitieron ${omitidos} que ya existían.`;
  if (fallidos > 0) texto += ` ${fallidos} no se pudieron importar.`;
  mostrarMensaje($('msg-ejemplos'), texto, fallidos > 0);
  pintarMazos();
};

pintarMazos();
