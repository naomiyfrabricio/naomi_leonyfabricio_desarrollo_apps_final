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

## Pruebas

Requiere Node.js 18 o superior, sin dependencias.

```
npm test
```
