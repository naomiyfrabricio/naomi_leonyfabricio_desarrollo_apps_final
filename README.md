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
index.html                               # interfaz web: pantalla principal, pantalla de estudio y pantalla de editar (a pantalla completa)
src/mazos/gestorMazos.js                 # crear, renombrar, eliminar y listar mazos (RF-01, RF-02, RF-03)
src/tarjetas/gestorTarjetas.js           # añadir, editar y eliminar tarjetas (RF-04, RF-05, RF-06)
src/estudio/sesionEstudio.js             # modo estudio, acierto/fallo y mazo vacío (RF-07, RF-08, RF-11)
src/estadisticas/estadisticas.js         # porcentaje de aciertos por mazo (RF-09)
src/intercambio/intercambioMazos.js      # exportar/importar mazo por archivo JSON (RF-10, RF-12)
src/almacenamiento/                      # memoria y localStorage, misma interfaz (RNF-05, RNF-09)
src/ui/controlador.js, src/ui/app.js     # integración y DOM
src/extra/explicaciones.js               # explicaciones del tema (EXTRA, fuera de RF)
src/extra/mazosEjemplo.js                # 18 mazos de ejemplo para cargar con un clic (EXTRA, fuera de RF)
src/extra/categorias.js                  # categoría de cada mazo para agrupar "Tus mazos" (EXTRA, fuera de RF)
src/extra/sonidos.js                     # sonidos sintetizados de acierto y fallo con Web Audio (EXTRA, fuera de RF)
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

La app tiene tres pantallas: la **principal**, la de **estudio** (pantalla completa) y la de **editar** (pantalla completa).

1. **Pantalla principal:** muestra solo tus mazos agrupados por categoría (con buscador y orden), la zona **Subir un archivo** y un menú discreto **Más opciones**. Arriba a la derecha están **🌙** (tema claro/oscuro, se recuerda) y **🔊** (sonidos); debajo del subtítulo aparece tu racha de días estudiando.
2. **Estudiar:** haz clic en la tarjeta de un mazo. Se abre la pantalla de estudio a pantalla completa, sin nada más a la vista. Si **📖 Ver la explicación antes de empezar** está marcada (predeterminado), primero verás la explicación de cada pregunta; pulsa **▶ Empezar preguntas**. Después verás la pregunta con la pista «Toca la tarjeta para ver la respuesta»; **✓ Acerté** y **✗ Fallé** están en gris hasta que veas la respuesta. **Toca la tarjeta** (o enfócala y pulsa Enter o Espacio): solo muestra la respuesta, sin registrar nada, y entonces tú decides: **✓ Acerté** registra el acierto y **✗ Fallé** registra el fallo, y ambos pasan solos a la siguiente pregunta (≈0,4 s). **No lo sé, mostrar respuesta** (solo antes de ver la respuesta) cuenta como **fallo**: muestra la respuesta, **Acerté** y **Fallé** quedan en gris y solo puedes pulsar **Siguiente** (junto con el tiempo agotado, es el único caso que se queda hasta **Siguiente**), porque ver la respuesta y marcar acierto sería trampa; si ya tocaste la tarjeta, **No lo sé** se deshabilita. **Siguiente** solo se habilita cuando la tarjeta ya está marcada (Acerté, Fallé, **No lo sé** o tiempo agotado); en una tarjeta sin marcar está en gris y no se puede saltar. Una tarjeta ya marcada no se vuelve a marcar. El temporizador del modo examen sigue corriendo al ver la respuesta y cuenta fallo si se agota. El avance se refleja en el porcentaje del mazo. Al terminar la última tarjeta aparece un resumen con **Aciertos: N**, **Fallos: M** y el porcentaje; ahí puedes **🔁 Repasar mis errores** (solo las falladas), **↻ Estudiar de nuevo** o **✕ Salir**.
3. **Opciones de estudio (⚙):** en la barra superior, el botón **⚙** despliega **⏱ Modo examen** (con los segundos por tarjeta que elijas; si se acaba el tiempo cuenta como fallo y muestra la respuesta), la explicación previa y **📖 Ver explicación del tema**. Las tarjetas siempre salen en orden aleatorio (ya no hay casilla; la explicación del tema sigue el orden original). Cambiar el modo examen o sus segundos reinicia el estudio (barajando de nuevo). El botón **Cerrar** de la explicación, sin sesión, vuelve a la pantalla principal si era la explicación previa o muestra **▶ Empezar** si se abrió desde ⚙, y con sesión vuelve a ella (si la tarjeta aún no está respondida, el tiempo del modo examen reinicia completo); cambiar opciones sin sesión no reinicia nada hasta pulsar **▶ Empezar preguntas** / **▶ Empezar**, y con la explicación abierta durante una sesión los cambios solo se aplican al reiniciarla (**EDITAR** → **← Volver a estudiar**, o salir y reabrir el mazo).
4. **Salir:** **✕ Salir** (o la tecla Escape) vuelve a la pantalla principal y cancela la sesión en curso.
5. **Editar un mazo:** en la pantalla de estudio pulsa **EDITAR**. Ahí está todo lo de gestión del mazo: renombrar, eliminar (pide confirmación y vuelve a la principal), duplicar ("(copia)"), exportar este mazo a un `.json`, las estadísticas (aciertos, fallos, avance) y las tarjetas. Para **añadir tarjetas** llena **Pregunta** y **Respuesta** y pulsa **Añadir tarjeta** (o Enter en Respuesta); el cursor vuelve a **Pregunta** y los campos se limpian. **Editar** carga una tarjeta en el formulario y **Eliminar** la borra pidiendo confirmación. **← Volver a estudiar** reinicia el estudio con las tarjetas actuales y **✕ Cerrar** (o Escape) vuelve a la principal.
6. **Mazo vacío:** si abres un mazo sin tarjetas verás el aviso "Este mazo no tiene tarjetas. Agrega al menos una antes de estudiar." con el botón **EDITAR** a la vista.
7. **Subir un archivo:** en **Subir un archivo** elige un `.json` (uno o varios mazos, por ejemplo exportado antes) y pulsa **Importar mazo(s) desde archivo**. Cada mazo se valida por separado y se informa cuántos se importaron; si el archivo está corrupto o mal formado se muestra un error y no se modifica ningún mazo existente.
8. **Crear un mazo vacío:** abre **Más opciones**, escribe el nombre en **Crear un mazo** y pulsa **Crear mazo**. El nombre no puede estar vacío ni repetir uno ya existente. Después ábrelo y pulsa **EDITAR** para agregarle tarjetas.
9. **Exportar todos los mazos:** en **Más opciones**, **⇩ Exportar todos mis mazos** descarga un solo archivo con todos tus mazos.
10. **Cargar mazos de ejemplo:** **📚 Cargar mazos de ejemplo** está visible cuando no tienes mazos y, cuando ya tienes, dentro de **Más opciones**. Añade 18 mazos de Cálculo, Matemáticas, Electrónica, Ciberseguridad y SQL; los que ya existan con el mismo nombre se omiten y el mensaje indica cuántos se cargaron y cuántos se omitieron.
11. **Buscar, ordenar y grupos:** el buscador ignora mayúsculas y acentos; el orden (nombre, avance, tarjetas) se aplica dentro de cada grupo. Al entrar, todos los grupos aparecen cerrados (con su "N mazo(s)"); pulsa un encabezado para abrirlo o cerrarlo (mientras la página siga abierta se recuerdan los que abriste, al recargar vuelven a cerrarse). Los mazos que creas tú van en **Otros**, al final. Al buscar, los grupos con resultados se abren solos.
12. **Sonido:** suenan un arpegio alegre al acertar y un wah-wah cómico al fallar (incluido **No lo sé**) y al agotarse el tiempo del modo examen; **🔊** los silencia.

