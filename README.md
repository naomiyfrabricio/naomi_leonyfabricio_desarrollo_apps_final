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
3. **Añadir tarjetas:** dentro del mazo, llena **Pregunta** y **Respuesta** y pulsa **Añadir tarjeta**. Para editar una tarjeta existente usa **Editar**, que carga sus datos en el formulario; **Eliminar** la borra pidiendo confirmación.
4. **Renombrar o eliminar el mazo:** en "Datos del mazo", usa **Renombrar** o **Eliminar mazo** (también pide confirmación y borra sus tarjetas).
5. **Estudiar:** pulsa **Estudiar este mazo**. Verás la pregunta; pulsa **Revelar respuesta** (o toca la tarjeta) y luego marca **Acerté** o **Fallé**. **Siguiente** avanza a la próxima tarjeta. El avance se refleja de inmediato en el porcentaje del mazo.
6. **Exportar un mazo:** dentro del mazo, pulsa **Exportar este mazo** para descargar un archivo `.json` con su nombre y tarjetas.
7. **Importar un mazo:** en "Importar desde archivo" (arriba de la lista de mazos), selecciona un archivo `.json` exportado previamente y pulsa **Importar mazo desde archivo**. Si el archivo está corrupto o mal formado, se muestra un error y no se modifica ningún mazo existente.

Todos los datos se guardan en el `localStorage` del navegador: funcionan sin conexión y persisten al recargar la página, pero son propios de ese navegador y ese dispositivo (no se sincronizan entre equipos salvo exportando/importando el archivo).

## Pruebas

Requiere Node.js 18 o superior, sin dependencias.

```
npm test
```
