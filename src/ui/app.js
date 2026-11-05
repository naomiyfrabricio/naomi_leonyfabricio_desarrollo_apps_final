// Conecta el controlador con la página (index.html). Solo maneja el DOM.
import { crearControlador } from './controlador.js';
import { AlmacenamientoLocal } from '../almacenamiento/almacenamientoLocal.js';

const app = crearControlador(new AlmacenamientoLocal(window.localStorage));
const $ = (id) => document.getElementById(id);
let mazoActual = null;
let sesion = null;

function mostrarMensaje(el, texto, esError) {
  el.textContent = texto;
  el.className = esError ? 'mensaje error' : 'mensaje ok';
}

function pintarMazos() {
  const lista = $('lista-mazos');
  lista.innerHTML = '';
  for (const m of app.listarMazos()) {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.textContent = `${m.nombre} (${m.tarjetas.length})`;
    btn.onclick = () => abrirMazo(m.id);
    li.appendChild(btn);
    lista.appendChild(li);
  }
}

function abrirMazo(id) {
  mazoActual = id;
  const m = app.listarMazos().find((x) => x.id === id);
  $('titulo-mazo').textContent = `${m.nombre} · ${m.tarjetas.length} tarjeta(s)`;
  $('seccion-mazo').hidden = false;
  $('seccion-estudio').hidden = true;
  $('msg-tarjeta').textContent = '';
}

function pintarTarjeta() {
  const v = sesion.vistaActual();
  $('posicion').textContent = `${v.posicion} / ${v.total}`;
  $('pregunta').textContent = v.pregunta;
  $('respuesta').textContent = v.respuesta ?? '';
  $('btn-siguiente').disabled = sesion.esUltima();
}

$('form-mazo').onsubmit = (e) => {
  e.preventDefault();
  const r = app.crearMazo($('nombre-mazo').value);
  mostrarMensaje($('msg-mazo'), r.ok ? r.mensaje : r.error, !r.ok);
  if (r.ok) { $('nombre-mazo').value = ''; pintarMazos(); }
};

$('form-tarjeta').onsubmit = (e) => {
  e.preventDefault();
  const r = app.agregarTarjeta(mazoActual, $('pregunta-in').value, $('respuesta-in').value);
  mostrarMensaje($('msg-tarjeta'), r.ok ? `${r.mensaje} Total: ${r.totalTarjetas}` : r.error, !r.ok);
  if (r.ok) {
    $('pregunta-in').value = '';
    $('respuesta-in').value = '';
    pintarMazos();
    abrirMazo(mazoActual);
    mostrarMensaje($('msg-tarjeta'), `${r.mensaje} Total: ${r.totalTarjetas}`, false);
  }
};

$('btn-estudiar').onclick = () => {
  const r = app.iniciarEstudio(mazoActual);
  if (!r.ok) { mostrarMensaje($('msg-tarjeta'), r.error, true); return; }
  sesion = r.sesion;
  $('seccion-estudio').hidden = false;
  pintarTarjeta();
};

$('tarjeta').onclick = $('btn-revelar').onclick = () => { sesion.revelar(); pintarTarjeta(); };
$('btn-siguiente').onclick = () => { sesion.siguiente(); pintarTarjeta(); };

pintarMazos();
