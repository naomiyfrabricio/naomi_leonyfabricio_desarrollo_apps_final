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
let segundosRestantes = 0;

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

// Preferencia de sonido (solo UI). Un pitido simple con Web Audio, sin archivos externos.
const CLAVE_SONIDO = 'flashcards.ui.sonido';
function sonidoActivado() {
  return localStorage.getItem(CLAVE_SONIDO) !== 'off';
}
function pintarBotonSonido() {
  $('btn-sonido').textContent = sonidoActivado() ? '🔊' : '🔇';
}
pintarBotonSonido();
$('btn-sonido').onclick = () => {
  localStorage.setItem(CLAVE_SONIDO, sonidoActivado() ? 'off' : 'on');
  pintarBotonSonido();
};
function reproducirSonido(tipo) {
  if (!sonidoActivado()) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const ganancia = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = tipo === 'acierto' ? 880 : 220;
    ganancia.gain.setValueAtTime(0.15, ctx.currentTime);
    ganancia.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
    osc.connect(ganancia).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
    osc.onended = () => ctx.close();
  } catch {
    // Si el navegador bloquea audio sin interacción previa, se ignora sin romper la app.
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

// EXTRA: grupos plegados de "Tus mazos" (solo UI). Un fallo de almacenamiento no rompe la lista.
const CLAVE_GRUPOS_PLEGADOS = 'flashcards.ui.gruposPlegados';
function gruposPlegados() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE_GRUPOS_PLEGADOS) || '[]');
    return new Set(Array.isArray(guardado) ? guardado : []);
  } catch {
    return new Set();
  }
}
function guardarGruposPlegados(conjunto) {
  try {
    localStorage.setItem(CLAVE_GRUPOS_PLEGADOS, JSON.stringify([...conjunto]));
  } catch {
    // Sin almacenamiento, los grupos se muestran igual pero no se recuerdan.
  }
}

