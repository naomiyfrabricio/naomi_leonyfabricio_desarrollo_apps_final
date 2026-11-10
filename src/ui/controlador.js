/**
 * Controlador de la app: une los módulos de mazos, tarjetas, estudio y estadísticas
 * sobre un mismo almacenamiento. No toca el DOM, para poder probar el flujo completo en Node.
 */
import { GestorMazos } from '../mazos/gestorMazos.js';
import { GestorTarjetas } from '../tarjetas/gestorTarjetas.js';
import { SesionEstudio } from '../estudio/sesionEstudio.js';
import { Estadisticas } from '../estadisticas/estadisticas.js';

export function crearControlador(almacenamiento) {
  const mazos = new GestorMazos(almacenamiento);
  const tarjetas = new GestorTarjetas(almacenamiento);
  const estadisticas = new Estadisticas(almacenamiento);
  const buscarMazo = (id) => mazos.listarMazos().find((m) => m.id === id);

  return {
    // Mazos (RF-01, RF-02, RF-03)
    crearMazo: (nombre) => mazos.crearMazo(nombre),
    listarMazos: () => mazos.listarMazos(),
    obtenerMazo: buscarMazo,
    renombrarMazo: (id, nombre) => mazos.renombrarMazo(id, nombre),
    eliminarMazo: (id, confirmado) => mazos.eliminarMazo(id, confirmado),
    // Tarjetas (RF-04, RF-05, RF-06)
    agregarTarjeta: (mazoId, pregunta, respuesta) => tarjetas.agregarTarjeta(mazoId, pregunta, respuesta),
    editarTarjeta: (mazoId, tarjetaId, pregunta, respuesta) => tarjetas.editarTarjeta(mazoId, tarjetaId, pregunta, respuesta),
    eliminarTarjeta: (mazoId, tarjetaId, confirmado) => tarjetas.eliminarTarjeta(mazoId, tarjetaId, confirmado),
    // Estudio y estadísticas (RF-07, RF-08, RF-09, RF-11)
    iniciarEstudio: (mazoId) => SesionEstudio.iniciar(buscarMazo(mazoId)),
    marcar: (mazoId, sesion, acierto) => {
      const m = sesion.marcar(acierto);
      return m.ok ? estadisticas.registrar(mazoId, m.registro) : m;
    },
    resumen: (mazoId) => estadisticas.resumen(mazoId),
  };
}