Todos los datos se guardan en el `localStorage` del navegador: funcionan sin conexión y persisten al recargar la página, pero son propios de ese navegador y ese dispositivo (no se sincronizan entre equipos salvo exportando/importando el archivo).

## Funciones extra (fuera del alcance evaluado)

Mejoras de interfaz añadidas después de los RF-01 a RF-12. No cuentan para la evaluación, no modifican esos requisitos ni sus pruebas. Detalle en docs/plan_incrementos.md §1.

- Diseño con color por mazo, animaciones y mensajes de ánimo; modo oscuro (se recuerda la elección).
- Buscador de mazos (sin distinguir mayúsculas ni acentos) y orden por nombre, avance o número de tarjetas.
- Orden siempre aleatorio, tocar la tarjeta para ver la respuesta sin penalizar, barra de progreso, modo examen, resumen final de la sesión y "Repasar mis errores".
- Ver la explicación del tema antes de empezar a estudiar (contenido en `src/extra/explicaciones.js`).
- Duplicar mazo; exportar todos los mazos en un solo archivo e importar un archivo con varios mazos.
- Sonidos de acierto (arpegio alegre) y fallo (wah-wah descendente) sintetizados con Web Audio, sin archivos de audio, silenciables (`src/extra/sonidos.js`), y racha de días estudiando.
- Rediseño de pantallas (2026-11-23, solo interfaz): principal limpia con los mazos y subir archivo; clic en un mazo abre el estudio a pantalla completa; **EDITAR** abre la gestión de mazo y tarjetas. Reemplaza al botón **▶ Estudiar** por mazo.
- Carga de 18 mazos de ejemplo con un clic, validados con el importador y sin duplicar nombres (`src/extra/mazosEjemplo.js`).
- Tras añadir una tarjeta, el foco vuelve a Pregunta y los campos se limpian.
- Agrupación de "Tus mazos" por categoría, plegable; arranca siempre cerrada y se recuerda solo mientras la página está abierta, sin localStorage (`src/extra/categorias.js`).

Los extras son de interfaz y no tienen pruebas automáticas propias. Las 61 pruebas cubren los RF y la lógica de `src/mazos`, `src/tarjetas`, `src/estudio`, `src/estadisticas`, `src/intercambio` y `src/almacenamiento`. Quedan fuera la repetición espaciada y cualquier uso de IA o internet; la app sigue funcionando sin conexión (RNF-09).

## Pruebas

Requiere Node.js 18 o superior, sin dependencias.

```
npm test
```
