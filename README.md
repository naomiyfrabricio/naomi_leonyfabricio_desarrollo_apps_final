# App de Flashcards para Repaso de Cálculo y Lógica

Cliente: Academia Horizonte · Desarrolla: Nebula Code Studio
Equipo: Naomi Ramírez, Fabricio Mata, León Rodrigo

## Estado

| Incremento | Tag | Entrega |
| --- | --- | --- |
| 1 | v0.1.0 | Crear mazos (RF-01) |
| 2 | v0.2.0 | Añadir tarjetas (RF-04), modo estudio (RF-07) y aviso de mazo vacío (RF-11), con interfaz web y guardado local |
| 3 | v0.3.0 | Editar y eliminar mazos y tarjetas con confirmación (RF-02, RF-03, RF-05, RF-06), acierto o fallo (RF-08) y porcentaje por mazo (RF-09) |
| 4 | v0.4.0 | Exportar e importar mazos mediante archivo JSON local (RF-10) y rechazo de archivos corruptos sin alterar los mazos existentes (RF-12) |

## Estructura

```
index.html                               # interfaz web
src/mazos/gestorMazos.js                 # crear, renombrar, eliminar y listar mazos (RF-01, RF-02, RF-03)
src/tarjetas/gestorTarjetas.js           # añadir, editar y eliminar tarjetas (RF-04, RF-05, RF-06)
src/estudio/sesionEstudio.js             # modo estudio, acierto/fallo y mazo vacío (RF-07, RF-08, RF-11)
src/estadisticas/estadisticas.js         # porcentaje de aciertos por mazo (RF-09)
src/intercambio/intercambioMazos.js      # exportar/importar mazo por archivo JSON (RF-10, RF-12)
src/almacenamiento/                      # memoria y localStorage, misma interfaz (RNF-05, RNF-09)
src/ui/controlador.js, src/ui/app.js     # integración y DOM
src/extra/explicaciones.js               # explicaciones del tema (EXTRA, fuera de RF)
src/extra/mazosEjemplo.js                # 18 mazos de ejemplo para cargar con un clic (EXTRA, fuera de RF)
tests/                                   # pruebas unitarias y de integración
docs/                                    # especificación y plan de incrementos
```

## Usar la app

Los módulos ES requieren abrir la página desde un servidor local:

```
python -m http.server 8000
```

y abrir http://localhost:8000 en Chrome, Firefox o Edge.

## Manual breve (RNF-08)