function pintarMazos() {
  const lista = $('lista-mazos');
  lista.innerHTML = '';
  const filtrados = mazosFiltradosYOrdenados();
  const texto = $('buscar-mazo').value.trim();
  const hayMazos = app.listarMazos().length > 0;
  $('msg-buscar-mazo').textContent =
    hayMazos && texto && filtrados.length === 0 ? `Ningún mazo coincide con "${texto}".` : '';
  $('btn-cargar-ejemplos').className = hayMazos ? 'secundario' : '';

  if (!hayMazos) {
    const aviso = document.createElement('p');
    aviso.className = 'lista-vacia-aviso';
    aviso.textContent = 'Aún no tienes mazos. Crea el primero arriba.';
    lista.appendChild(aviso);
    return;
  }

  const porCategoria = new Map();
  for (const item of filtrados) {
    const categoria = categoriaDe(item.mazo.nombre);
    if (!porCategoria.has(categoria)) porCategoria.set(categoria, []);
    porCategoria.get(categoria).push(item);
  }
  const plegados = gruposPlegados();
  for (const categoria of ORDEN_CATEGORIAS) {
    const items = porCategoria.get(categoria);
    if (!items) continue;

    const grupo = document.createElement('details');
    grupo.className = 'grupo-mazos';
    grupo.open = Boolean(texto) || !plegados.has(categoria);
    grupo.addEventListener('toggle', () => {
      if ($('buscar-mazo').value.trim()) return;
      const conjunto = gruposPlegados();
      if (grupo.open) conjunto.delete(categoria); else conjunto.add(categoria);
      guardarGruposPlegados(conjunto);
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

  const abrir = boton('', () => abrirMazo(m.id), 'btn-abrir-mazo');
  abrir.append(info, badge);

  // EXTRA: estudiar sin abrir el mazo antes (mismas opciones de estudio que el detalle).
  const estudiar = boton('▶ Estudiar', () => estudiarDesdeLista(m.id), 'btn-estudiar-mazo');

  li.append(abrir, estudiar);
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

/** EXTRA: lleva la vista a una sección recién abierta. */
function desplazarA(elemento) {
  elemento.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function abrirMazo(id, desplazar = true) {
  cancelarTemporizador();
  mazoActual = id;
  const m = app.obtenerMazo(id);
  $('titulo-mazo').textContent = `${m.nombre} · ${m.tarjetas.length} tarjeta(s)`;
  $('nuevo-nombre').value = m.nombre;
  $('seccion-mazo').hidden = false;
  $('seccion-estudio').hidden = true;
  $('seccion-presentacion').hidden = true;
  cancelarEdicion();
  pintarTarjetas();
  pintarEstadisticas();
  if (desplazar) desplazarA($('seccion-mazo'));
}

function refrescar() {
  pintarMazos();
  if (mazoActual !== null && app.obtenerMazo(mazoActual)) {
    const m = app.obtenerMazo(mazoActual);
    $('titulo-mazo').textContent = `${m.nombre} · ${m.tarjetas.length} tarjeta(s)`;
    pintarTarjetas();
    pintarEstadisticas();
  }
}

function cancelarEdicion() {
  tarjetaEditando = null;
  $('pregunta-in').value = '';
  $('respuesta-in').value = '';
  $('btn-tarjeta').textContent = 'Añadir tarjeta';
}

function mensajeFinal() {
  const total = sesionAciertos + sesionFallos;
  const pct = total > 0 ? Math.round((sesionAciertos / total) * 100) : 0;
  const resumen = `Repaso terminado: ${sesionAciertos}/${total} correctas (${pct} %).`;
  if (pct >= 80) return `${resumen} ¡Lo dominas! 🎉`;
  if (pct >= 50) return `${resumen} Vas por buen camino 💪`;
  return `${resumen} Sigue practicando 📚`;
}

/** Compara respuestas de forma flexible: ignora mayúsculas, acentos y espacios. */
function normalizarRespuesta(texto) {
  return (texto || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/\s+/g, '');
}

/** id de la tarjeta que se está mostrando ahora mismo, según el orden usado en esta sesión. */
function idTarjetaActual() {
  const v = sesion.vistaActual();
  return ordenEstudio[v.posicion - 1]?.id;
}

function cancelarTemporizador() {
  if (temporizador) { clearInterval(temporizador); temporizador = null; }
  $('temporizador-estudio').textContent = '';
}

function actualizarTemporizadorUI() {
  $('temporizador-estudio').textContent = `⏱ ${segundosRestantes}s`;
}

function iniciarTemporizadorSiAplica() {
  cancelarTemporizador();
  if (!$('chk-examen').checked || sesion.terminado()) return;
  segundosRestantes = Number($('examen-segundos').value) || 20;
  actualizarTemporizadorUI();
  temporizador = setInterval(() => {
    segundosRestantes -= 1;
    actualizarTemporizadorUI();
    if (segundosRestantes <= 0) tiempoAgotado();
  }, 1000);
}

/** Se acabó el tiempo sin que el estudiante respondiera: cuenta como fallo (RF-08). */
function tiempoAgotado() {
  cancelarTemporizador();
  const v = sesion.revelar(); // asegura respuestaVisible=true para poder marcar (RF-08)
  const r = app.marcar(mazoActual, sesion, false);
  if (!r.ok) return;
  sesionFallos += 1;
  erroresSesion.push(idTarjetaActual());
  registrarEstudioDeHoy();
  refrescar();
  pintarTarjetaEstudio();
  $('tarjeta').classList.add('resultado-fallo');
  reproducirSonido('fallo');
  mostrarMensaje($('msg-comprobar'), `⏱ Se acabó el tiempo. La respuesta era: ${v.respuesta}`, true);
}

function pintarTarjetaEstudio() {
  const v = sesion.vistaActual();
  $('posicion').textContent = `${v.posicion} / ${v.total}`;
  $('pregunta').textContent = v.pregunta;
  $('respuesta').textContent = v.respuesta ?? '';
  $('barra-progreso-relleno').style.width = `${(v.posicion / v.total) * 100}%`;
  $('btn-acierto').disabled = $('btn-fallo').disabled = !sesion.puedeMarcar();
  // "Comprobar" se deshabilita solo cuando la tarjeta ya quedó marcada (revelada y sin poder volver a marcar).
  $('btn-comprobar').disabled = v.respuesta !== null && !sesion.puedeMarcar();
  $('btn-siguiente').disabled = sesion.esUltima();
  $('msg-estudio').textContent = sesion.terminado() ? mensajeFinal() : '';
  $('btn-repasar-errores').hidden = !(sesion.terminado() && erroresSesion.length > 0);
  $('btn-repasar-errores').textContent = `🔁 Repasar mis errores (${erroresSesion.length})`;
  $('tarjeta').classList.remove('resultado-acierto', 'resultado-fallo');
}

function limpiarComprobacion() {
  $('respuesta-usuario').value = '';
  $('msg-comprobar').textContent = '';
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
  $('seccion-estudio').hidden = false;
  limpiarComprobacion();
  pintarTarjetaEstudio();
  iniciarTemporizadorSiAplica();
  desplazarA($('seccion-estudio'));
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
  if (mazos.length === 0) { mostrarMensaje($('msg-importar'), 'No tienes mazos para exportar.', true); return; }
  descargarJSON('todos_mis_mazos.json', JSON.stringify({ version: 1, mazos }, null, 2));
  mostrarMensaje($('msg-importar'), `${mazos.length} mazo(s) exportado(s) en un solo archivo.`, false);
};

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
      for (const m of datos.mazos) {
        const r = app.importarMazo(JSON.stringify(m));
        if (r.ok) importados += 1; else fallidos += 1;
      }
      const texto = fallidos > 0
        ? `Se importaron ${importados} de ${datos.mazos.length} mazo(s). ${fallidos} no se pudieron importar.`
        : `Se importaron ${importados} mazo(s) correctamente.`;
      mostrarMensaje($('msg-importar'), texto, importados === 0);
      if (importados > 0) { input.value = ''; pintarMazos(); }
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
    cancelarTemporizador();
    mazoActual = null;
    $('seccion-mazo').hidden = true;
    $('seccion-estudio').hidden = true;
    mostrarMensaje($('msg-mazo'), r.mensaje, false);
    pintarMazos();
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
  const mazo = app.obtenerMazo(mazoActual);
  const tarjetas = $('chk-aleatorio').checked ? barajar(mazo.tarjetas) : [...mazo.tarjetas];
  const r = iniciarSesionSobre(tarjetas);
  if (!r.ok) {
    mostrarMensaje($('msg-tarjeta'), r.error, true);
    desplazarA($('msg-tarjeta'));
  }
}

/** Inicia el estudio del mazo actual respetando la opción de explicación previa (extra). */
function iniciarEstudioMazoActual() {
  const mazo = app.obtenerMazo(mazoActual);
  if ($('chk-explicacion-previa').checked && mazo.tarjetas.length > 0) abrirPresentacion(true);
  else empezarEstudio();
}

/** EXTRA: "▶ Estudiar" de la lista. Abre el mazo sin desplazar y estudia directamente. */
function estudiarDesdeLista(id) {
  abrirMazo(id, false);
  iniciarEstudioMazoActual();
}

$('btn-estudiar').onclick = iniciarEstudioMazoActual;

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
  if (mazo.tarjetas.length === 0) { mostrarMensaje($('msg-tarjeta'), 'Este mazo no tiene tarjetas que explicar.', true); return; }
  tarjetasPresentacion = mazo.tarjetas;
  indicePresentacion = 0;
  cancelarTemporizador();
  $('seccion-estudio').hidden = true;
  $('btn-empezar-preguntas').hidden = !paraEstudiar;
  $('seccion-presentacion').hidden = false;
  pintarPresentacion();
  desplazarA($('seccion-presentacion'));
}

$('btn-ver-explicacion').onclick = () => abrirPresentacion(false);

$('btn-empezar-preguntas').onclick = () => {
  $('seccion-presentacion').hidden = true;
  empezarEstudio();
};

$('btn-anterior-presentacion').onclick = () => {
  if (indicePresentacion > 0) { indicePresentacion -= 1; pintarPresentacion(); }
};
$('btn-siguiente-presentacion').onclick = () => {
  if (indicePresentacion < tarjetasPresentacion.length - 1) { indicePresentacion += 1; pintarPresentacion(); }
};
$('btn-cerrar-presentacion').onclick = () => { $('seccion-presentacion').hidden = true; };

$('btn-repasar-errores').onclick = () => {
  const mazo = app.obtenerMazo(mazoActual);
  const tarjetasFalladas = mazo.tarjetas.filter((t) => erroresSesion.includes(t.id));
  iniciarSesionSobre(tarjetasFalladas);
};

$('tarjeta').onclick = $('btn-revelar').onclick = () => { sesion.revelar(); pintarTarjetaEstudio(); };
$('btn-siguiente').onclick = () => {
  sesion.siguiente();
  limpiarComprobacion();
  pintarTarjetaEstudio();
  iniciarTemporizadorSiAplica();
};
for (const [id, acierto] of [['btn-acierto', true], ['btn-fallo', false]]) {
  $(id).onclick = () => {
    cancelarTemporizador();
    const r = app.marcar(mazoActual, sesion, acierto);
    if (!r.ok) return;
    if (acierto) sesionAciertos += 1; else { sesionFallos += 1; erroresSesion.push(idTarjetaActual()); }
    registrarEstudioDeHoy();
    refrescar();
    pintarTarjetaEstudio();
    $('tarjeta').classList.add(acierto ? 'resultado-acierto' : 'resultado-fallo');
    reproducirSonido(acierto ? 'acierto' : 'fallo');
  };
}

$('form-comprobar').onsubmit = (e) => {
  e.preventDefault();
  cancelarTemporizador();
  const v = sesion.revelar(); // asegura respuestaVisible=true para poder marcar (RF-08)
  const correcto = normalizarRespuesta($('respuesta-usuario').value) === normalizarRespuesta(v.respuesta);
  const r = app.marcar(mazoActual, sesion, correcto);
  if (!r.ok) { mostrarMensaje($('msg-comprobar'), r.error, true); return; }

  if (correcto) sesionAciertos += 1; else { sesionFallos += 1; erroresSesion.push(idTarjetaActual()); }
  registrarEstudioDeHoy();
  refrescar();
  pintarTarjetaEstudio();
  $('tarjeta').classList.add(correcto ? 'resultado-acierto' : 'resultado-fallo');
  reproducirSonido(correcto ? 'acierto' : 'fallo');

  if (correcto) {
    mostrarMensaje($('msg-comprobar'), '¡Correcto! ✓', false);
    setTimeout(() => {
      if (sesion.esUltima()) return;
      sesion.siguiente();
      limpiarComprobacion();
      pintarTarjetaEstudio();
      iniciarTemporizadorSiAplica();
    }, 900);
  } else {
    mostrarMensaje($('msg-comprobar'), `✗ Incorrecto. La respuesta correcta es: ${v.respuesta}`, true);
  }
};

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
