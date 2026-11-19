// Conecta el controlador con la página (index.html). Solo maneja el DOM.
import { crearControlador } from './controlador.js';
import { AlmacenamientoLocal } from '../almacenamiento/almacenamientoLocal.js';

const app = crearControlador(new AlmacenamientoLocal(window.localStorage));
const $ = (id) => document.getElementById(id);
let mazoActual = null;
let tarjetaEditando = null;
let sesion = null;

function mostrarMensaje(el, texto, esError) {
  el.textContent = texto;
  el.className = esError ? 'mensaje error' : 'mensaje ok';
}

function boton(texto, onClick, clase = '') {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = texto;
  b.className = clase;
  b.onclick = onClick;
  return b;
}

function pintarMazos() {
  const lista = $('lista-mazos');
  lista.innerHTML = '';
  for (const m of app.listarMazos()) {
    const li = document.createElement('li');
    const pct = app.resumen(m.id).porcentaje;

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

function pintarTarjetaEstudio() {
  const v = sesion.vistaActual();
  $('posicion').textContent = `${v.posicion} / ${v.total}`;
  $('pregunta').textContent = v.pregunta;
  $('respuesta').textContent = v.respuesta ?? '';
  $('btn-acierto').disabled = $('btn-fallo').disabled = !sesion.puedeMarcar();
  $('btn-siguiente').disabled = sesion.esUltima();
  $('msg-estudio').textContent = sesion.terminado() ? 'Repaso terminado.' : '';
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
  pintarTarjetaEstudio();
};

$('tarjeta').onclick = $('btn-revelar').onclick = () => { sesion.revelar(); pintarTarjetaEstudio(); };
$('btn-siguiente').onclick = () => { sesion.siguiente(); pintarTarjetaEstudio(); };
for (const [id, acierto] of [['btn-acierto', true], ['btn-fallo', false]]) {
  $(id).onclick = () => {
    const r = app.marcar(mazoActual, sesion, acierto);
    if (r.ok) refrescar();
    pintarTarjetaEstudio();
  };
}

pintarMazos();
