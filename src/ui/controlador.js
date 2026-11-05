/**
 * Controlador de la app: une los módulos de mazos, tarjetas y estudio sobre un
 * mismo almacenamiento. No toca el DOM, para poder probar el flujo completo en Node.
 */
import { GestorMazos } from '../mazos/gestorMazos.js';
import { GestorTarjetas } from '../tarjetas/gestorTarjetas.js';
import { SesionEstudio } from '../estudio/sesionEstudio.js';

export function crearControlador(almacenamiento) {
  const mazos = new GestorMazos(almacenamiento);
  const tarjetas = new GestorTarjetas(almacenamiento);

  return {
    crearMazo: (nombre) => mazos.crearMazo(nombre),
    listarMazos: () => mazos.listarMazos(),
    agregarTarjeta: (mazoId, pregunta, respuesta) => tarjetas.agregarTarjeta(mazoId, pregunta, respuesta),
    iniciarEstudio: (mazoId) => SesionEstudio.iniciar(mazos.listarMazos().find((m) => m.id === mazoId)),
  };
}
