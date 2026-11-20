// Conecta el controlador con la página (index.html). Solo maneja el DOM.
import { crearControlador } from './controlador.js';
import { AlmacenamientoLocal } from '../almacenamiento/almacenamientoLocal.js';

const app = crearControlador(new AlmacenamientoLocal(window.localStorage));
const $ = (id) => document.getElementById(id);
let mazoActual = null;
let tarjetaEditando = null;
let sesion = null;

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

function mostrarMensaje(el, texto, esError) {
  el.textContent = texto;
  el.className = esError ? 'mensaje error' : 'mensaje ok';
}

// Colores de acento por mazo, solo decorativos (no se guardan, se calculan del id).
const PALETA_MAZOS = ['#e8604c', '#2f9e6b', '#9256c9', '#d9a521', '#2f8fd4', '#d4578f', '#1fa394', '#c9622f'];
function colorMazo(id) {
  return PALETA_MAZOS[id % PALETA_MAZOS.length];
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

function pintarMazos() {
  const lista = $('lista-mazos');
  lista.innerHTML = '';
  const filtrados = mazosFiltradosYOrdenados();
  const texto = $('buscar-mazo').value.trim();
  const hayMazos = app.listarMazos().length > 0;
  $('msg-buscar-mazo').textContent =
    hayMazos && texto && filtrados.length === 0 ? `Ningún mazo coincide con "${texto}".` : '';

  if (!hayMazos) {
    const aviso = document.createElement('li');
    aviso.className = 'lista-vacia-aviso';
    aviso.textContent = 'Aún no tienes mazos. Crea el primero arriba.';
    lista.appendChild(aviso);
    return;
  }

  for (const { mazo: m, porcentaje: pct } of filtrados) {
    const li = document.createElement('li');

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

    const b = document.createElement('button');
    b.type = 'button';
    b.style.setProperty('--acento', colorMazo(m.id));
    b.append(info, badge);
    b.onclick = () => abrirMazo(m.id);

    li.appendChild(b);
    lista.appendChild(li);
  }
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

function abrirMazo(id) {
  mazoActual = id;
  const m = app.obtenerMazo(id);
  $('titulo-mazo').textContent = `${m.nombre} · ${m.tarjetas.length} tarjeta(s)`;
  $('nuevo-nombre').value = m.nombre;
  $('seccion-mazo').hidden = false;
  $('seccion-estudio').hidden = true;
  cancelarEdicion();
  pintarTarjetas();
  pintarEstadisticas();
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
  const pct = app.resumen(mazoActual).porcentaje;
  if (pct >= 80) return '¡Repaso terminado! Lo dominas 🎉';
  if (pct >= 50) return '¡Repaso terminado! Vas por buen camino 💪';
  return 'Repaso terminado. ¡Sigue practicando! 📚';
}

/** Compara respuestas de forma flexible: ignora mayúsculas, acentos y espacios. */
function normalizarRespuesta(texto) {
  return (texto || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/\s+/g, '');
}

function pintarTarjetaEstudio() {
  const v = sesion.vistaActual();
  $('posicion').textContent = `${v.posicion} / ${v.total}`;
  $('pregunta').textContent = v.pregunta;
  $('respuesta').textContent = v.respuesta ?? '';
  $('btn-acierto').disabled = $('btn-fallo').disabled = !sesion.puedeMarcar();
  // "Comprobar" se deshabilita solo cuando la tarjeta ya quedó marcada (revelada y sin poder volver a marcar).
  $('btn-comprobar').disabled = v.respuesta !== null && !sesion.puedeMarcar();
  $('btn-siguiente').disabled = sesion.esUltima();
  $('msg-estudio').textContent = sesion.terminado() ? mensajeFinal() : '';
  $('tarjeta').classList.remove('resultado-acierto', 'resultado-fallo');
}

function limpiarComprobacion() {
  $('respuesta-usuario').value = '';
  $('msg-comprobar').textContent = '';
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

$('btn-exportar-mazo').onclick = () => {
  const r = app.exportarMazo(mazoActual);
  if (!r.ok) { mostrarMensaje($('msg-tarjeta'), r.error, true); return; }
  const blob = new Blob([r.contenido], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = r.nombreArchivo;
  a.click();
  URL.revokeObjectURL(url);
  mostrarMensaje($('msg-tarjeta'), 'Mazo exportado correctamente.', false);
};

$('form-importar').onsubmit = (e) => {
  e.preventDefault();
  const input = $('archivo-importar');
  const archivo = input.files[0];
  if (!archivo) { mostrarMensaje($('msg-importar'), 'Selecciona un archivo .json para importar.', true); return; }
  const lector = new FileReader();
  lector.onload = () => {
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
  if (r.ok) { cancelarEdicion(); refrescar(); }
  mostrarMensaje($('msg-tarjeta'), texto, !r.ok);
};

$('btn-estudiar').onclick = () => {
  const r = app.iniciarEstudio(mazoActual);
  if (!r.ok) { mostrarMensaje($('msg-tarjeta'), r.error, true); return; }
  sesion = r.sesion;
  $('seccion-estudio').hidden = false;
  limpiarComprobacion();
  pintarTarjetaEstudio();
};

$('tarjeta').onclick = $('btn-revelar').onclick = () => { sesion.revelar(); pintarTarjetaEstudio(); };
$('btn-siguiente').onclick = () => { sesion.siguiente(); limpiarComprobacion(); pintarTarjetaEstudio(); };
for (const [id, acierto] of [['btn-acierto', true], ['btn-fallo', false]]) {
  $(id).onclick = () => {
    const r = app.marcar(mazoActual, sesion, acierto);
    if (r.ok) refrescar();
    pintarTarjetaEstudio();
    if (r.ok) $('tarjeta').classList.add(acierto ? 'resultado-acierto' : 'resultado-fallo');
  };
}

$('form-comprobar').onsubmit = (e) => {
  e.preventDefault();
  const v = sesion.revelar(); // asegura respuestaVisible=true para poder marcar (RF-08)
  const correcto = normalizarRespuesta($('respuesta-usuario').value) === normalizarRespuesta(v.respuesta);
  const r = app.marcar(mazoActual, sesion, correcto);
  if (!r.ok) { mostrarMensaje($('msg-comprobar'), r.error, true); return; }

  refrescar();
  pintarTarjetaEstudio();
  $('tarjeta').classList.add(correcto ? 'resultado-acierto' : 'resultado-fallo');

  if (correcto) {
    mostrarMensaje($('msg-comprobar'), '¡Correcto! ✓', false);
    setTimeout(() => {
      if (sesion.esUltima()) return;
      sesion.siguiente();
      limpiarComprobacion();
      pintarTarjetaEstudio();
    }, 900);
  } else {
    mostrarMensaje($('msg-comprobar'), `✗ Incorrecto. La respuesta correcta es: ${v.respuesta}`, true);
  }
};

$('buscar-mazo').oninput = pintarMazos;
$('ordenar-mazos').onchange = pintarMazos;

pintarMazos();