1. **Crear un mazo:** escribe un nombre en "Crear un mazo" y pulsa **Crear mazo**. El nombre no puede estar vacío ni repetir uno ya existente.
2. **Abrir un mazo:** haz clic en su tarjeta dentro de "Tus mazos" para ver sus tarjetas y su porcentaje de aciertos.
3. **Añadir tarjetas:** dentro del mazo, llena **Pregunta** y **Respuesta** y pulsa **Añadir tarjeta** (o pulsa Enter en el campo Respuesta). Tras añadir, el cursor vuelve a **Pregunta** y los campos se limpian, así puedes seguir escribiendo tarjetas sin tocar el ratón. Para editar una tarjeta existente usa **Editar**, que carga sus datos en el formulario; **Eliminar** la borra pidiendo confirmación.
4. **Renombrar o eliminar el mazo:** en "Datos del mazo", usa **Renombrar** o **Eliminar mazo** (también pide confirmación y borra sus tarjetas).
5. **Estudiar:** pulsa **Estudiar este mazo**. Verás la pregunta; pulsa **Revelar respuesta** (o toca la tarjeta) y luego marca **Acerté** o **Fallé**. **Siguiente** avanza a la próxima tarjeta. El avance se refleja de inmediato en el porcentaje del mazo. Si está marcada la opción de la explicación previa (ver el paso 11), primero verás la explicación.
6. **Exportar un mazo:** dentro del mazo, pulsa **Exportar este mazo** para descargar un archivo `.json` con su nombre y tarjetas.
7. **Importar un mazo:** en "Importar desde archivo" (arriba de la lista de mazos), selecciona un archivo `.json` exportado previamente y pulsa **Importar mazo desde archivo**. Si el archivo está corrupto o mal formado, se muestra un error y no se modifica ningún mazo existente.
8. **Escribir la respuesta:** en modo estudio escribe tu respuesta en el campo "Escribe tu respuesta..." y pulsa **Comprobar respuesta**. Se ignoran mayúsculas, acentos y espacios: si es correcta avanza sola; si no, muestra la respuesta completa.
9. **Orden aleatorio y modo examen:** antes de estudiar puedes marcar **🔀 Orden aleatorio** y **⏱ Modo examen** (con los segundos por tarjeta que elijas). Si se acaba el tiempo, cuenta como fallo y muestra la respuesta. Al terminar verás un resumen, por ejemplo "5/10 correctas".
10. **Repasar errores:** al terminar una sesión con fallos, **🔁 Repasar mis errores** estudia solo las tarjetas que fallaste.
11. **Ver la explicación:** **📖 Ver explicación del tema** recorre cada pregunta con su explicación. Con **📖 Ver la explicación antes de empezar** marcada (predeterminado), **Estudiar este mazo** abre primero esa presentación; pulsa **▶ Empezar preguntas** para comenzar.
12. **Duplicar un mazo:** **📄 Duplicar mazo** crea una copia con sus tarjetas, llamada "(copia)".
13. **Exportar o importar varios mazos:** **⇩ Exportar todos mis mazos** descarga un solo archivo con todos tus mazos. Al importar un archivo con varios mazos, cada uno se valida por separado y se informa cuántos se importaron.
14. **Tema y sonido:** **🌙** cambia entre tema claro y oscuro (se recuerda tu elección); **🔊** activa o silencia los sonidos de acierto y fallo. Buscar y ordenar mazos se hace desde la lista de mazos.
15. **Estudiar desde la lista:** cada mazo de "Tus mazos" tiene un botón **▶ Estudiar**. Inicia el estudio directo, sin abrir el mazo antes, y respeta las opciones marcadas (explicación previa y orden aleatorio). Si el mazo está vacío, verás el aviso de mazo vacío. El clic en el resto de la tarjeta sigue abriendo el mazo.
16. **Cargar mazos de ejemplo:** **📚 Cargar mazos de ejemplo** (arriba de la lista) añade 18 mazos de Cálculo, Matemáticas, Electrónica, Ciberseguridad y SQL. Los que ya existan con el mismo nombre se omiten y el mensaje indica cuántos se cargaron y cuántos se omitieron.

Todos los datos se guardan en el `localStorage` del navegador: funcionan sin conexión y persisten al recargar la página, pero son propios de ese navegador y ese dispositivo (no se sincronizan entre equipos salvo exportando/importando el archivo).

## Funciones extra (fuera del alcance evaluado)

Mejoras de interfaz añadidas después de los RF-01 a RF-12. No cuentan para la evaluación, no modifican esos requisitos ni sus pruebas. Detalle en docs/plan_incrementos.md §1.

- Diseño con color por mazo, animaciones y mensajes de ánimo; modo oscuro (se recuerda la elección).
- Buscador de mazos (sin distinguir mayúsculas ni acentos) y orden por nombre, avance o número de tarjetas.
- Escribir la respuesta y comprobarla automáticamente en modo estudio.
- Orden aleatorio, barra de progreso, modo examen, resumen final de la sesión y "Repasar mis errores".
- Ver la explicación del tema antes de empezar a estudiar (contenido en `src/extra/explicaciones.js`).
- Duplicar mazo; exportar todos los mazos en un solo archivo e importar un archivo con varios mazos.
- Sonidos de acierto y fallo (silenciables) y racha de días estudiando.
- Botón **▶ Estudiar** en cada mazo de la lista, para estudiar sin abrirlo antes.
- Carga de 18 mazos de ejemplo con un clic, validados con el importador y sin duplicar nombres (`src/extra/mazosEjemplo.js`).
- Tras añadir una tarjeta, el foco vuelve a Pregunta y los campos se limpian.
- Desplazamiento suave a la sección que se abre: detalle del mazo, modo estudio y explicación del tema.

Los extras son de interfaz y no tienen pruebas automáticas propias. Las 61 pruebas cubren los RF y la lógica de `src/mazos`, `src/tarjetas`, `src/estudio`, `src/estadisticas`, `src/intercambio` y `src/almacenamiento`. Quedan fuera la repetición espaciada y cualquier uso de IA o internet; la app sigue funcionando sin conexión (RNF-09).

## Pruebas

Requiere Node.js 18 o superior, sin dependencias.

```
npm test
```
